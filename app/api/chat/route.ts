import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '@/lib/db';
import Venue from '@/models/Venue';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';

const client = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// ─── Intent Detection Keywords ───────────────────────────────────
const INTENT_KEYWORDS: Record<string, string[]> = {
  venue_search: ['venue', 'hall', 'banquet', 'place', 'location', 'farmhouse', 'lawn', 'resort', 'hotel', 'convention', 'mandap', 'marriage hall', 'function hall', 'find', 'search', 'show', 'suggest', 'recommend', 'looking for', 'need a', 'want a', 'best'],
  pricing: ['price', 'cost', 'budget', 'expensive', 'cheap', 'affordable', 'rate', 'charges', 'how much', 'pricing', 'per plate', 'starting from', 'range', '₹', 'rupees', 'lakh', 'thousand'],
  location: ['hyderabad', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'pune', 'jaipur', 'goa', 'noida', 'gurgaon', 'gurugram', 'navi mumbai', 'thane', 'secunderabad', 'jubilee hills', 'banjara hills', 'hitech city', 'gachibowli', 'shamshabad', 'kompally', 'kukatpally', 'ameerpet', 'begumpet', 'madhapur'],
  category: ['decorator', 'decoration', 'dj', 'music', 'cater', 'food', 'photographer', 'photography', 'photo', 'video', 'makeup', 'bridal', 'mehendi', 'mehndi', 'henna', 'invitation', 'card', 'pandit', 'priest', 'puja', 'choreograph', 'dance', 'bridal wear', 'lehenga', 'sherwani', 'anchor', 'host', 'emcee', 'karaoke', 'singing'],
  event_type: ['wedding', 'engagement', 'birthday', 'anniversary', 'reception', 'pre-wedding', 'mehendi', 'sangeet', 'haldi', 'bachelor', 'bridal shower', 'baby shower', 'party', 'function', 'event', 'celebration', 'ceremony'],
  capacity: ['guest', 'people', 'person', 'capacity', 'attendee', 'seat', 'how many', 'small', 'large', 'intimate', 'grand', '100', '200', '300', '500', '1000'],
  booking: ['book', 'reserve', 'available', 'availability', 'date', 'slot', 'enquiry', 'enquire', 'quote', 'get quote', 'send enquiry', 'appointment', 'visit', 'schedule'],
  comparison: ['compare', 'better', 'best', 'top', 'vs', 'versus', 'difference', 'which one', 'popular', 'rating', 'review', 'highly rated', 'most booked'],
  amenities: ['parking', 'ac', 'air condition', 'wifi', 'swimming', 'pool', 'garden', 'outdoor', 'indoor', 'veg', 'non-veg', 'alcohol', 'dj allowed', 'fireworks', 'valet', 'power backup', 'changing room', 'bridal room'],
  about: ['about', 'what is', 'how does', 'how do', 'shubharambh', 'platform', 'work', 'help', 'service', 'what can you', 'who are you'],
};

function detectIntent(message: string): string[] {
  const lower = message.toLowerCase();
  const intents: string[] = [];
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) intents.push(intent);
  }
  return intents.length > 0 ? intents : ['general'];
}

function extractCity(message: string): string | null {
  const lower = message.toLowerCase();
  const cities = ['hyderabad', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'pune', 'jaipur', 'goa', 'noida', 'gurgaon', 'gurugram', 'secunderabad', 'navi mumbai', 'thane'];
  for (const city of cities) { if (lower.includes(city)) return city; }
  const hydAreas = ['jubilee hills', 'banjara hills', 'hitech city', 'gachibowli', 'shamshabad', 'kompally', 'kukatpally', 'ameerpet', 'begumpet', 'madhapur'];
  for (const area of hydAreas) { if (lower.includes(area)) return 'hyderabad'; }
  return null;
}

