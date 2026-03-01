'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile, updateUserProfile } from '@/app/actions/profile';
import { User, Mail, Phone, Calendar, Edit2, Save, X, ArrowLeft, Settings, LogOut, Check, MapPin, Heart } from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  const loadProfile = async () => {
    const data = await getUserProfile();
    if (data) {
      setProfile(data);
      setFormData({ name: data.name || '', phone: data.phone || '' });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    const result = await updateUserProfile(data);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || 'Profile updated!' });
      setEditing(false);
      loadProfile();
    }
    setSaving(false);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading || status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream-50)' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid var(--cream-200)', borderTopColor: 'var(--olive-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream-50)' }}>
      {/* Clean Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--olive-700), var(--olive-800))', paddingTop: '80px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: '24px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'white' }}>My Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '900px', margin: '-40px auto 0', padding: '0 16px 60px', position: 'relative', zIndex: 10 }}>
        {/* Message */}
        {message.text && (
          <div style={{ padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${message.type === 'error' ? '#fee2e2' : '#dcfce7'}` }}>
            <Check size={18} /> {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Profile Header */}
          <div className="profile-header-inner" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--cream-200)', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '16px', flexShrink: 0, background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', boxShadow: '0 8px 20px rgba(107, 142, 35, 0.3)' }}>
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: 'var(--olive-800)', marginBottom: '4px', wordBreak: 'break-word' }}>{profile?.name || 'User'}</h2>
              <p style={{ color: 'var(--olive-500)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '14px' }}>
                <Mail size={14} /> {profile?.email}
              </p>
            </div>
            <div className="profile-edit-btn-wrap" style={{ flexShrink: 0 }}>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'var(--olive-100)', color: 'var(--olive-700)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}>
                  <Edit2 size={16} /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div style={{ padding: '24px' }}>
            <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--olive-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Full Name</label>
                {editing ? (
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid var(--cream-300)', fontSize: '15px', color: 'var(--olive-800)', outline: 'none' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--cream-50)' }}>
                    <User size={18} style={{ color: 'var(--olive-500)' }} />
                    <span style={{ color: 'var(--olive-800)', fontWeight: 500 }}>{profile?.name}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--olive-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Phone Number</label>
                {editing ? (
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid var(--cream-300)', fontSize: '15px', color: 'var(--olive-800)', outline: 'none' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--cream-50)' }}>
                    <Phone size={18} style={{ color: 'var(--olive-500)' }} />
                    <span style={{ color: profile?.phone ? 'var(--olive-800)' : 'var(--olive-400)', fontWeight: 500 }}>{profile?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--olive-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Email Address</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--cream-50)' }}>
                  <Mail size={18} style={{ color: 'var(--olive-500)' }} />
                  <span style={{ color: 'var(--olive-800)', fontWeight: 500 }}>{profile?.email}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'var(--olive-100)', color: 'var(--olive-600)', fontWeight: 600 }}>Verified</span>
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--olive-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Member Since</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--cream-50)' }}>
                  <Calendar size={18} style={{ color: 'var(--olive-500)' }} />
                  <span style={{ color: 'var(--olive-800)', fontWeight: 500 }}>{profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {editing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setEditing(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', background: 'var(--cream-100)', color: 'var(--olive-700)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  <X size={18} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '20px 24px', background: 'var(--cream-50)', borderTop: '1px solid var(--cream-200)' }}>
            <div className="profile-quick-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'white', color: 'var(--olive-700)', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--cream-200)', fontSize: '14px' }}>
                <Settings size={15} /> Dashboard
              </Link>
              <Link href="/venues" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'white', color: 'var(--olive-700)', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--cream-200)', fontSize: '14px' }}>
                <MapPin size={15} /> Browse Venues
              </Link>
              <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', fontWeight: 600, border: '1px solid #fee2e2', cursor: 'pointer', marginLeft: 'auto', fontSize: '14px' }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div style={{ marginTop: '24px', padding: '20px 24px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontWeight: 600, color: 'var(--olive-800)' }}>Account Status</span>
          </div>
          <span style={{ padding: '8px 16px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>Active</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
