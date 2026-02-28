import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuoteRequest from '@/models/QuoteRequest';
import Quote from '@/models/Quote';

export async function POST() {
  try {
    await dbConnect();
    
    // Delete all quotes first (foreign key dependency)
    const quotesResult = await Quote.deleteMany({});
    
    // Then delete all quote requests
    const requestsResult = await QuoteRequest.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${requestsResult.deletedCount} quote requests and ${quotesResult.deletedCount} quotes`,
      quotesDeleted: quotesResult.deletedCount,
      requestsDeleted: requestsResult.deletedCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
