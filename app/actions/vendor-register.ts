'use server';

import dbConnect from '@/lib/db';
import Vendor from '@/models/Vendor';
import Venue from '@/models/Venue';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { auth } from '@/lib/auth';

// Category-specific highlights/badges
const categoryHighlights: Record<string, string[]> = {
  'venues': ['Premium Venue', 'Verified Vendor', 'New Listing'],
  'decorators': ['Creative Designs', 'Verified Decorator', 'New Listing'],
  'photographers': ['Professional', 'Verified Photographer', 'New Listing'],
  'caterers': ['Quality Food', 'Verified Caterer', 'New Listing'],
  'djs': ['Crowd Favorite', 'Verified Artist', 'New Listing'],
  'makeup': ['Expert Artist', 'Verified Makeup Artist', 'New Listing'],
  'mehendi': ['Intricate Designs', 'Verified Mehendi Artist', 'New Listing'],
  'invitations': ['Premium Cards', 'Verified Vendor', 'New Listing'],
  'pandits': ['Experienced Pandit', 'Vedic Expert', 'New Listing'],
  'choreographers': ['Talented Choreographer', 'Verified Artist', 'New Listing'],
  'bridal-wear': ['Premium Collection', 'Verified Store', 'New Listing'],
  'anchoring': ['Professional Anchor', 'Verified Artist', 'New Listing'],
  'karaoke': ['Fun Entertainment', 'Verified Vendor', 'New Listing'],
};

// Category-specific amenities/services
const categoryAmenities: Record<string, string[]> = {
  'venues': ['Parking', 'AC', 'Valet Parking', 'Stage', 'Dining Area'],
  'decorators': ['Theme Decor', 'Floral Arrangements', 'Lighting', 'Stage Setup'],
  'photographers': ['Candid Photography', 'Pre-Wedding Shoot', 'Album', 'Video'],
  'caterers': ['Multi-Cuisine', 'Live Counters', 'Buffet', 'Service Staff'],
  'djs': ['Sound System', 'LED Lights', 'MC Services', 'Fog Machine'],
  'makeup': ['Bridal Makeup', 'Party Makeup', 'Hairstyling', 'Draping'],
  'mehendi': ['Bridal Mehendi', 'Arabic Design', 'Traditional Design', 'Guest Mehendi'],
  'invitations': ['Custom Design', 'Digital Cards', 'Box Invites', 'RSVP'],
  'pandits': ['Wedding Ceremonies', 'Puja Services', 'Vedic Rituals', 'Consultation'],
  'choreographers': ['Bollywood Dance', 'Classical Dance', 'Group Performance', 'Training'],
  'bridal-wear': ['Lehenga', 'Sherwani', 'Sarees', 'Custom Fitting'],
  'anchoring': ['Wedding Hosting', 'Corporate Events', 'Multilingual', 'Script Writing'],
  'karaoke': ['Professional Setup', 'Large Song Library', 'Party Games', 'Lighting'],
};

