'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getUserQuoteRequests, getQuotesForRequest, acceptQuote } from '@/app/actions/quotes';
import { getUserAppointments, cancelAppointment } from '@/app/actions/appointments';
import { getVendorListings, getVendorQuoteRequests, getVendorAppointments, acceptAppointment, rejectAppointment, acceptQuoteRequest, rejectQuoteRequest, updateVenueListing, deleteVenueListing } from '@/app/actions/vendor-dashboard';
import { FileText, Calendar, Clock, MapPin, Star, Users, Check, X, ChevronRight, Inbox, Eye, PartyPopper, Shield, Store, Edit2, Trash2, Package, CheckCircle } from 'lucide-react';
import VendorJoinModal from '@/components/VendorJoinModal';

interface QuoteRequest {
  _id: string;
  eventType: string;
  location: string;
  eventDate: string;
  attendees: number;
  budgetMin: number;
  budgetMax: number;
  requirements: string;
  status: string;
  createdAt: string;
}

interface Quote {
  _id: string;
  price: number;
  description: string;
  inclusions: string[];
  validUntil: string;
  status: string;
  venueId?: { _id: string; name: string; images: string[]; location: string; rating: number };
}


interface Appointment {
  _id: string;
  type: 'appointment' | 'visit';
  scheduledDate: string;
  scheduledTime: string;
  eventType: string;
  status: string;
  venueId?: { _id: string; name: string; images: string[]; location: string };
}