function extractCategory(message: string): string | null {
  const lower = message.toLowerCase();
  const categoryMap: Record<string, string> = {
    'venue': 'venues', 'hall': 'venues', 'banquet': 'venues', 'farmhouse': 'venues', 'lawn': 'venues', 'resort': 'venues', 'marriage hall': 'venues', 'function hall': 'venues', 'mandap': 'venues',
    'decorator': 'decorators', 'decoration': 'decorators', 'decor': 'decorators', 'flower': 'decorators', 'floral': 'decorators',
    'dj': 'djs', 'music': 'djs', 'sound': 'djs', 'band': 'djs',
    'cater': 'caterers', 'food': 'caterers', 'cuisine': 'caterers', 'menu': 'caterers', 'biryani': 'caterers',
    'photograph': 'photographers', 'photo': 'photographers', 'video': 'photographers', 'camera': 'photographers', 'shoot': 'photographers',
    'makeup': 'makeup', 'mua': 'makeup', 'stylist': 'makeup',
    'mehendi': 'mehendi', 'mehndi': 'mehendi', 'henna': 'mehendi',
    'invitation': 'invitations', 'card': 'invitations', 'invite': 'invitations',
    'pandit': 'pandits', 'priest': 'pandits', 'puja': 'pandits', 'pooja': 'pandits',
    'choreograph': 'choreographers', 'dance': 'choreographers',
    'lehenga': 'bridal-wear', 'sherwani': 'bridal-wear', 'bridal wear': 'bridal-wear', 'wedding dress': 'bridal-wear', 'outfit': 'bridal-wear',
    'anchor': 'anchoring', 'host': 'anchoring', 'emcee': 'anchoring',
    'karaoke': 'karaoke', 'singing': 'karaoke',
  };
  for (const [keyword, cat] of Object.entries(categoryMap)) { if (lower.includes(keyword)) return cat; }
  return null;
}

function extractEventType(message: string): string | null {
  const lower = message.toLowerCase();
  const eventMap: Record<string, string> = {
    'wedding': 'wedding', 'shaadi': 'wedding', 'marriage': 'wedding',
    'engagement': 'engagement', 'ring ceremony': 'engagement', 'sagai': 'engagement',
    'birthday': 'birthday', 'bday': 'birthday',
    'anniversary': 'anniversary',
    'reception': 'wedding-reception',
    'pre-wedding': 'pre-wedding', 'pre wedding': 'pre-wedding',
    'sangeet': 'sangeet', 'haldi': 'pre-wedding',
    'bachelor': 'bachelor-party',
    'bridal shower': 'bridal-shower',
    'baby shower': 'baby-shower',
  };
  for (const [kw, et] of Object.entries(eventMap)) { if (lower.includes(kw)) return et; }
  return null;
}

function extractCapacityHint(message: string): { min?: number; max?: number } | null {
  const lower = message.toLowerCase();
  const numMatch = lower.match(/(\d+)\s*(guest|people|person|pax|seat)/);
  if (numMatch) { const n = parseInt(numMatch[1]); return { min: Math.max(1, n - 50), max: n + 100 }; }
  if (lower.includes('small') || lower.includes('intimate')) return { min: 1, max: 100 };
  if (lower.includes('medium')) return { min: 100, max: 300 };
  if (lower.includes('large') || lower.includes('grand') || lower.includes('big')) return { min: 300, max: 2000 };
  return null;
}

function extractBudgetHint(message: string): { min?: number; max?: number } | null {
  const lower = message.toLowerCase();
  const underLakh = lower.match(/(under|below|within|max|upto|up to)\s*(\d+)\s*lakh/);
  if (underLakh) return { min: 0, max: parseInt(underLakh[2]) * 100000 };
  const rangeLakh = lower.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*lakh/);
  if (rangeLakh) return { min: parseInt(rangeLakh[1]) * 100000, max: parseInt(rangeLakh[2]) * 100000 };
  if (lower.includes('cheap') || lower.includes('affordable') || lower.includes('budget')) return { min: 0, max: 300000 };
  if (lower.includes('premium') || lower.includes('luxury') || lower.includes('expensive')) return { min: 500000, max: 10000000 };
  return null;
}