export async function registerVendorWithVenue(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const venueName = formData.get('venueName') as string;
  const category = formData.get('category') as string;
  const location = formData.get('location') as string;
  const city = formData.get('city') as string;
  const address = formData.get('address') as string;
  const description = formData.get('description') as string;
  const priceMin = parseInt(formData.get('priceMin') as string) || 50000;
  const priceMax = parseInt(formData.get('priceMax') as string) || 200000;
  const eventTypes = (formData.get('eventTypes') as string)?.split(',') || ['wedding'];
  
  // Get uploaded images - can be either Cloudinary URLs (from /api/upload) or base64 (legacy)
  const uploadedImages: string[] = [];
  try {
    for (let i = 0; i < 3; i++) {
      const imageData = formData.get(`image_${i}`) as string;
      if (!imageData) continue;

      if (imageData.startsWith('https://')) {
        // Already a Cloudinary URL — use directly
        uploadedImages.push(imageData);
      } else if (imageData.startsWith('data:image')) {
        // Legacy base64 path — upload now
        const imageUrl = await uploadToCloudinary(imageData, `shubharambh/${category}`);
        uploadedImages.push(imageUrl);
      }
    }
  } catch (error) {
    console.error('Image upload failed:', error);
  }

  // Get category-specific fields
  const capacity = parseInt(formData.get('capacity') as string) || 100;
  const experience = formData.get('experience') as string;
  const styles = formData.get('photoStyles') || formData.get('makeupStyles') || formData.get('decorStyles') || formData.get('musicStyles') || formData.get('mehendiStyles') || formData.get('cardTypes');

  if (!name || !email || !venueName || !location || !city) {
    return { error: 'Please fill all required fields' };
  }

  try {
    await dbConnect();

    // Try to get session to store userId for reliable future lookups
    let sessionUserId: string | undefined;
    try {
      const session = await auth();
      if (session?.user?.id) sessionUserId = session.user.id;
    } catch { /* session optional during registration */ }

    console.log('[VendorReg] Creating vendor:', { name, email, businessName: venueName, category, sessionUserId });

    // Create vendor - PENDING approval by default
    const vendor = await Vendor.create({
      ...(sessionUserId ? { userId: sessionUserId } : {}),
      name,
      email,
      phone: phone || '0000000000',
      businessName: venueName,
      description: description || `${venueName} - Quality ${category} services for your special occasions.`,
      categories: [category],
      locations: [city],
      images: uploadedImages.length > 0 ? uploadedImages : [],
      priceRange: {
        min: priceMin,
        max: priceMax,
      },
      isActive: false, // Only true after admin approval
      status: 'pending', // Requires admin approval
    });

    console.log('[VendorReg] Vendor created:', {
      id: vendor._id,
      status: vendor.status,
      isActive: vendor.isActive
    });

    // Determine type from category
    const typeMap: Record<string, string> = {
      'venues': 'venue',
      'decorators': 'decorator',
      'djs': 'dj',
      'caterers': 'caterer',
      'photographers': 'photographer',
      'makeup': 'makeup_artist',
      'mehendi': 'mehendi_artist',
      'invitations': 'invitation',
      'pandits': 'pandit',
      'choreographers': 'choreographer',
      'bridal-wear': 'bridal_wear',
      'anchoring': 'anchor',
      'karaoke': 'karaoke',
    };

    // Default images per category (only used if no images uploaded)
    const defaultImages: Record<string, string[]> = {
      'venues': [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop',
      ],
      'decorators': [
        'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
      ],
      'photographers': [
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&auto=format&fit=crop',
      ],
      'caterers': [
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
      ],
      'djs': [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&auto=format&fit=crop',
      ],
      'makeup': [
        'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop',
      ],
      'mehendi': [
        'https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600612253723-3fbbb8f8b2c0?w=800&auto=format&fit=crop',
      ],
      'invitations': [
        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=800&auto=format&fit=crop',
      ],
      'pandits': [
        'https://images.unsplash.com/photo-1545048702-79362697f5fc?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1604608672516-f1b9b1d97a77?w=800&auto=format&fit=crop',
      ],
      'choreographers': [
        'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&auto=format&fit=crop',
      ],
      'bridal-wear': [
        'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1610117238813-5a8f46ebeab1?w=800&auto=format&fit=crop',
      ],
      'anchoring': [
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=800&auto=format&fit=crop',
      ],
      'karaoke': [
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
      ],
    };

    // Use uploaded images if available, otherwise use defaults
    const imagesToUse = uploadedImages.length > 0 
      ? uploadedImages 
      : (defaultImages[category] || defaultImages['venues']);

    // Get category-specific highlights and amenities
    const highlights = categoryHighlights[category] || categoryHighlights['venues'];
    const amenities = categoryAmenities[category] || categoryAmenities['venues'];

    // Build capacity object - for non-venue categories, use a small default
    const capacityObj = category === 'venues' 
      ? { min: Math.floor(capacity * 0.5), max: capacity }
      : { min: 1, max: 1 }; // For services, capacity doesn't apply

    // Get ALL category-specific fields from form
    const serviceDetails: Record<string, string | number | undefined> = {};

    // Helper to safely get number or undefined
    const getNum = (key: string) => {
      const val = formData.get(key);
      return val ? parseInt(val as string) : undefined;
    };

    // Helper to safely get string or undefined
    const getStr = (key: string) => {
      const val = formData.get(key);
      return val ? (val as string) : undefined;
    };

    // Common
    serviceDetails.experience = getNum('experience');
    serviceDetails.teamSize = getNum('teamSize');

    // Photographers
    serviceDetails.photoStyles = getStr('photoStyles');
    serviceDetails.equipment = getStr('equipment');

    // Caterers
    serviceDetails.cuisines = getStr('cuisines');
    serviceDetails.minPlates = getNum('minPlates');
    serviceDetails.maxPlates = getNum('maxPlates');

    // Decorators
    serviceDetails.decorStyles = getStr('decorStyles');

    // Makeup
    serviceDetails.makeupStyles = getStr('makeupStyles');
    serviceDetails.brands = getStr('brands');
    serviceDetails.servicesOffered = getStr('servicesOffered');

    // Mehendi
    serviceDetails.mehendiStyles = getStr('mehendiStyles');
    serviceDetails.mehendiType = getStr('mehendiType');

    // DJ/Music
    serviceDetails.musicStyles = getStr('musicStyles');

    // Invitations
    serviceDetails.cardTypes = getStr('cardTypes');
    serviceDetails.customization = getStr('customization');
    serviceDetails.minOrder = getNum('minOrder');

    // Pandits
    serviceDetails.ceremonies = getStr('ceremonies');
    serviceDetails.languages = getStr('languages');

    // Choreographers
    serviceDetails.danceStyles = getStr('danceStyles');

    // Bridal Wear
    serviceDetails.dressTypes = getStr('dressTypes');
    serviceDetails.sizes = getStr('sizes');

    // Anchoring
    serviceDetails.eventSpecialties = getStr('eventTypes'); // Using eventTypes field from modal

    // Karaoke
    serviceDetails.songLibrary = getStr('songLibrary');

    // Venues
    serviceDetails.venueType = getStr('venueType');

    // Get price unit based on category
    const priceUnits: Record<string, string> = {
      venues: 'per event',
      photographers: 'per day',
      caterers: 'per plate',
      decorators: 'per event',
      djs: 'per event',
      makeup: 'per look',
      mehendi: 'per hand',
      invitations: 'per 100 cards',
      pandits: 'per ceremony',
      choreographers: 'per performance',
      'bridal-wear': 'per day',
      anchoring: 'per event',
      karaoke: 'per event',
    };

    // Create venue/listing entry - ALSO PENDING approval
    const venue = await Venue.create({
      vendorId: vendor._id,
      name: venueName,
      type: typeMap[category] || 'service',
      category: category,
      eventTypes: eventTypes,
      location,
      city,
      address: address || location,
      capacity: capacityObj,
      priceRange: {
        min: priceMin,
        max: priceMax,
      },
      priceUnit: priceUnits[category] || 'per event',
      images: imagesToUse,
      amenities: amenities,
      highlights: highlights,
      description: description || `${venueName} - Quality ${category} services for your special occasions.`,
      rating: 4.5,
      reviewCount: 0,
      isAvailable: false, // Only true after admin approval
      status: 'pending', // Requires admin approval
      serviceDetails: serviceDetails,
    });

    console.log('[VendorReg] Venue created:', {
      id: venue._id,
      status: venue.status,
      isAvailable: venue.isAvailable
    });

    // Get category display name
    const categoryNames: Record<string, string> = {
      'venues': 'Venues',
      'decorators': 'Decorators',
      'djs': 'DJ & Entertainment',
      'caterers': 'Caterers',
      'photographers': 'Photographers',
      'makeup': 'Makeup Artists',
      'mehendi': 'Mehendi Artists',
      'invitations': 'Invitations',
      'pandits': 'Pandits',
      'choreographers': 'Choreographers',
      'bridal-wear': 'Bridal Wear',
      'anchoring': 'Anchors & Emcees',
      'karaoke': 'Karaoke',
    };
    const categoryDisplayName = categoryNames[category] || 'Services';

    return { 
      success: true, 
      message: `Your listing has been submitted successfully! It will be reviewed by our admin team and will appear on the ${categoryDisplayName} category page once approved.`,
      venueId: venue._id.toString(),
      category: category,
    };
  } catch (error: any) {
    console.error('Vendor registration error:', error);
    
    // Check for duplicate email error
    if (error.code === 11000) {
      return { error: 'A vendor with this email already exists. Please use a different email.' };
    }
    
    return { error: 'Failed to register. Please try again.' };
  }
}

