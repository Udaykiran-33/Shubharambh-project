'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Users, 
  Mail, 
  Phone, 
  Building2,
  Trash2,
  Search,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { 
  getAdminVendors, 
  getAdminCategories,
  approveVendor,
  rejectVendor,
  deleteVendor 
} from '@/app/actions/admin';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  description?: string;
  categories: string[];
  locations: string[];
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function AdminVendorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category') || 'all';
  const initialStatus = searchParams.get('status') as 'all' | 'pending' | 'approved' | 'rejected' || 'all';
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(initialStatus);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorData, categoryData] = await Promise.all([
        getAdminVendors(selectedCategory, statusFilter),
        getAdminCategories(),
      ]);
      setVendors(vendorData);
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, statusFilter]);

  const handleApprove = async (vendorId: string) => {
    console.log('Approving vendor:', vendorId);
    setActionLoading(vendorId);
    try {
      const result = await approveVendor(vendorId);
      console.log('Approve result:', result);
      if (result.success) {
        // Navigate to approved tab - this will reload the page with correct data
        window.location.href = '/admin/vendors?status=approved';
      } else {
        alert('❌ Failed to approve vendor: ' + (result.message || 'Unknown error'));
        setActionLoading(null);
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
      alert('❌ Error approving vendor. Check console for details.');
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedVendor || !rejectReason) return;
    console.log('Rejecting vendor:', selectedVendor._id, 'Reason:', rejectReason);
    setActionLoading(selectedVendor._id);
    try {
      const result = await rejectVendor(selectedVendor._id, rejectReason);
      console.log('Reject result:', result);
      if (result.success) {
        alert('Vendor rejected successfully.');
        await loadData();
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedVendor(null);
      } else {
        alert('Failed to reject vendor: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      alert('Error rejecting vendor. Check console for details..');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor and all their listings? This action cannot be undone.')) return;
    console.log('Deleting vendor:', vendorId);
    setActionLoading(vendorId);
    try {
      const result = await deleteVendor(vendorId);
      console.log('Delete result:', result);
      if (result.success) {
        alert('Vendor deleted successfully.');
        await loadData();
      } else {
        alert('Failed to delete vendor: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Error deleting vendor. Check console for details.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get effective status (treat undefined as pending)
  const getEffectiveStatus = (vendor: Vendor) => {
    return vendor.status || 'pending';
  };

  const getStatusBadge = (status: string | undefined) => {
    const effectiveStatus = status || 'pending';
    const styles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: <Clock size={12} /> },
      approved: { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle size={12} /> },
      rejected: { bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={12} /> },
    };
    const style = styles[effectiveStatus] || styles.pending;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        background: style.bg,
        color: style.color,
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}>
        {style.icon}
        {effectiveStatus}
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
          Vendors Management
        </h1>
        <p style={{ color: 'var(--olive-500)' }}>
          Manage and verify vendor registrations by category
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
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '280px' }}>
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
            placeholder="Search vendors..."
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

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--olive-500)" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--cream-200)',
              background: 'white',
              fontSize: '14px',
              color: 'var(--olive-700)',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '10px',
          background: 'var(--cream-100)',
        }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === s ? 'white' : 'transparent',
                color: statusFilter === s ? 'var(--olive-700)' : 'var(--olive-500)',
                fontWeight: statusFilter === s ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List */}
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
      ) : filteredVendors.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--cream-200)',
        }}>
          <Users size={48} color="var(--olive-300)" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--olive-700)', marginBottom: '8px' }}>No vendors found</h3>
          <p style={{ color: 'var(--olive-500)', fontSize: '14px' }}>
            {searchQuery ? 'No vendors match your search' : 
             statusFilter !== 'all' ? `No ${statusFilter} vendors in this category` : 
             'No vendors registered yet'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {filteredVendors.map((vendor) => (
            <div
              key={vendor._id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--cream-200)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: vendor.images?.[0] ? 'transparent' : 'linear-gradient(135deg, var(--olive-500), var(--olive-600))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    overflow: 'hidden',
                  }}>
                    {vendor.images?.[0] ? (
                      <img src={vendor.images[0]} alt={vendor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      vendor.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ 
                      fontWeight: 700, 
                      color: 'var(--olive-800)',
                      marginBottom: '4px',
                    }}>
                      {vendor.name}
                    </h3>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--olive-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <Building2 size={12} />
                      {vendor.businessName}
                    </div>
                  </div>
                </div>
                {getStatusBadge(vendor.status)}
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--olive-600)',
                  marginBottom: '4px',
                }}>
                  <Mail size={14} />
                  {vendor.email}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--olive-600)',
                  marginBottom: '4px',
                }}>
                  <Phone size={14} />
                  {vendor.phone}
                </div>
                {vendor.locations.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--olive-600)',
                  }}>
                    <MapPin size={14} />
                    {vendor.locations.slice(0, 2).join(', ')}
                    {vendor.locations.length > 2 && ` +${vendor.locations.length - 2} more`}
                  </div>
                )}
              </div>

              {/* Categories */}
              {vendor.categories.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '6px',
                  marginBottom: '16px',
                }}>
                  {vendor.categories.map((cat, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'var(--olive-100)',
                        color: 'var(--olive-700)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--cream-100)',
              }}>
                {getEffectiveStatus(vendor) === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(vendor._id)}
                      disabled={actionLoading === vendor._id}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--olive-600)',
                        color: 'white',
                        cursor: actionLoading === vendor._id ? 'wait' : 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                        opacity: actionLoading === vendor._id ? 0.7 : 1,
                      }}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setShowRejectModal(true);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--cream-300)',
                        background: 'var(--cream-100)',
                        color: 'var(--olive-700)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
                {getEffectiveStatus(vendor) === 'approved' && (
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    padding: '10px',
                    color: 'var(--olive-700)',
                    fontSize: '13px',
                    background: 'var(--olive-100)',
                    borderRadius: '8px',
                  }}>
                    <CheckCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Vendor is active and visible on website
                  </div>
                )}
                {getEffectiveStatus(vendor) === 'rejected' && (
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    padding: '10px',
                    color: 'var(--olive-600)',
                    fontSize: '13px',
                    background: 'var(--cream-200)',
                    borderRadius: '8px',
                  }}>
                    <XCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Vendor was rejected
                  </div>
                )}
                <button
                  onClick={() => handleDelete(vendor._id)}
                  disabled={actionLoading === vendor._id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--cream-300)',
                    background: 'var(--cream-100)',
                    color: 'var(--olive-600)',
                    cursor: 'pointer',
                  }}
                  title="Delete vendor"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVendor && (
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
              Reject Vendor
            </h3>
            <p style={{ color: 'var(--olive-500)', marginBottom: '16px', fontSize: '14px' }}>
              Rejecting: <strong>{selectedVendor.businessName}</strong>
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
                  setSelectedVendor(null);
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
                disabled={!rejectReason || actionLoading === selectedVendor._id}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !rejectReason ? 'var(--cream-300)' : 'var(--olive-700)',
                  color: 'white',
                  cursor: !rejectReason ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Reject Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
