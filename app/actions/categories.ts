'use server';

import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Venue from '@/models/Venue';

export async function getCategories() {
  try {
    await connectDB();
    
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    await connectDB();
    
    const category = await Category.findOne({ slug, isActive: true }).lean();
    
    return category ? JSON.parse(JSON.stringify(category)) : null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

export async function getCategoryVendorCounts() {
  try {
    await connectDB();
    
    const categories = await Category.find({ isActive: true }).lean();
    const counts: Record<string, number> = {};
    
    for (const category of categories) {
      const count = await Venue.countDocuments({
        category: category.slug,
        isAvailable: true,
        status: 'approved',
      });
      counts[category.slug] = count;
    }
    
    return counts;
  } catch (error) {
    console.error('Error fetching category vendor counts:', error);
    return {};
  }
}
