'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getVenues, getDistinctLocations } from '@/app/actions/venues';
import QuoteModal from '@/components/QuoteModal';
import AppointmentModal from '@/components/AppointmentModal';
import { MapPin, Users, Star, Search, X, FileText, Calendar, Heart, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface Venue {
  _id: string;
  name: string;
  type: string;
  category: string;
  eventTypes: string[];
  location: string;
  city: string;
  capacity: { min: number; max: number };
  priceRange: { min: number; max: number };
  images: string[];
  amenities: string[];
  highlights: string[];
  description: string;
  rating: number;
  reviewCount: number;
}



const capacityRanges = [
  { id: '', name: 'Any Capacity' },
  { id: '50', name: 'Up to 50 guests' },
  { id: '100', name: '50-100 guests' },
  { id: '250', name: '100-250 guests' },
  { id: '500', name: '250-500 guests' },
  { id: '1000', name: '500+ guests' },
];

const ratingOptions = [
  { id: '', name: 'Any Rating' },
  { id: '4.5', name: '4.5+ Rating' },
  { id: '4', name: '4+ Rating' },
  { id: '3.5', name: '3.5+ Rating' },
];

// cities moved to component-level state (fetched from DB)

function VenuesContent() {
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    location: true, capacity: false, rating: false,
  });
  
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    minCapacity: searchParams.get('attendees') || '',
    priceRange: '', rating: '',
  });

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [appointmentType, setAppointmentType] = useState<'appointment' | 'visit'>('appointment');

  useEffect(() => { loadVenues(); }, [filters]);
  useEffect(() => { loadCities(); }, []);

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const locs = await getDistinctLocations('venues');
      setCities(locs);
    } catch {
      // fallback: keep empty — user can still type in search
    }
    setCitiesLoading(false);
  }

  async function loadVenues() {
    setLoading(true);
    try {
      const data = await getVenues({
        location: filters.location,
        category: 'venues', // Ensure backend only returns venues
        minCapacity: filters.minCapacity ? parseInt(filters.minCapacity) : undefined,
      });
      setVenues(data);
    } catch (error) {
      console.error('Failed to load venues:', error);
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
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleFilterSection = (section: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openQuoteModal = (venue: Venue) => { setSelectedVenue(venue); setShowQuoteModal(true); };
  const openAppointmentModal = (venue: Venue, type: 'appointment' | 'visit') => { setSelectedVenue(venue); setAppointmentType(type); setShowAppointmentModal(true); };
  const clearFilters = () => { setFilters({ location: '', minCapacity: '', priceRange: '', rating: '' }); };
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'p-5' : 'filter-sidebar'}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid #eee8d5' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '2px solid #f0ead6', background: 'linear-gradient(135deg,#fbf9f3,#f5f0e4)' }}>
          <div className="flex items-center gap-2.5">
        
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#2d3d1a', letterSpacing: '-0.3px' }}>Filter Venues</h3>
          </div>
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
              {/* All Cities */}
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
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: filters.location === '' ? 'rgba(255,255,255,0.7)' : '#b8a96a', flexShrink: 0, display: 'inline-block', transition: 'background 0.2s' }} />
                All Cities
              </button>

              {/* Dynamic cities */}
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

        {/* ── Guest Capacity ── */}
        <div style={{ borderBottom: '1px solid #f0ead6' }}>
          <button
            onClick={() => toggleFilterSection('capacity')}
            className="flex items-center justify-between w-full"
            style={{ padding: '14px 20px' }}
          >
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: '#6b7c47' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2d3d1a', letterSpacing: '0.2px' }}>Guest Capacity</span>
              {filters.minCapacity && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#6b7c47', color: 'white' }}>1</span>
              )}
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: expandedFilters.capacity ? '#f0ead6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
              {expandedFilters.capacity
                ? <ChevronUp size={13} style={{ color: '#556b2f' }} />
                : <ChevronDown size={13} style={{ color: '#8a9d5a' }} />}
            </div>
          </button>

          {expandedFilters.capacity && (
            <div style={{ padding: '0 14px 14px' }}>
              {capacityRanges.map(range => (
                <button
                  key={range.id}
                  onClick={() => setFilters({ ...filters, minCapacity: range.id })}
                  className="flex items-center gap-2.5 w-full text-left transition-all"
                  style={{
                    padding: '9px 12px', borderRadius: 12, marginBottom: 4,
                    background: filters.minCapacity === range.id ? 'linear-gradient(135deg,#556b2f,#6b7c47)' : '#faf8f2',
                    color: filters.minCapacity === range.id ? 'white' : '#556b2f',
                    fontWeight: filters.minCapacity === range.id ? 700 : 500,
                    fontSize: 13,
                    border: filters.minCapacity === range.id ? 'none' : '1px solid #ede6d0',
                    boxShadow: filters.minCapacity === range.id ? '0 2px 8px rgba(85,107,47,0.25)' : 'none',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: filters.minCapacity === range.id ? 'rgba(255,255,255,0.7)' : '#b8a96a', flexShrink: 0, display: 'inline-block' }} />
                  {range.name}
                </button>
              ))}
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
      {/* Header */}
      <div className="pt-28 pb-8 hero-gradient-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm mb-2 text-olive-200">Home / Venues</p>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Wedding Venues</h1>
          <p className="text-olive-200">{loading ? 'Finding venues...' : `${venues.length} venues found`}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-cream-200">
              <button onClick={() => setMobileFiltersOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-white text-olive-700 border border-cream-300">
                <SlidersHorizontal size={18} />
                Filters
                {hasActiveFilters && <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white bg-olive-600">{Object.values(filters).filter(v => v !== '').length}</span>}
              </button>

              <p className="text-sm font-medium text-olive-600">Showing {venues.length} venues</p>

              <select className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-cream-300 text-olive-700">
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
                  <div className="spinner w-16 h-16 mx-auto mb-6"></div>
                  <p className="text-olive-500">Loading venues...</p>
                </div>
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-32">
                <Search size={64} className="mx-auto mb-6 text-cream-300" />
                <h2 className="text-2xl font-bold mb-3 text-olive-800">No venues found</h2>
                <p className="mb-8 max-w-md mx-auto text-olive-500">Try adjusting your filters to find more options</p>
                <button onClick={clearFilters} className="btn btn-primary px-8 py-4">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <div key={venue._id} className="venue-card group">
                    <Link href={`/venues/${venue._id}`} className="block relative aspect-video overflow-hidden">
                      <img src={venue.images[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600'} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 gradient-overlay" />
                      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-medium text-white backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.5)' }}>📷 {venue.images.length || 1}+ Photos</div>
                      
                      <button onClick={(e) => { e.preventDefault(); toggleShortlist(venue._id); }} className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${shortlisted.has(venue._id) ? 'bg-olive-600' : 'bg-white'}`} style={{ background: shortlisted.has(venue._id) ? 'var(--olive-600)' : 'rgba(255,255,255,0.9)' }}>
                        <Heart size={20} className={shortlisted.has(venue._id) ? 'fill-white text-white' : 'text-olive-600'} />
                      </button>

                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-sm font-bold bg-olive-600">
                        <Star size={14} className="fill-white" />
                        {venue.rating}
                      </div>
                    </Link>

                    <div className="p-5">
                      <Link href={`/venues/${venue._id}`}>
                        <h3 className="text-lg font-bold mb-1 line-clamp-1 text-olive-800 group-hover:text-olive-600 transition-colors">{venue.name}</h3>
                      </Link>
                      
                      <p className="flex items-center gap-1 text-sm mb-4 text-olive-500">
                        <MapPin size={14} />
                        {venue.city}
                      </p>

                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-cream-200">
                        <div className="flex items-center gap-1 text-olive-500">
                          <Users size={16} />
                          <span className="text-sm">{venue.capacity.min}-{venue.capacity.max}</span>
                        </div>
                        <span className="font-bold text-olive-700">{formatPrice(venue.priceRange.min, venue.priceRange.max)}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-5">
                        {venue.highlights.slice(0, 3).map((highlight, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-lg bg-cream-100 text-olive-600">{highlight}</span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => openQuoteModal(venue)} className="btn btn-primary flex-1 py-3 text-sm">
                          <FileText size={16} />
                          Send Enquiry
                        </button>
                        <button onClick={() => openAppointmentModal(venue, 'visit')} className="w-12 flex items-center justify-center rounded-xl bg-cream-100 text-olive-600 transition-all">
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
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-cream-200">
              <h2 className="text-lg font-bold text-olive-800">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)}><X size={24} className="text-olive-600" /></button>
            </div>
            <FilterSidebar isMobile />
            <div className="p-6 pt-0">
              <button onClick={() => setMobileFiltersOpen(false)} className="btn btn-primary w-full py-4">Show {venues.length} Results</button>
            </div>
          </div>
        </div>
      )}

      {showQuoteModal && selectedVenue && <QuoteModal venue={selectedVenue} onClose={() => setShowQuoteModal(false)} />}
      {showAppointmentModal && selectedVenue && <AppointmentModal venue={selectedVenue} type={appointmentType} onClose={() => setShowAppointmentModal(false)} />}
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="spinner w-16 h-16"></div>
      </div>
    }>
      <VenuesContent />
    </Suspense>
  );
}
