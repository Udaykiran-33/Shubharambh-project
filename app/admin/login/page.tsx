'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.message || 'Invalid password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--olive-800) 0%, var(--olive-900) 100%)',
      padding: '24px',
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Logo/Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 40px -8px rgba(107, 142, 35, 0.5)',
            }}>
              <Shield size={40} color="white" />
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--olive-800)',
              marginBottom: '8px',
            }}>
              Admin Panel
            </h1>
            <p style={{
              color: 'var(--olive-500)',
              fontSize: '0.95rem',
            }}>
              Enter password to access dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '14px',
                color: 'var(--olive-700)',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--olive-400)',
                }}>
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  style={{
                    width: '100%',
                    padding: '16px 48px',
                    borderRadius: '12px',
                    border: error ? '2px solid #ef4444' : '2px solid var(--cream-200)',
                    background: 'var(--cream-50)',
                    fontSize: '1rem',
                    color: 'var(--olive-800)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--olive-500)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(107, 142, 35, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? '#ef4444' : 'var(--cream-200)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--olive-400)',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 16A8 8 0 108 0a8 8 0 000 16zM7 5a1 1 0 112 0v3a1 1 0 11-2 0V5zm1 7a1 1 0 100-2 1 1 0 000 2z"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: loading || !password 
                  ? 'var(--olive-300)' 
                  : 'linear-gradient(135deg, var(--olive-600), var(--olive-700))',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                boxShadow: loading || !password ? 'none' : '0 8px 20px -4px rgba(107, 142, 35, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '13px',
            color: 'var(--olive-400)',
          }}>
            Shubharambh Admin Portal
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px',
        }}>
          © 2024 Shubharambh. All rights reserved.
        </p>
      </div>
    </div>
  );
}
