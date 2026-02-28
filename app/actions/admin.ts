'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import Venue from '@/models/Venue';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';

// Get dashboard stats
export async function getAdminStats() {
  try {
    await connectDB();
    
    const [
      totalVenues,
      pendingVenues,
      approvedVenues,
      rejectedVenues,
      totalVendors,
      pendingVendors,
      approvedVendors,
      totalCategories,
    ] = await Promise.all([
      Venue.countDocuments(),
      Venue.countDocuments({ status: 'pending' }),
      Venue.countDocuments({ status: 'approved' }),
      Venue.countDocuments({ status: 'rejected' }),
      Vendor.countDocuments(),
      Vendor.countDocuments({ $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }] }),
      Vendor.countDocuments({ status: 'approved' }),
      Category.countDocuments(),
    ]);

    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSubmissions = await Vendor.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    return {
      totalVenues,
      pendingVenues,
      approvedVenues,
      rejectedVenues,
      totalVendors,
      pendingVendors,
      approvedVendors,
      totalCategories,
      recentSubmissions,
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalVenues: 0,
      pendingVenues: 0,
      approvedVenues: 0,
      rejectedVenues: 0,
      totalVendors: 0,
      pendingVendors: 0,
      approvedVendors: 0,
      totalCategories: 0,
      recentSubmissions: 0,
    };
  }
}

// Get all venues for admin
export async function getAdminVenues(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
  try {
    await connectDB();
    
    const query: Record<string, unknown> = {};
    if (filter !== 'all') {
      query.status = filter;
    }

    const venues = await Venue.find(query)
      .sort({ createdAt: -1 })
      .populate('vendorId', 'name email phone businessName')
      .lean();

    return JSON.parse(JSON.stringify(venues));
  } catch (error) {
    console.error('Error getting admin venues:', error);
    return [];
  }
}

// Approve venue
export async function approveVenue(venueId: string) {
  try {
    await connectDB();
    
    const venue = await Venue.findByIdAndUpdate(
      venueId,
      {
        status: 'approved',
        isAvailable: true,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!venue) {
      return { success: false, message: 'Venue not found' };
    }

    return { success: true, message: 'Venue approved successfully' };
  } catch (error) {
    console.error('Error approving venue:', error);
    return { success: false, message: 'Failed to approve venue' };
  }
}

// Reject venue
export async function rejectVenue(venueId: string, reason: string) {
  try {
    await connectDB();
    
    const venue = await Venue.findByIdAndUpdate(
      venueId,
      {
        status: 'rejected',
        isAvailable: false,
        rejectionReason: reason,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!venue) {
      return { success: false, message: 'Venue not found' };
    }

    return { success: true, message: 'Venue rejected' };
  } catch (error) {
    console.error('Error rejecting venue:', error);
    return { success: false, message: 'Failed to reject venue' };
  }
}

// Delete venue
export async function deleteVenue(venueId: string) {
  try {
    await connectDB();
    
    const venue = await Venue.findByIdAndDelete(venueId);

    if (!venue) {
      return { success: false, message: 'Venue not found' };
    }

    return { success: true, message: 'Venue deleted successfully' };
  } catch (error) {
    console.error('Error deleting venue:', error);
    return { success: false, message: 'Failed to delete venue' };
  }
}

// Get all vendors for admin with filters
export async function getAdminVendors(
  category?: string,
  status: 'all' | 'pending' | 'approved' | 'rejected' = 'all'
) {
  try {
    await connectDB();
    
    const query: Record<string, unknown> = {};
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.categories = category;
    }
    
    // Filter by status if provided
    // Note: 'pending' should also match vendors without a status field (legacy data)
    if (status !== 'all') {
      if (status === 'pending') {
        // Match vendors with status='pending' OR no status field at all
        query.$or = [
          { status: 'pending' },
          { status: { $exists: false } },
          { status: null }
        ];
      } else {
        query.status = status;
      }
    }

    const vendors = await Vendor.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(vendors));
  } catch (error) {
    console.error('Error getting admin vendors:', error);
    return [];
  }
}

