'use client';

import { useState, useEffect } from 'react';
import { getVendorEnquiries, getEnquiryStats } from '@/app/actions/vendor-enquiries';
import { TrendingUp, Clock, CheckCircle, FileText, Users, Calendar, MapPin, Wallet, Search, Filter } from 'lucide-react';

interface QuoteRequest {
  _id: string;
  eventType: string;
  location: string;
  eventDate: string;
  attendees: number;
  budgetMin: number;
  budgetMax: number;
  requirements: string;
  notes: string;
  category: string;
  categoryDetails?: Record<string, any>;
  status: string;
  createdAt: string;
  userId?: {
    name: string;
    email: string;
  };
}

interface Stats {
  totalEnquiries: number;
  pendingEnquiries: number;
  respondedEnquiries: number;
  totalQuotes: number;
  acceptedQuotes: number;
  conversionRate: string;
}

export default function VendorDashboardPage() {
  const [enquiries, setEnquiries] = useState<QuoteRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEnquiries: 0,
    pendingEnquiries: 0,
    respondedEnquiries: 0,
    totalQuotes: 0,
    acceptedQuotes: 0,
    conversionRate: '0',
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [enquiriesData, statsData] = await Promise.all([
      getVendorEnquiries(),
      getEnquiryStats(),
    ]);
    setEnquiries(enquiriesData);
    setStats(statsData);
    setLoading(false);
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
    return `₹${price}`;
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesFilter = filter === 'all' || enquiry.status === filter;
    const matchesSearch = searchQuery === '' || 
      enquiry.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.userId?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream-50)' }}>
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ 
              borderColor: 'var(--cream-200)',
              borderTopColor: 'var(--olive-600)'
            }}
          />
          <p style={{ color: 'var(--olive-600)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream-50)' }}>
      {/* Header */}
      <section 
        className="pt-32 pb-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--olive-700) 0%, var(--olive-800) 50%, var(--olive-900) 100%)' }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'var(--cream-100)' }} />
          <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ background: 'var(--cream-100)', animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Vendor Dashboard</h1>
          <p className="text-xl" style={{ color: 'var(--cream-200)' }}>
            Manage your enquiries and grow your business
          </p>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-24 relative z-20">
            {/* Total Enquiries */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))' }}
                >
                  <FileText size={24} className="text-white" />
                </div>
                <TrendingUp size={20} style={{ color: 'var(--olive-500)' }} />
              </div>
              <div className="text-3xl font-black mb-1" style={{ color: 'var(--olive-800)' }}>
                {stats.totalEnquiries}
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--olive-600)' }}>
                Total Enquiries
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <Clock size={24} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-600 mb-1">
                {stats.pendingEnquiries}
              </div>
              <div className="text-sm font-medium text-amber-700">
                Pending Response
              </div>
            </div>

            {/* Responded */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <CheckCircle size={24} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-black text-green-600 mb-1">
                {stats.respondedEnquiries}
              </div>
              <div className="text-sm font-medium text-green-700">
                Responded
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
                >
                  <TrendingUp size={24} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-black text-purple-600 mb-1">
                {stats.conversionRate}%
              </div>
              <div className="text-sm font-medium text-purple-700">
                Conversion Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--olive-400)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by event type, location, or customer..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 text-sm"
                  style={{ 
                    borderColor: 'var(--cream-300)',
                    background: 'var(--cream-50)',
                    color: 'var(--olive-800)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--olive-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--cream-300)'}
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    filter === 'all'
                      ? 'text-white shadow-md'
                      : 'bg-white'
                  }`}
                  style={{
                    background: filter === 'all' ? 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' : 'white',
                    color: filter === 'all' ? 'white' : 'var(--olive-600)',
                    border: filter === 'all' ? 'none' : '2px solid var(--cream-300)'
                  }}
                >
                  All ({enquiries.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    filter === 'pending' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-amber-600 border-2 border-amber-200'
                  }`}
                >
                  Pending ({stats.pendingEnquiries})
                </button>
                <button
                  onClick={() => setFilter('responded')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    filter === 'responded' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border-2 border-green-200'
                  }`}
                >
                  Responded ({stats.respondedEnquiries})
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiries List */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {filteredEnquiries.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
              <div className="text-6xl mb-6">📭</div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--olive-800)' }}>
                No enquiries found
              </h3>
              <p style={{ color: 'var(--olive-600)' }}>
                {searchQuery || filter !== 'all' 
                  ? 'Try adjusting your filters or search query'
                  : 'New enquiries will appear here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredEnquiries.map((enquiry) => (
                <div 
                  key={enquiry._id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedEnquiry(selectedEnquiry === enquiry._id ? null : enquiry._id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span 
                          className="px-4 py-1.5 rounded-lg text-sm font-bold capitalize"
                          style={{ 
                            background: 'var(--olive-100)',
                            color: 'var(--olive-700)'
                          }}
                        >
                          {enquiry.eventType}
                        </span>
                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            enquiry.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {enquiry.status}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--olive-400)' }}>
                          {formatDate(enquiry.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--olive-800)' }}>
                        {enquiry.userId?.name || 'Customer'}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--olive-600)' }}>
                        {enquiry.userId?.email}
                      </p>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} style={{ color: 'var(--olive-500)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--olive-700)' }}>
                        {enquiry.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} style={{ color: 'var(--olive-500)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--olive-700)' }}>
                        {formatDate(enquiry.eventDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: 'var(--olive-500)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--olive-700)' }}>
                        {enquiry.attendees} guests
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet size={16} style={{ color: 'var(--olive-500)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--olive-700)' }}>
                        {formatPrice(enquiry.budgetMin)} - {formatPrice(enquiry.budgetMax)}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {selectedEnquiry === enquiry._id && (
                    <div 
                      className="mt-6 pt-6 border-t-2 space-y-4"
                      style={{ borderColor: 'var(--cream-200)' }}
                    >
                      <div>
                        <h4 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--olive-700)' }}>
                          Requirements
                        </h4>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--olive-600)' }}>
                          {enquiry.requirements}
                        </p>
                      </div>

                      {/* Dynamic Category Details */}
                      {enquiry.categoryDetails && Object.keys(enquiry.categoryDetails).length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                           <h4 className="text-sm font-bold mb-3 uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--olive-700)' }}>
                             <FileText size={16} />
                             Specific Preferences
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                             {Object.entries(enquiry.categoryDetails).map(([key, value]) => (
                               <div key={key}>
                                 <span className="text-xs font-semibold text-gray-500 uppercase block mb-0.5">
                                   {key.replace(/([A-Z])/g, ' $1').trim()}
                                 </span>
                                 <span className="text-sm font-medium text-gray-800">
                                   {value}
                                 </span>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}
                      {enquiry.notes && (
                        <div>
                          <h4 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--olive-700)' }}>
                            Additional Notes
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--olive-600)' }}>
                            {enquiry.notes}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-3 pt-4">
                        <button
                          className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-md hover:shadow-lg"
                          style={{ background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' }}
                        >
                          Send Quote
                        </button>
                        <button
                          className="px-6 py-3 rounded-xl font-bold transition-all duration-300"
                          style={{ 
                            background: 'white',
                            color: 'var(--olive-600)',
                            border: '2px solid var(--olive-300)'
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
