'use client';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSellerArea = pathname.startsWith('/seller');

  if (isSellerArea) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="mx-auto mt-4 max-w-6xl p-4 md:p-6">{children}</main>
    </>
  );
}
