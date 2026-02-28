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
  ArrowUpRight,
  TrendingUp,
  AlertCircle
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--cream-200)',
          borderTopColor: 'var(--olive-600)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Venues',
      value: stats?.totalVenues || 0,
      icon: Building2,
      color: 'var(--olive-600)',
      bg: 'var(--olive-100)',
      href: '/admin/venues',
    },
    {
      title: 'Pending Approval',
      value: stats?.pendingVenues || 0,
      icon: Clock,
      color: '#f59e0b',
      bg: '#fef3c7',
      href: '/admin/venues?filter=pending',
      urgent: (stats?.pendingVenues || 0) > 0,
    },
    {
      title: 'Approved',
      value: stats?.approvedVenues || 0,
      icon: CheckCircle,
      color: '#10b981',
      bg: '#d1fae5',
      href: '/admin/venues?filter=approved',
    },
    {
      title: 'Rejected',
      value: stats?.rejectedVenues || 0,
      icon: XCircle,
      color: '#ef4444',
      bg: '#fee2e2',
      href: '/admin/venues?filter=rejected',
    },
    {
      title: 'Total Vendors',
      value: stats?.totalVendors || 0,
      icon: Users,
      color: '#6366f1',
      bg: '#e0e7ff',
      href: '/admin/vendors',
    },
    {
      title: 'Pending Vendors',
      value: stats?.pendingVendors || 0,
      icon: Clock,
      color: '#f59e0b',
      bg: '#fef3c7',
      href: '/admin/vendors?status=pending',
      urgent: (stats?.pendingVendors || 0) > 0,
    },
    {
      title: 'Categories',
      value: stats?.totalCategories || 0,
      icon: FolderOpen,
      color: '#8b5cf6',
      bg: '#ede9fe',
      href: '/admin/categories',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
          fontWeight: 800, 
          color: 'var(--olive-800)',
          marginBottom: '8px',
        }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--olive-500)' }}>
          Welcome back! Here{`'`}s an overview of your platform.
        </p>
      </div>

      {/* Alert for Pending Items */}
      {((stats?.pendingVenues || 0) > 0 || (stats?.pendingVendors || 0) > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {(stats?.pendingVenues || 0) > 0 && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <AlertCircle size={20} color="#f59e0b" />
              <span style={{ color: '#92400e', fontWeight: 500, flex: 1 }}>
                {stats?.pendingVenues} venue(s) waiting for approval
              </span>
              <Link 
                href="/admin/venues?filter=pending"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#f59e0b',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Review
              </Link>
            </div>
          )}
          {(stats?.pendingVendors || 0) > 0 && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#dbeafe',
              border: '1px solid #93c5fd',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <Users size={20} color="#3b82f6" />
              <span style={{ color: '#1e40af', fontWeight: 500, flex: 1 }}>
                {stats?.pendingVendors} vendor(s) waiting for verification
              </span>
              <Link 
                href="/admin/vendors?status=pending"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Verify
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              href={card.href}
              style={{
                padding: '24px',
                borderRadius: '16px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid var(--cream-200)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={24} color={card.color} />
                </div>
                <ArrowUpRight size={16} color="var(--olive-400)" />
              </div>
              <div style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 800,
                color: 'var(--olive-800)',
                marginBottom: '4px',
              }}>
                {card.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--olive-500)',
                fontWeight: 500,
              }}>
                {card.title}
              </div>
              {card.urgent && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  animation: 'pulse 2s infinite',
                }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--cream-200)',
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--olive-800)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <TrendingUp size={20} />
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}>
          <Link
            href="/admin/venues"
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--olive-50)',
              border: '1px solid var(--olive-200)',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--olive-700)',
              transition: 'all 0.2s ease',
            }}
          >
            Manage Venues
          </Link>
          <Link
            href="/admin/vendors"
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--cream-100)',
              border: '1px solid var(--cream-200)',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--olive-700)',
              transition: 'all 0.2s ease',
            }}
          >
            View Vendors
          </Link>
          <Link
            href="/admin/categories"
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--cream-100)',
              border: '1px solid var(--cream-200)',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--olive-700)',
              transition: 'all 0.2s ease',
            }}
          >
            Edit Categories
          </Link>
          <Link
            href="/"
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--cream-100)',
              border: '1px solid var(--cream-200)',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--olive-700)',
              transition: 'all 0.2s ease',
            }}
          >
            View Website
          </Link>
        </div>
      </div>

      {/* Recent Activity would go here */}
      <div style={{
        marginTop: '24px',
        padding: '24px',
        borderRadius: '16px',
        background: 'white',
        border: '1px solid var(--cream-200)',
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--olive-800)',
          marginBottom: '12px',
        }}>
          Summary
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px',
        }}>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--olive-600)' }}>
              {stats?.recentSubmissions || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--olive-500)' }}>
              New this week
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
              {stats?.approvedVendors || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--olive-500)' }}>
              Approved Vendors
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--olive-700)' }}>
              {stats?.totalCategories || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--olive-500)' }}>
              Categories
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
