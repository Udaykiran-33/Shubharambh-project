'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getApprovedVendorsByCategory, getDistinctLocations } from '@/app/actions/venues';
import { getCategoryBySlug } from '@/app/actions/categories';
import QuoteModal from '@/components/QuoteModal';
import AppointmentModal from '@/components/AppointmentModal';
import { 
  MapPin, Users, Star, Search, X, FileText, Calendar, 
  Heart, SlidersHorizontal, ChevronDown, ChevronUp, ArrowLeft, Loader2
} from 'lucide-react';

interface Vendor {
  _id: string;
  vendorId?: string;  // Original vendor ID for reference
  name: string;
  type: string;
  category: string;
  eventTypes: string[];
  location: string;
  city: string;
  address?: string;
  capacity: { min: number; max: number };
  priceRange: { min: number; max: number };
  priceUnit?: string;
  images: string[];
  amenities: string[];
  highlights: string[];
  description: string;
  rating: number;
  reviewCount: number;
  isVenue?: boolean;  // Has associated venue entry
  serviceDetails?: {
    // Common
    experience?: number;
    teamSize?: number;
    // Category specific
    photoStyles?: string;
    equipment?: string;
    cuisines?: string;
    minPlates?: number;
    maxPlates?: number;
    decorStyles?: string;
    makeupStyles?: string;
    brands?: string;
    servicesOffered?: string;
    mehendiStyles?: string;
    musicStyles?: string;
    cardTypes?: string;
    ceremonies?: string;
    danceStyles?: string;
    dressTypes?: string;
    songLibrary?: string;
    venueType?: string;
    [key: string]: string | number | undefined;
  };
}

// cities are fetched dynamically from DB — see loadCities()

const ratingOptions = [
  { id: '', name: 'Any Rating' },
  { id: '4.5', name: '4.5+ Rating' },
  { id: '4', name: '4+ Rating' },
  { id: '3.5', name: '3.5+ Rating' },
];

interface CategoryInfo {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  backgroundColor: string;
  highlights: string[];
  amenities: string[];
  priceLabel: string;
  priceUnit: string;
}

