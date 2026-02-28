'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Venue from '@/models/Venue';
import Vendor from '@/models/Vendor';

// Get venues with optional filters
export async function getVenues(filters: {
  eventType?: string;
  location?: string;
  category?: string;
  minCapacity?: number;
  maxPrice?: number;
}) {
  await dbConnect();

  // Build query - only show approved venues
  const query: Record<string, unknown> = { isAvailable: true, status: 'approved' };
  
  if (filters.eventType) {
    query.eventTypes = filters.eventType;
  }
  
  if (filters.location) {
    query.$or = [
      { location: { $regex: filters.location, $options: 'i' } },
      { city: { $regex: filters.location, $options: 'i' } },
    ];
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.minCapacity) {
    query['capacity.max'] = { $gte: filters.minCapacity };
  }
  
  if (filters.maxPrice) {
    query['priceRange.min'] = { $lte: filters.maxPrice };
  }

  const venues = await Venue.find(query)
    .sort({ rating: -1 })
    .lean();

  return JSON.parse(JSON.stringify(venues));
}

// Get a venue by its ID
export async function getVenueById(id: string) {
  await dbConnect();
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  
  try {
    const venue = await Venue.findById(id).lean();
    
    if (!venue) {
      return null;
    }

    return JSON.parse(JSON.stringify(venue));
  } catch {
    return null;
  }
}

// Get featured venues (highest rated)
export async function getFeaturedVenues(limit: number = 3) {
  await dbConnect();

  const venues = await Venue.find({ 
    isAvailable: true, 
    status: 'approved',
    category: 'venues'  // Only show actual venues, not other services like photographers
  })
    .sort({ rating: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(venues));
}

// Search venues by keyword
export async function searchVenues(searchTerm: string) {
  await dbConnect();

  const venues = await Venue.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { city: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
    ],
    isAvailable: true,
    status: 'approved',
  })
    .sort({ rating: -1 })
    .limit(20)
    .lean();

  return JSON.parse(JSON.stringify(venues));
}

// Get vendors by category slug (only shows approved/available listings)
export async function getVendorsByCategory(slug: string, filters?: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
}) {
  await dbConnect();

  // The slug IS the category - direct mapping
  // This ensures each category shows ONLY its own vendors
  const category = slug;

  // Build query - only show approved venues that are available
  const query: Record<string, unknown> = { 
    isAvailable: true,
    status: 'approved', // Only show admin-approved listings
    category: category,
  };
  
  if (filters?.location) {
    query.$or = [
      { location: { $regex: filters.location, $options: 'i' } },
      { city: { $regex: filters.location, $options: 'i' } },
    ];
  }
  
  if (filters?.minPrice) {
    query['priceRange.min'] = { $gte: filters.minPrice };
  }
  
  if (filters?.maxPrice) {
    query['priceRange.max'] = { $lte: filters.maxPrice };
  }
  
  if (filters?.rating) {
    query.rating = { $gte: filters.rating };
  }

  const vendors = await Venue.find(query)
    .sort({ rating: -1 })
    .lean();

  return JSON.parse(JSON.stringify(vendors));
}

