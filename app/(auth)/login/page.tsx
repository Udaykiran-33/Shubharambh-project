'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Star, Users, Award, Sparkles, ChevronRight } from 'lucide-react';

/* ── tiny inline keyframes ─────────────────────────────────────────────── */
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
`;

const stats = [
  { icon: Users,  value: '50K+', label: 'Happy Couples' },
  { icon: Award,  value: '500+', label: 'Verified Venues' },
  { icon: Star,   value: '4.9',  label: 'Average Rating' },
];

const testimonial = {
  quote: '"Shubharambh made our wedding flawless. The best platform for event planning!"',
  author: 'Priya & Rahul',
  location: 'Hyderabad',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [focused, setFocused]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });
    if (result?.error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '14px',
    border: `2px solid ${focused === field ? '#6b7c47' : 'rgba(107,124,71,0.2)'}`,
    background: focused === field ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
    color: '#2d3222',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
    boxShadow: focused === field ? '0 0 0 4px rgba(107,124,71,0.12), 0 4px 20px rgba(107,124,71,0.08)' : 'none',
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

        {/* ── Decorative background blobs ────────────────────────────── */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,124,71,0.12) 0%, transparent 70%)',
          animation: 'floatA 8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,124,71,0.1) 0%, transparent 70%)',
          animation: 'floatB 10s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* ═══════════════ LEFT PANEL – Form ════════════════════════════ */}
        <div style={{
          width: '100%',
          maxWidth: '520px',
          margin: 'auto',
          padding: '32px 24px',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }} className="auth-left-panel">
          
          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 32px 80px rgba(107,124,71,0.12), 0 8px 32px rgba(0,0,0,0.06)',
            padding: '48px 44px',
            animation: 'fadeUp 0.6s ease-out both',
          }}>
            

            {/* Heading */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '100px',
                background: 'rgba(107,124,71,0.08)',
                border: '1px solid rgba(107,124,71,0.15)',
                marginBottom: '12px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7c47', animation: 'pulseSlow 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7c47', letterSpacing: '0.5px' }}>Welcome back</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1a2010', margin: 0, lineHeight: 1.15, letterSpacing: '-0.8px' }}>
                Sign in to your account
              </h1>
              <p style={{ marginTop: '8px', fontSize: '15px', color: '#6b7560', lineHeight: 1.6 }}>
                Continue planning your perfect event
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', gap: '10px',
                animation: 'fadeUp 0.3s ease-out both',
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '11px', fontWeight: 800 }}>!</span>
                </div>
                <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a5a2e', marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    required
                    style={inputStyle('email')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#4a5a2e', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? '#6b7c47' : '#a8b48a', transition: 'color 0.3s' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    required
                    style={{ ...inputStyle('password'), paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: '#a8b48a', borderRadius: '6px', display: 'flex', transition: 'color 0.2s',
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '16px',
                  borderRadius: '14px',
                  border: 'none',
                  background: loading
                    ? 'rgba(107,124,71,0.5)'
                    : 'linear-gradient(135deg, #6b7c47 0%, #4a5a2e 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(107,124,71,0.4)',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.3px',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(107,124,71,0.15)' }} />
              <span style={{ fontSize: '12px', color: '#a8b48a', fontWeight: 500 }}>New here?</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(107,124,71,0.15)' }} />
            </div>

            {/* Sign up link */}
            <Link href="/signup" style={{ textDecoration: 'none', display: 'block', marginTop: '16px' }}>
              <div style={{
                width: '100%', padding: '13px', borderRadius: '14px',
                border: '2px solid rgba(107,124,71,0.25)',
                background: 'rgba(107,124,71,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                color: '#4a5a2e', fontSize: '14px', fontWeight: 700,
                transition: 'all 0.3s ease', cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(107,124,71,0.1)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,124,71,0.5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(107,124,71,0.04)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,124,71,0.25)';
              }}
              >
                Create a new account
                <ChevronRight size={15} />
              </div>
            </Link>
          </div>

          {/* Small footer note */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#a8b48a' }}>
            Protected by industry-standard encryption
          </p>
        </div>

        {/* ═══════════════ RIGHT PANEL – Brand / Social Proof ════════════ */}
        <div style={{
          flex: 1,
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #4a5a2e 0%, #2d3a1c 40%, #1a2010 100%)',
        }} className="auth-right-panel">

          {/* Mesh background */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Orbs */}
          <div style={{
            position: 'absolute', top: '10%', right: '-80px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,180,138,0.3) 0%, transparent 70%)',
            animation: 'floatA 9s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '15%', left: '-60px',
            width: '250px', height: '250px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,180,138,0.2) 0%, transparent 70%)',
            animation: 'floatB 11s ease-in-out infinite',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 2,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            height: '100%', padding: '60px 56px',
          }}>

            {/* Headline */}
            <div style={{ marginBottom: '56px', animation: 'fadeUp 0.7s ease-out 0.1s both' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '100px',
                background: 'rgba(168,180,138,0.15)', border: '1px solid rgba(168,180,138,0.3)',
                marginBottom: '20px',
              }}>
                <Sparkles size={13} color="#a8b48a" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#a8b48a', letterSpacing: '0.5px' }}>India's #1 Event Platform</span>
              </div>
              <h2 style={{
                fontSize: '44px', fontWeight: 900, color: 'white',
                lineHeight: 1.1, margin: 0, letterSpacing: '-1px',
              }}>
                Plan Your<br />
                <span style={{
                  background: 'linear-gradient(90deg, #c8d4a0, #a8b48a, #c8d4a0)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s linear infinite',
                }}>
                  Dream Event
                </span>
              </h2>
              <p style={{ marginTop: '16px', fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Trusted by thousands of couples across India for their most important celebrations.
              </p>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
              marginBottom: '48px', animation: 'fadeUp 0.7s ease-out 0.2s both',
            }}>
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div key={i} style={{
                  padding: '20px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <Icon size={20} color="#a8b48a" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>{value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: '2px', letterSpacing: '0.3px' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial card */}
            <div style={{
              padding: '28px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              animation: 'fadeUp 0.7s ease-out 0.3s both',
            }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '15px', lineHeight: 1.65, fontStyle: 'italic' }}>
                {testimonial.quote}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a8b48a, #6b7c47)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: 'white',
                }}>P</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{testimonial.author}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{testimonial.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Responsive styles ───────────────────────────────────────── */}
        <style>{`
          @media (min-width: 1024px) {
            .auth-left-panel {
              width: 50% !important;
              max-width: none !important;
              padding: 48px 56px !important;
            }
            .auth-right-panel {
              display: flex !important;
            }
          }
          @media (max-width: 480px) {
            .auth-left-panel > div:first-of-type {
              padding: 32px 24px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f7f4ee, #eee8d8)' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(107,124,71,0.2)', borderTopColor: '#6b7c47', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
