'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createAppointment } from '@/app/actions/appointments';
import {
  X, CheckCircle, Calendar, Clock, Phone, Users,
  StickyNote, AlertTriangle, ChevronRight, MapPin,
  Info, Star
} from 'lucide-react';

interface Venue {
  _id: string;
  name: string;
  location: string;
}

interface AppointmentModalProps {
  venue: Venue;
  type: 'appointment' | 'visit';
  onClose: () => void;
}

const kf = `
@keyframes slideUp {
  from { opacity:0; transform:translateY(40px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes fadeInBg {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes spinA {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes popIn {
  0%   { transform: scale(0.5); opacity:0; }
  70%  { transform: scale(1.1); }
  100% { transform: scale(1);   opacity:1; }
}
`;

const TIME_SLOTS = [
  '9:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '1:00 PM','2:00 PM','3:00 PM','4:00 PM',
  '5:00 PM','6:00 PM',
];

const EVENT_TYPES = [
  'Wedding','Engagement','Wedding Reception','Sangeet Night',
  'Mehendi Ceremony','Haldi Ceremony','Birthday Party',
  'Anniversary Celebration','Corporate Event','Other',
];

export default function AppointmentModal({ venue, type, onClose }: AppointmentModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    eventType: '',
    attendees: '',
    phone: '',
    notes: '',
  });

  const set = (key: string, val: string) =>
    setFormData(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    setError('');

    const fd = new FormData();
    fd.append('venueId', venue._id);
    fd.append('type', type);
    fd.append('scheduledDate', formData.scheduledDate);
    fd.append('scheduledTime', formData.scheduledTime);
    fd.append('eventType', formData.eventType);
    fd.append('attendees', formData.attendees);
    fd.append('phone', formData.phone);
    fd.append('notes', formData.notes);

    const result = await createAppointment(fd);
    if (result.error) setError(result.error); else setSuccess(true);
    setLoading(false);
  };

  const isAppointment = type === 'appointment';
  const title = isAppointment ? 'Book an Appointment' : 'Schedule a Site Visit';
  const subtitle = isAppointment
    ? 'Confirm your preferred date & time'
    : 'Come see the venue in person';

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: `2px solid ${focused === field ? '#6b7c47' : 'rgba(107,124,71,0.2)'}`,
    background: 'white',
    color: '#2d3a1c',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(107,124,71,0.1)' : 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  });

  // ── Success Screen ──────────────────────────────────
  if (success) {
    return (
      <>
        <style>{kf}</style>
        <div
          style={{ position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',animation:'fadeInBg 0.2s ease' }}
          onClick={onClose}
        >
          <div
            style={{ background:'white',borderRadius:'24px',padding:'44px 32px',maxWidth:'380px',width:'100%',textAlign:'center',boxShadow:'0 32px 80px rgba(0,0,0,0.2)',animation:'slideUp 0.35s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,#6b7c47,#4a5a2e)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',animation:'popIn 0.4s ease 0.1s both' }}>
              <CheckCircle size={36} color="white" />
            </div>
            <h2 style={{ fontSize:'22px',fontWeight:900,color:'#1a2010',margin:'0 0 10px' }}>
              {isAppointment ? 'Appointment Confirmed! 🎉' : 'Visit Scheduled! 🏛️'}
            </h2>
            <p style={{ color:'#6b7560',lineHeight:1.65,margin:'0 0 24px',fontSize:'14px' }}>
              <strong style={{ color:'#2d3a1c' }}>{venue.name}</strong> will reach out to confirm your {type}. Check your dashboard for updates.
            </p>

            {/* What's next box */}
            <div style={{ background:'rgba(107,124,71,0.06)',borderRadius:'14px',border:'1px solid rgba(107,124,71,0.15)',padding:'14px 16px',marginBottom:'24px',textAlign:'left' }}>
              <p style={{ margin:0,fontSize:'12px',fontWeight:700,color:'#4a5a2e',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px' }}>What happens next</p>
              {["Vendor receives your booking request","They confirm within 24 hours via call/email","You'll see the update on your dashboard"].map((step,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom: i < 2 ? '6px' : 0 }}>
                  <div style={{ width:'20px',height:'20px',borderRadius:'50%',background:'linear-gradient(135deg,#6b7c47,#4a5a2e)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <span style={{ fontSize:'10px',fontWeight:900,color:'white' }}>{i+1}</span>
                  </div>
                  <span style={{ fontSize:'12px',color:'#4a5a3e' }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex',gap:'10px' }}>
              <button onClick={onClose} style={{ flex:1,padding:'13px',borderRadius:'12px',border:'2px solid rgba(107,124,71,0.25)',background:'white',color:'#4a5a2e',fontWeight:700,fontSize:'14px',cursor:'pointer' }}>
                Close
              </button>
              <button onClick={() => router.push('/dashboard')} style={{ flex:1,padding:'13px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg,#6b7c47,#4a5a2e)',color:'white',fontWeight:700,fontSize:'14px',cursor:'pointer',boxShadow:'0 4px 14px rgba(107,124,71,0.35)' }}>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{kf}</style>
      <div
        style={{ position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',display:'flex',alignItems:'flex-end',justifyContent:'center',animation:'fadeInBg 0.2s ease' }}
        onClick={onClose}
        className="appt-modal-backdrop"
      >
        <style>{`
          @media(min-width:640px){
            .appt-modal-backdrop { align-items:center !important; padding:24px !important; }
            .appt-modal-sheet   { border-radius:24px !important; max-height:90vh !important; }
          }
        `}</style>

        <div
          className="appt-modal-sheet"
          style={{ background:'#f7f4ee',width:'100%',maxWidth:'520px',maxHeight:'95vh',overflowY:'auto',borderRadius:'24px 24px 0 0',boxShadow:'0 -8px 60px rgba(0,0,0,0.22)',animation:'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)',display:'flex',flexDirection:'column' }}
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ───────────────────────────────────── */}
          <div style={{ background:'white',borderRadius:'24px 24px 0 0',padding:'18px 24px 16px',position:'sticky',top:0,zIndex:10,borderBottom:'1px solid rgba(107,124,71,0.1)' }}>
            {/* Drag handle */}
            <div style={{ width:'36px',height:'4px',background:'rgba(107,124,71,0.2)',borderRadius:'100px',margin:'0 auto 14px' }} />

            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
                <div style={{ width:'42px',height:'42px',borderRadius:'13px',background:'linear-gradient(135deg,#6b7c47,#4a5a2e)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(107,124,71,0.3)' }}>
                  {isAppointment ? <Calendar size={20} color="white" /> : <MapPin size={20} color="white" />}
                </div>
                <div>
                  <h2 style={{ margin:0,fontSize:'17px',fontWeight:900,color:'#1a2010',lineHeight:1.2 }}>{title}</h2>
                  <p style={{ margin:0,fontSize:'12px',color:'#8a9a6a',fontWeight:500,marginTop:'2px' }}>{venue.name} · {subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width:'36px',height:'36px',borderRadius:'10px',background:'rgba(107,124,71,0.08)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#4a5a2e',flexShrink:0 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────── */}
          <div style={{ padding:'20px 24px',flex:1 }}>

            {/* Contact-sharing notice / acknowledge card */}
            {!acknowledged ? (
              <div style={{ background:'white',borderRadius:'18px',border:'2px solid rgba(245,158,11,0.3)',overflow:'hidden',boxShadow:'0 4px 20px rgba(245,158,11,0.1)' }}>
                {/* Top banner */}
                <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)',padding:'20px 20px 16px',display:'flex',alignItems:'flex-start',gap:'12px' }}>
                  <div style={{ width:'40px',height:'40px',borderRadius:'12px',background:'rgba(245,158,11,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <AlertTriangle size={20} color="#92400e" />
                  </div>
                  <div>
                    <h3 style={{ margin:'0 0 4px',fontSize:'15px',fontWeight:800,color:'#78350f' }}>Contact Sharing Notice</h3>
                    <p style={{ margin:0,fontSize:'13px',color:'#92400e',lineHeight:1.6 }}>
                      By booking this {type}, your contact details (name, email &amp; phone) will be shared with <strong>{venue.name}</strong> so they can confirm your booking.
                    </p>
                  </div>
                </div>
                {/* What's shared */}
                <div style={{ padding:'14px 20px',borderTop:'1px solid rgba(245,158,11,0.2)' }}>
                  <p style={{ margin:'0 0 10px',fontSize:'11px',fontWeight:700,color:'#92400e',textTransform:'uppercase',letterSpacing:'0.5px' }}>Information shared</p>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'16px' }}>
                    {['Your Name','Email Address','Phone Number','Event Details'].map(item => (
                      <span key={item} style={{ padding:'4px 10px',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)',color:'#78350f',borderRadius:'100px',fontSize:'12px',fontWeight:600 }}>{item}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => setAcknowledged(true)}
                    style={{ width:'100%',padding:'14px',borderRadius:'13px',border:'none',background:'linear-gradient(135deg,#d97706,#b45309)',color:'white',fontWeight:800,fontSize:'14px',cursor:'pointer',boxShadow:'0 4px 14px rgba(180,83,9,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',letterSpacing:'0.2px' }}
                  >
                    I understand, continue <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form ──────────────────────────────────── */
              <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:'16px' }}>

                {error && (
                  <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'11px 14px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'12px' }}>
                    <Info size={14} color="#dc2626" />
                    <p style={{ margin:0,color:'#dc2626',fontSize:'13px',fontWeight:500 }}>{error}</p>
                  </div>
                )}

                {/* Date + Time slot */}
                <div style={{ background:'white',borderRadius:'16px',padding:'18px',border:'1px solid rgba(107,124,71,0.12)',boxShadow:'0 2px 8px rgba(107,124,71,0.05)' }}>
                  <p style={{ margin:'0 0 14px',fontSize:'11px',fontWeight:700,color:'#6b7c47',textTransform:'uppercase',letterSpacing:'0.5px',display:'flex',alignItems:'center',gap:'6px' }}>
                    <Calendar size={13} /> Scheduling
                  </p>

                  {/* Date */}
                  <div style={{ marginBottom:'14px' }}>
                    <label style={{ display:'block',fontSize:'12px',fontWeight:700,color:'#4a5a2e',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.5px' }}>Preferred Date *</label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={e => set('scheduledDate', e.target.value)}
                      onFocus={() => setFocused('date')}
                      onBlur={() => setFocused(null)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      style={inputStyle('date')}
                    />
                  </div>

                  {/* Time slots grid */}
                  <div>
                    <label style={{ display:'block',fontSize:'12px',fontWeight:700,color:'#4a5a2e',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px' }}>
                      Preferred Time * {formData.scheduledTime && <span style={{ fontWeight:500,color:'#6b7c47' }}>— {formData.scheduledTime}</span>}
                    </label>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px' }}>
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => set('scheduledTime', slot)}
                          style={{
                            padding:'8px 4px',
                            borderRadius:'10px',
                            border:`1.5px solid ${formData.scheduledTime === slot ? '#6b7c47' : 'rgba(107,124,71,0.2)'}`,
                            background: formData.scheduledTime === slot ? 'linear-gradient(135deg,#6b7c47,#4a5a2e)' : 'white',
                            color: formData.scheduledTime === slot ? 'white' : '#4a5a2e',
                            fontSize:'11px',
                            fontWeight:700,
                            cursor:'pointer',
                            transition:'all 0.15s',
                            textAlign:'center',
                          }}
                        >{slot}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Event details card */}
                <div style={{ background:'white',borderRadius:'16px',padding:'18px',border:'1px solid rgba(107,124,71,0.12)',boxShadow:'0 2px 8px rgba(107,124,71,0.05)' }}>
                  <p style={{ margin:'0 0 14px',fontSize:'11px',fontWeight:700,color:'#6b7c47',textTransform:'uppercase',letterSpacing:'0.5px',display:'flex',alignItems:'center',gap:'6px' }}>
                    <Star size={13} /> Event Details
                  </p>

                  {/* Event type */}
                  <div style={{ marginBottom:'12px' }}>
                    <label style={{ display:'block',fontSize:'12px',fontWeight:700,color:'#4a5a2e',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.5px' }}>Event Type *</label>
                    <select
                      value={formData.eventType}
                      onChange={e => set('eventType', e.target.value)}
                      onFocus={() => setFocused('evType')}
                      onBlur={() => setFocused(null)}
                      required
                      style={inputStyle('evType')}
                    >
                      <option value="">Select event type</option>
                      {EVENT_TYPES.map(et => <option key={et} value={et.toLowerCase().replace(/ /g,'-')}>{et}</option>)}
                    </select>
                  </div>

                  {/* Guests + Phone */}
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                    <div>
                      <label style={{ display:'block',fontSize:'12px',fontWeight:700,color:'#4a5a2e',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.5px' }}>
                        <span style={{ display:'flex',alignItems:'center',gap:'4px' }}><Users size={11} /> Expected Guests</span>
                      </label>
                      <input
                        type="number"
                        value={formData.attendees}
                        onChange={e => set('attendees', e.target.value)}
                        onFocus={() => setFocused('guests')}
                        onBlur={() => setFocused(null)}
                        placeholder="e.g. 200"
                        min="1"
                        style={inputStyle('guests')}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block',fontSize:'12px',fontWeight:700,color:'#4a5a2e',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.5px' }}>
                        <span style={{ display:'flex',alignItems:'center',gap:'4px' }}><Phone size={11} /> Phone *</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => set('phone', e.target.value)}
                        onFocus={() => setFocused('phone')}
                        onBlur={() => setFocused(null)}
                        placeholder="+91 98765 43210"
                        required
                        style={inputStyle('phone')}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ background:'white',borderRadius:'16px',padding:'18px',border:'1px solid rgba(107,124,71,0.12)',boxShadow:'0 2px 8px rgba(107,124,71,0.05)' }}>
                  <label style={{ display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:700,color:'#4a5a2e',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.5px' }}>
                    <StickyNote size={13} color="#6b7c47" /> Additional Notes <span style={{ fontWeight:400,color:'#a8b48a',textTransform:'none',letterSpacing:0,fontSize:'11px' }}>(optional)</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e => set('notes', e.target.value)}
                    onFocus={() => setFocused('notes')}
                    onBlur={() => setFocused(null)}
                    placeholder="Any specific requirements, questions, or requests for the vendor..."
                    rows={3}
                    style={{ ...inputStyle('notes'), resize: 'none', lineHeight: 1.6 }}
                  />
                </div>

                {/* Submit — inside form but separate sticky footer handles it visually */}
                <button
                  type="submit"
                  disabled={loading || !formData.scheduledDate || !formData.scheduledTime || !formData.eventType || !formData.phone}
                  style={{
                    width:'100%', padding:'16px', borderRadius:'14px', border:'none',
                    background: (!loading && formData.scheduledDate && formData.scheduledTime && formData.eventType && formData.phone)
                      ? 'linear-gradient(135deg,#6b7c47,#4a5a2e)'
                      : 'rgba(107,124,71,0.3)',
                    color:'white', fontWeight:800, fontSize:'15px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                    boxShadow: (!loading && formData.scheduledDate && formData.scheduledTime && formData.eventType && formData.phone)
                      ? '0 6px 20px rgba(107,124,71,0.4)' : 'none',
                    transition:'all 0.2s',
                    letterSpacing:'0.2px',
                  }}
                >
                  {loading ? (
                    <><div style={{ width:'18px',height:'18px',border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'white',borderRadius:'50%',animation:'spinA 0.8s linear infinite' }} /> Booking...</>
                  ) : !session ? (
                    'Login to Book'
                  ) : (
                    <><Calendar size={17} /> {isAppointment ? 'Confirm Appointment' : 'Schedule Visit'}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