// Get counts of vendors per category
export async function getCategoryCounts() {
  await dbConnect();

  const counts = await Venue.aggregate([
    { $match: { isAvailable: true, status: 'approved' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap: Record<string, number> = {};
  counts.forEach((item: { _id: string; count: number }) => {
    countMap[item._id] = item.count;
  });

  return countMap;
}

// Get approved vendors from Venue model by category
// Queries Venue.category directly — each venue knows its own category
export async function getApprovedVendorsByCategory(categorySlug: string, filters?: {
  location?: string;
}) {
  await dbConnect();

  // ── Core query: filter by the venue's OWN category field ──────────────────
  const query: Record<string, unknown> = {
    category: categorySlug,   // Venue.category — NOT Vendor.categories
    isAvailable: true,
    status: 'approved',
  };

  if (filters?.location) {
    query.$or = [
      { location: { $regex: filters.location, $options: 'i' } },
      { city: { $regex: filters.location, $options: 'i' } },
    ];
  }

  const venues = await Venue.find(query).sort({ rating: -1 }).lean();

  console.log(`Found ${venues.length} approved venues for category: ${categorySlug}`);

  // ── Enrich each venue with vendor contact info (for quote/appointment modals) ──
  const vendorIds = [...new Set(venues.map((v: any) => v.vendorId?.toString()).filter(Boolean))];
  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();
  const vendorMap = new Map<string, any>();
  vendors.forEach((v: any) => vendorMap.set(v._id?.toString(), v));

  const result = venues.map((venue: any) => {
    const vendor = vendorMap.get(venue.vendorId?.toString());
    return {
      _id: venue._id?.toString() || '',
      vendorId: venue.vendorId?.toString() || '',
      name: venue.name || vendor?.businessName || 'Unnamed Business',
      type: venue.type || 'service',
      category: venue.category || categorySlug,
      eventTypes: venue.eventTypes || ['wedding', 'engagement'],
      location: venue.location || (vendor?.locations?.[0]) || 'Not specified',
      city: venue.city || (vendor?.locations?.[0]) || 'Not specified',
      address: venue.address || '',
      capacity: venue.capacity || { min: 0, max: 0 },
      priceRange: venue.priceRange || vendor?.priceRange || { min: 0, max: 0 },
      priceUnit: venue.priceUnit || 'per event',
      images: (venue.images?.length > 0 ? venue.images : vendor?.images) || [],
      amenities: venue.amenities || [],
      highlights: venue.highlights || ['Verified Vendor', 'Admin Approved'],
      description: venue.description || vendor?.description || `Professional ${categorySlug.replace(/-/g, ' ')} services`,
      rating: venue.rating || 4.5,
      reviewCount: venue.reviewCount || 0,
      isVenue: true,
      serviceDetails: venue.serviceDetails || {},
      vendorInfo: {
        name: vendor?.name || '',
        businessName: vendor?.businessName || '',
        email: vendor?.email || '',
        phone: vendor?.phone || '',
        categories: vendor?.categories || [],
        locations: vendor?.locations || [],
      },
    };
  });

  console.log(`Returning ${result.length} venues for category: ${categorySlug}`);
  return JSON.parse(JSON.stringify(result));
}

// Get distinct city/location values from all approved venues & vendors
// Optional `category` param to scope to a specific category slug
export async function getDistinctLocations(category?: string): Promise<string[]> {
  await dbConnect();

  // Query approved Venue docs for distinct city values
  const venueQuery: Record<string, unknown> = { isAvailable: true, status: 'approved' };
  if (category) venueQuery.category = category;

  const venueCities: string[] = await Venue.distinct('city', venueQuery);

  // Also pull distinct location values from Vendor docs
  const vendorQuery: Record<string, unknown> = { isActive: true, status: 'approved' };
  if (category) vendorQuery.categories = category;

  const vendorLocations: string[] = await Vendor.distinct('locations', vendorQuery);

  // Merge, deduplicate (case-insensitive), filter empties, sort
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const loc of [...venueCities, ...vendorLocations]) {
    const trimmed = (loc || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      // Capitalize first letter of each word
      merged.push(trimmed.replace(/\b\w/g, c => c.toUpperCase()));
    }
  }
  return merged.sort();
}

// Get count of approved vendors by category (from Vendor model)
export async function getApprovedVendorCounts() {
  await dbConnect();

  const categories = await Vendor.aggregate([
    { 
      $match: { 
        $or: [
          { status: 'approved', isActive: true },
          { status: { $exists: false }, isActive: true }
        ]
      } 
    },
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
  ]);

  const countMap: Record<string, number> = {};
  categories.forEach((item: { _id: string; count: number }) => {
    countMap[item._id] = item.count;
  });

  return countMap;
}
