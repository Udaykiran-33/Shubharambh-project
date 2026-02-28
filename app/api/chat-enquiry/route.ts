// Chat enquiry API route — creates QuoteRequest from chatbot

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import QuoteRequest from '@/models/QuoteRequest';
import Venue from '@/models/Venue';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import { sendMail } from '@/lib/mailer';
import { quoteEnquiryEmail } from '@/lib/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please login to send an enquiry' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      venueId,
      venueName,
      category = 'venues',
      eventType,
      eventDate,
      guests,
      message,
    } = body;

    if (!eventType || !eventDate || !message) {
      return NextResponse.json(
        { error: 'Please fill all required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // ── 1. Resolve venue & vendor ──────────────────────────────
    let primaryVenue: any = null;
    let primaryVendor: any = null;

    if (venueId) {
      // Direct ID lookup (when available)
      primaryVenue = await Venue.findById(venueId).lean();
    }
    
    // Fallback: search by venue name if ID didn't work
    if (!primaryVenue && venueName) {
      // Try exact match first, then fuzzy
      primaryVenue = await Venue.findOne({
        name: { $regex: new RegExp(`^${venueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        status: 'approved',
      }).lean();

      // If no exact match, try partial match
      if (!primaryVenue) {
        primaryVenue = await Venue.findOne({
          name: { $regex: new RegExp(venueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          status: 'approved',
        }).lean();
      }
    }

    // Get vendor from venue
    if (primaryVenue?.vendorId) {
      primaryVendor = await Vendor.findById(primaryVenue.vendorId).lean();
    }

    // If still no vendor, try searching by category
    if (!primaryVendor && !primaryVenue) {
      // Find the first active vendor in this category
      primaryVendor = await Vendor.findOne({
        categories: category,
        isActive: true,
      }).lean();
    }

    console.log('[chat-enquiry] Venue resolved:', primaryVenue?.name || 'None', '| Vendor:', primaryVendor?.businessName || 'None');

    // ── 2. Build vendor list ───────────────────────────────────
    let vendorObjectIds: any[] = [];
    if (primaryVendor) {
      vendorObjectIds.push(primaryVendor._id);
    }

    // Find additional vendors in same category (up to 4 more)
    const additionalVendors = await Vendor.find({
      categories: category,
      isActive: true,
      ...(vendorObjectIds.length ? { _id: { $nin: vendorObjectIds } } : {}),
    })
      .limit(4)
      .lean();

    vendorObjectIds = [
      ...vendorObjectIds,
      ...additionalVendors.map((v: any) => v._id),
    ];

    // ── 3. Create QuoteRequest ─────────────────────────────────
    const quoteData: Record<string, any> = {
      userId: session.user.id,
      eventType,
      location: primaryVenue?.city || primaryVenue?.location || 'Not specified',
      eventDate: new Date(eventDate),
      requirements: message,
      notes: `Enquiry sent via Shubhi chatbot${venueName ? ` for ${venueName}` : ''}`,
      category,
      vendorIds: vendorObjectIds,
      source: 'chatbot',
      status: 'pending',
    };

    if (guests && !isNaN(parseInt(guests)) && parseInt(guests) > 0) {
      quoteData.attendees = parseInt(guests);
    }

    if (venueId && primaryVenue) {
      quoteData.venueId = primaryVenue._id;
    }

    console.log('[chat-enquiry] Creating QuoteRequest:', {
      eventType,
      category,
      venueId,
      vendorCount: vendorObjectIds.length,
      source: 'chatbot',
    });

    const quoteRequest = await QuoteRequest.create(quoteData);

    console.log(
      '[chat-enquiry] Created QuoteRequest:',
      quoteRequest._id.toString()
    );

    // ── 4. Send email to vendor (non-blocking) ────────────────
    try {
      const requestingUser = (await User.findById(session.user.id).lean()) as any;
      const targetVendor =
        primaryVendor ?? (additionalVendors[0] as any) ?? null;

      console.log('[chat-enquiry] Email target vendor:', targetVendor?.businessName, '| Email:', targetVendor?.email);

      if (targetVendor?.email) {
        const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;
        const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const html = quoteEnquiryEmail({
          vendorName: targetVendor.name || targetVendor.businessName,
          businessName: targetVendor.businessName,
          userName: requestingUser?.name || 'A Customer',
          userEmail: requestingUser?.email || '',
          eventType,
          eventDate: formattedDate,
          location:
            primaryVenue?.city ||
            primaryVenue?.location ||
            'Not specified',
          attendees: quoteData.attendees || 0,
          budgetMin: 0,
          budgetMax: 1000000,
          requirements: message,
          notes: `Enquiry via Shubhi Chatbot${venueName ? ` for ${venueName}` : ''}`,
          venueName: primaryVenue?.name || venueName,
          dashboardUrl,
        });

        const emailResult = await sendMail({
          to: targetVendor.email,
          subject: `🎉 New Chatbot Enquiry from ${requestingUser?.name || 'a Customer'} – Shubharambh`,
          html,
        });

        console.log('[chat-enquiry] Email result:', emailResult.success ? 'SENT ✅' : `FAILED ❌ ${emailResult.error}`);
      } else {
        console.log('[chat-enquiry] ⚠️ No vendor email found — skipping email notification');
      }
    } catch (emailErr) {
      console.error('[chat-enquiry] Email failed (non-fatal):', emailErr);
    }

    const successTarget = primaryVenue?.name || venueName || `${vendorObjectIds.length} vendor(s)`;

    return NextResponse.json({
      success: true,
      message: `Enquiry sent to ${successTarget}! They'll respond within 24 hours. Check your dashboard for updates.`,
      quoteRequestId: quoteRequest._id.toString(),
    });
  } catch (error: any) {
    console.error('[chat-enquiry] Error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to send enquiry. Please try again.' },
      { status: 500 }
    );
  }
}
