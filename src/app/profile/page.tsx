'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, setUser } = useMarket();
  const router = useRouter();

  if (!user) return null;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008bd0]">Akun Vexel</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Profil Saya</h1>
      </header>
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-[#008bd0]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{user.username}</h2>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Link href="/orders" className="flex-1 rounded-xl bg-sky-50 px-4 py-3 text-center text-sm font-bold text-[#0073ad] transition hover:bg-sky-100">
            Lihat Pesanan Saya
          </Link>
          <button
            onClick={() => {
              setUser(null);
              router.push('/');
            }}
            className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
          >
            Keluar
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500">Akun saat ini menggunakan mode demo; autentikasi server belum diaktifkan.</p>
    </section>
  );
}