// ─── ADD A NEW LISTING TO AN EXISTING VENDOR ACCOUNT ───────────────────────
export async function addVenueListing(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'Not authenticated. Please log in.' };
  }

  const vendorEmail = session.user.email;

  const venueName = formData.get('venueName') as string;
  const category = formData.get('category') as string;
  const location = formData.get('location') as string;
  const city = formData.get('city') as string;
  const address = formData.get('address') as string;
  const description = formData.get('description') as string;
  const priceMin = parseInt(formData.get('priceMin') as string) || 50000;
  const priceMax = parseInt(formData.get('priceMax') as string) || 200000;
  const eventTypes = (formData.get('eventTypes') as string)?.split(',') || ['wedding'];

  if (!venueName || !location || !city || !category) {
    return { error: 'Please fill all required fields.' };
  }

  try {
    await dbConnect();

    // ── Multi-strategy vendor lookup ──────────────────────────────────────────
    // Priority: userId (most reliable) → session email → form email → name
    const sessionEmail = session.user.email.toLowerCase().trim();
    const formEmail = (formData.get('email') as string || '').toLowerCase().trim();
    const sessionName = session.user.name || '';
    const sessionUserId = session.user.id;

    let vendor =
      sessionUserId
        ? await Vendor.findOne({ userId: sessionUserId })
        : null;

    if (!vendor) {
      vendor = await Vendor.findOne({ email: sessionEmail });
    }

    if (!vendor && formEmail && formEmail !== sessionEmail) {
      vendor = await Vendor.findOne({ email: formEmail });
      if (vendor) console.log('[AddVenue] Found vendor via formData email:', formEmail);
    }

    if (!vendor && sessionName) {
      vendor = await Vendor.findOne({ name: { $regex: `^${sessionName}$`, $options: 'i' } });
      if (vendor) console.log('[AddVenue] Found vendor via session name:', sessionName);
    }

    console.log('[AddVenue] Lookup:', { sessionUserId, sessionEmail, formEmail, found: !!vendor });

    if (!vendor) {
      return { error: `Vendor account not found for "${sessionEmail}". If you registered with a different email, please contact support.` };
    }

    // Backfill userId on legacy vendor docs that predate this field
    if (!vendor.userId && sessionUserId) {
      vendor.userId = sessionUserId as any;
    }

    // Upload images if provided
    const uploadedImages: string[] = [];
    try {
      for (let i = 0; i < 3; i++) {
        const imageData = formData.get(`image_${i}`) as string;
        if (!imageData) continue;

        if (imageData.startsWith('https://')) {
          // Already a Cloudinary URL — use directly
          uploadedImages.push(imageData);
        } else if (imageData.startsWith('data:image')) {
          // Legacy base64 path — upload now
          const imageUrl = await uploadToCloudinary(imageData, `shubharambh/${category}`);
          uploadedImages.push(imageUrl);
        }
      }
    } catch (uploadErr) {
      console.error('Image upload failed (non-fatal):', uploadErr);
    }

    // Add the new category to the vendor's categories array if not already present
    if (!vendor.categories.includes(category as any)) {
      vendor.categories.push(category as any);
    }
    // Add city to locations if not already present
    if (!vendor.locations.includes(city as any)) {
      vendor.locations.push(city as any);
    }
    await vendor.save();

    // Reuse the same maps as registerVendorWithVenue
    const typeMap: Record<string, string> = {
      'venues': 'venue', 'decorators': 'decorator', 'djs': 'dj', 'caterers': 'caterer',
      'photographers': 'photographer', 'makeup': 'makeup_artist', 'mehendi': 'mehendi_artist',
      'invitations': 'invitation', 'pandits': 'pandit', 'choreographers': 'choreographer',
      'bridal-wear': 'bridal_wear', 'anchoring': 'anchor', 'karaoke': 'karaoke',
    };

    const defaultImages: Record<string, string[]> = {
      'venues': ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop'],
      'decorators': ['https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&auto=format&fit=crop'],
      'photographers': ['https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop'],
      'caterers': ['https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop'],
      'djs': ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop'],
      'makeup': ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop'],
      'mehendi': ['https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=800&auto=format&fit=crop'],
      'invitations': ['https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop'],
      'pandits': ['https://images.unsplash.com/photo-1545048702-79362697f5fc?w=800&auto=format&fit=crop'],
      'choreographers': ['https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop'],
      'bridal-wear': ['https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=800&auto=format&fit=crop'],
      'anchoring': ['https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop'],
      'karaoke': ['https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop'],
    };

    const highlights = categoryHighlights[category] || categoryHighlights['venues'];
    const amenities = categoryAmenities[category] || categoryAmenities['venues'];
    const imagesToUse = uploadedImages.length > 0 ? uploadedImages : (defaultImages[category] || defaultImages['venues']);

    const capacity = category === 'venues'
      ? { min: Math.floor((parseInt(formData.get('capacity') as string) || 100) * 0.5), max: parseInt(formData.get('capacity') as string) || 100 }
      : { min: 1, max: 1 };

    const priceUnits: Record<string, string> = {
      venues: 'per event', photographers: 'per day', caterers: 'per plate',
      decorators: 'per event', djs: 'per event', makeup: 'per look',
      mehendi: 'per hand', invitations: 'per 100 cards', pandits: 'per ceremony',
      choreographers: 'per performance', 'bridal-wear': 'per day', anchoring: 'per event', karaoke: 'per event',
    };

    // Build serviceDetails from any extra fields passed through formData
    const serviceDetails: Record<string, string | number | undefined> = {};
    const extraFields = ['photoStyles','equipment','experience','teamSize','cuisines','minPlates','maxPlates',
      'decorStyles','makeupStyles','brands','servicesOffered','mehendiStyles','mehendiType','musicStyles',
      'cardTypes','customization','minOrder','ceremonies','languages','danceStyles','dressTypes','sizes',
      'venueType','songLibrary'];
    extraFields.forEach(key => {
      const val = formData.get(key);
      if (val) serviceDetails[key] = isNaN(Number(val)) ? (val as string) : Number(val);
    });

    const venue = await Venue.create({
      vendorId: vendor._id,
      name: venueName,
      type: typeMap[category] || 'service',
      category,
      eventTypes,
      location,
      city,
      address: address || location,
      capacity,
      priceRange: { min: priceMin, max: priceMax },
      priceUnit: priceUnits[category] || 'per event',
      images: imagesToUse,
      amenities,
      highlights,
      description: description || `${venueName} - Quality ${category} services for your special occasions.`,
      rating: 4.5,
      reviewCount: 0,
      isAvailable: false,
      status: 'pending',
      serviceDetails,
    });

    console.log('[AddVenue] New venue added to existing vendor:', { vendorId: vendor._id, venueId: venue._id, category });

    const categoryNames: Record<string, string> = {
      'venues': 'Venues', 'decorators': 'Decorators', 'djs': 'DJ & Entertainment',
      'caterers': 'Caterers', 'photographers': 'Photographers', 'makeup': 'Makeup Artists',
      'mehendi': 'Mehendi Artists', 'invitations': 'Invitations', 'pandits': 'Pandits',
      'choreographers': 'Choreographers', 'bridal-wear': 'Bridal Wear', 'anchoring': 'Anchors & Emcees', 'karaoke': 'Karaoke',
    };

    return {
      success: true,
      message: `Your new listing has been submitted! It will appear on the ${categoryNames[category] || 'Services'} page once approved by our admin team.`,
      venueId: venue._id.toString(),
      category,
    };
  } catch (error: any) {
    console.error('[AddVenue] Error:', error);
    return { error: 'Failed to add listing. Please try again.' };
  }
}
