'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Search,
  MapPin,
  Building2,
  Tag,
} from 'lucide-react';
import {
  getAdminVenues,
  approveVenue,
  rejectVenue,
  deleteVenue,
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

const STATUS_CONFIG = {
  pending:  { bg: '#fffbeb', border: '#fbbf24', color: '#92400e', icon: Clock,        label: 'Pending'  },
  approved: { bg: '#ecfdf5', border: '#34d399', color: '#065f46', icon: CheckCircle,  label: 'Approved' },
  rejected: { bg: '#fef2f2', border: '#f87171', color: '#991b1b', icon: XCircle,      label: 'Rejected' },
};

export default function AdminVenuesPage() {
  const searchParams = useSearchParams();
  const initialFilter =
    (searchParams.get('filter') as 'all' | 'pending' | 'approved' | 'rejected') || 'all';

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

  useEffect(() => { loadVenues(); }, [filter]);

  const handleApprove = async (venueId: string) => {
    setActionLoading(venueId);
    try {
      const result = await approveVenue(venueId);
      if (result.success) loadVenues();
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
    if (!confirm('Delete this venue? This cannot be undone.')) return;
    setActionLoading(venueId);
    try {
      const result = await deleteVenue(venueId);
      if (result.success) loadVenues();
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const FILTERS: { key: 'all' | 'pending' | 'approved' | 'rejected'; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'pending',  label: 'Pending'  },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      <style>{`
        /* ── Page layout ─────────────────────────────────── */
        .av-page { padding: 0; }

        /* ── Header ──────────────────────────────────────── */
        .av-header { margin-bottom: 24px; }
        .av-header h1 {
          font-size: clamp(1.4rem, 4vw, 2rem);
          font-weight: 800;
          color: var(--olive-800);
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }
        .av-header p { color: var(--olive-500); font-size: 14px; margin: 0; }

        /* ── Filters ─────────────────────────────────────── */
        .av-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .av-search-wrap {
          position: relative;
          width: 100%;
        }
        .av-search-wrap svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--olive-400);
          pointer-events: none;
        }
        .av-search {
          width: 100%;
          padding: 11px 14px 11px 40px;
          border-radius: 12px;
          border: 1.5px solid var(--cream-200);
          background: white;
          font-size: 14px;
          color: var(--olive-800);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .av-search:focus { border-color: var(--olive-400); }

        .av-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 5px;
          border-radius: 12px;
          background: var(--cream-100);
        }
        .av-tab {
          padding: 9px 4px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--olive-500);
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.18s;
          text-align: center;
          white-space: nowrap;
        }
        .av-tab.active {
          background: white;
          color: var(--olive-800);
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        /* ── Cards ───────────────────────────────────────── */
        .av-cards { display: flex; flex-direction: column; gap: 14px; }

        .av-card {
          background: white;
          border-radius: 16px;
          border: 1.5px solid var(--cream-200);
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .av-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); }

        /* Card top band */
        .av-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 16px 12px;
          border-bottom: 1px solid var(--cream-100);
        }
        .av-thumb {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: var(--cream-100);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .av-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .av-name { font-size: 15px; font-weight: 700; color: var(--olive-800); margin: 0 0 3px; }
        .av-vendor { font-size: 12px; color: var(--olive-400); margin: 0; }

        /* Card meta row */
        .av-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--cream-100);
        }
        .av-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .av-chip-category {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          text-transform: capitalize;
        }
        .av-chip-location {
          background: #f8faff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
        .av-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid;
          margin-left: auto;
        }

        /* Card action row */
        .av-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--cream-50);
        }
        .av-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .av-btn:active { transform: scale(0.97); }
        .av-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .av-btn-approve { background: #10b981; color: white; }
        .av-btn-reject  { background: #ef4444; color: white; }
        .av-btn-delete  {
          background: white;
          color: var(--olive-600);
          border: 1.5px solid var(--cream-200);
          margin-left: auto;
        }

        /* ── Empty / Loading ─────────────────────────────── */
        .av-empty {
          text-align: center;
          padding: 60px 24px;
          background: white;
          border-radius: 16px;
          border: 1.5px solid var(--cream-200);
        }
        .av-empty h3 { color: var(--olive-700); margin: 16px 0 8px; font-size: 16px; }
        .av-empty p  { color: var(--olive-400); font-size: 13px; margin: 0; }

        .av-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--cream-200);
          border-top-color: var(--olive-600);
          border-radius: 50%;
          animation: av-spin 0.7s linear infinite;
          margin: 60px auto;
        }
        @keyframes av-spin { to { transform: rotate(360deg); } }

        /* ── Desktop table (≥ 768 px) ────────────────────── */
        @media (min-width: 768px) {
          .av-controls { flex-direction: row; align-items: center; }
          .av-search-wrap { flex: 1; max-width: 340px; }
          .av-tabs { width: auto; min-width: 340px; }

          /* Switch to table-like horizontal cards on desktop */
          .av-card-top { border-bottom: none; flex: 2; }
          .av-card {
            display: flex;
            align-items: center;
            border-radius: 14px;
          }
          .av-meta {
            flex: 1.5;
            flex-direction: column;
            align-items: flex-start;
            border-bottom: none;
            border-left: 1px solid var(--cream-100);
            border-right: 1px solid var(--cream-100);
            min-height: 80px;
            justify-content: center;
          }
          .av-status-chip { margin-left: 0; }
          .av-actions {
            flex-direction: column;
            padding: 16px 14px;
            background: transparent;
            border-left: 1px solid var(--cream-100);
            gap: 8px;
            min-width: 130px;
          }
          .av-btn { width: 100%; justify-content: center; }
          .av-btn-delete { margin-left: 0; }
        }

        /* ── Reject Modal ─────────────────────────────────── */
        .av-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 200;
          padding: 0;
        }
        @media (min-width: 480px) {
          .av-modal-overlay {
            align-items: center;
            padding: 24px;
          }
        }
        .av-modal {
          background: white;
          border-radius: 24px 24px 0 0;
          padding: 24px 20px;
          width: 100%;
          max-width: 440px;
          animation: av-slide-up 0.25s ease;
        }
        @media (min-width: 480px) {
          .av-modal { border-radius: 20px; }
        }
        @keyframes av-slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .av-modal h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--olive-800);
          margin: 0 0 4px;
        }
        .av-modal p {
          font-size: 13px;
          color: var(--olive-500);
          margin: 0 0 16px;
        }
        .av-modal textarea {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid var(--cream-200);
          min-height: 100px;
          font-size: 14px;
          resize: vertical;
          box-sizing: border-box;
          margin-bottom: 16px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .av-modal textarea:focus { border-color: var(--olive-400); }
        .av-modal-actions { display: flex; gap: 10px; }
        .av-modal-cancel {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: 1.5px solid var(--cream-200);
          background: white;
          color: var(--olive-700);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }
        .av-modal-confirm {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: white;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .av-modal-confirm:disabled {
          background: var(--olive-300);
          cursor: not-allowed;
        }
      `}</style>

      <div className="av-page">
        {/* ── Header ── */}
        <div className="av-header">
          <h1>Venues Management</h1>
          <p>Review and manage venue listings from vendors</p>
        </div>

        {/* ── Controls ── */}
        <div className="av-controls">
          <div className="av-search-wrap">
            <Search size={17} />
            <input
              className="av-search"
              type="text"
              placeholder="Search by name or city…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="av-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`av-tab${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="av-spinner" />
        ) : filteredVenues.length === 0 ? (
          <div className="av-empty">
            <Building2 size={44} color="var(--olive-300)" />
            <h3>No venues found</h3>
            <p>
              {filter !== 'all'
                ? `No ${filter} venues at the moment`
                : 'No venues match your search'}
            </p>
          </div>
        ) : (
          <div className="av-cards">
            {filteredVenues.map((venue) => {
              const sc = STATUS_CONFIG[venue.status] || STATUS_CONFIG.pending;
              const StatusIcon = sc.icon;
              const isLoading = actionLoading === venue._id;

              return (
                <div key={venue._id} className="av-card">
                  {/* Thumbnail + Name */}
                  <div className="av-card-top">
                    <div className="av-thumb">
                      {venue.images?.[0] ? (
                        <img src={venue.images[0]} alt={venue.name} />
                      ) : (
                        <Building2 size={22} color="var(--olive-400)" />
                      )}
                    </div>
                    <div>
                      <p className="av-name">{venue.name}</p>
                      <p className="av-vendor">
                        {venue.vendorId?.businessName || 'Unknown vendor'}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="av-meta">
                    <span className="av-chip av-chip-category">
                      <Tag size={11} />
                      {venue.category}
                    </span>
                    <span className="av-chip av-chip-location">
                      <MapPin size={11} />
                      {venue.city}
                    </span>
                    <span
                      className="av-status-chip"
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        borderColor: sc.border,
                      }}
                    >
                      <StatusIcon size={12} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="av-actions">
                    {venue.status === 'pending' && (
                      <>
                        <button
                          className="av-btn av-btn-approve"
                          onClick={() => handleApprove(venue._id)}
                          disabled={isLoading}
                          title="Approve"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          className="av-btn av-btn-reject"
                          onClick={() => {
                            setSelectedVenue(venue);
                            setShowRejectModal(true);
                          }}
                          title="Reject"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="av-btn av-btn-delete"
                      onClick={() => handleDelete(venue._id)}
                      disabled={isLoading}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && selectedVenue && (
        <div
          className="av-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRejectModal(false);
              setRejectReason('');
              setSelectedVenue(null);
            }
          }}
        >
          <div className="av-modal">
            <h3>Reject Venue</h3>
            <p>
              You are rejecting: <strong>{selectedVenue.name}</strong>. Please provide
              a reason that will be sent to the vendor.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection…"
            />
            <div className="av-modal-actions">
              <button
                className="av-modal-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedVenue(null);
                }}
              >
                Cancel
              </button>
              <button
                className="av-modal-confirm"
                onClick={handleReject}
                disabled={!rejectReason || actionLoading === selectedVenue._id}
              >
                {actionLoading === selectedVenue._id ? 'Rejecting…' : 'Reject Venue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
