'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createQuoteRequest } from '@/app/actions/quotes';
import {
  X, Send, CheckCircle, Calendar, Users, Wallet, FileText,
  StickyNote, Shield, Info, Music, Camera, Utensils, Palette,
  Sparkles, Mic, ChevronRight, ChevronLeft, Star
} from 'lucide-react';

interface Venue {
  _id: string;
  name: string;
  location: string;
  category?: string;
  priceRange?: { min: number; max: number };
}

interface QuoteModalProps {
  venue: Venue;
  onClose: () => void;
}

const kf = `
@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes spinQ {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes popIn {
  0%   { transform: scale(0.5); opacity:0; }
  70%  { transform: scale(1.1); }
  100% { transform: scale(1);   opacity:1; }
}
`;

const inputCls: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '2px solid rgba(107,124,71,0.2)',
  background: 'white',
  color: '#2d3a1c',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

export default function QuoteModal({ venue, onClose }: QuoteModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [focused, setFocused] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    eventType: '', eventDate: '', attendees: '',
    budgetMin: '', budgetMax: '', requirements: '', notes: '',
  });
  const [categoryDetails, setCategoryDetails] = useState<Record<string, any>>({});

  const category = venue.category || 'venues';

  const getCategoryFields = () => {
    switch (category) {
      case 'venues':        return [{ key:'venueType',label:'Venue Type Preference',type:'select',options:['Banquet Hall','Lawn/Garden','Hotel','Resort','Farmhouse','Destination'],needsGuests:true},{key:'seatingStyle',label:'Seating Arrangement',type:'select',options:['Theater Style','Cluster/Round Tables','U-Shape','Mixed'],needsGuests:true},{key:'amenities',label:'Required Amenities',type:'text',placeholder:'e.g. AC, Parking, Stage...',needsGuests:true}];
      case 'caterers':      return [{key:'plateType',label:'Plate Type',type:'select',options:['Veg','Non-Veg','Both','Jain'],needsGuests:true},{key:'cuisines',label:'Preferred Cuisines',type:'text',placeholder:'e.g. North Indian, Chinese...',needsGuests:true},{key:'mealTime',label:'Meal Service',type:'select',options:['Lunch','Dinner','High Tea','All Meals'],needsGuests:true},{key:'serviceStyle',label:'Service Style',type:'select',options:['Buffet','Plated','Live Counters','Mixed'],needsGuests:true}];
      case 'photographers': return [{key:'coverage',label:'Coverage Duration',type:'select',options:['Half Day (4-6 hrs)','Full Day (8-10 hrs)','Multiple Days','2-3 Hours'],needsGuests:false},{key:'services',label:'Services Required',type:'select',options:['Photography Only','Videography Only','Both Photo + Video','Drone Coverage'],needsGuests:false},{key:'deliverables',label:'Deliverables Expected',type:'select',options:['Digital Photos Only','Photos + Album','Cinematic Film + Photos','Pre-Wedding Shoot'],needsGuests:false},{key:'team',label:'Team Size Preference',type:'select',options:['1 Photographer','2 Photographers','1 Photo + 1 Video','Full Team (3+)'],needsGuests:false}];
      case 'decorators':    return [{key:'theme',label:'Theme Preference',type:'text',placeholder:'e.g. Floral, Royal, Pastel...',needsGuests:true},{key:'setting',label:'Event Setting',type:'select',options:['Indoor','Outdoor','Both Indoor & Outdoor','Terrace/Rooftop'],needsGuests:true},{key:'elements',label:'Key Decoration Elements',type:'text',placeholder:'e.g. Stage, Mandap, Floral...',needsGuests:true},{key:'lighting',label:'Lighting Requirements',type:'select',options:['Basic Lighting','Full Mood Lighting','String Lights Only','LED + Effects'],needsGuests:true}];
      case 'makeup':        return [{key:'serviceFor',label:'Makeup Service For',type:'select',options:['Bride Only','Bride + 1-2 Family','Bride + 3-5 Family','Party Makeup'],needsGuests:false},{key:'makeupType',label:'Makeup Type',type:'select',options:['HD Makeup','Airbrush Makeup','Traditional Makeup','Party/Glam Makeup'],needsGuests:false},{key:'services',label:'Additional Services',type:'select',options:['Makeup Only','Makeup + Hairstyling','Makeup + Hair + Draping','Full Bridal Package'],needsGuests:false},{key:'location',label:'Service Location',type:'select',options:['At Your Venue/Home','At Salon/Studio','Flexible'],needsGuests:false}];
      case 'djs':           return [{key:'duration',label:'DJ Service Duration',type:'select',options:['2-3 Hours','4-5 Hours','6-8 Hours','Full Night'],needsGuests:true},{key:'musicStyle',label:'Music Preference',type:'text',placeholder:'e.g. Bollywood, EDM...',needsGuests:true},{key:'equipment',label:'Equipment Needed',type:'select',options:['Sound System Only','Sound + Lighting','Sound + Light + LED','Full Setup + Effects'],needsGuests:true},{key:'additionalServices',label:'Additional Services',type:'select',options:['DJ Only','DJ + Dhol','DJ + Emcee','Full Entertainment Package'],needsGuests:true}];
      default: return [];
    }
  };

  const currentCategoryFields = getCategoryFields();
  const needsGuestCount = currentCategoryFields.some(f => f.needsGuests);

  const set = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));
  const setCat = (key: string, val: string) => setCategoryDetails(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!session) { router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      fd.append('location', venue.location);
      fd.append('category', category);
      fd.append('venueId', venue._id);
      fd.append('categoryDetails', JSON.stringify(categoryDetails));
      const result = await createQuoteRequest(fd);
      if (result.error) setError(result.error); else setSuccess(true);
    } catch { setError('Failed to send request. Please try again.'); }
    setLoading(false);
  };

  const getCategoryIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      caterers: <Utensils size={20} color="white" />,
      photographers: <Camera size={20} color="white" />,
      decorators: <Palette size={20} color="white" />,
      djs: <Music size={20} color="white" />,
      makeup: <Sparkles size={20} color="white" />,
      anchoring: <Mic size={20} color="white" />,
    };
    return icons[category] || <FileText size={20} color="white" />;
  };

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputCls,
    borderColor: focused === field ? '#6b7c47' : 'rgba(107,124,71,0.2)',
    boxShadow: focused === field ? '0 0 0 3px rgba(107,124,71,0.1)' : 'none',
  });

  const canProceed = formData.eventType && formData.eventDate && (!needsGuestCount || formData.attendees);

  // ── Success screen ──
  if (success) {
    return (
      <>
        <style>{kf}</style>
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '48px 36px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', animation: 'slideUp 0.4s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn 0.4s ease 0.1s both' }}>
              <CheckCircle size={36} color="white" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1a2010', margin: '0 0 10px' }}>Enquiry Sent! 🎉</h2>
            <p style={{ color: '#6b7560', lineHeight: 1.6, margin: '0 0 28px', fontSize: '14px' }}>Your quote request has been sent to <strong style={{ color: '#2d3a1c' }}>{venue.name}</strong>. They'll respond within 24 hours.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '24px' }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', color: 'white', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(107,124,71,0.35)' }}>
              Done
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{kf}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.2s ease', padding: '0' }} onClick={onClose} className="quote-modal-backdrop">
        <style>{`
          @media(min-width:640px){
            .quote-modal-backdrop { align-items: center !important; padding: 24px !important; }
            .quote-modal-sheet { border-radius: 24px !important; max-height: 90vh !important; }
          }
        `}</style>
        <div
          className="quote-modal-sheet"
          style={{ background: '#f7f4ee', width: '100%', maxWidth: '520px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 60px rgba(0,0,0,0.25)', animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)', display: 'flex', flexDirection: 'column' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '20px 24px 16px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(107,124,71,0.1)' }}>
            {/* Drag handle */}
            <div style={{ width: '36px', height: '4px', background: 'rgba(107,124,71,0.2)', borderRadius: '100px', margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#6b7c47,#4a5a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getCategoryIcon()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1a2010', lineHeight: 1.2 }}>Get a Quote</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#8a9a6a', fontWeight: 500, marginTop: '2px' }}>from {venue.name}</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(107,124,71,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5a2e', transition: 'background 0.2s' }}>
                <X size={18} />
              </button>
            </div>

            {/* Step progress */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '100px', background: step >= s ? 'linear-gradient(90deg,#6b7c47,#4a5a2e)' : 'rgba(107,124,71,0.15)', transition: 'background 0.4s ease' }} />
              ))}
            </div>
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
              {['Event Details', 'Budget & Notes'].map((label, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? '#4a5a2e' : '#a8b48a' }}>{label}</span>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '20px 24px', flex: 1 }}>

            {/* Privacy banner */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '20px' }}>
              <Shield size={15} color="#3b82f6" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Your privacy is protected.</strong> We only share requirements with verified vendors — not your contact details.
              </p>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '16px' }}>
                <Info size={14} color="#dc2626" />
                <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Event Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Event Type *
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={e => set('eventType', e.target.value)}
                    onFocus={() => setFocused('eventType')}
                    onBlur={() => setFocused(null)}
                    style={focusStyle('eventType')}
                  >
                    <option value="">Select event type</option>
                    {['Wedding','Engagement','Wedding Reception','Pre-Wedding Function','Mehendi Ceremony','Sangeet Night','Haldi Ceremony','Birthday Party','Anniversary Celebration','Bachelor/Bachelorette Party','Bridal Shower','Baby Shower','Corporate Event','Product Launch','Conference/Seminar','Other Event'].map(o => <option key={o} value={o.toLowerCase().replace(/ /g,'-')}>{o}</option>)}
                  </select>
                </div>

                {/* Date + Guests row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Date *</label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={e => set('eventDate', e.target.value)}
                      onFocus={() => setFocused('eventDate')}
                      onBlur={() => setFocused(null)}
                      min={new Date().toISOString().split('T')[0]}
                      style={focusStyle('eventDate')}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {needsGuestCount ? 'Guests *' : 'Time Pref.'}
                    </label>
                    {needsGuestCount ? (
                      <input type="number" value={formData.attendees} onChange={e => set('attendees', e.target.value)} placeholder="e.g. 200" onFocus={() => setFocused('attendees')} onBlur={() => setFocused(null)} style={focusStyle('attendees')} />
                    ) : (
                      <input type="time" onFocus={() => setFocused('time')} onBlur={() => setFocused(null)} style={focusStyle('time')} />
                    )}
                  </div>
                </div>

                {/* Dynamic category fields */}
                {currentCategoryFields.map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        onChange={e => setCat(field.key, e.target.value)}
                        onFocus={() => setFocused(field.key)} onBlur={() => setFocused(null)}
                        style={focusStyle(field.key)}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        onChange={e => setCat(field.key, e.target.value)}
                        onFocus={() => setFocused(field.key)} onBlur={() => setFocused(null)}
                        style={focusStyle(field.key)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Budget info tip */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fffbeb', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Info size={14} color="#92400e" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>Sharing your budget helps vendors give accurate quotes that match your expectations.</p>
                </div>

                {/* Budget */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budget Range (₹)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="number" value={formData.budgetMin} onChange={e => set('budgetMin', e.target.value)} placeholder="Min budget" onFocus={() => setFocused('bmin')} onBlur={() => setFocused(null)} style={focusStyle('bmin')} />
                    <input type="number" value={formData.budgetMax} onChange={e => set('budgetMax', e.target.value)} placeholder="Max budget" onFocus={() => setFocused('bmax')} onBlur={() => setFocused(null)} style={focusStyle('bmax')} />
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requirements *</label>
                  <textarea
                    value={formData.requirements}
                    onChange={e => set('requirements', e.target.value)}
                    placeholder="Describe your vision, what you're looking for, any special needs..."
                    rows={4}
                    onFocus={() => setFocused('req')} onBlur={() => setFocused(null)}
                    style={{ ...focusStyle('req'), resize: 'none', lineHeight: 1.6 }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Additional Notes <span style={{ fontWeight: 400, color: '#a8b48a' }}>(optional)</span></label>
                  <textarea
                    value={formData.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Any other details or questions for the vendor..."
                    rows={2}
                    onFocus={() => setFocused('notes')} onBlur={() => setFocused(null)}
                    style={{ ...focusStyle('notes'), resize: 'none', lineHeight: 1.6 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Footer buttons ── */}
          <div style={{ padding: '16px 24px', background: 'white', borderTop: '1px solid rgba(107,124,71,0.1)', position: 'sticky', bottom: 0 }}>
            {step === 1 ? (
              <button
                onClick={() => { setError(''); setStep(2); }}
                disabled={!canProceed}
                style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: canProceed ? 'linear-gradient(135deg,#6b7c47,#4a5a2e)' : 'rgba(107,124,71,0.25)', color: 'white', fontWeight: 800, fontSize: '15px', cursor: canProceed ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: canProceed ? '0 6px 20px rgba(107,124,71,0.35)' : 'none', transition: 'all 0.2s' }}
              >
                Continue <ChevronRight size={17} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ padding: '15px 20px', borderRadius: '14px', border: '2px solid rgba(107,124,71,0.25)', background: 'white', color: '#4a5a2e', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.requirements}
                  style={{ flex: 1, padding: '15px', borderRadius: '14px', border: 'none', background: !loading && formData.requirements ? 'linear-gradient(135deg,#6b7c47,#4a5a2e)' : 'rgba(107,124,71,0.3)', color: 'white', fontWeight: 800, fontSize: '15px', cursor: loading || !formData.requirements ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !loading && formData.requirements ? '0 6px 20px rgba(107,124,71,0.35)' : 'none' }}
                >
                  {loading ? (
                    <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%', animation: 'spinQ 0.8s linear infinite' }} /> Sending...</>
                  ) : (
                    <><Send size={17} /> Send Enquiry</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