// ─── Edit Venue Modal with Image Upload ────────────────────────────────────
function EditVenueModal({ venue, onClose, onSave }: { venue: any; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: venue.name || '', description: venue.description || '', city: venue.city || '', address: venue.address || '', location: venue.location || '' });
  const [currentImages, setCurrentImages] = useState<string[]>(venue.images || []);
  const [newPreviews, setNewPreviews] = useState<string[]>([]); // base64 previews for new images
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const compressFile = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => {
          const src = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const MAX = 1200;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
              else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('no canvas'));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.onerror = reject;
          img.src = src;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressFile(file);
        setNewPreviews(prev => prev.length + currentImages.length >= 5 ? prev : [...prev, compressed]);
      } catch { /* skip */ }
    }
    if (e.target) e.target.value = '';
  }


  async function handleSave() {
    setSaving(true);
    setUploadError('');
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmyww4jcv';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'shubharambh_unsigned';

      // Upload new images directly to Cloudinary from browser
      const uploadedUrls: string[] = [];
      for (const base64 of newPreviews) {
        try {
          const fd = new FormData();
          fd.append('file', base64);
          fd.append('upload_preset', uploadPreset);
          fd.append('folder', `shubharambh/${venue.category || 'venues'}`);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
          const data = await res.json();
          if (data.secure_url) {
            uploadedUrls.push(data.secure_url);
          } else {
            setUploadError('One or more photos failed to upload.');
          }
        } catch {
          setUploadError('Upload error — check your connection.');
        }
      }
      // Merge existing + newly uploaded
      const finalImages = [...currentImages, ...uploadedUrls];
      await onSave({ ...form, amenities: [], images: finalImages.length > 0 ? finalImages : venue.images });
    } catch {
      setUploadError('Save failed. Please try again.');
    }
    setSaving(false);
  }


  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '4px' }}>Edit Listing</h3>
        <p style={{ fontSize: '13px', color: 'var(--olive-500)', marginBottom: '24px' }}>Update your listing details and photos</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Photo Section ── */}
          <div style={{ background: 'var(--cream-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--cream-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--olive-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photos</span>
              <span style={{ fontSize: '12px', color: 'var(--olive-400)' }}>{currentImages.length + newPreviews.length}/5</span>
            </div>

            {/* Current images */}
            {currentImages.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px', fontWeight: 500 }}>Current photos (click × to remove):</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--cream-300)', flexShrink: 0 }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setCurrentImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New image previews */}
            {newPreviews.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px', fontWeight: 500 }}>New photos to upload:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {newPreviews.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #10b981', flexShrink: 0 }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setNewPreviews(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} style={{ padding: '9px 16px', borderRadius: '8px', border: '2px dashed var(--olive-400)', background: 'white', color: 'var(--olive-600)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              + Add Photos
            </button>
            {uploadError && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>{uploadError}</p>}
          </div>

          {/* ── Text Fields ── */}
          {[
            { key: 'name', label: 'Listing Name', type: 'input' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'city', label: 'City', type: 'input' },
            { key: 'location', label: 'Area / Locality', type: 'input' },
            { key: 'address', label: 'Full Address', type: 'input' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--olive-700)', marginBottom: '6px' }}>{f.label}</label>
              {f.type === 'textarea'
                ? <textarea value={(form as any)[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid var(--cream-300)', fontSize: '14px', resize: 'vertical', outline: 'none' }} />
                : <input type="text" value={(form as any)[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid var(--cream-300)', fontSize: '14px', outline: 'none' }} />
              }
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', border: '1px solid var(--cream-300)', borderRadius: '10px', background: 'white', color: 'var(--olive-600)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '10px', background: saving ? 'var(--olive-400)' : 'var(--olive-600)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? (newPreviews.length > 0 ? 'Uploading photos...' : 'Saving...') : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}



export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'quotes' | 'appointments' | 'listings' | 'requests'>('quotes');
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  
  // Vendor-specific state
  const [vendorListings, setVendorListings] = useState<any[]>([]);
  const [vendorDoc, setVendorDoc] = useState<any>(null); // null = no Vendor doc yet (first-time vendor)
  const [vendorQuoteRequests, setVendorQuoteRequests] = useState<any[]>([]);
  const [vendorAppointments, setVendorAppointments] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppointment, setRejectingAppointment] = useState<string | null>(null);
  const [rejectingQuoteRequest, setRejectingQuoteRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const isVendor = session?.user?.role === 'vendor';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  async function loadData() {
    setLoading(true);
    if (isVendor) {
      // Load vendor-specific data
      const [listingsData, quoteReqs, appts] = await Promise.all([
        getVendorListings(),
        getVendorQuoteRequests(),
        getVendorAppointments()
      ]);
      
      console.log('[Dashboard] Vendor data loaded:', {
        listings: listingsData.venues?.length || 0,
        quoteRequests: quoteReqs.length,
        appointments: appts.length,
      });
      
      if (!listingsData.error) {
        setVendorListings(listingsData.venues || []);
        setVendorDoc(listingsData.vendor || null); // null if vendor has never registered
      }
      setVendorQuoteRequests(quoteReqs);
      setVendorAppointments(appts);
      
      // Set default tab for vendors
      if (listingsData.venues && listingsData.venues.length > 0) {
        setActiveTab('listings');
      } else {
        setActiveTab('requests');
      }
    } else {
      // Load user data
      const [quoteData, appointmentData] = await Promise.all([getUserQuoteRequests(), getUserAppointments()]);
      
      console.log('[Dashboard] User data loaded:', {
        quoteRequests: quoteData.length,
        appointments: appointmentData.length,
      });
      
      // Log vendor responses
      quoteData.forEach((req: any) => {
        console.log('[Dashboard] User Quote Request:', {
          id: req._id,
          eventType: req.eventType,
          vendorResponse: req.vendorResponse ? {
            status: req.vendorResponse.status,
            message: req.vendorResponse.message,
            respondedAt: req.vendorResponse.respondedAt
          } : 'No response yet'
        });
      });
      
      setQuoteRequests(quoteData);
      setAppointments(appointmentData);
    }
    setLoading(false);
  }

  async function loadQuotes(requestId: string) {
    setQuotesLoading(true);
    setSelectedRequest(requestId);
    const quotesData = await getQuotesForRequest(requestId);
    setQuotes(quotesData);
    setQuotesLoading(false);
  }

  async function handleAcceptQuote(quoteId: string) {
    const result = await acceptQuote(quoteId);
    if (result.success) {
      loadData();
      if (selectedRequest) loadQuotes(selectedRequest);
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    const result = await cancelAppointment(appointmentId);
    if (result.success) loadData();
  }

  async function handleAcceptAppointment(appointmentId: string) {
    const result = await acceptAppointment(appointmentId);
    if (result.success) {
      alert('Appointment confirmed!');
      loadData();
    }
  }

  async function handleRejectAppointment() {
    if (rejectingAppointment) {
      if (!rejectionReason.trim()) return;
      
      const result = await rejectAppointment(rejectingAppointment, rejectionReason);
      if (result.success) {
        setShowRejectModal(false);
        setRejectingAppointment(null);
        setRejectionReason('');
        loadData();
      }
    } else if (rejectingQuoteRequest) {
      if (!rejectionReason.trim()) return;
      
      const result = await rejectQuoteRequest(rejectingQuoteRequest, rejectionReason);
      if (result.success) {
        alert('Quote request rejected');
        setShowRejectModal(false);
        setRejectingQuoteRequest(null);
        setRejectionReason('');
        loadData();
      } else {
        alert(result.error || 'Failed to reject quote request');
      }
    }
  }

  async function handleAcceptQuoteRequest(quoteRequestId: string) {
    const result = await acceptQuoteRequest(quoteRequestId);
    if (result.success) {
      alert('Quote request accepted!');
      loadData();
    } else {
      alert(result.error || 'Failed to accept quote request');
    }
  }

  function handleEditVenue(venue: any) {
    setEditingVenue(venue);
    setEditForm({
      name: venue.name,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      pincode: venue.pincode,
      capacity: venue.capacity,
      pricing: venue.pricing,
      amenities: venue.amenities.join(', '),
      type: venue.type,
      availability: venue.availability,
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editingVenue) return;
    
    const updatedData = {
      ...editForm,
      amenities: editForm.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a),
    };
    
    const result = await updateVenueListing(editingVenue._id, updatedData);
    if (result.success) {
      alert('Venue updated successfully');
      setShowEditModal(false);
      setEditingVenue(null);
      setEditForm({});
      loadData();
    } else {
      alert(result.error || 'Failed to update venue');
    }
  }

  async function handleDeleteListing(venueId: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    const result = await deleteVenueListing(venueId);
    if (result.success) {
      alert('Listing deleted successfully');
      loadData();
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const formatPrice = (price: number, maxPrice?: number) => {
    if (maxPrice) {
      const formatSingle = (p: number) => {
        if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
        if (p >= 1000) return `₹${(p / 1000).toFixed(0)}K`;
        return `₹${p}`;
      };
      return `${formatSingle(price)} - ${formatSingle(maxPrice)}`;
    }
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
    return `₹${price}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream-50)', paddingTop: '80px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--cream-200)', borderTopColor: 'var(--olive-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream-50)' }}>
      {/* Header */}
      <section style={{ paddingTop: '80px', paddingBottom: '32px', background: 'linear-gradient(135deg, var(--olive-700), var(--olive-800))' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: 'white', marginBottom: '4px', marginTop: '30px' }}>My Dashboard</h1>
              <p style={{ color: 'var(--cream-200)', fontSize: '14px' }}>Welcome back, {session?.user?.name}</p>
            </div>
            {isVendor && (
              <button 
                onClick={() => setShowVendorModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: 'white',
                  color: 'var(--olive-700)',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s'
                }}
              >
                <Store size={18} />
                List Your Service
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats & Tabs */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Stats Row */}
        <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '-20px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--olive-800)' }}>{isVendor ? vendorQuoteRequests.length : quoteRequests.length}</div>
              <div style={{ fontSize: '12px', color: 'var(--olive-500)' }}>{isVendor ? 'Incoming Requests' : 'Quote Requests'}</div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isVendor ? <CheckCircle size={20} style={{ color: 'white' }} /> : <Calendar size={20} style={{ color: 'white' }} />}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{isVendor ? vendorQuoteRequests.filter((q: any) => q.vendorResponse?.status === 'accepted').length : appointments.length}</div>
              <div style={{ fontSize: '12px', color: '#16a34a' }}>{isVendor ? 'Accepted' : 'Appointments'}</div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{isVendor ? vendorQuoteRequests.filter((q: any) => !q.vendorResponse).length : quoteRequests.filter(q => q.status === 'pending').length}</div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>Pending</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tab-bar" style={{ background: 'white', borderRadius: '12px', padding: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '20px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {isVendor ? (
            <>
              <button onClick={() => setActiveTab('listings')} style={{ flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === 'listings' ? 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' : 'transparent', color: activeTab === 'listings' ? 'white' : 'var(--olive-600)', transition: 'all 0.2s' }}>
                <Package size={16} /> My Listings
                {vendorListings.length > 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: activeTab === 'listings' ? 'rgba(255,255,255,0.2)' : 'var(--olive-100)' }}>{vendorListings.length}</span>}
              </button>
              <button onClick={() => setActiveTab('requests')} style={{ flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === 'requests' ? 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' : 'transparent', color: activeTab === 'requests' ? 'white' : 'var(--olive-600)', transition: 'all 0.2s' }}>
                <FileText size={16} /> Incoming Requests
                {(vendorQuoteRequests.length + vendorAppointments.filter(a => a.status === 'pending').length) > 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: activeTab === 'requests' ? 'rgba(255,255,255,0.2)' : 'var(--olive-100)' }}>{vendorQuoteRequests.length + vendorAppointments.filter((a: any) => a.status === 'pending').length}</span>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('quotes')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === 'quotes' ? 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' : 'transparent', color: activeTab === 'quotes' ? 'white' : 'var(--olive-600)', transition: 'all 0.2s' }}>
                <FileText size={16} /> Quote Requests
                {quoteRequests.length > 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: activeTab === 'quotes' ? 'rgba(255,255,255,0.2)' : 'var(--olive-100)' }}>{quoteRequests.length}</span>}
              </button>
              <button onClick={() => setActiveTab('appointments')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === 'appointments' ? 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' : 'transparent', color: activeTab === 'appointments' ? 'white' : 'var(--olive-600)', transition: 'all 0.2s' }}>
                <Calendar size={16} /> Appointments
                {appointments.length > 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: activeTab === 'appointments' ? 'rgba(255,255,255,0.2)' : 'var(--olive-100)' }}>{appointments.length}</span>}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 60px' }}>
        {isVendor && activeTab === 'listings' ? (
          /* Vendor Listings */
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--olive-600)', marginBottom: '12px' }}>Your Listed Services</h3>
            {vendorListings.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Package size={40} style={{ color: 'var(--olive-300)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--olive-500)', fontSize: '14px', marginBottom: '16px' }}>No listings yet. Start by adding your first service!</p>
                <button onClick={() => setShowVendorModal(true)} style={{ background: 'var(--olive-600)', color: 'white', fontWeight: 600, padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Add Listing</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {vendorListings.map((venue: any) => (
                  <div key={venue._id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <img src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300'} alt={venue.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--olive-800)' }}>{venue.name}</h4>
                        <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, background: venue.status === 'approved' ? '#dcfce7' : venue.status === 'pending' ? '#fef3c7' : '#fee2e2', color: venue.status === 'approved' ? '#16a34a' : venue.status === 'pending' ? '#b45309' : '#dc2626', textTransform: 'capitalize' }}>{venue.status}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {venue.location}
                      </p>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--olive-700)', marginBottom: '12px' }}>
                        {formatPrice(venue.priceRange.min, venue.priceRange.max)}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditVenue(venue)} style={{ flex: 1, padding: '8px', border: '1px solid var(--olive-300)', borderRadius: '8px', background: 'white', color: 'var(--olive-600)', fontWeight: 500, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDeleteListing(venue._id)} style={{ padding: '8px 12px', border: '1px solid #fee2e2', borderRadius: '8px', background: 'white', color: '#dc2626', fontWeight: 500, fontSize: '12px', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isVendor && activeTab === 'requests' ? (
          /* Vendor Incoming Requests */
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--olive-600)', marginBottom: '12px' }}>Incoming Customer Requests</h3>
            
            {/* Quote Requests Section */}
            {vendorQuoteRequests.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--olive-700)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} /> Quote Requests ({vendorQuoteRequests.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {vendorQuoteRequests.map((request: any) => (
                    <div key={request._id} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '2px solid var(--olive-200)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: 'var(--olive-100)', color: 'var(--olive-700)', textTransform: 'capitalize' }}>Quote Request</span>
                        <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, background: request.status === 'pending' ? '#fef3c7' : request.status === 'responded' ? '#dcfce7' : '#fee2e2', color: request.status === 'pending' ? '#b45309' : request.status === 'responded' ? '#16a34a' : '#dc2626', textTransform: 'capitalize' }}>{request.status}</span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '8px' }}>{request.eventType}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px' }}>
                        <strong>Customer:</strong> {request.userId?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {request.location}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {formatDate(request.eventDate)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                        <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {request.attendees} guests
                      </div>
                      {request.budgetMin && request.budgetMax && (
                        <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px' }}>
                          <strong>Budget:</strong> ₹{request.budgetMin.toLocaleString()} - ₹{request.budgetMax.toLocaleString()}
                        </div>
                      )}
                      {request.requirements && (
                        <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px', padding: '8px', background: 'var(--cream-50)', borderRadius: '6px' }}>
                          <strong>Requirements:</strong> {request.requirements}
                        </div>
                      )}
                      {request.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px', padding: '8px', background: 'var(--cream-50)', borderRadius: '6px' }}>
                          <strong>Notes:</strong> {request.notes}
                        </div>
                      )}
                      {!request.vendorResponse && request.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button onClick={() => handleAcceptQuoteRequest(request._id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#10b981', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Check size={16} /> Accept
                          </button>
                          <button onClick={() => { setRejectingQuoteRequest(request._id); setShowRejectModal(true); }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <X size={16} /> Reject
                          </button>
                        </div>
                      )}
                      {request.vendorResponse && (
                        <div style={{ marginTop: '12px', padding: '10px', background: request.vendorResponse.status === 'accepted' ? '#dcfce7' : '#fee2e2', borderRadius: '8px', fontSize: '12px', color: request.vendorResponse.status === 'accepted' ? '#16a34a' : '#dc2626' }}>
                          <strong>{request.vendorResponse.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}</strong>
                          {request.vendorResponse.message && <div style={{ marginTop: '4px' }}>{request.vendorResponse.message}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments Section */}
            {vendorAppointments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--olive-700)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} /> Appointments ({vendorAppointments.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {vendorAppointments.map((appointment: any) => (
                    <div key={appointment._id} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: appointment.type === 'appointment' ? 'var(--olive-100)' : '#dbeafe', color: appointment.type === 'appointment' ? 'var(--olive-700)' : '#1e40af', textTransform: 'capitalize' }}>{appointment.type}</span>
                        <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, background: appointment.status === 'pending' ? '#fef3c7' : appointment.status === 'confirmed' ? '#dcfce7' : '#fee2e2', color: appointment.status === 'pending' ? '#b45309' : appointment.status === 'confirmed' ? '#16a34a' : '#dc2626', textTransform: 'capitalize' }}>{appointment.status}</span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '8px' }}>{appointment.venueId?.name}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px' }}>
                        <strong>Customer:</strong> {appointment.userId?.name || appointment.userName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {formatDate(appointment.scheduledDate)} at {appointment.scheduledTime}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                        Event: {appointment.eventType} • {appointment.attendees || 'N/A'} guests
                      </div>
                      {appointment.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '12px', padding: '8px', background: 'var(--cream-50)', borderRadius: '6px' }}>
                          <strong>Notes:</strong> {appointment.notes}
                        </div>
                      )}
                      {appointment.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button onClick={() => handleAcceptAppointment(appointment._id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#10b981', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Check size={16} /> Accept
                          </button>
                          <button onClick={() => { setRejectingAppointment(appointment._id); setShowRejectModal(true); }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <X size={16} /> Reject
                          </button>
                        </div>
                      )}
                      {appointment.status === 'rejected' && appointment.rejectionReason && (
                        <div style={{ marginTop: '12px', padding: '8px', background: '#fee2e2', borderRadius: '6px', fontSize: '12px', color: '#dc2626' }}>
                          <strong>Rejection reason:</strong> {appointment.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {vendorQuoteRequests.length === 0 && vendorAppointments.length === 0 && (
              <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Inbox size={40} style={{ color: 'var(--olive-300)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--olive-500)', fontSize: '14px' }}>No customer requests yet</p>
              </div>
            )}
          </div>
        ) : activeTab === 'quotes' ? (
          <div>
            {/* Show user's sent quote requests with vendor responses */}
            <div style={{ marginBottom: '16px', background: 'var(--cream-50)', border: '1px solid var(--olive-200)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Store size={18} style={{ color: 'var(--olive-600)' }} />
              <p style={{ fontSize: '13px', color: 'var(--olive-700)' }}>
                <strong>Your Quote Requests:</strong> Track the status of your quote requests and vendor responses here.
              </p>
            </div>
            
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '16px' }}>Your Quote Requests</h3>
            
            {quoteRequests.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Clock size={40} style={{ color: 'var(--olive-300)', marginBottom: '12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--olive-700)', marginBottom: '4px', fontSize: '15px' }}>No quote requests yet</p>
                <p style={{ color: 'var(--olive-500)', fontSize: '13px', marginBottom: '20px' }}>Request quotes from venues to get started</p>
                <button onClick={() => router.push('/venues')} style={{ background: 'var(--olive-600)', color: 'white', fontWeight: 600, padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Browse Venues</button>
              </div>
            ) : (
              <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {quoteRequests.map((request: any) => (
                  <div key={request._id} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '2px solid var(--olive-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: 'var(--olive-100)', color: 'var(--olive-700)', textTransform: 'capitalize' }}>{request.eventType}</span>
                      <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, background: request.vendorResponse ? (request.vendorResponse.status === 'accepted' ? '#dcfce7' : '#fee2e2') : '#fef3c7', color: request.vendorResponse ? (request.vendorResponse.status === 'accepted' ? '#16a34a' : '#dc2626') : '#b45309', textTransform: 'capitalize' }}>
                        {request.vendorResponse ? request.vendorResponse.status : 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {request.location}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {formatDate(request.eventDate)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--olive-500)', marginBottom: '8px' }}>
                      <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {request.attendees} guests
                    </div>
                    {request.budgetMin && request.budgetMax && (
                      <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px' }}>
                        <strong>Budget:</strong> ₹{request.budgetMin.toLocaleString()} - ₹{request.budgetMax.toLocaleString()}
                      </div>
                    )}
                    {request.requirements && (
                      <div style={{ fontSize: '12px', color: 'var(--olive-600)', marginBottom: '8px', padding: '8px', background: 'var(--cream-50)', borderRadius: '6px' }}>
                        <strong>Requirements:</strong> {request.requirements}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--olive-500)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--olive-100)' }}>
                      Sent on {formatDate(request.createdAt)}
                    </div>
                    {request.vendorResponse && (
                      <div style={{ marginTop: '12px', padding: '12px', background: request.vendorResponse.status === 'accepted' ? '#dcfce7' : '#fee2e2', borderRadius: '8px', fontSize: '12px', color: request.vendorResponse.status === 'accepted' ? '#16a34a' : '#dc2626' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {request.vendorResponse.status === 'accepted' ? '✅ Accepted by Vendor' : '❌ Declined by Vendor'}
                        </div>
                        {request.vendorResponse.message && (
                          <div style={{ marginTop: '6px', fontSize: '12px', lineHeight: '1.5' }}>
                            {request.vendorResponse.message}
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
                          Responded on {formatDate(request.vendorResponse.respondedAt)}
                        </div>
                      </div>
                    )}
                    {!request.vendorResponse && (
                      <div style={{ marginTop: '12px', padding: '10px', background: '#fef3c7', borderRadius: '6px', fontSize: '11px', color: '#b45309' }}>
                        ⏳ Waiting for vendor response...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Privacy Note */}
            <div style={{ marginTop: '20px', background: 'var(--olive-50)', border: '1px solid var(--olive-200)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={16} style={{ color: 'var(--olive-600)' }} />
              <p style={{ fontSize: '12px', color: 'var(--olive-600)' }}><strong>Privacy Protected:</strong> Your contact details are kept private until vendors respond to your requests.</p>
            </div>
          </div>
        ) : (
          /* Appointments Tab */
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--olive-600)', marginBottom: '12px' }}>Your Appointments & Visits</h3>
            {appointments.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '0 auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Calendar size={40} style={{ color: 'var(--olive-300)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--olive-500)', fontSize: '14px', marginBottom: '16px' }}>No appointments scheduled</p>
                <button onClick={() => router.push('/venues')} style={{ background: 'var(--olive-600)', color: 'white', fontWeight: 600, padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Browse Venues</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {appointments.map((appointment) => (
                  <div key={appointment._id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    {appointment.venueId && <img src={appointment.venueId.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300'} alt={appointment.venueId.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', textTransform: 'capitalize', background: appointment.type === 'visit' ? '#dbeafe' : 'var(--olive-100)', color: appointment.type === 'visit' ? '#2563eb' : 'var(--olive-700)' }}>{appointment.type === 'visit' ? 'Site Visit' : 'Appointment'}</span>
                        <span style={{ fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '6px', background: appointment.status === 'pending' ? '#fef3c7' : appointment.status === 'confirmed' ? '#dcfce7' : appointment.status === 'cancelled' ? '#fee2e2' : '#dbeafe', color: appointment.status === 'pending' ? '#b45309' : appointment.status === 'confirmed' ? '#16a34a' : appointment.status === 'cancelled' ? '#dc2626' : '#2563eb' }}>{appointment.status}</span>
                      </div>
                      {appointment.venueId && (
                        <>
                          <h4 style={{ fontWeight: 700, color: 'var(--olive-800)', fontSize: '15px', marginBottom: '4px' }}>{appointment.venueId.name}</h4>
                          <p style={{ color: 'var(--olive-500)', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {appointment.venueId.location}</p>
                        </>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--olive-600)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> {formatDate(appointment.scheduledDate)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={14} /> {appointment.scheduledTime}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize' }}><PartyPopper size={14} /> {appointment.eventType}</span>
                      </div>
                      {appointment.status === 'rejected' && (appointment as any).rejectionReason && (
                        <div style={{ marginTop: '12px', padding: '10px', background: '#fee2e2', borderRadius: '8px', fontSize: '12px', color: '#dc2626' }}>
                          <strong>Rejected:</strong> {(appointment as any).rejectionReason}
                        </div>
                      )}
                      {appointment.status === 'pending' && (
                        <button onClick={() => handleCancelAppointment(appointment._id)} style={{ width: '100%', marginTop: '14px', padding: '10px', border: '1px solid var(--cream-300)', borderRadius: '8px', background: 'transparent', color: 'var(--olive-600)', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Vendor Modal */}
      {showVendorModal && (
        <VendorJoinModal
          onClose={() => { setShowVendorModal(false); loadData(); }}
          mode={vendorDoc ? 'add-listing' : 'register'}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRejectModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '12px' }}>
              {rejectingQuoteRequest ? 'Reject Quote Request' : 'Reject Appointment'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--olive-600)', marginBottom: '16px' }}>
              Please provide a reason for rejecting this {rejectingQuoteRequest ? 'quote request' : 'appointment'}. This will be shared with the customer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={rejectingQuoteRequest ? "e.g., Unable to accommodate this event type..." : "e.g., Venue already booked for that date..."}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--cream-300)', fontSize: '14px', minHeight: '100px', marginBottom: '16px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setRejectingAppointment(null); setRejectingQuoteRequest(null); }} style={{ flex: 1, padding: '10px', border: '1px solid var(--cream-300)', borderRadius: '8px', background: 'white', color: 'var(--olive-600)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRejectAppointment} disabled={!rejectionReason.trim()} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: rejectionReason.trim() ? '#ef4444' : '#d1d5db', color: 'white', fontWeight: 600, fontSize: '14px', cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed' }}>
                {rejectingQuoteRequest ? 'Reject Request' : 'Reject Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Venue Modal */}
      {showEditModal && editingVenue && (
        <EditVenueModal
          venue={editingVenue}
          onClose={() => { setShowEditModal(false); setEditingVenue(null); setEditForm({}); }}
          onSave={async (updatedData: any) => {
            const result = await updateVenueListing(editingVenue._id, updatedData);
            if (result.success) {
              setShowEditModal(false);
              setEditingVenue(null);
              setEditForm({});
              loadData();
            } else {
              alert(result.error || 'Failed to update listing');
            }
          }}
        />
      )}

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
