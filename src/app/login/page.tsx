'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/permissions';
import { BrandLogo } from '@/components/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('Your session expired after 30 minutes. Please sign in again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const saved = localStorage.getItem('user');
      const user = saved ? JSON.parse(saved) : null;
      router.push(ROLE_HOME[user?.role] || '/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-top safe-bottom flex min-h-screen items-center justify-center bg-kedar-cream px-4 py-6">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-kedar-gold/30 bg-white shadow-lg">
        <div className="bg-kedar-navy px-6 py-8 text-center text-white sm:px-8">
          <div className="flex justify-center">
            <BrandLogo size="lg" showText={false} subtitle="" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-kedar-gold">Kedar Enterprise</p>
          <h1 className="mt-1 text-2xl font-semibold">ERP System</h1>
          <p className="mt-1 text-sm text-white/70">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8" autoComplete="off">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kedar-navy">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-kedar-cream/50 px-3 py-2.5 text-base text-kedar-navy focus:border-kedar-gold focus:outline-none focus:ring-1 focus:ring-kedar-gold sm:py-2 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kedar-navy">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-kedar-cream/50 px-3 py-2.5 text-base text-kedar-navy focus:border-kedar-gold focus:outline-none focus:ring-1 focus:ring-kedar-gold sm:py-2 sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] rounded-md bg-kedar-gold px-4 py-2.5 text-sm font-semibold text-kedar-navy hover:bg-kedar-gold-light disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
