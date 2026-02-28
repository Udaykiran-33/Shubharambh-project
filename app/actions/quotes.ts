'use server';

import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import QuoteRequest from '@/models/QuoteRequest';
import Quote from '@/models/Quote';
import Vendor from '@/models/Vendor';
import Venue from '@/models/Venue';
import User from '@/models/User';
import { sendMail } from '@/lib/mailer';
import { quoteEnquiryEmail } from '@/lib/emailTemplates';

export async function createQuoteRequest(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: 'Please login to request a quote' };
  }

  const eventType = formData.get('eventType') as string;
  const location = formData.get('location') as string;
  const eventDate = formData.get('eventDate') as string;
  const attendees = parseInt(formData.get('attendees') as string);
  const budgetMin = parseInt(formData.get('budgetMin') as string);
  const budgetMax = parseInt(formData.get('budgetMax') as string);
  const requirements = formData.get('requirements') as string;
  const notes = formData.get('notes') as string;
  const category = formData.get('category') as string || 'venues';
  const venueId = formData.get('venueId') as string;

  // Categories that require a guest/attendee count
  const guestRequiredCategories = ['venues', 'caterers', 'decorators', 'djs'];
  const needsAttendees = guestRequiredCategories.includes(category);

  if (!eventType || !location || !eventDate || !requirements) {
    return { error: 'Please fill all required fields' };
  }
  if (needsAttendees && !attendees) {
    return { error: 'Please enter the expected number of guests' };
  }

  try {
    await dbConnect();

    // ── 1. Resolve the specific venue/vendor the user clicked on ─────────────
    let primaryVenue: any = null;
    let primaryVendor: any = null;

    if (venueId) {
      primaryVenue = await Venue.findById(venueId).lean();
      if (primaryVenue?.vendorId) {
        primaryVendor = await Vendor.findById(primaryVenue.vendorId).lean();
        // Make sure this vendor ends up in the notification list
      }
    }

    // ── 2. Build vendor list (for the vendorIds field on QuoteRequest) ────────
    let vendorObjectIds: any[] = [];

    if (primaryVendor) {
      vendorObjectIds.push(primaryVendor._id);
    }

    // Find additional vendors in same category (up to 4 more)
    const additionalVendors = await Vendor.find({
      categories: category,
      isActive: true,
      ...(vendorObjectIds.length ? { _id: { $nin: vendorObjectIds } } : {}),
    }).limit(4).lean();

    vendorObjectIds = [...vendorObjectIds, ...additionalVendors.map((v: any) => v._id)];

    // ── 3. Create the QuoteRequest document ──────────────────────────────────
    const quoteData: Record<string, any> = {
      userId: session.user.id,
      eventType,
      location,
      eventDate: new Date(eventDate),
      requirements,
      notes: notes || '',
      category,
      vendorIds: vendorObjectIds,
      status: 'pending',
    };

    // Only include budget if user provided real numbers
    if (!isNaN(budgetMin) && budgetMin > 0) quoteData.budgetMin = budgetMin;
    else quoteData.budgetMin = 0;
    if (!isNaN(budgetMax) && budgetMax > 0) quoteData.budgetMax = budgetMax;
    else quoteData.budgetMax = 1000000;

    // Only include attendees for categories that need it  
    if (needsAttendees && !isNaN(attendees) && attendees > 0) {
      quoteData.attendees = attendees;
    }

    // Include venue reference if one was clicked  
    if (venueId && primaryVenue) {
      quoteData.venueId = primaryVenue._id;
    }

    // Category details — store as plain object (schema uses Map which accepts Object)
    const categoryDetailsStr = formData.get('categoryDetails') as string;
    if (categoryDetailsStr) {
      try {
        quoteData.categoryDetails = JSON.parse(categoryDetailsStr);
      } catch {
        console.warn('[createQuoteRequest] Could not parse categoryDetails, skipping');
      }
    }

    console.log('[createQuoteRequest] Creating with data:', {
      eventType, location, eventDate, category, venueId,
      attendees: quoteData.attendees,
      vendorCount: vendorObjectIds.length,
    });

    const quoteRequest = await QuoteRequest.create(quoteData);

    console.log('[createQuoteRequest] Created QuoteRequest:', quoteRequest._id.toString());

    // ── 4. Send notification email (non-blocking) ─────────────────────────────
    try {
      const requestingUser = await User.findById(session.user.id).lean() as any;
      const targetVendor = primaryVendor ?? (additionalVendors[0] as any) ?? null;

      if (targetVendor?.email) {
        const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;
        const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        const html = quoteEnquiryEmail({
          vendorName: targetVendor.name || targetVendor.businessName,
          businessName: targetVendor.businessName,
          userName: requestingUser?.name || 'A Customer',
          userEmail: requestingUser?.email || '',
          eventType,
          eventDate: formattedDate,
          location,
          attendees: (!isNaN(attendees) && attendees > 0) ? attendees : 0,
          budgetMin: !isNaN(budgetMin) ? budgetMin : 0,
          budgetMax: !isNaN(budgetMax) ? budgetMax : 1000000,
          requirements,
          notes: notes || '',
          venueName: primaryVenue?.name,
          dashboardUrl,
        });

        await sendMail({
          to: targetVendor.email,
          subject: `🎉 New Quote Enquiry from ${requestingUser?.name || 'a Customer'} – Shubharambh`,
          html,
        });
        console.log('[createQuoteRequest] Email sent to:', targetVendor.email);
      }
    } catch (emailErr) {
      console.error('[createQuoteRequest] Email failed (non-fatal):', emailErr);
    }

    const successMessage = primaryVenue
      ? `Enquiry sent to ${primaryVenue.name}. They'll respond within 24 hours.`
      : `Quote request sent to ${vendorObjectIds.length} vendors. Check your dashboard for responses.`;

    return {
      success: true,
      message: successMessage,
      quoteRequestId: quoteRequest._id.toString(),
    };

  } catch (err: any) {
    console.error('[createQuoteRequest] FATAL ERROR:', {
      message: err?.message,
      name: err?.name,
      errors: err?.errors
        ? Object.entries(err.errors).map(([k, v]: any) => `${k}: ${v?.message}`)
        : undefined,
    });
    return { error: 'Failed to create quote request. Please try again.' };
  }
}

