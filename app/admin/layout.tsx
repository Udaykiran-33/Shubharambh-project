'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FolderOpen, 
  LogOut, 
  Menu, 
  X,
  Shield,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/venues', label: 'Venues', icon: Building2 },
  { href: '/admin/vendors', label: 'Vendors', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check if on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Check authentication by looking for cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (!isLoginPage) {
            router.push('/admin/login');
          }
        }
      } catch {
        setIsAuthenticated(false);
        if (!isLoginPage) {
          router.push('/admin/login');
        }
      }
    };

    if (!isLoginPage) {
      checkAuth();
    } else {
      setIsAuthenticated(false);
    }
  }, [pathname, router, isLoginPage]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  // Login page doesn't need the layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream-50)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--cream-200)',
          borderTopColor: 'var(--olive-600)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream-50)' }}>
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: sidebarOpen ? 0 : '-280px',
        top: 0,
        bottom: 0,
        width: '280px',
        background: 'linear-gradient(180deg, var(--olive-800) 0%, var(--olive-900) 100%)',
        zIndex: 50,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="lg:left-0"
      >
        {/* Logo */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                Shubharambh
              </h1>
              <p style={{ color: 'var(--olive-300)', fontSize: '12px' }}>
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: isActive 
                      ? 'rgba(255,255,255,0.15)' 
                      : 'transparent',
                    color: isActive ? 'white' : 'var(--olive-300)',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '0',
        transition: 'margin-left 0.3s ease',
      }}
      className="lg:ml-[280px]"
      >
        {/* Top Bar */}
        <header style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          borderBottom: '1px solid var(--cream-200)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid var(--cream-200)',
              background: 'white',
              cursor: 'pointer',
            }}
            className="lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              background: 'var(--olive-100)', 
              color: 'var(--olive-700)',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </main>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .lg\\:left-0 { left: 0 !important; }
          .lg\\:ml-\\[280px\\] { margin-left: 280px !important; }
          .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
