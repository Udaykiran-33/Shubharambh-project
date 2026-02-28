'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { getCategories } from '@/app/actions/categories';
import { getApprovedVendorCounts } from '@/app/actions/venues';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  backgroundColor: string;
  order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [categoriesData, counts] = await Promise.all([
        getCategories(),
        getApprovedVendorCounts(),
      ]);
      setCategories(categoriesData);
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
    setLoading(false);
  }

  const getCountForCategory = (slug: string) => categoryCounts[slug] || 0;
  const getTotalCount = () => Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto text-olive-600 mb-4" />
          <p className="text-olive-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="pt-32 pb-10 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-2 text-olive-500">Home / Categories</p>
              <h1 className="text-3xl md:text-4xl font-bold text-olive-800 mb-3">Wedding Services</h1>
              <p className="text-base text-olive-500">
                {getTotalCount()} vendors across {categories.length} categories
              </p>
            </div>
            <Link href="/venues" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-olive-600 hover:text-olive-700 transition-colors">
              View all Venues
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-olive-600 text-lg">No categories available yet.</p>
            <p className="text-olive-500 mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.filter(c => c.slug !== 'venues').map((category) => {
              const count = getCountForCategory(category.slug);
              return (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug}`}
                  className="category-card group"
                  style={{ background: category.backgroundColor }}
                >
                  {/* Content */}
                  <div className="flex-1 p-6 z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl md:text-2xl font-bold text-olive-800">{category.name}</h3>
                      <ChevronDown size={20} className="transition-transform group-hover:rotate-180 text-olive-600 ml-auto md:ml-0" />
                    </div>
                    <p className="text-sm md:text-base text-olive-600 line-clamp-2">{category.description}</p>
                  </div>

                  {/* Image */}
                  <div className="relative w-36 md:w-44 h-full overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to right, ${category.backgroundColor} 0%, transparent 40%)` }} />
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All Mobile Button */}
        <div className="mt-10 text-center sm:hidden">
          <Link href="/venues" className="btn btn-primary px-8 py-4">
            View All Venues
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Additional Help Section */}
        <div className="mt-16 p-8 md:p-12 rounded-3xl text-center bg-cream-100">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-olive-800">Need Help Finding Vendors?</h2>
          <p className="text-base md:text-lg mb-8 mx-auto max-w-xl text-olive-600">
            Tell us what you need and we&apos;ll help you find the best vendors for your wedding
          </p>
          <Link href="/venues" className="btn btn-primary px-10 py-4 text-lg">
            Get Recommendations
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
