'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerUser } from '@/app/actions/auth';
import { User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff, Store, Sparkles,
         Star, Heart, Calendar, Users, ChevronRight, CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

/* ── keyframes ─────────────────────────────────────────────────────────── */
const kf = `
@keyframes floatA {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-20px) rotate(5deg); }
}
@keyframes floatB {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-14px) rotate(-3deg); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes pulseSlow {
  0%,100% { opacity: 0.4; }
  50%      { opacity: 0.8; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes progressFill {
  from { width: 0; }
}
`;

const perks = [
  { icon: Calendar,      text: 'Plan weddings, parties & more in minutes' },
  { icon: Users,         text: 'Access 500+ verified vendors across India' },
  { icon: Star,          text: 'Personalised recommendations just for you' },
  { icon: Heart,         text: 'Dedicated support throughout your journey' },
];

function SignupForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const role         = (searchParams.get('role') as 'user' | 'vendor') || 'user';
  const isVendor     = role === 'vendor';

  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused]                     = useState<string | null>(null);
  const [formData, setFormData]                   = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  /* Password strength */
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { pct: 0, label: '', color: '' };
    let s = 0;
    if (pw.length >= 6)  s++;
    if (pw.length >= 10) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw))   s++;
    if (/[^a-zA-Z\d]/.test(pw)) s++;
    if (s <= 2) return { pct: 33,  label: 'Weak',   color: '#ef4444' };
    if (s <= 3) return { pct: 66,  label: 'Medium', color: '#f59e0b' };
    return                { pct: 100, label: 'Strong', color: '#10b981' };
  };
  const pwStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);

    const data = new FormData();
    data.append('name',     formData.name);
    data.append('email',    formData.email);
    data.append('phone',    formData.phone);
    data.append('password', formData.password);
    data.append('role',     role);

    const result = await registerUser(data);
    if (result.error) { setError(result.error); setLoading(false); return; }

    const signInResult = await signIn('credentials', {
      email: formData.email, password: formData.password, redirect: false,
    });
    router.push(signInResult?.error ? '/login?registered=true' : '/');
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px 13px 44px',
    borderRadius: '13px',
    border: `2px solid ${focused === field ? '#6b7c47' : 'rgba(107,124,71,0.2)'}`,
    background: focused === field ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
    color: '#2d3222',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
    boxShadow: focused === field ? '0 0 0 4px rgba(107,124,71,0.12)' : 'none',
  });

  return (
    <>
      <style>{kf}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        paddingTop: '80px',
        background: 'linear-gradient(135deg, #f7f4ee 0%, #eee8d8 50%, #e8dfc8 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,124,71,0.1) 0%, transparent 70%)', animation: 'floatA 9s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,124,71,0.08) 0%, transparent 70%)', animation: 'floatB 12s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* ═══════════ RIGHT panel – brand / perks (hidden on mobile) ═══ */}
        <div style={{
          display: 'none',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #4a5a2e 0%, #2d3a1c 40%, #1a2010 100%)',
        }} className="signup-left-panel">

          {/* Mesh */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="g2" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#g2)" />
            </svg>
          </div>

          {/* Orbs */}
          <div style={{ position: 'absolute', top: '8%', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,180,138,0.25) 0%, transparent 70%)', animation: 'floatA 10s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '12%', right: '-50px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,180,138,0.2) 0%, transparent 70%)', animation: 'floatB 8s ease-in-out infinite' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '60px 56px' }}>
            <div style={{ marginBottom: '52px', animation: 'fadeUp 0.7s ease-out 0.1s both' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(168,180,138,0.15)', border: '1px solid rgba(168,180,138,0.3)', marginBottom: '20px' }}>
                <Sparkles size={13} color="#a8b48a" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#a8b48a', letterSpacing: '0.5px' }}>Start for free</span>
              </div>
              <h2 style={{ fontSize: '44px', fontWeight: 900, color: 'white', lineHeight: 1.1, margin: 0, letterSpacing: '-1px' }}>
                Your Perfect<br />
                <span style={{
                  background: 'linear-gradient(90deg, #c8d4a0, #a8b48a, #c8d4a0)',
                  backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s linear infinite',
                }}>Event Awaits</span>
              </h2>
              <p style={{ marginTop: '16px', fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Join thousands of families who trusted Shubharambh for their most cherished moments.
              </p>
            </div>

            {/* Perks list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeUp 0.7s ease-out 0.2s both' }}>
              {perks.map(({ icon: Icon, text }, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 20px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168,180,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color="#a8b48a" />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '12px', animation: 'fadeUp 0.7s ease-out 0.3s both' }}>
              <div style={{ display: 'flex' }}>
                {['A','B','C','D'].map((l, i) => (
                  <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${80 + i*15},30%,${40+i*5}%)`, border: '2px solid rgba(255,255,255,0.2)', marginLeft: i === 0 ? 0 : '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white' }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Trusted by 50,000+ customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ LEFT panel – Form ════════════════════════════════ */}
        <div style={{
          width: '100%',
          maxWidth: '560px',
          margin: 'auto',
          padding: '28px 20px',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }} className="signup-right-panel">

          <div style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 32px 80px rgba(107,124,71,0.12), 0 8px 32px rgba(0,0,0,0.06)',
            padding: '44px 40px',
            animation: 'fadeUp 0.6s ease-out both',
          }}>
            {/* Logo */}
            

            {/* Heading */}
            <div style={{ marginBottom: '28px' }}>
              {isVendor && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '12px' }}>
                  <Store size={13} color="#059669" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Vendor Registration</span>
                </div>
              )}
              {!isVendor && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', background: 'rgba(107,124,71,0.08)', border: '1px solid rgba(107,124,71,0.15)', marginBottom: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7c47', animation: 'pulseSlow 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#6b7c47', letterSpacing: '0.5px' }}>User Account</span>
                </div>
              )}
              <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#1a2010', margin: 0, lineHeight: 1.15, letterSpacing: '-0.6px' }}>
                {isVendor ? 'List your services' : 'Create your account'}
              </h1>
              <p style={{ marginTop: '6px', fontSize: '14px', color: '#6b7560', lineHeight: 1.6 }}>
                {isVendor ? 'Reach thousands of couples planning their events' : 'Join thousands planning their perfect events'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '11px 14px', borderRadius: '12px', marginBottom: '18px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeUp 0.3s ease-out both' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '10px', fontWeight: 800 }}>!</span>
                </div>
                <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Row: Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focused === 'name' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} placeholder="John Doe" required style={inputStyle('name')} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focused === 'phone' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                    <input
                      type="tel" value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      onInput={e => { const el = e.currentTarget; el.value = el.value.replace(/[^0-9+\- ]/g, ''); }}
                      onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                      placeholder="+91 98765 43210" pattern="[0-9+\- ]*" inputMode="numeric"
                      style={inputStyle('phone')}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} placeholder="you@example.com" required style={inputStyle('email')} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} placeholder="Min 6 characters" required style={{ ...inputStyle('password'), paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8b48a', display: 'flex', padding: '4px' }} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {formData.password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7560', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Strength</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: pwStrength.color }}>{pwStrength.label}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '100px', background: 'rgba(107,124,71,0.12)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pwStrength.pct}%`, background: pwStrength.color, borderRadius: '100px', transition: 'all 0.4s ease', animation: 'progressFill 0.4s ease-out' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5a2e', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focused === 'confirm' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                  <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)} placeholder="Re-enter password" required style={{ ...inputStyle('confirm'), paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8b48a', display: 'flex', padding: '4px' }} aria-label="Toggle confirm password visibility">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {/* Match check */}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle size={15} color="#10b981" style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', marginTop: '6px', padding: '15px', borderRadius: '14px', border: 'none',
                  background: loading ? 'rgba(107,124,71,0.5)' : 'linear-gradient(135deg, #6b7c47 0%, #4a5a2e 100%)',
                  color: 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(107,124,71,0.38)',
                  transition: 'all 0.3s ease', letterSpacing: '0.3px',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '17px', height: '17px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Creating account…
                  </>
                ) : (
                  <>
                    {isVendor ? 'Register as Vendor' : 'Create Free Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider + sign in link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(107,124,71,0.15)' }} />
              <span style={{ fontSize: '12px', color: '#a8b48a', fontWeight: 500 }}>Already a member?</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(107,124,71,0.15)' }} />
            </div>

            <Link href="/login" style={{ textDecoration: 'none', display: 'block', marginTop: '14px' }}>
              <div style={{ width: '100%', padding: '12px', borderRadius: '13px', border: '2px solid rgba(107,124,71,0.25)', background: 'rgba(107,124,71,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4a5a2e', fontSize: '13px', fontWeight: 700, transition: 'all 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(107,124,71,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,124,71,0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(107,124,71,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,124,71,0.25)'; }}
              >
                Sign in instead <ChevronRight size={14} />
              </div>
            </Link>

            {/* Terms */}
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#b0b89a', marginTop: '16px', lineHeight: 1.6 }}>
              By creating an account, you agree to our{' '}
              <span style={{ color: '#6b7c47', fontWeight: 600 }}>Terms of Service</span> and{' '}
              <span style={{ color: '#6b7c47', fontWeight: 600 }}>Privacy Policy</span>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#a8b48a' }}>
            Protected by industry-standard encryption
          </p>
        </div>

        {/* Responsive */}
        <style>{`
          @media (min-width: 1024px) {
            .signup-left-panel  { display: flex !important; }
            .signup-right-panel { width: 50% !important; max-width: none !important; padding: 40px 52px !important; }
          }
          @media (max-width: 520px) {
            .signup-right-panel > div:first-of-type { padding: 28px 20px !important; }
            .signup-right-panel > div:first-of-type > form > div:first-of-type { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f7f4ee, #eee8d8)' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(107,124,71,0.2)', borderTopColor: '#6b7c47', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
