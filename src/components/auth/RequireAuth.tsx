'use client';
import { useMarket } from '@/context/MarketContext';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, userLoaded } = useMarket();
  const router = useRouter();

  useEffect(() => {
    if (userLoaded && !user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
    }
  }, [router, user, userLoaded]);

  if (!userLoaded || !user) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-slate-500" role="status">
        Memeriksa sesi masuk...
      </div>
    );
  }

  return children;
}
