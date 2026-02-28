'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  Clock,
  Search,
  Filter,
  MapPin,
  Building2
} from 'lucide-react';
import { 
  getAdminVenues, 
  approveVenue, 
  rejectVenue, 
  deleteVenue 
} from '@/app/actions/admin';

interface Venue {
  _id: string;
  name: string;
  category: string;
  city: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  images: string[];
  vendorId?: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
  };
}

export default function AdminVenuesPage() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') as 'all' | 'pending' | 'approved' | 'rejected' || 'all';
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const data = await getAdminVenues(filter);
      setVenues(data);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, [filter]);

  const handleApprove = async (venueId: string) => {
    setActionLoading(venueId);
    try {
      const result = await approveVenue(venueId);
      if (result.success) {
        loadVenues();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedVenue || !rejectReason) return;
    setActionLoading(selectedVenue._id);
    try {
      const result = await rejectVenue(selectedVenue._id, rejectReason);
      if (result.success) {
        loadVenues();
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedVenue(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) return;
    setActionLoading(venueId);
    try {
      const result = await deleteVenue(venueId);
      if (result.success) {
        loadVenues();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: <Clock size={14} /> },
      approved: { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle size={14} /> },
      rejected: { bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={14} /> },
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '6px',
        background: style.bg,
        color: style.color,
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}>
        {style.icon}
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
          fontWeight: 800, 
          color: 'var(--olive-800)',
          marginBottom: '8px',
        }}>
          Venues Management
        </h1>
        <p style={{ color: 'var(--olive-500)' }}>
          Review and manage venue listings from vendors
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '300px' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--olive-400)',
            }} 
          />
          <input
            type="text"
            placeholder="Search venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '10px',
              border: '1px solid var(--cream-200)',
              background: 'white',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '10px',
          background: 'var(--cream-100)',
        }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === f ? 'white' : 'transparent',
                color: filter === f ? 'var(--olive-700)' : 'var(--olive-500)',
                fontWeight: filter === f ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Venues Table/Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--cream-200)',
            borderTopColor: 'var(--olive-600)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : filteredVenues.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--cream-200)',
        }}>
          <Building2 size={48} color="var(--olive-300)" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--olive-700)', marginBottom: '8px' }}>No venues found</h3>
          <p style={{ color: 'var(--olive-500)', fontSize: '14px' }}>
            {filter !== 'all' ? `No ${filter} venues at the moment` : 'No venues match your search'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--cream-200)',
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
            gap: '16px',
            padding: '16px 20px',
            background: 'var(--cream-50)',
            borderBottom: '1px solid var(--cream-200)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--olive-600)',
          }} className="hide-on-mobile">
            <div>Venue</div>
            <div>Category</div>
            <div>Location</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Venue Rows */}
          {filteredVenues.map((venue) => (
            <div
              key={venue._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: '1px solid var(--cream-100)',
                alignItems: 'center',
              }}
              className="venue-row"
            >
              {/* Venue Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'var(--cream-100)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {venue.images?.[0] ? (
                    <img 
                      src={venue.images[0]} 
                      alt={venue.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Building2 size={20} color="var(--olive-400)" />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--olive-800)', marginBottom: '2px' }}>
                    {venue.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--olive-500)' }}>
                    {venue.vendorId?.businessName || 'Unknown vendor'}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--olive-600)',
                textTransform: 'capitalize',
              }}>
                {venue.category}
              </div>

              {/* Location */}
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--olive-600)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <MapPin size={14} />
                {venue.city}
              </div>

              {/* Status */}
              <div>{getStatusBadge(venue.status)}</div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {venue.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(venue._id)}
                      disabled={actionLoading === venue._id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      title="Approve"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVenue(venue);
                        setShowRejectModal(true);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      title="Reject"
                    >
                      <XCircle size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(venue._id)}
                  disabled={actionLoading === venue._id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--cream-200)',
                    background: 'white',
                    color: 'var(--olive-600)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVenue && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: 'var(--olive-800)',
              marginBottom: '8px',
            }}>
              Reject Venue
            </h3>
            <p style={{ color: 'var(--olive-500)', marginBottom: '16px', fontSize: '14px' }}>
              Rejecting: <strong>{selectedVenue.name}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--cream-200)',
                minHeight: '100px',
                marginBottom: '16px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedVenue(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--cream-200)',
                  background: 'white',
                  color: 'var(--olive-700)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || actionLoading === selectedVenue._id}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !rejectReason ? 'var(--olive-300)' : '#ef4444',
                  color: 'white',
                  cursor: !rejectReason ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Reject Venue
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .venue-row {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
