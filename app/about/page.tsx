'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Heart, Building2, MapPin, Star,
  Users, Award, Zap, Shield, CheckCircle,
  TrendingUp, Quote
} from 'lucide-react';

/* ─── data ──────────────────────────────── */
const team = [
  { name: 'Somesh',     role: 'Founder & CEO',  img: 'https://res.cloudinary.com/dmyww4jcv/image/upload/v1770618934/Gemini_Generated_Image_154sqv154sqv154s_fjdyyo.png' },
  { name: 'Raghav',     role: 'UI/UX Designer', img: 'https://res.cloudinary.com/dmyww4jcv/image/upload/v1770618523/Gemini_Generated_Image_pdd5k3pdd5k3pdd5_aow26z.png' },
  { name: 'Harsh',      role: 'Marketing Lead', img: 'https://res.cloudinary.com/dmyww4jcv/image/upload/v1770618965/Gemini_Generated_Image_bt0kkmbt0kkmbt0k_ebsh20.png' },
  { name: 'Uday Kiran', role: 'Tech Lead',       img: 'https://res.cloudinary.com/dmyww4jcv/image/upload/v1771581900/Gemini_Generated_Image_lzcze1lzcze1lzcz_nfu0h8.jpg' },
];

const testimonials = [
  { name: 'Priya & Rahul',   event: 'Wedding', text: 'Found our dream banquet hall and photographer in one afternoon. Zero stress from start to finish.' },
  { name: 'Ananya Sharma',   event: 'Birthday', text: 'The venue suggestions were perfect for our budget. Booking took just 10 minutes — I was impressed!' },
  { name: 'Vikram & Deepa',  event: 'Anniversary', text: 'Every vendor was professional and exactly as described. Pure celebration, no coordination chaos.' },
  { name: 'Ritu Agarwal',    event: 'Engagement', text: 'The team went above and beyond — even helped coordinate between the caterer and decorator.' },
];

const values = [
  { icon: Heart,      color: '#cd37cfac', bg: '#fef2f2', title: 'Customer First',       desc: 'Your joy is our north star. Every feature exists to make your event planning happier.' },
  { icon: Shield,     color: '#99f63bff', bg: '#eff6ff', title: 'Trust & Transparency', desc: 'Verified vendors, real reviews, no hidden fees. We earn your trust every day.' },
  { icon: Zap,        color: '#f59e0b', bg: '#fffbeb', title: 'Innovation',            desc: 'Constantly building smarter tools so planning feels like a breeze, not a burden.' },
  { icon: TrendingUp, color: '#10b981', bg: '#f0fdf4', title: 'Growth Together',      desc: 'We grow alongside every couple and vendor, celebrating every milestone with you.' },
];

const PHOTOS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&fit=crop&q=90',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&fit=crop&q=90',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&fit=crop&q=90',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&fit=crop&q=90',
];