export async function getUserQuoteRequests() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    await dbConnect();

    // Get all quote requests sent by this user
    const quoteRequests = await QuoteRequest.find({ 
      userId: session.user.id 
    })
      .populate('vendorIds', 'businessName email')
      .populate('venueId', 'name images category')
      .populate('vendorResponse.respondedBy', 'businessName email')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[getUserQuoteRequests] Found quote requests for user:', quoteRequests.length);
    quoteRequests.forEach((req: any) => {
      console.log('  - Request:', req._id, 'Status:', req.status, 'VendorResponse:', {
        status: req.vendorResponse?.status || 'none',
        message: req.vendorResponse?.message || 'N/A',
        respondedAt: req.vendorResponse?.respondedAt || 'N/A',
        respondedBy: req.vendorResponse?.respondedBy?.businessName || 'N/A'
      });
    });

    return JSON.parse(JSON.stringify(quoteRequests));
  } catch (error) {
    console.error('Get quote requests error:', error);
    return [];
  }
}

export async function getQuotesForRequest(quoteRequestId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    await dbConnect();

    // Verify the quote request belongs to the user
    const quoteRequest = await QuoteRequest.findOne({
      _id: quoteRequestId,
      userId: session.user.id,
    });

    if (!quoteRequest) {
      return [];
    }

    const quotes = await Quote.find({ quoteRequestId })
      .populate('venueId', 'name images location rating')
      .sort({ price: 1 })
      .lean();

    return JSON.parse(JSON.stringify(quotes));
  } catch (error) {
    console.error('Get quotes error:', error);
    return [];
  }
}

export async function acceptQuote(quoteId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Please login to accept quote' };
  }

  try {
    await dbConnect();

    const quote = await Quote.findById(quoteId).populate('quoteRequestId');

    if (!quote) {
      return { error: 'Quote not found' };
    }

    // Verify ownership
    const quoteRequest = await QuoteRequest.findOne({
      _id: quote.quoteRequestId,
      userId: session.user.id,
    });

    if (!quoteRequest) {
      return { error: 'Unauthorized' };
    }

    // Update quote status
    await Quote.findByIdAndUpdate(quoteId, { status: 'accepted' });
    
    // Reject other quotes
    await Quote.updateMany(
      { quoteRequestId: quote.quoteRequestId, _id: { $ne: quoteId } },
      { status: 'rejected' }
    );

    // Update quote request status
    await QuoteRequest.findByIdAndUpdate(quote.quoteRequestId, { status: 'responded' });

    return { success: true, message: 'Quote accepted successfully!' };
  } catch (error) {
    console.error('Accept quote error:', error);
    return { error: 'Failed to accept quote' };
  }
}
