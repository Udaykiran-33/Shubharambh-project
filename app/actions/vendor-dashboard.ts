'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Vendor from '@/models/Vendor';
import Venue from '@/models/Venue';
import QuoteRequest from '@/models/QuoteRequest';
import Appointment from '@/models/Appointment';

// Get vendor's own listings
export async function getVendorListings() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    await dbConnect();

    // Try userId first (most reliable), fall back to email
    let vendor = session.user.id
      ? await Vendor.findOne({ userId: session.user.id })
      : null;

    if (!vendor) {
      vendor = await Vendor.findOne({ email: session.user.email });
    }

    if (!vendor) {
      return { venues: [], vendor: null };
    }

    // Get all venues for this vendor
    const venues = await Venue.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .lean();

    return {
      vendor: JSON.parse(JSON.stringify(vendor)),
      venues: JSON.parse(JSON.stringify(venues))
    };
  } catch (error) {
    console.error('Get vendor listings error:', error);
    return { error: 'Failed to load listings' };
  }
}

// Get incoming quote requests for vendor's venues
export async function getVendorQuoteRequests() {
  try {
    const session = await auth();
    console.log('[getVendorQuoteRequests] Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return [];
    }

    await dbConnect();

    // Find vendor
    const vendor = await Vendor.findOne({ email: session.user.email });
    console.log('[getVendorQuoteRequests] Vendor found:', vendor?._id.toString());
    
    if (!vendor) {
      return [];
    }

    // Get quote requests that include this vendor in their vendorIds array
    const quoteRequests = await QuoteRequest.find({ 
      vendorIds: vendor._id 
    })
      .populate('userId', 'name email')
      .populate('venueId', 'name images category')
      .populate('vendorResponse.respondedBy', 'businessName')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[getVendorQuoteRequests] Found quote requests:', quoteRequests.length);
    quoteRequests.forEach((req: any) => {
      console.log('  - Quote request:', req._id, 'Status:', req.status, 'Event:', req.eventType, 'VendorResponse:', req.vendorResponse?.status || 'none');
    });

    return JSON.parse(JSON.stringify(quoteRequests));
  } catch (error) {
    console.error('Get vendor quote requests error:', error);
    return [];
  }
}

// Get incoming appointments for vendor's venues
export async function getVendorAppointments() {
  try {
    const session = await auth();
    console.log('[getVendorAppointments] Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return [];
    }

    await dbConnect();

    // Find vendor
    const vendor = await Vendor.findOne({ email: session.user.email });
    console.log('[getVendorAppointments] Vendor found:', vendor?._id.toString());
    
    if (!vendor) {
      return [];
    }

    // Get vendor's venues
    const venues = await Venue.find({ vendorId: vendor._id }).select('_id name');
    const venueIds = venues.map(v => v._id);
    console.log('[getVendorAppointments] Vendor venues:', venues.length, 'IDs:', venueIds.map(v => v.toString()));

    // Get appointments for these venues
    const appointments = await Appointment.find({ venueId: { $in: venueIds } })
      .populate('userId', 'name email phone')
      .populate('venueId', 'name images category')
      .sort({ scheduledDate: 1 })
      .lean();

    console.log('[getVendorAppointments] Found appointments:', appointments.length);
    appointments.forEach((appt: any) => {
      console.log('  - Appointment:', appt._id, 'Status:', appt.status, 'Venue:', appt.venueId?._id);
    });

    return JSON.parse(JSON.stringify(appointments));
  } catch (error) {
    console.error('Get vendor appointments error:', error);
    return [];
  }
}

// Accept appointment
export async function acceptAppointment(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    await dbConnect();

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'confirmed' },
      { new: true }
    );

    if (!appointment) {
      return { error: 'Appointment not found' };
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Appointment confirmed' };
  } catch (error) {
    console.error('Accept appointment error:', error);
    return { error: 'Failed to confirm appointment' };
  }
}

// Reject appointment
export async function rejectAppointment(appointmentId: string, reason: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    await dbConnect();

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status: 'rejected',
        rejectionReason: reason 
      },
      { new: true }
    );

    if (!appointment) {
      return { error: 'Appointment not found' };
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Appointment rejected' };
  } catch (error) {
    console.error('Reject appointment error:', error);
    return { error: 'Failed to reject appointment' };
  }
}