function CategoryContent() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    location: true,
    rating: false,
  });
  
  const [filters, setFilters] = useState({
    location: '',
    rating: '',
  });

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [appointmentType, setAppointmentType] = useState<'appointment' | 'visit'>('appointment');

  // Fallback category info if not found in database
  const info = category || {
    _id: '',
    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
    slug: slug,
    description: `Browse ${slug.replace(/-/g, ' ')} services for your wedding`,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200',
    backgroundColor: '#f3e8ff',
    highlights: ['Verified Vendor', 'New Listing'],
    amenities: [],
    priceLabel: 'Starting Price',
    priceUnit: 'per event',
  };

  useEffect(() => {
    loadCategory();
    loadCities();
  }, [slug]);

  useEffect(() => {
    loadVendors();
  }, [slug, filters]);

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const locs = await getDistinctLocations(slug);
      setCities(locs);
    } catch {
      // fallback: empty — UI handles gracefully
    }
    setCitiesLoading(false);
  }

  async function loadCategory() {
    setCategoryLoading(true);
    try {
      const data = await getCategoryBySlug(slug);
      if (data) {
        setCategory(data);
      }
    } catch (error) {
      console.error('Failed to load category:', error);
    }
    setCategoryLoading(false);
  }

  async function loadVendors() {
    setLoading(true);
    try {
      const data = await getApprovedVendorsByCategory(slug, {
        location: filters.location || undefined,
      });
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
    setLoading(false);
  }

  const formatPrice = (min: number, max: number) => {
    const formatNum = (n: number) => {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n}`;
    };
    return `${formatNum(min)} - ${formatNum(max)}`;
  };

  const toggleShortlist = (id: string) => {
    setShortlisted(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleFilterSection = (section: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openQuoteModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowQuoteModal(true);
  };

  const openAppointmentModal = (vendor: Vendor, type: 'appointment' | 'visit') => {
    setSelectedVendor(vendor);
    setAppointmentType(type);
    setShowAppointmentModal(true);
  };

  const clearFilters = () => {
    setFilters({ location: '', rating: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'p-5' : 'sticky top-32'}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid #eee8d5' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '2px solid #f0ead6', background: 'linear-gradient(135deg,#fbf9f3,#f5f0e4)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#2d3d1a', letterSpacing: '-0.3px' }}>
            Filter {info.name}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#556b2f', color: 'white', border: 'none', cursor: 'pointer', letterSpacing: '0.3px' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* ── City / Location ── */}
        <div style={{ borderBottom: '1px solid #f0ead6' }}>
          <button
            onClick={() => toggleFilterSection('location')}
            className="flex items-center justify-between w-full"
            style={{ padding: '14px 20px' }}
          >
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: '#6b7c47' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2d3d1a', letterSpacing: '0.2px' }}>City</span>
              {filters.location && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#6b7c47', color: 'white' }}>1</span>
              )}
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: expandedFilters.location ? '#f0ead6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
              {expandedFilters.location
                ? <ChevronUp size={13} style={{ color: '#556b2f' }} />
                : <ChevronDown size={13} style={{ color: '#8a9d5a' }} />}
            </div>
          </button>

          {expandedFilters.location && (
            <div style={{ padding: '0 14px 14px' }}>
              {/* All Cities chip */}
              <button
                onClick={() => setFilters({ ...filters, location: '' })}
                className="flex items-center gap-2.5 w-full text-left transition-all"
                style={{
                  padding: '9px 12px', borderRadius: 12, marginBottom: 4,
                  background: filters.location === '' ? 'linear-gradient(135deg,#556b2f,#6b7c47)' : '#faf8f2',
                  color: filters.location === '' ? 'white' : '#556b2f',
                  fontWeight: filters.location === '' ? 700 : 500,
                  fontSize: 13,
                  border: filters.location === '' ? 'none' : '1px solid #ede6d0',
                  boxShadow: filters.location === '' ? '0 2px 8px rgba(85,107,47,0.25)' : 'none',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: filters.location === '' ? 'rgba(255,255,255,0.7)' : '#b8a96a', flexShrink: 0, display: 'inline-block' }} />
                All Cities
              </button>

              {/* Dynamic city chips */}
              {citiesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl mb-1" style={{ height: 36, background: '#f0ead6', width: `${65 + i * 12}%` }} />
                ))
              ) : cities.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9aaa70', fontStyle: 'italic', padding: '8px 12px' }}>No locations yet</p>
              ) : (
                cities.map(city => (
                  <button
                    key={city}
                    onClick={() => setFilters({ ...filters, location: city })}
                    className="flex items-center gap-2.5 w-full text-left transition-all"
                    style={{
                      padding: '9px 12px', borderRadius: 12, marginBottom: 4,
                      background: filters.location === city ? 'linear-gradient(135deg,#556b2f,#6b7c47)' : '#faf8f2',
                      color: filters.location === city ? 'white' : '#556b2f',
                      fontWeight: filters.location === city ? 700 : 500,
                      fontSize: 13,
                      border: filters.location === city ? 'none' : '1px solid #ede6d0',
                      boxShadow: filters.location === city ? '0 2px 8px rgba(85,107,47,0.25)' : 'none',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: filters.location === city ? 'rgba(255,255,255,0.7)' : '#b8a96a', flexShrink: 0, display: 'inline-block' }} />
                    {city}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Rating ── */}
        <div>
          <button
            onClick={() => toggleFilterSection('rating')}
            className="flex items-center justify-between w-full"
            style={{ padding: '14px 20px' }}
          >
            <div className="flex items-center gap-2">
              <Star size={14} style={{ color: '#6b7c47' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2d3d1a', letterSpacing: '0.2px' }}>Rating</span>
              {filters.rating && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#6b7c47', color: 'white' }}>1</span>
              )}
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: expandedFilters.rating ? '#f0ead6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
              {expandedFilters.rating
                ? <ChevronUp size={13} style={{ color: '#556b2f' }} />
                : <ChevronDown size={13} style={{ color: '#8a9d5a' }} />}
            </div>
          </button>

          {expandedFilters.rating && (
            <div style={{ padding: '0 14px 14px' }}>
              {ratingOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFilters({ ...filters, rating: option.id })}
                  className="flex items-center gap-2.5 w-full text-left transition-all"
                  style={{
                    padding: '9px 12px', borderRadius: 12, marginBottom: 4,
                    background: filters.rating === option.id ? 'linear-gradient(135deg,#556b2f,#6b7c47)' : '#faf8f2',
                    color: filters.rating === option.id ? 'white' : '#556b2f',
                    fontWeight: filters.rating === option.id ? 700 : 500,
                    fontSize: 13,
                    border: filters.rating === option.id ? 'none' : '1px solid #ede6d0',
                    boxShadow: filters.rating === option.id ? '0 2px 8px rgba(85,107,47,0.25)' : 'none',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: filters.rating === option.id ? 'rgba(255,255,255,0.7)' : '#b8a96a', flexShrink: 0, display: 'inline-block' }} />
                  {option.name}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header - Responsive */}
      <div 
        className="pt-24 md:pt-32 lg:pt-36 pb-10 md:pb-14 lg:pb-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #556b2f 0%, #465a28 100%)' }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${info.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link 
            href="/categories"
            className="inline-flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 transition-colors hover:opacity-80 text-olive-200"
          >
            <ArrowLeft size={16} />
            Back to Categories
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 md:mb-4 leading-tight">
            {info.name}
          </h1>
          <p className="text-base md:text-lg lg:text-xl max-w-2xl text-olive-200 mb-2">
            {info.description}
          </p>
          <p className="mt-4 md:mt-6 text-xs md:text-sm text-olive-300">
            {loading ? 'Finding services...' : `${vendors.length} ${vendors.length === 1 ? 'provider' : 'providers'} found`}
          </p>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Toolbar */}
            <div 
              className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6"
              style={{ borderBottom: '1px solid #f0ead6' }}
            >
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-white text-olive-700 shadow-sm"
                style={{ border: '1px solid #f0ead6' }}
              >
                <SlidersHorizontal size={18} />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white bg-olive-600">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </button>

              {/* Results Count */}
              <p className="text-sm font-medium text-olive-600">
                Showing {vendors.length} {vendors.length === 1 ? 'provider' : 'providers'}
              </p>

              {/* Sort Dropdown */}
              <select 
                className="px-5 py-3 rounded-xl text-sm font-medium bg-white text-olive-700 shadow-sm cursor-pointer"
                style={{ border: '1px solid #f0ead6' }}
              >
                <option>Sort by: Popularity</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Rating</option>
              </select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div 
                    className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-6"
                    style={{ borderColor: '#f0ead6', borderTopColor: '#6b8e23' }}
                  />
                  <p className="text-olive-500">Loading {info.name.toLowerCase()}...</p>
                </div>
              </div>
            ) : vendors.length === 0 ? (
              /* Empty State */
              <div className="text-center py-32">
                <Search size={64} className="mx-auto mb-8 text-cream-400" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-olive-800">No {info.name.toLowerCase()} found</h2>
                <p className="mb-10 max-w-md mx-auto text-olive-500 text-lg">
                  We don&apos;t have any {info.name.toLowerCase()} listed yet in this category. Check back soon or try adjusting your filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg bg-olive-600 hover:bg-olive-700"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                  <div 
                    key={vendor._id} 
                    className="bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group shadow-lg"
                  >
                    {/* Image Section */}
                    <Link href={`/venues/${vendor._id}`} className="block relative aspect-video overflow-hidden">
                      <img
                        src={vendor.images[0] || info.image}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      
                      {/* Photo Count Badge */}
                      <div 
                        className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white backdrop-blur-sm"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                      >
                        📷 {vendor.images.length || 1}+ Photos
                      </div>
                      
                      {/* Shortlist Heart */}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleShortlist(vendor._id); }}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm hover:scale-110"
                        style={{ background: shortlisted.has(vendor._id) ? '#6b8e23' : 'rgba(255,255,255,0.95)' }}
                      >
                        <Heart size={20} className={shortlisted.has(vendor._id) ? 'fill-white text-white' : 'text-olive-600'} />
                      </button>

                      {/* Rating Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-2 rounded-lg text-white text-sm font-bold bg-olive-600">
                        <Star size={14} className="fill-white" />
                        {vendor.rating}
                      </div>
                    </Link>

                    {/* Content Section */}
                    <div className="p-5">
                      <Link href={`/venues/${vendor._id}`}>
                        <h3 className="text-lg font-bold mb-1 line-clamp-1 text-olive-800 group-hover:text-olive-600 transition-colors">
                          {vendor.name}
                        </h3>
                      </Link>
                      
                      <p className="flex items-center gap-1 text-sm mb-4 text-olive-500">
                        <MapPin size={14} />
                        {vendor.city}
                      </p>

                      {/* Info Row */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-cream-200">
                        {/* Show category-appropriate info */}
                        {vendor.category === 'venues' && vendor.capacity && vendor.capacity.max > 0 ? (
                          <div className="flex items-center gap-1 text-olive-500">
                            <Users size={16} />
                            <span className="text-sm">{vendor.capacity.min}-{vendor.capacity.max}</span>
                          </div>
                        ) : vendor.serviceDetails?.experience ? (
                          <div className="flex items-center gap-1 text-olive-500">
                            <Star size={16} />
                            <span className="text-sm">{vendor.serviceDetails.experience}+ years</span>
                          </div>
                        ) : vendor.serviceDetails?.minPlates ? (
                          <div className="flex items-center gap-1 text-olive-500">
                            <Users size={16} />
                            <span className="text-sm">{vendor.serviceDetails.minPlates}+ plates</span>
                          </div>
                        ) : vendor.serviceDetails?.teamSize ? (
                          <div className="flex items-center gap-1 text-olive-500">
                            <Users size={16} />
                            <span className="text-sm">{vendor.serviceDetails.teamSize} members</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-olive-500">
                            <span className="text-sm">Professional</span>
                          </div>
                        )}
                        <span className="font-bold text-olive-700">
                          {formatPrice(vendor.priceRange.min, vendor.priceRange.max)}
                        </span>
                      </div>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1 mb-5">
                        {vendor.highlights.slice(0, 3).map((highlight, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-lg bg-cream-100 text-olive-600">
                            {highlight}
                          </span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openQuoteModal(vendor)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-lg bg-olive-600 hover:bg-olive-700"
                        >
                          <FileText size={16} />
                          Send Enquiry
                        </button>
                        <button
                          onClick={() => openAppointmentModal(vendor, 'visit')}
                          className="w-12 flex items-center justify-center rounded-xl transition-all bg-cream-100 text-olive-600 hover:bg-cream-200"
                        >
                          <Calendar size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileFiltersOpen(false)} 
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto shadow-2xl">
            <div 
              className="flex items-center justify-between p-5"
              style={{ borderBottom: '1px solid #f0ead6' }}
            >
              <h2 className="text-lg font-bold text-olive-800">Filters</h2>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <X size={24} className="text-olive-600" />
              </button>
            </div>
            <FilterSidebar isMobile />
            <div className="p-6">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-4 rounded-xl font-bold text-white bg-olive-600 hover:bg-olive-700 transition-colors"
              >
                Show {vendors.length} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuoteModal && selectedVendor && (
        <QuoteModal venue={selectedVendor} onClose={() => setShowQuoteModal(false)} />
      )}

      {showAppointmentModal && selectedVendor && (
        <AppointmentModal venue={selectedVendor} type={appointmentType} onClose={() => setShowAppointmentModal(false)} />
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div 
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{ borderColor: '#f0ead6', borderTopColor: '#6b8e23' }}
        />
      </div>
    }>
      <CategoryContent />
    </Suspense>
  );
}
