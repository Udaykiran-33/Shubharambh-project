'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getVenueById } from '@/app/actions/venues';
import QuoteModal from '@/components/QuoteModal';
import AppointmentModal from '@/components/AppointmentModal';
import {
  MapPin, Star, Users, Check, FileText, Calendar,
  ChevronRight, ArrowLeft, Heart, X,
  Shield, Clock, ChevronLeft, Sparkles, Grid3X3,
  Phone
} from 'lucide-react';

interface Venue {
  _id: string;
  name: string;
  type: string;
  category: string;
  eventTypes: string[];
  location: string;
  city: string;
  address: string;
  capacity: { min: number; max: number };
  priceRange: { min: number; max: number };
  priceUnit?: string;
  images: string[];
  amenities: string[];
  highlights: string[];
  description: string;
  rating: number;
  reviewCount: number;
  serviceDetails?: {
    experience?: number;
    teamSize?: number;
    minPlates?: number;
    maxPlates?: number;
    [key: string]: any;
  };
}

const kf = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes spinAnim {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentType, setAppointmentType] = useState<'appointment' | 'visit'>('appointment');
  const [isLiked, setIsLiked] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => { loadVenue(); }, [resolvedParams.id]);

  async function loadVenue() {
    try {
      const data = await getVenueById(resolvedParams.id);
      setVenue(data);
    } catch (error) {
      console.error('Failed to load venue:', error);
    }
    setLoading(false);
  }

  const formatPrice = (min: number, max: number) => {
    const f = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
    return `${f(min)} – ${f(max)}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee' }}>
        <style>{kf}</style>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(107,124,71,0.2)', borderTopColor: '#6b7c47', borderRadius: '50%', animation: 'spinAnim 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!venue) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px', padding: '0 24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(107,124,71,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <MapPin size={32} color="#6b7c47" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#2d3a1c', marginBottom: '12px' }}>Venue Not Found</h1>
          <p style={{ color: '#6b7560', marginBottom: '24px' }}>This venue doesn't exist or may have been removed.</p>
          <Link href="/venues" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>
            <ArrowLeft size={16} /> Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  const images = venue.images?.length ? venue.images : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200'];

  return (
    <>
      <style>{kf}</style>
      <div style={{ minHeight: '100vh', background: '#f7f4ee', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>

        {/* ── Lightbox ─────────────────────────────────────── */}
        {showLightbox && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}
            onClick={() => setShowLightbox(false)}
          >
            <button onClick={() => setShowLightbox(false)} style={{ position: 'absolute', top: '20px', right: '20px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
              <X size={20} />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setSelectedImage((selectedImage - 1 + images.length) % images.length); }} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
                  <ChevronLeft size={26} />
                </button>
                <button onClick={e => { e.stopPropagation(); setSelectedImage((selectedImage + 1) % images.length); }} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
                  <ChevronRight size={26} />
                </button>
              </>
            )}
            <img
              src={images[selectedImage]}
              alt={venue.name}
              style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '12px' }}
              onClick={e => e.stopPropagation()}
            />
            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '6px 18px', borderRadius: '100px', color: 'white', fontSize: '13px', fontWeight: 600 }}>
              {selectedImage + 1} / {images.length}
            </div>
          </div>
        )}

        <div style={{ paddingTop: '80px' }}>

          {/* ── Breadcrumb ────────────────────────────────── */}
          <div style={{ background: 'white', borderBottom: '1px solid rgba(107,124,71,0.1)' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8a9a6a' }}>
              <Link href="/" style={{ color: '#8a9a6a', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
              <ChevronRight size={13} />
              <Link href={`/categories/${venue.category || 'all'}`} style={{ color: '#8a9a6a', textDecoration: 'none', fontWeight: 500, textTransform: 'capitalize' }}>{(venue.category || 'Venues').replace('-', ' ')}</Link>
              <ChevronRight size={13} />
              <span style={{ color: '#2d3a1c', fontWeight: 600 }}>{venue.name}</span>
            </div>
          </div>

          {/* ── Hero Gallery ─────────────────────────────── */}
          <div style={{ background: 'white', padding: '0 0 4px' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 0' }}>

              {/* Name + actions bar (above gallery on desktop) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#1a2010', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.15 }}>{venue.name}</h1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7c47' }}>
                      <MapPin size={15} />
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{venue.city}{venue.location ? `, ${venue.location}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fef3c7', padding: '4px 10px', borderRadius: '8px' }}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontWeight: 700, color: '#92400e', fontSize: '13px' }}>{venue.rating}</span>
                      </div>
                      <span style={{ color: '#8a9a6a', fontSize: '13px' }}>({venue.reviewCount} reviews)</span>
                    </div>
                    {venue.category && (
                      <span style={{ background: 'rgba(107,124,71,0.1)', color: '#4a5a2e', padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {venue.category.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', border: `2px solid ${isLiked ? '#ef4444' : 'rgba(107,124,71,0.25)'}`, background: isLiked ? '#fee2e2' : 'white', color: isLiked ? '#dc2626' : '#4a5a2e', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Heart size={15} fill={isLiked ? '#dc2626' : 'none'} /> Save
                  </button>
                </div>
              </div>

              {/* Photo Grid */}
              <div style={{ position: 'relative' }}>
                {images.length === 1 ? (
                  // Single image 
                  <div style={{ height: '480px', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setSelectedImage(0); setShowLightbox(true); }}>
                    <img src={images[0]} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : images.length === 2 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', height: '480px' }}>
                    {images.slice(0, 2).map((img, i) => (
                      <div key={i} style={{ borderRadius: i === 0 ? '20px 0 0 20px' : '0 20px 20px 0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => { setSelectedImage(i); setShowLightbox(true); }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                      </div>
                    ))}
                  </div>
                ) : (
                  // 3+ images – Airbnb-style
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '240px 240px', gap: '8px', height: '488px' }}>
                    {/* Main large left image */}
                    <div
                      style={{ gridRow: '1 / 3', borderRadius: '20px 0 0 20px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                      onClick={() => { setSelectedImage(0); setShowLightbox(true); }}
                    >
                      <img src={images[0]} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                    </div>
                    {/* Top-right */}
                    <div
                      style={{ borderRadius: '0 20px 0 0', overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => { setSelectedImage(1); setShowLightbox(true); }}
                    >
                      <img src={images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                    </div>
                    {/* Bottom-right */}
                    <div
                      style={{ borderRadius: '0 0 20px 0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                      onClick={() => { setSelectedImage(images.length > 3 ? 2 : 2); setShowLightbox(true); }}
                    >
                      <img src={images[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                      {images.length > 3 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontSize: '22px', fontWeight: 900 }}>+{images.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Show all photos button */}
                {images.length > 1 && (
                  <button
                    onClick={() => { setSelectedImage(0); setShowLightbox(true); }}
                    style={{
                      position: 'absolute', bottom: '16px', right: '16px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                      border: '1.5px solid rgba(107,124,71,0.3)', color: '#2d3a1c',
                      padding: '9px 16px', borderRadius: '12px',
                      fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    }}
                  >
                    <Grid3X3 size={15} /> View all {images.length} photos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Main Content ──────────────────────────────── */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 120px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="venue-detail-grid">
            <style>{`
              @media(min-width:1024px){
                .venue-detail-grid { grid-template-columns: 1fr 380px !important; }
                .venue-sidebar { position: sticky; top: 96px; align-self: start; }
                .mobile-bar { display: none !important; }
              }
              .detail-section-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 16px;
              }
              .detail-section-icon {
                width: 34px;
                height: 34px;
                border-radius: 10px;
                background: linear-gradient(135deg, rgba(107,124,71,0.12), rgba(74,90,46,0.08));
                border: 1px solid rgba(107,124,71,0.18);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
              .detail-section-title {
                font-size: 17px;
                font-weight: 800;
                color: #1a2010;
                letter-spacing: -0.3px;
                margin: 0;
              }
              .detail-divider {
                height: 1px;
                background: linear-gradient(to right, rgba(107,124,71,0.15), transparent);
                margin: 24px 0;
              }
              .highlight-chip {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 11px 14px;
                background: rgba(107,124,71,0.05);
                border-radius: 12px;
                border: 1px solid rgba(107,124,71,0.12);
                transition: background 0.2s, border-color 0.2s;
              }
              .highlight-chip:hover {
                background: rgba(107,124,71,0.09);
                border-color: rgba(107,124,71,0.22);
              }
              .event-pill {
                padding: 7px 16px;
                background: linear-gradient(135deg, rgba(107,124,71,0.09), rgba(74,90,46,0.06));
                border: 1px solid rgba(107,124,71,0.22);
                color: #3a4e20;
                border-radius: 100px;
                font-size: 13px;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 6px;
              }
              .amenity-chip {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 8px 14px;
                background: #f7f4ee;
                border: 1px solid rgba(107,124,71,0.15);
                color: #2d3a1c;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 500;
                transition: background 0.2s;
              }
              .amenity-chip:hover { background: #f0ead6; }
            `}</style>

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* ── UNIFIED INFO CARD ── */}
              <section style={{
                background: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(107,124,71,0.08)',
                border: '1px solid rgba(107,124,71,0.1)',
                animation: 'fadeUp 0.5s ease both',
              }}>

                {/* Card Top Accent */}
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #6b7c47, #a3b877, #6b7c47)' }} />

                <div style={{ padding: '28px 30px' }}>

                  {/* ── About ── */}
                  <div className="detail-section-header">
                    <div className="detail-section-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7c47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <h2 className="detail-section-title">About this {venue.category?.replace('-',' ') || 'vendor'}</h2>
                  </div>
                  <p style={{ color: '#4a5a3e', lineHeight: 1.8, fontSize: '14.5px', margin: 0, paddingLeft: '44px' }}>
                    {venue.description || 'No description available.'}
                  </p>

                  {/* ── Key Stats Strip ── */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginTop: '20px',
                    paddingLeft: '44px',
                  }}>
                    {venue.category === 'venues' && venue.capacity?.max > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(107,124,71,0.07)', borderRadius: '100px', border: '1px solid rgba(107,124,71,0.15)' }}>
                        <Users size={13} color="#6b7c47" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4e20' }}>Capacity: {venue.capacity.min}–{venue.capacity.max}</span>
                      </div>
                    )}
                    {venue.serviceDetails?.experience && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(107,124,71,0.07)', borderRadius: '100px', border: '1px solid rgba(107,124,71,0.15)' }}>
                        <Clock size={13} color="#6b7c47" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4e20' }}>{venue.serviceDetails.experience}+ Years Experience</span>
                      </div>
                    )}
                    {venue.serviceDetails?.teamSize && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(107,124,71,0.07)', borderRadius: '100px', border: '1px solid rgba(107,124,71,0.15)' }}>
                        <Users size={13} color="#6b7c47" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4e20' }}>Team of {venue.serviceDetails.teamSize}</span>
                      </div>
                    )}
                    {venue.serviceDetails?.minPlates && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(107,124,71,0.07)', borderRadius: '100px', border: '1px solid rgba(107,124,71,0.15)' }}>
                        <Users size={13} color="#6b7c47" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4e20' }}>{venue.serviceDetails.minPlates}+ Plates</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: '#fffbeb', borderRadius: '100px', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>{venue.rating}/5 · {venue.reviewCount} reviews</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(107,124,71,0.07)', borderRadius: '100px', border: '1px solid rgba(107,124,71,0.15)' }}>
                      <Shield size={13} color="#6b7c47" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4e20' }}>Verified Vendor</span>
                    </div>
                  </div>

                  {/* ── Highlights ── */}
                  {venue.highlights?.length > 0 && (
                    <>
                      <div className="detail-divider" />
                      <div className="detail-section-header">
                        <div className="detail-section-icon">
                          <Sparkles size={15} color="#6b7c47" />
                        </div>
                        <h2 className="detail-section-title">What Makes Us Special</h2>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '9px', paddingLeft: '44px' }}>
                        {venue.highlights.map((h, i) => (
                          <div key={i} className="highlight-chip">
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Check size={12} color="white" strokeWidth={3} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#2d3a1c' }}>{h}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Event Types ── */}
                  {venue.eventTypes?.length > 0 && (
                    <>
                      <div className="detail-divider" />
                      <div className="detail-section-header">
                        <div className="detail-section-icon">
                          <Calendar size={15} color="#6b7c47" />
                        </div>
                        <h2 className="detail-section-title">Event Types We Host</h2>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '44px' }}>
                        {venue.eventTypes.map((et, i) => (
                          <span key={i} className="event-pill">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7c47', display: 'inline-block' }} />
                            {et}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Amenities & Services ── */}
                  {venue.amenities?.length > 0 && (
                    <>
                      <div className="detail-divider" />
                      <div className="detail-section-header">
                        <div className="detail-section-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7c47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                        <h2 className="detail-section-title">Amenities & Services</h2>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '44px' }}>
                        {venue.amenities.map((a, i) => (
                          <div key={i} className="amenity-chip">
                            <Sparkles size={12} color="#6b7c47" />
                            {a}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Location ── */}
                  {venue.address && (
                    <>
                      <div className="detail-divider" />
                      <div className="detail-section-header">
                        <div className="detail-section-icon">
                          <MapPin size={15} color="#6b7c47" />
                        </div>
                        <h2 className="detail-section-title">Location</h2>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingLeft: '44px' }}>
                        <div style={{ background: 'rgba(107,124,71,0.07)', border: '1px solid rgba(107,124,71,0.15)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color="#6b7c47" />
                          <span style={{ fontSize: '13.5px', color: '#3a4e20', fontWeight: 500, lineHeight: 1.5 }}>{venue.address}, {venue.city}</span>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </section>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="venue-sidebar">
              <div style={{
                background: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(107,124,71,0.14)',
                border: '1px solid rgba(107,124,71,0.15)',
              }}>
                {/* Price header */}
                <div style={{ background: 'linear-gradient(135deg,#4a5a2e,#2d3a1c)', padding: '24px 28px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Starting from</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {formatPrice(venue.priceRange.min, venue.priceRange.max)}
                  </div>
                  {venue.priceUnit && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '6px' }}>per {venue.priceUnit.replace('per ', '')}</div>}
                </div>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Key stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ textAlign: 'center', padding: '14px', background: '#f7f4ee', borderRadius: '14px', border: '1px solid rgba(107,124,71,0.1)' }}>
                      {venue.category === 'venues' ? (
                        <>
                          <Users size={20} color="#6b7c47" style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '10px', color: '#8a9a6a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Capacity</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a2010' }}>{venue.capacity.min}–{venue.capacity.max}</div>
                        </>
                      ) : venue.serviceDetails?.experience ? (
                        <>
                          <Clock size={20} color="#6b7c47" style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '10px', color: '#8a9a6a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Experience</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a2010' }}>{venue.serviceDetails.experience}+ Yrs</div>
                        </>
                      ) : (
                        <>
                          <Shield size={20} color="#6b7c47" style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '10px', color: '#8a9a6a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Verified</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a2010' }}>✓</div>
                        </>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', padding: '14px', background: '#fffbeb', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Star size={20} fill="#f59e0b" color="#f59e0b" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Rating</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#78350f' }}>{venue.rating}/5</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(107,124,71,0.1)' }} />

                  {/* CTA buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={() => {
                        if (!session) { router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`); return; }
                        setShowQuoteModal(true);
                      }}
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', color: 'white', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(107,124,71,0.35)', transition: 'transform 0.2s,box-shadow 0.2s', letterSpacing: '0.2px' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(107,124,71,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,124,71,0.35)'; }}
                    >
                      <FileText size={18} /> Get a Free Quote
                    </button>
                    <button
                      onClick={() => { setAppointmentType('appointment'); setShowAppointmentModal(true); }}
                      style={{ width: '100%', padding: '15px', borderRadius: '14px', border: '2px solid rgba(107,124,71,0.3)', background: 'rgba(107,124,71,0.05)', color: '#4a5a2e', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,124,71,0.1)'; e.currentTarget.style.borderColor = 'rgba(107,124,71,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(107,124,71,0.05)'; e.currentTarget.style.borderColor = 'rgba(107,124,71,0.3)'; }}
                    >
                      <Calendar size={17} /> Check Availability
                    </button>
                  </div>

                  {/* Trust badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(107,124,71,0.04)', borderRadius: '10px', border: '1px solid rgba(107,124,71,0.1)' }}>
                    <Shield size={13} color="#6b7c47" />
                    <span style={{ fontSize: '12px', color: '#6b7560', fontWeight: 600 }}>No booking fees · Secure enquiry</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Bottom Bar ─────────────────────────── */}
        <div className="mobile-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid rgba(107,124,71,0.15)', boxShadow: '0 -8px 32px rgba(0,0,0,0.08)', zIndex: 50, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '10px', color: '#8a9a6a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a2010', lineHeight: 1.2 }}>{formatPrice(venue.priceRange.min, venue.priceRange.max)}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <button onClick={() => { setAppointmentType('appointment'); setShowAppointmentModal(true); }} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '2px solid rgba(107,124,71,0.3)', background: 'white', color: '#4a5a2e', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Calendar size={15} /> Check
            </button>
            <button onClick={() => { if (!session) { router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`); return; } setShowQuoteModal(true); }} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(107,124,71,0.4)' }}>
              <FileText size={15} /> Get Quote
            </button>
          </div>
        </div>

        {showQuoteModal && <QuoteModal venue={venue} onClose={() => setShowQuoteModal(false)} />}
        {showAppointmentModal && <AppointmentModal venue={venue} type={appointmentType} onClose={() => setShowAppointmentModal(false)} />}
      </div>
    </>
  );
}
