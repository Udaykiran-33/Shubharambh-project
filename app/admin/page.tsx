'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  FolderOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  Activity,
} from 'lucide-react';
import { getAdminStats } from '@/app/actions/admin';

interface Stats {
  totalVenues: number;
  pendingVenues: number;
  approvedVenues: number;
  rejectedVenues: number;
  totalVendors: number;
  pendingVendors: number;
  approvedVendors: number;
  totalCategories: number;
  recentSubmissions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid var(--cream-200)',
          borderTopColor: 'var(--olive-600)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  const hasPending = (stats?.pendingVenues || 0) > 0 || (stats?.pendingVendors || 0) > 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Top Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--olive-700), var(--olive-800))',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{today}</p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'white', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>Platform overview at a glance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '12px' }}>
          <Activity size={16} color="rgba(255,255,255,0.8)" />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600 }}>
            {(stats?.recentSubmissions || 0)} new this week
          </span>
        </div>
      </div>

      {/* ── Alerts ── */}
      {hasPending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {(stats?.pendingVenues || 0) > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px', borderRadius: '12px',
              background: '#fffbeb', border: '1px solid #fde68a',
            }}>
              <AlertCircle size={18} color="#d97706" />
              <span style={{ flex: 1, fontSize: '14px', color: '#78350f', fontWeight: 500 }}>
                <strong>{stats?.pendingVenues}</strong> venue{(stats?.pendingVenues || 0) > 1 ? 's' : ''} awaiting approval
              </span>
              <Link href="/admin/venues?filter=pending" style={{
                fontSize: '13px', fontWeight: 700, color: '#d97706',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                Review <ArrowRight size={14} />
              </Link>
            </div>
          )}
          {(stats?.pendingVendors || 0) > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px', borderRadius: '12px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
            }}>
              <Users size={18} color="#3b82f6" />
              <span style={{ flex: 1, fontSize: '14px', color: '#1e40af', fontWeight: 500 }}>
                <strong>{stats?.pendingVendors}</strong> vendor{(stats?.pendingVendors || 0) > 1 ? 's' : ''} waiting for verification
              </span>
              <Link href="/admin/vendors?status=pending" style={{
                fontSize: '13px', fontWeight: 700, color: '#3b82f6',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                Verify <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Venues Section ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Building2 size={16} color="var(--olive-600)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--olive-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Venues</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Total', value: stats?.totalVenues || 0, href: '/admin/venues', accent: 'var(--olive-600)', light: 'var(--olive-100)' },
            { label: 'Pending', value: stats?.pendingVenues || 0, href: '/admin/venues?filter=pending', accent: '#d97706', light: '#fef3c7' },
            { label: 'Approved', value: stats?.approvedVenues || 0, href: '/admin/venues?filter=approved', accent: '#059669', light: '#d1fae5' },
            { label: 'Rejected', value: stats?.rejectedVenues || 0, href: '/admin/venues?filter=rejected', accent: '#dc2626', light: '#fee2e2' },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--cream-200)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: item.light,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <Building2 size={17} color={item.accent} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--olive-900)', lineHeight: 1 }}>{item.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--olive-500)', marginTop: '4px', fontWeight: 500 }}>{item.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Vendors & Categories ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>

        {/* Vendors */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={16} color="var(--olive-600)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--olive-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vendors</span>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--cream-200)', overflow: 'hidden' }}>
            {[
              { label: 'Total Vendors', value: stats?.totalVendors || 0, href: '/admin/vendors', color: 'var(--olive-600)' },
              { label: 'Pending Verification', value: stats?.pendingVendors || 0, href: '/admin/vendors?status=pending', color: '#d97706' },
              { label: 'Approved Vendors', value: stats?.approvedVendors || 0, href: '/admin/vendors?status=approved', color: '#059669' },
            ].map((row, i, arr) => (
              <Link key={row.label} href={row.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--cream-200)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream-50)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span style={{ fontSize: '14px', color: 'var(--olive-700)', fontWeight: 500 }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: row.color }}>{row.value}</span>
                    <ArrowRight size={14} color="var(--olive-400)" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Categories + Week summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Categories */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FolderOpen size={16} color="var(--olive-600)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--olive-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categories</span>
            </div>
            <Link href="/admin/categories" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: '14px',
                border: '1px solid var(--cream-200)', padding: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
              >
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--olive-900)' }}>{stats?.totalCategories || 0}</div>
                  <div style={{ fontSize: '13px', color: 'var(--olive-500)', marginTop: '2px' }}>Active Categories</div>
                </div>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'var(--olive-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FolderOpen size={20} color="var(--olive-600)" />
                </div>
              </div>
            </Link>
          </div>

          {/* This Week */}
          <div style={{
            background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))',
            borderRadius: '14px', padding: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{stats?.recentSubmissions || 0}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Submissions this week</div>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LayoutGrid size={20} color="white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <CheckCircle size={16} color="var(--olive-600)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--olive-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Manage Venues', href: '/admin/venues', icon: Building2, primary: true },
            { label: 'View Vendors', href: '/admin/vendors', icon: Users, primary: false },
            { label: 'Edit Categories', href: '/admin/categories', icon: FolderOpen, primary: false },
            { label: 'View Website', href: '/', icon: ArrowRight, primary: false },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: action.primary ? 'var(--olive-600)' : 'white',
                  border: action.primary ? 'none' : '1px solid var(--cream-200)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontWeight: 600, fontSize: '14px',
                  color: action.primary ? 'white' : 'var(--olive-700)',
                  transition: 'all 0.18s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = action.primary ? 'var(--olive-700)' : 'var(--cream-50)';
                    el.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = action.primary ? 'var(--olive-600)' : 'white';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  <Icon size={16} />
                  {action.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