// Approve vendor
export async function approveVendor(vendorId: string) {
  try {
    console.log('[Server] Approving vendor:', vendorId);
    await connectDB();
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      console.log('[Server] Vendor not found');
      return { success: false, message: 'Vendor not found' };
    }

    console.log('[Server] Before update:', {
      id: vendor._id,
      status: vendor.status,
      isActive: vendor.isActive
    });

    // BYPASS MONGOOSE - Use raw MongoDB driver
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const vendorsCollection = db.collection('vendors');
    
    const updateResult = await vendorsCollection.updateOne(
      { _id: vendor._id },
      { 
        $set: {
          status: 'approved',
          isActive: true,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        }
      }
    );

    console.log('[Server] Raw MongoDB update result:', {
      acknowledged: updateResult.acknowledged,
      modifiedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount
    });

    // VERIFY: Re-fetch using raw MongoDB
    const verifyVendor = await vendorsCollection.findOne({ _id: vendor._id });
    console.log('[Server] DATABASE VERIFICATION (raw MongoDB):', {
      id: verifyVendor?._id,
      status: verifyVendor?.status,
      isActive: verifyVendor?.isActive,
      hasStatusField: verifyVendor ? 'status' in verifyVendor : false
    });

    if (!verifyVendor || verifyVendor.status !== 'approved') {
      console.error('[Server] ERROR: Status did not persist to database!');
      console.error('[Server] Full vendor object:', JSON.stringify(verifyVendor, null, 2));
      return { success: false, message: 'Failed to persist approval to database' };
    }

    console.log('[Server] ✅ SUCCESS: Vendor approved and persisted to database');

    // Also approve all associated venues for this vendor
    const venuesCollection = db.collection('venues');
    const venueUpdateResult = await venuesCollection.updateMany(
      { vendorId: vendor._id },
      { 
        $set: {
          status: 'approved',
          isAvailable: true,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        }
      }
    );
    
    console.log('[Server] Auto-approved venues:', {
      matchedCount: venueUpdateResult.matchedCount,
      modifiedCount: venueUpdateResult.modifiedCount
    });

    // Revalidate pages to show updated data
    revalidatePath('/admin/vendors');
    revalidatePath('/admin/venues');
    revalidatePath('/categories');
    
    // Revalidate specific category pages for this vendor
    if (verifyVendor.categories && verifyVendor.categories.length > 0) {
      verifyVendor.categories.forEach((category: string) => {
        revalidatePath(`/categories/${category}`);
        console.log('[Server] Revalidated category:', category);
      });
    }

    return { success: true, message: 'Vendor and associated venues approved successfully' };
  } catch (error) {
    console.error('[Server] Error approving vendor:', error);
    return { success: false, message: 'Failed to approve vendor: ' + (error as Error).message };
  }
}

// Reject vendor
export async function rejectVendor(vendorId: string, reason: string) {
  try {
    console.log('[Server] Rejecting vendor:', vendorId, 'Reason:', reason);
    await connectDB();
    
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      console.log('[Server] Vendor not found');
      return { success: false, message: 'Vendor not found' };
    }

    // Use updateOne with $set to force field addition
    const updateResult = await Vendor.updateOne(
      { _id: vendorId },
      { 
        $set: {
          status: 'rejected',
          isActive: false,
          rejectionReason: reason,
          verifiedAt: new Date(),
        }
      }
    );

    console.log('[Server] Reject update result:', {
      acknowledged: updateResult.acknowledged,
      modifiedCount: updateResult.modifiedCount
    });

    // Also reject all associated venues
    await Venue.updateMany(
      { vendorId: vendor._id },
      {
        $set: {
          status: 'rejected',
          isAvailable: false,
          rejectionReason: 'Vendor rejected',
          verifiedAt: new Date(),
        }
      }
    );

    // Verify
    const verifyVendor = await Vendor.findById(vendorId).lean();
    console.log('[Server] Vendor rejected and verified:', {
      id: verifyVendor?._id,
      status: verifyVendor?.status,
      isActive: verifyVendor?.isActive
    });

    revalidatePath('/admin/vendors');
    revalidatePath('/admin/venues');

    return { success: true, message: 'Vendor and associated venues rejected' };
  } catch (error) {
    console.error('[Server] Error rejecting vendor:', error);
    return { success: false, message: 'Failed to reject vendor: ' + (error as Error).message };
  }
}

// Toggle vendor active status
export async function toggleVendorStatus(vendorId: string) {
  try {
    await connectDB();
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return { success: false, message: 'Vendor not found' };
    }

    vendor.isActive = !vendor.isActive;
    await vendor.save();

    return { success: true, message: `Vendor ${vendor.isActive ? 'activated' : 'deactivated'}` };
  } catch (error) {
    console.error('Error toggling vendor status:', error);
    return { success: false, message: 'Failed to update vendor' };
  }
}

// Delete vendor
export async function deleteVendor(vendorId: string) {
  try {
    await connectDB();
    
    // Delete vendor and their venues
    await Venue.deleteMany({ vendorId });
    await Vendor.findByIdAndDelete(vendorId);

    return { success: true, message: 'Vendor and associated venues deleted' };
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return { success: false, message: 'Failed to delete vendor' };
  }
}

// Get all categories for admin
export async function getAdminCategories() {
  try {
    await connectDB();
    
    const categories = await Category.find()
      .sort({ order: 1 })
      .lean();

    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error('Error getting admin categories:', error);
    return [];
  }
}

// Toggle category active status
export async function toggleCategoryStatus(categoryId: string) {
  try {
    await connectDB();
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return { success: false, message: 'Category not found' };
    }

    category.isActive = !category.isActive;
    await category.save();

    return { success: true, message: `Category ${category.isActive ? 'activated' : 'deactivated'}` };
  } catch (error) {
    console.error('Error toggling category status:', error);
    return { success: false, message: 'Failed to update category' };
  }
}

// Update category
export async function updateCategory(categoryId: string, data: {
  name?: string;
  description?: string;
  image?: string;
  order?: number;
}) {
  try {
    await connectDB();
    
    const category = await Category.findByIdAndUpdate(categoryId, data, { new: true });

    if (!category) {
      return { success: false, message: 'Category not found' };
    }

    return { success: true, message: 'Category updated' };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, message: 'Failed to update category' };
  }
}