// ─── Query Database ───────────────────────────────────
async function queryDatabase(message: string, intents: string[]): Promise<string> {
  await dbConnect();
  const city = extractCity(message);
  const category = extractCategory(message);
  const eventType = extractEventType(message);
  const capacityHint = extractCapacityHint(message);
  const budgetHint = extractBudgetHint(message);
  const contextParts: string[] = [];

  try {
    const totalVenues = await Venue.countDocuments({ status: 'approved', isAvailable: true });
    const totalVendors = await Vendor.countDocuments({ status: 'approved', isActive: true });
    const categories = await Category.find({ isActive: true }).lean();

    contextParts.push(`PLATFORM STATS: ${totalVenues} verified venues/services, ${totalVendors} verified vendors, ${categories.length} categories.`);

    if (categories.length > 0) {
      contextParts.push(`CATEGORIES: ${categories.map(c => `${c.icon} ${c.name}`).join(', ')}`);
    }

    // Search venues/services
    if (intents.includes('venue_search') || intents.includes('pricing') || intents.includes('comparison') || intents.includes('amenities') || category || city || eventType) {
      const query: any = { status: 'approved', isAvailable: true };
      if (category) query.category = category;
      if (city) query.city = { $regex: city, $options: 'i' };
      if (eventType) query.eventTypes = eventType;
      if (capacityHint?.max) query['capacity.max'] = { $gte: capacityHint.min || 0 };
      if (budgetHint?.max) query['priceRange.min'] = { $lte: budgetHint.max };
      if (budgetHint?.min) query['priceRange.max'] = { $gte: budgetHint.min };

      const venues = await Venue.find(query)
        .populate('vendorId', 'businessName email phone')
        .sort({ rating: -1, reviewCount: -1 })
        .limit(8)
        .lean();

      if (venues.length > 0) {
        contextParts.push(`\nMATCHING RESULTS (${venues.length} found). Present each as a CARD using the exact format from instructions:\n`);
        venues.forEach((v: any, i: number) => {
          const priceStr = v.priceRange ? `₹${(v.priceRange.min / 1000).toFixed(0)}K – ₹${(v.priceRange.max / 1000).toFixed(0)}K` : 'Price on request';
          const capStr = v.capacity ? `${v.capacity.min}–${v.capacity.max} guests` : '';
          const ratingStr = v.rating > 0 ? `${v.rating.toFixed(1)} ⭐ (${v.reviewCount} reviews)` : 'New listing ✨';
          const highlight = v.highlights?.length ? v.highlights[0] : (v.amenities?.length ? v.amenities.slice(0, 3).join(', ') : '');
          contextParts.push(
            `VENUE ${i + 1}: ID="${v._id}" | Name="${v.name}" | Location="${v.location}, ${v.city}" | Price="${priceStr} ${v.priceUnit || 'per event'}" | Capacity="${capStr}" | Rating="${ratingStr}" | Category="${v.category}" | Highlight="${highlight}"`
          );
        });
      } else {
        const broaderQuery: any = { status: 'approved', isAvailable: true };
        if (category) broaderQuery.category = category;
        else if (city) broaderQuery.city = { $regex: city, $options: 'i' };

        const broaderResults = await Venue.find(broaderQuery).sort({ rating: -1 }).limit(5).lean();
        if (broaderResults.length > 0) {
          contextParts.push(`\nNo exact match. Show these RELATED options as cards:\n`);
          broaderResults.forEach((v: any, i: number) => {
            const priceStr = v.priceRange ? `₹${(v.priceRange.min / 1000).toFixed(0)}K – ₹${(v.priceRange.max / 1000).toFixed(0)}K` : 'Price on request';
            const ratingStr = v.rating > 0 ? `${v.rating.toFixed(1)} ⭐` : 'New ✨';
            contextParts.push(`VENUE ${i + 1}: ID="${v._id}" | Name="${v.name}" | Location="${v.location}, ${v.city}" | Price="${priceStr}" | Rating="${ratingStr}" | Category="${v.category}"`);
          });
        } else {
          contextParts.push(`\nNo venues/services found matching these criteria.`);
        }
      }
    }

    if (intents.includes('location') && city) {
      const cityCount = await Venue.countDocuments({ city: { $regex: city, $options: 'i' }, status: 'approved', isAvailable: true });
      const cityCats = await Venue.distinct('category', { city: { $regex: city, $options: 'i' }, status: 'approved' });
      contextParts.push(`\nIN ${city.toUpperCase()}: ${cityCount} listings across: ${cityCats.join(', ') || 'None yet'}`);
    }

    if (category) {
      const catCount = await Venue.countDocuments({ category, status: 'approved', isAvailable: true });
      const avgStats = await Venue.aggregate([
        { $match: { category, status: 'approved', rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, avgMin: { $avg: '$priceRange.min' }, avgMax: { $avg: '$priceRange.max' } } }
      ]);
      if (avgStats.length > 0) {
        contextParts.push(`${category.toUpperCase()} STATS: ${catCount} listings | Avg rating: ${avgStats[0].avgRating?.toFixed(1)} | Avg price: ₹${(avgStats[0].avgMin / 1000).toFixed(0)}K - ₹${(avgStats[0].avgMax / 1000).toFixed(0)}K`);
      }
    }

    if (intents.includes('booking') || intents.includes('about')) {
      contextParts.push(`
HOW SHUBHARAMBH WORKS:
- Browse categories: venues, decorators, DJs, caterers, photographers, makeup artists, mehendi artists, invitation designers, pandits, choreographers, bridal wear, anchoring, karaoke
- Every listing is verified by the admin team before going live
- Users can "Send Enquiry" for quotes without sharing personal contact
- Users can "Book Appointment/Visit" for serious inquiries (contact shared)
- Vendors respond with accept/reject and a message
- All communication happens via the platform dashboard
- Event types: Wedding, Engagement, Birthday, Anniversary, Reception, Pre-wedding, Mehendi, Sangeet, Bachelor Party, Bridal Shower, Baby Shower
- Platform is based in India covering major cities`);
    }
  } catch (error) {
    console.error('[Chat DB Error]:', error);
    contextParts.push('Database query had an issue. Respond with general platform knowledge.');
  }

  return contextParts.join('\n');
}

