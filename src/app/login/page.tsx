'use client';
import { useState } from 'react';
import { useMarket } from '@/context/MarketContext';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axiosClient';
import { getSupabaseBrowserClient, isSupabaseClientConfigured } from '@/lib/supabaseClient';

export default function LoginPage() {
  const { setUser } = useMarket();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getRedirectPath = () => {
    if (typeof window === 'undefined') return '/';
    const requestedPath = new URLSearchParams(window.location.search).get('redirect');
    return requestedPath?.startsWith('/') &&
      !requestedPath.startsWith('//') &&
      !requestedPath.startsWith('/login')
      ? requestedPath
      : '/';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isSupabaseClientConfigured()) {
      setErrorMessage(
        'Konfigurasi Supabase belum diatur di .env.local. Silakan isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY terlebih dahulu.'
      );
      return;
    }

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get('password') ?? '');
    setLoading(true);

    try {
      if (mode === 'register') {
        const username = String(formData.get('username') ?? '').trim();
        const email = String(formData.get('email') ?? '').trim().toLowerCase();

        // 1. Daftarkan akun melalui Server API
        await axiosClient.post('/api/auth/register', {
          username,
          email,
          password
        });

        // 2. Langsung login menggunakan Supabase Auth
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          setSuccessMessage('Akun berhasil dibuat! Silakan masuk menggunakan akun Anda.');
          setMode('login');
          return;
        }

        const meRes = await axiosClient.get('/api/auth/me');
        if (meRes.data?.user) {
          setUser(meRes.data.user);
        } else {
          setUser({ username, email });
        }

        router.push(getRedirectPath());
      } else {
        const identifier = String(formData.get('identifier') ?? '').trim();

        // 1. Resolusi username atau email di server
        const resolveRes = await axiosClient.post('/api/auth/resolve-identifier', {
          identifier
        });
        const email = String(resolveRes.data?.email ?? '').trim();

        // 2. Autentikasi ke Supabase Auth
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw new Error('Email/Username atau password salah.');
        }

        // 3. Ambil profil resmi yang terverifikasi dari server
        const meRes = await axiosClient.get('/api/auth/me');
        if (meRes.data?.user) {
          setUser(meRes.data.user);
        }

        router.push(getRedirectPath());
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Gagal memproses autentikasi.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full border border-sky-200 text-center">
        <img
          src="/vexel-logo.png"
          alt="Vexel Logo"
          className="mx-auto mb-3 h-16 w-16 rounded-2xl object-cover shadow-md"
        />
        <h1 className="text-4xl font-black text-[#008bd0] mb-2">Vexel</h1>
        <p className="text-sm text-slate-500 mb-6">
          {mode === 'login'
            ? 'Masuk untuk mulai trading item game.'
            : 'Buat akun baru untuk jual beli item game di Vexel.'}
        </p>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sky-50 p-1.5 mb-6 border border-sky-100">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2.5 text-sm font-bold rounded-xl transition ${
              mode === 'login'
                ? 'bg-[#008bd0] text-white shadow'
                : 'text-slate-600 hover:text-[#008bd0]'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2.5 text-sm font-bold rounded-xl transition ${
              mode === 'register'
                ? 'bg-[#008bd0] text-white shadow'
                : 'text-slate-600 hover:text-[#008bd0]'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-xs font-semibold text-rose-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-xs font-semibold text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === 'register' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  placeholder="Contoh: ProTrader_99"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#008bd0] outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#008bd0] outline-none mt-1"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-600">Email / Username</label>
              <input
                name="identifier"
                type="text"
                required
                placeholder="Masukkan email atau username"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#008bd0] outline-none mt-1"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#008bd0] outline-none mt-1"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008bd0] hover:bg-[#0073ad] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg hover:-translate-y-0.5"
          >
            {loading
              ? 'Memproses...'
              : mode === 'login'
              ? 'Masuk Sekarang'
              : 'Daftar & Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}