'use client';
import Navbar from '@/components/layout/Navbar';
import RequireAuth from '@/components/auth/RequireAuth';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSellerArea = pathname.startsWith('/seller');

  const isProtectedRoute = isSellerArea
    || pathname === '/payment'
    || pathname.startsWith('/payment/')
    || pathname === '/orders'
    || pathname.startsWith('/chat')
    || pathname === '/profile';

  if (isSellerArea) return <RequireAuth>{children}</RequireAuth>;

  return (
    <>
      <Navbar />
      <main className="mx-auto mt-4 max-w-6xl p-4 md:p-6">
        {isProtectedRoute ? <RequireAuth>{children}</RequireAuth> : children}
      </main>
    </>
  );
}
