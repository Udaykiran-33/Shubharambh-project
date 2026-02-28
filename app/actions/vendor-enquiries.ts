'use server';

import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import QuoteRequest from '@/models/QuoteRequest';
import Quote from '@/models/Quote';
import Vendor from '@/models/Vendor';

export async function getVendorEnquiries() {
  try {
    await dbConnect();

    // Get all quote requests with their quotes
    const quoteRequests = await QuoteRequest.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return JSON.parse(JSON.stringify(quoteRequests));
  } catch (error) {
    console.error('Get vendor enquiries error:', error);
    return [];
  }
}

export async function getEnquiryStats() {
  try {
    await dbConnect();

    const totalEnquiries = await QuoteRequest.countDocuments();
    const pendingEnquiries = await QuoteRequest.countDocuments({ status: 'pending' });
    const respondedEnquiries = await QuoteRequest.countDocuments({ status: 'responded' });
    const totalQuotes = await Quote.countDocuments();
    const acceptedQuotes = await Quote.countDocuments({ status: 'accepted' });

    const conversionRate = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) : '0';

    return {
      totalEnquiries,
      pendingEnquiries,
      respondedEnquiries,
      totalQuotes,
      acceptedQuotes,
      conversionRate,
    };
  } catch (error) {
    console.error('Get enquiry stats error:', error);
    return {
      totalEnquiries: 0,
      pendingEnquiries: 0,
      respondedEnquiries: 0,
      totalQuotes: 0,
      acceptedQuotes: 0,
      conversionRate: '0',
    };
  }
}

export async function getEnquiryDetails(enquiryId: string) {
  try {
    await dbConnect();

    const quoteRequest = await QuoteRequest.findById(enquiryId)
      .populate('userId', 'name email phone')
      .populate('venueId', 'name images location')
      .lean();

    if (!quoteRequest) {
      return null;
    }

    const quotes = await Quote.find({ quoteRequestId: enquiryId })
      .populate('venueId', 'name images location rating')
      .populate('vendorId', 'name email phone')
      .lean();

    return JSON.parse(JSON.stringify({ quoteRequest, quotes }));
  } catch (error) {
    console.error('Get enquiry details error:', error);
    return null;
  }
}
