'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SellerNavigation() {
  const { orders, user } = useMarket();
  const pathname = usePathname();
  const sellerOrders = orders.filter((order) => order.product.seller === user?.username);
  const activeCount = sellerOrders.filter((order) => order.status !== 'Selesai' && order.status !== 'Menunggu Pembayaran').length;

  const sections = [
    {
      label: 'TOKO SAYA',
      links: [
        { href: '/seller', label: 'Ringkasan', icon: '▦' },
        { href: '/seller/items', label: 'Daftar Barang', icon: '◇' }
      ]
    },
    {
      label: 'PESANAN',
      links: [
        { href: '/seller/orders', label: 'Pesanan Aktif', icon: '▤', count: activeCount },
        { href: '/seller/history', label: 'Riwayat Pesanan', icon: '◷' }
      ]
    }
  ];

  return (
    <nav aria-label="Navigasi panel penjual" className="flex gap-2 overflow-x-auto lg:block lg:space-y-7 lg:px-4 lg:py-7">
      <div className="hidden border-b border-slate-100 px-2 pb-5 lg:block">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-sky-100 text-lg" aria-hidden="true">🎮</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{user?.username ?? 'Penjual'}</p>
            <p className="text-xs text-slate-500">Toko Vexel</p>
          </div>
        </div>
        <Link href="/seller/items" className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-sky-100 hover:text-[#0073ad]">
          Kelola toko
        </Link>
      </div>
      {sections.map((section) => (
        <div key={section.label} className="flex shrink-0 gap-1 lg:block lg:space-y-1">
          <p className="hidden px-3 pb-2 text-[10px] font-black tracking-[0.16em] text-slate-400 lg:block">{section.label}</p>
          {section.links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-max items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition lg:min-w-0 ${isActive ? 'bg-sky-50 text-[#087cc1] lg:border-l-[3px] lg:border-[#087cc1] lg:pl-[9px]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#087cc1]'}`}
              >
                <span className="flex items-center gap-3"><span className="w-5 text-center text-base text-slate-500" aria-hidden="true">{link.icon}</span><span>{link.label}</span></span>
                {link.count !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-[#087cc1] text-white' : 'bg-slate-100 text-slate-600'}`}>{link.count}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