// Accept quote request
export async function acceptQuoteRequest(quoteRequestId: string, message?: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    await dbConnect();

    // Find vendor
    const vendor = await Vendor.findOne({ email: session.user.email });
    if (!vendor) {
      return { error: 'Vendor not found' };
    }

    // Verify the quote request is for this vendor
    const quoteRequest = await QuoteRequest.findOne({
      _id: quoteRequestId,
      vendorIds: vendor._id
    });

    if (!quoteRequest) {
      return { error: 'Quote request not found or unauthorized' };
    }

    // Update quote request with vendor response
    const updatedRequest = await QuoteRequest.findByIdAndUpdate(
      quoteRequestId,
      {
        status: 'responded',
        vendorResponse: {
          status: 'accepted',
          message: message || 'Your quote request has been accepted. We will contact you soon with details.',
          respondedAt: new Date(),
          respondedBy: vendor._id
        }
      },
      { new: true }
    );

    console.log('[acceptQuoteRequest] Updated quote request:', updatedRequest?._id, 'New status:', updatedRequest?.status, 'Response:', updatedRequest?.vendorResponse?.status);

    revalidatePath('/dashboard');
    return { success: true, message: 'Quote request accepted' };
  } catch (error) {
    console.error('Accept quote request error:', error);
    return { error: 'Failed to accept quote request' };
  }
}

// Reject quote request
export async function rejectQuoteRequest(quoteRequestId: string, reason: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    if (!reason || reason.trim().length === 0) {
      return { error: 'Rejection reason is required' };
    }

    await dbConnect();

    // Find vendor
    const vendor = await Vendor.findOne({ email: session.user.email });
    if (!vendor) {
      return { error: 'Vendor not found' };
    }

    // Verify the quote request is for this vendor
    const quoteRequest = await QuoteRequest.findOne({
      _id: quoteRequestId,
      vendorIds: vendor._id
    });

    if (!quoteRequest) {
      return { error: 'Quote request not found or unauthorized' };
    }

    // Update quote request with vendor response
    const updatedRequest = await QuoteRequest.findByIdAndUpdate(
      quoteRequestId,
      {
        status: 'responded',
        vendorResponse: {
          status: 'rejected',
          message: reason,
          respondedAt: new Date(),
          respondedBy: vendor._id
        }
      },
      { new: true }
    );

    console.log('[rejectQuoteRequest] Updated quote request:', updatedRequest?._id, 'New status:', updatedRequest?.status, 'Response:', updatedRequest?.vendorResponse?.status);

    revalidatePath('/dashboard');
    return { success: true, message: 'Quote request rejected' };
  } catch (error) {
    console.error('Reject quote request error:', error);
    return { error: 'Failed to reject quote request' };
  }
}

// Update venue/listing
export async function updateVenueListing(venueId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    await dbConnect();

    // Verify ownership
    const vendor = await Vendor.findOne({ email: session.user.email });
    if (!vendor) {
      return { error: 'Vendor not found' };
    }

    const venue = await Venue.findOne({ _id: venueId, vendorId: vendor._id });
    if (!venue) {
      return { error: 'Venue not found or unauthorized' };
    }

    // Update venue
    Object.assign(venue, data);
    await venue.save();

    revalidatePath('/dashboard');
    revalidatePath('/venues');
    revalidatePath(`/categories/${venue.category}`);

    return { success: true, message: 'Listing updated successfully' };
  } catch (error) {
    console.error('Update venue error:', error);
    return { error: 'Failed to update listing' };
  }
}

// Delete venue/listing
export async function deleteVenueListing(venueId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    await dbConnect();

    // Verify ownership
    const vendor = await Vendor.findOne({ email: session.user.email });
    if (!vendor) {
      return { error: 'Vendor not found' };
    }

    const venue = await Venue.findOne({ _id: venueId, vendorId: vendor._id });
    if (!venue) {
      return { error: 'Venue not found or unauthorized' };
    }

    await Venue.findByIdAndDelete(venueId);

    revalidatePath('/dashboard');
    revalidatePath('/venues');
    revalidatePath(`/categories/${venue.category}`);

    return { success: true, message: 'Listing deleted successfully' };
  } catch (error) {
    console.error('Delete venue error:', error);
    return { error: 'Failed to delete listing' };
  }
}
