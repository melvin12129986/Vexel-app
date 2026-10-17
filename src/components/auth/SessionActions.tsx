'use client';
import { useMarket } from '@/context/MarketContext';
import { useRouter } from 'next/navigation';

export default function SessionActions({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { user, userLoaded, setUser } = useMarket();
  const router = useRouter();

  if (!userLoaded) return null;

  return (
    <a
      href={user ? '/profile' : '/login'}
      aria-label={user ? `Profil ${user.username}` : 'Masuk atau buka profil'}
      title={user ? `Profil ${user.username}` : 'Masuk atau buka profil'}
      className={`grid h-10 w-10 place-items-center rounded-xl transition ${tone === 'dark' ? 'text-white hover:bg-white/15' : 'text-slate-600 hover:bg-slate-100 hover:text-[#087cc1]'}`}
    >
      <ProfileIcon />
    </a>
  );
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
