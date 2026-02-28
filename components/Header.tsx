'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X, User } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-cream-300 bg-cream-50" style={{ background: 'rgba(255, 254, 250, 0.95)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md bg-olive-600" style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-olive-800 hidden sm:block">
              Shubharambh
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold tracking-wide text-olive-700 transition-colors hover:opacity-80">
              Home
            </Link>

            <Link href="/categories" className="text-sm font-semibold tracking-wide text-olive-700 transition-colors hover:opacity-80">
              Categories
            </Link>
            <Link href="/venues" className="text-sm font-semibold tracking-wide text-olive-700 transition-colors hover:opacity-80">
              Venues
            </Link>
            <Link href="/about" className="text-sm font-semibold tracking-wide text-olive-700 transition-colors hover:opacity-80">
              About
            </Link>
          </div>

          {/* Desktop Auth Buttons - Right */}
          <div className="hidden lg:flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-semibold px-4 py-2 rounded-lg text-olive-700 transition-colors">
                  Dashboard
                </Link>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-100 text-olive-700 transition-all hover:shadow-sm">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-olive-600" style={{ background: 'var(--gradient-primary)' }}>
                    {session.user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                  </div>
                  <span className="text-sm font-semibold hidden xl:block">
                    {session.user?.name?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={async () => {
                    await signOut({ redirect: false });
                    window.location.href = '/login';
                  }}
                  className="text-sm font-semibold px-5 py-2 rounded-lg border-2 border-olive-400 text-olive-700 bg-white transition-all hover:shadow-md"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold px-4 py-2 text-olive-700 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-sm font-semibold px-6 py-3 rounded-xl text-white transition-all hover:shadow-lg bg-olive-600" style={{ background: 'var(--gradient-primary)' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ background: mobileMenuOpen ? 'var(--cream-200)' : 'transparent' }}
          >
            {mobileMenuOpen ? (
              <X size={22} className="text-olive-700" />
            ) : (
              <Menu size={22} className="text-olive-700" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-cream-300 bg-cream-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col gap-1">
              <Link href="/" className="text-sm font-semibold px-4 py-3 rounded-lg text-olive-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>

              <Link href="/categories" className="text-sm font-semibold px-4 py-3 rounded-lg text-olive-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Categories
              </Link>
              <Link href="/venues" className="text-sm font-semibold px-4 py-3 rounded-lg text-olive-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Venues
              </Link>
              <Link href="/about" className="text-sm font-semibold px-4 py-3 rounded-lg text-olive-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              
              {/* Divider */}
              <div className="h-px my-4 bg-cream-300"></div>
              
              {/* Auth Section */}
              {session ? (
                <>
                  <Link href="/dashboard" className="text-sm font-semibold px-4 py-3 rounded-lg text-olive-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/profile" className="text-sm font-semibold px-4 py-3 rounded-lg text-olive-700 transition-colors flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-olive-600" style={{ background: 'var(--gradient-primary)' }}>
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    My Profile
                  </Link>
                  <button onClick={async () => { 
                    await signOut({ redirect: false }); 
                    window.location.href = '/login';
                    setMobileMenuOpen(false); 
                  }} className="text-sm font-semibold text-left px-4 py-3 rounded-lg text-olive-700 transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  <Link href="/login" className="text-sm font-semibold text-center py-3 rounded-lg border-2 border-olive-400 text-olive-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-sm font-semibold text-center py-3 rounded-lg text-white bg-olive-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