// ─── System Prompt ───────────────────────────────────
const SYSTEM_PROMPT = `You are **Shubhi** 🙏, the warm and knowledgeable AI concierge for **Shubharambh** — India's trusted event & wedding planning platform.

## Your Personality
- Friendly, experienced wedding planner who genuinely cares
- Use occasional Hindi words naturally ("bilkul", "zaroor", "shaadi", "badhiya")
- Emojis sparingly (max 1-2 per message)
- Sound like a real person, not a robot

## CRITICAL FORMATTING RULES — FOLLOW EXACTLY

You MUST keep responses SHORT, SCANNABLE, and STRUCTURED. Users lose patience reading paragraphs.

### When listing venues/services (ALWAYS use this exact format):

1 short greeting line (max 15 words), then:

For EACH venue/service, use this EXACT format:

---
**🏛️ Venue Name Here**
📍 Location, City
💰 ₹50K – ₹2L per event
👥 100–500 guests
⭐ 4.5 (120 reviews)
📌 Key highlight in 5 words max
---

Then 1 short closing line asking if they want to send an enquiry or know more.

### For general questions:
- Max 3-4 short lines
- Use bullet points, not paragraphs
- Be direct and helpful

### For comparisons:
Use the venue card format above for each, then add:
**🏆 My Pick:** One line recommendation with reason.

### For pricing questions:
- Lead with the number: "**₹50K – ₹2L** for venues in Hyderabad"
- Then 1-2 lines of context max

### For greetings/about:
- Max 3 lines
- List what you can help with as bullet points

## STRICT RULES
- NEVER write paragraphs longer than 2 lines
- NEVER combine venue details into a sentence — always use the card format
- NEVER reveal database access — speak naturally
- NEVER invent details not in the provided context
- If no results: 1 empathetic line + suggest browsing the website
- ALWAYS end with a helpful 1-line question or next step
- After listing venues/services, ALWAYS ask: "Would you like to send an enquiry to any of these venues?"
- Use **bold** for venue names, prices, and key info
- Use --- as dividers between venue cards
- Keep total response under 250 words

## Platform Details
- Sections: Home, Categories, Venues, Events, About
- Users can "Send Enquiry" for quotes or "Book Appointment" for visits
- All vendors verified by Shubharambh team
- Contact details protected until vendor accepts
- Covers major Indian cities`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { message: "I'm having trouble connecting right now. Please try again in a moment! 🙏" },
        { status: 200 }
      );
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const intents = detectIntent(lastUserMessage);
    console.log('[Chat] Intents:', intents, '| Message:', lastUserMessage.substring(0, 80));

    const dbContext = await queryDatabase(lastUserMessage, intents);
    console.log('[Chat] DB Context length:', dbContext.length);

    const llmMessages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    const recentMessages = messages.slice(-10);

    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
      if (i === recentMessages.length - 1 && msg.role === 'user') {
        llmMessages.push({
          role: 'user',
          content: `[INTERNAL DATABASE CONTEXT — DO NOT MENTION TO USER]\n${dbContext}\n\n[USER MESSAGE]\n${msg.content}`,
        });
      } else {
        llmMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: llmMessages,
      max_tokens: 500,
      temperature: 0.6,
      top_p: 0.9,
    });

    const reply = response.choices[0]?.message?.content || "I couldn't process that right now. Could you try again? 🙏";
    return NextResponse.json({ message: reply });
  } catch (error: any) {
    console.error('[Chat API Error]:', error?.message || error);
    return NextResponse.json(
      { message: "Oops! I'm having a small hiccup right now 😅 Please try again in a moment!" },
      { status: 200 }
    );
  }
}