/* ─── animations ────────────────────────── */
const KF = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeLeft { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.92)}     to{opacity:1;transform:scale(1)} }
@keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes marq     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
@keyframes spin     { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(107,124,71,0)} 50%{box-shadow:0 0 32px 8px rgba(107,124,71,0.18)} }
`;

/* ─── scroll reveal ─────────────────────── */
function useIn(t = 0.15) {
  const r = useRef<HTMLDivElement>(null);
  const [v, sv] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) sv(true); }, { threshold: t });
    if (r.current) o.observe(r.current);
    return () => o.disconnect();
  }, []);
  return { r, v };
}

function FU({ children, delay = 0, anim = 'fadeUp' }: { children: React.ReactNode; delay?: number; anim?: string }) {
  const { r, v } = useIn();
  return (
    <div ref={r} style={{ animation: v ? `${anim} 0.65s cubic-bezier(.22,.68,0,1.2) ${delay}ms both` : 'none', opacity: v ? undefined : 0 }}>
      {children}
    </div>
  );
}

/* ─── inline button helper ──────────────── */
function Btn({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  const [h, sh] = useState(false);
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '13px 26px', borderRadius: '12px', textDecoration: 'none',
    fontWeight: 700, fontSize: '14px', transition: 'all 0.2s',
    transform: h ? 'translateY(-2px)' : 'translateY(0)',
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'linear-gradient(135deg,#3d4e28,#6b7c47)', color: 'white', boxShadow: h ? '0 12px 28px rgba(45,58,28,0.35)' : '0 4px 14px rgba(45,58,28,0.25)' },
    ghost:   { border: '1.5px solid rgba(107,124,71,0.35)', color: '#2d3a1c', background: h ? 'rgba(107,124,71,0.07)' : 'transparent' },
  };
  return (
    <Link href={href} style={{ ...base, ...styles[variant] }} onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}>
      {children}
    </Link>
  );
}

/* ══════════════════════════════════════════ */
export default function AboutPage() {
  const [hTeam, sHTeam] = useState<number | null>(null);
  const [hVal,  sHVal]  = useState<number | null>(null);
  const [tick,  sTick]  = useState(0);

  /* number ticker for stats */
  useEffect(() => {
    const id = setInterval(() => sTick(n => n + 1), 60);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{KF}</style>

      <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", background: '#faf9f5', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ══════════════════════════════════════
            HERO — elegant centered, cream bg
        ══════════════════════════════════════ */}
        <section style={{ paddingTop: '80px', background: 'linear-gradient(170deg,#f0ede3 0%,#e8e2d4 60%,#d9d2be 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

          {/* decorative rings */}
          <div style={{ position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', border: '1px solid rgba(107,124,71,0.1)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'spin 40s linear infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(107,124,71,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'spin 25s linear infinite reverse', pointerEvents: 'none' }} />

          {/* olive orb */}
          <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(107,124,71,0.12) 0%,transparent 70%)', top: '10%', right: '-80px', pointerEvents: 'none', animation: 'floatY 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,184,122,0.15) 0%,transparent 70%)', bottom: '10%', left: '-60px', pointerEvents: 'none', animation: 'floatY 10s ease-in-out infinite 2s' }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', padding: '60px 32px', textAlign: 'center' }}>

            {/* pill label */}
            <FU>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px 6px 8px', borderRadius: '100px', background: 'rgba(107,124,71,0.1)', border: '1px solid rgba(107,124,71,0.2)', marginBottom: '32px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#3d4e28,#6b7c47)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={13} color="white" fill="white" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3d4e28', letterSpacing: '0.3px' }}>India&rsquo;s #1 Event Planning Platform</span>
              </div>
            </FU>

            {/* headline */}
            <FU delay={80}>
              <h1 style={{ fontSize: 'clamp(42px,7.5vw,88px)', fontWeight: 900, color: '#1a2010', margin: '0 0 24px', lineHeight: 1.0, letterSpacing: '-3px' }}>
                We make your{' '}
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ background: 'linear-gradient(135deg,#3d4e28 0%,#6b7c47 50%,#8a9d5a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    celebrations
                  </span>
                  {/* underline swoosh */}
                  <svg viewBox="0 0 340 18" style={{ position: 'absolute', bottom: '-6px', left: 0, width: '100%', height: 'auto' }} fill="none">
                    <path d="M4 14 C80 4, 260 4, 336 14" stroke="#6b7c47" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
                  </svg>
                </span>
                {' '}unforgettable.
              </h1>
            </FU>

            <FU delay={160}>
              <p style={{ fontSize: '18px', color: '#5a6a40', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 40px' }}>
                Shubharambh connects couples with the finest venues &amp; vendors across India, making event planning joyful, transparent, and completely stress-free.
              </p>
            </FU>

            <FU delay={240}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Btn href="/venues">Browse Venues <ArrowRight size={16} /></Btn>
                <Btn href="/categories" variant="ghost">Find Vendors</Btn>
              </div>
            </FU>

            {/* trust strip */}
            <FU delay={320}>
              <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {[{ n: '10K+', l: 'Happy Couples' }, { n: '500+', l: 'Venues' }, { n: '50+', l: 'Cities' }, { n: '99%', l: 'Satisfaction' }].map(({ n, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1a2010', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: '12px', color: '#8a9a6a', fontWeight: 600, marginTop: '3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            </FU>
          </div>

          {/* photo strips */}
          <FU delay={400} anim="scaleIn">
            <div style={{ display: 'flex', gap: '12px', padding: '0 32px 64px', maxWidth: '900px', margin: '0 auto', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
              {PHOTOS.map((src, i) => (
                <div key={i} style={{ width: '180px', height: i % 2 === 0 ? '220px' : '260px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', marginTop: i % 2 === 0 ? '20px' : 0 }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', display: 'block' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
              ))}
            </div>
          </FU>
        </section>

        {/* ══════════════════════════════════════
            BENTO STATS GRID
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 32px', background: '#1a2010' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <FU>
              <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'rgba(200,184,122,0.7)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '48px' }}>
                Shubharambh by the Numbers
              </p>
            </FU>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '24px', overflow: 'hidden' }}>
              {[
                { val: '10,000+', lbl: 'Happy Couples',    icon: Heart,     col: '#e85d5d' },
                { val: '500+',    lbl: 'Verified Venues',  icon: Building2, col: '#6b7c47' },
                { val: '50+',     lbl: 'Cities Covered',   icon: MapPin,    col: '#f59e0b' },
                { val: '99%',     lbl: 'Satisfaction Rate',icon: Star,      col: '#8b5cf6' },
                { val: '24/7',    lbl: 'Customer Support', icon: Users,     col: '#3b82f6' },
              ].map(({ val, lbl, icon: Icon, col }, i) => (
                <FU key={lbl} delay={i * 50}>
                  <div style={{ padding: '36px 28px', background: '#1a2010', textAlign: 'center', transition: 'background 0.3s', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#242e18')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1a2010')}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${col}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Icon size={20} color={col} />
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '6px', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(200,184,122,0.6)', letterSpacing: '0.3px' }}>{lbl}</div>
                  </div>
                </FU>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            OUR STORY — magazine layout
        ══════════════════════════════════════ */}
        <section style={{ padding: '100px 32px', background: '#faf9f5' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '72px', alignItems: 'center' }}>

            {/* images — creative overlap layout */}
            <FU anim="fadeLeft">
              <div style={{ position: 'relative', height: '520px' }}>
                {/* main big image */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '78%', height: '75%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
                  <img src={PHOTOS[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(26,32,16,0.1) 0%,transparent 60%)' }} />
                </div>
                {/* second image — offset */}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '58%', height: '56%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: '4px solid #faf9f5' }}>
                  <img src={PHOTOS[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* floating stat card */}
                <div style={{ position: 'absolute', top: '48%', left: '56%', background: 'white', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(107,124,71,0.1)', zIndex: 3, animation: 'glow 4s ease-in-out infinite' }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#1a2010', lineHeight: 1 }}>2020</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7c47', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Founded</div>
                </div>
              </div>
            </FU>

            {/* text */}
            <div>
              <FU>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '100px', background: 'rgba(107,124,71,0.08)', border: '1px solid rgba(107,124,71,0.18)', marginBottom: '20px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7c47' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7c47', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Story</span>
                </div>
              </FU>
              <FU delay={60}>
                <h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#1a2010', margin: '0 0 20px', letterSpacing: '-1px', lineHeight: 1.12 }}>
                  Born from a real<br />
                  <em style={{ fontStyle: 'normal', color: '#6b7c47' }}>wedding frustration</em>
                </h2>
              </FU>
              <FU delay={120}>
                <p style={{ fontSize: '15px', color: '#5a6a50', lineHeight: 1.85, margin: '0 0 16px' }}>
                  Founded in 2020, Shubharambh emerged from a personal challenge our founders faced while planning their own weddings — a fragmented market, opaque pricing, and endless coordination that turned joy into stress.
                </p>
              </FU>
              <FU delay={160}>
                <p style={{ fontSize: '15px', color: '#5a6a50', lineHeight: 1.85, margin: '0 0 28px' }}>
                  We set out to build a single destination where couples could discover, compare, and book the finest venues and vendors — with genuine reviews, transparent pricing, and zero chaos.
                </p>
              </FU>
              <FU delay={200}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                  {['Curated, verified venues & vendors', 'Transparent pricing — no surprises', 'Real reviews from real couples', 'End-to-end booking support'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#2d3a1c', fontWeight: 500 }}>
                      <CheckCircle size={16} color="#6b7c47" strokeWidth={2.5} />{f}
                    </div>
                  ))}
                </div>
              </FU>
              <FU delay={240}>
                <Btn href="/venues">Explore Venues <ArrowRight size={16} /></Btn>
              </FU>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            VALUES — editorial split layout
        ══════════════════════════════════════ */}
        <section style={{ padding: '100px 32px', background: '#faf9f5', overflow: 'hidden' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '80px', alignItems: 'start' }}>

            {/* Left — sticky label column */}
            <FU>
              <div style={{ position: 'sticky', top: '120px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '100px', background: 'rgba(107,124,71,0.08)', border: '1px solid rgba(107,124,71,0.2)', marginBottom: '20px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7c47' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7c47', letterSpacing: '1px', textTransform: 'uppercase' }}>What drives us</span>
                </div>
                <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: '#1a2010', margin: '0 0 20px', letterSpacing: '-1.5px', lineHeight: 1.08 }}>
                  Built on<br />
                  <em style={{ fontStyle: 'normal', color: '#6b7c47' }}>principles</em><br />
                  that matter.
                </h2>
                <p style={{ fontSize: '15px', color: '#7a8a62', lineHeight: 1.8, maxWidth: '300px', margin: 0 }}>
                  Four commitments that shape everything we build, every vendor we onboard, and every couple we serve.
                </p>
                {/* small olive accent bar */}
                <div style={{ width: '48px', height: '3px', background: 'linear-gradient(90deg,#6b7c47,#a3b877)', borderRadius: '100px', marginTop: '28px' }} />
              </div>
            </FU>

            {/* Right — values list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {values.map((v, i) => {
                const Icon = v.icon;
                const hov = hVal === i;
                return (
                  <FU key={v.title} delay={i * 80}>
                    <div
                      onMouseEnter={() => sHVal(i)}
                      onMouseLeave={() => sHVal(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '22px',
                        padding: '32px 0',
                        borderBottom: i < values.length - 1 ? '1px solid rgba(107,124,71,0.1)' : 'none',
                        borderLeft: `3px solid ${hov ? '#6b7c47' : 'transparent'}`,
                        paddingLeft: hov ? '20px' : '0',
                        transition: 'all 0.35s cubic-bezier(0.22,0.68,0,1.1)',
                        cursor: 'default',
                      }}
                    >
                      {/* number */}
                      <div style={{
                        flexShrink: 0,
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: hov ? 'linear-gradient(135deg,#4a5a2e,#6b7c47)' : 'rgba(107,124,71,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        marginTop: '2px',
                      }}>
                        <Icon size={20} color={hov ? 'white' : '#6b7c47'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 800, color: hov ? '#2d3a1c' : '#1a2010', margin: 0, transition: 'color 0.25s', letterSpacing: '-0.2px' }}>{v.title}</h3>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9aaa78', letterSpacing: '0.5px', opacity: hov ? 1 : 0, transition: 'opacity 0.3s', whiteSpace: 'nowrap' }}>0{i + 1}</span>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, color: hov ? '#3d4e22' : '#7a8a62', transition: 'color 0.3s' }}>{v.desc}</p>
                      </div>
                    </div>
                  </FU>
                );
              })}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════
            TESTIMONIALS — infinite marquee ticker
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 0', background: '#f0ede3', overflow: 'hidden' }}>
          <FU>
            <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 32px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7c47', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Trusted by Thousands</p>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#1a2010', margin: 0, letterSpacing: '-1px' }}>What Couples Say</h2>
            </div>
          </FU>

          {/* marquee track */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* edge fades */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '120px', background: 'linear-gradient(to right, #f0ede3, transparent)', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '120px', background: 'linear-gradient(to left, #f0ede3, transparent)', zIndex: 10, pointerEvents: 'none' }} />

            <style>{`
              @keyframes marqueeScroll {
                from { transform: translateX(0); }
                to   { transform: translateX(-50%); }
              }
              .marquee-track {
                display: flex;
                gap: 20px;
                width: max-content;
                animation: marqueeScroll 28s linear infinite;
              }
              .marquee-track:hover { animation-play-state: paused; }
              .marquee-card {
                flex-shrink: 0;
                width: 300px;
                background: white;
                borderRadius: 20px;
                padding: 26px;
                box-shadow: 0 4px 18px rgba(0,0,0,0.06);
                border: 1px solid rgba(107,124,71,0.1);
                transition: box-shadow 0.25s, transform 0.25s;
              }
              .marquee-card:hover {
                box-shadow: 0 10px 32px rgba(107,124,71,0.14);
                transform: translateY(-3px);
              }
            `}</style>

            <div className="marquee-track" style={{ paddingLeft: '20px' }}>
              {/* double the array for seamless loop */}
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="marquee-card">
                  <Quote size={22} color="#6b7c47" style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <p style={{ fontSize: '13.5px', color: '#2d3a1c', lineHeight: 1.8, margin: '0 0 18px', fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} color="#f59e0b" fill="#f59e0b" />)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3d4e28,#6b7c47)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>{t.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1a2010' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: '#8a9a6a', fontWeight: 600 }}>{t.event}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            TEAM — cards
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 32px', background: '#faf9f5' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <FU>
              <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7c47', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>The People Behind It</p>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#1a2010', margin: 0, letterSpacing: '-1px' }}>Meet Our Team</h2>
              </div>
            </FU>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '20px' }}>
              {team.map((m, i) => {
                const hov = hTeam === i;
                return (
                  <FU key={m.name} delay={i * 80}>
                    <div
                      onMouseEnter={() => sHTeam(i)}
                      onMouseLeave={() => sHTeam(null)}
                      style={{ borderRadius: '20px', overflow: 'hidden', background: 'white', border: '1px solid rgba(107,124,71,0.1)', boxShadow: hov ? '0 24px 60px rgba(45,58,28,0.16)' : '0 2px 14px rgba(107,124,71,0.07)', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', transform: hov ? 'translateY(-10px)' : 'translateY(0)', cursor: 'default' }}
                    >
                      <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
                        <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transition: 'transform 0.5s', transform: hov ? 'scale(1.08)' : 'scale(1)' }} />
                        <div style={{ position: 'absolute', inset: 0, background: hov ? 'linear-gradient(to top,rgba(26,32,16,0.65) 0%,transparent 60%)' : 'linear-gradient(to top,rgba(26,32,16,0.2) 0%,transparent 50%)', transition: 'background 0.4s' }} />
                      </div>
                      <div style={{ padding: '18px 20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1a2010' }}>{m.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7c47', fontWeight: 600, marginTop: '2px' }}>{m.role}</div>
                      </div>
                    </div>
                  </FU>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            CTA STRIP
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 32px', background: 'linear-gradient(135deg,#1a2010 0%,#2d3a1c 50%,#3d4e28 100%)' }}>
          <FU anim="scaleIn">
            <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, color: 'white', margin: '0 0 18px', letterSpacing: '-1.5px', lineHeight: 1.08 }}>
                Ready to plan something<br />
                <span style={{ background: 'linear-gradient(90deg,#d4c484,#c8b87a,#e8dfc8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  extraordinary?
                </span>
              </h2>
              <p style={{ fontSize: '17px', color: 'rgba(232,223,200,0.75)', margin: '0 0 36px', lineHeight: 1.7 }}>
                Join 10,000+ couples who planned the perfect celebration with Shubharambh.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/venues" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#c8b87a', color: '#1a2010', padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '15px', boxShadow: '0 8px 24px rgba(200,184,122,0.35)', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Browse Venues <ArrowRight size={17} />
                </Link>
                <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid rgba(255,255,255,0.25)', color: 'white', padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', backdropFilter: 'blur(6px)', background: 'rgba(255,255,255,0.07)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                >
                  Join Free — It&apos;s Quick
                </Link>
              </div>
            </div>
          </FU>
        </section>

      </div>
    </>
  );
}
