'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';

export default function SellerDashboard() {
  const { products, orders, user } = useMarket();
  const sellerProducts = products.filter((product) => product.seller === user?.username);
  const sellerOrders = orders.filter((order) => order.product.seller === user?.username);
  const activeOrders = sellerOrders.filter((order) => order.status !== 'Selesai' && order.status !== 'Menunggu Pembayaran');
  const completedOrders = sellerOrders.filter((order) => order.status === 'Selesai');
  const totalSales = completedOrders.reduce((total, order) => total + order.total, 0);
  const stats = [
    { label: 'Barang aktif', value: sellerProducts.length, icon: '◇', detail: 'Kelola katalog tokomu', href: '/seller/items', tone: 'bg-sky-100 text-[#0073ad]' },
    { label: 'Pesanan aktif', value: activeOrders.length, icon: '▤', detail: 'Perlu diproses', href: '/seller/orders', tone: 'bg-amber-100 text-amber-700' },
    { label: 'Transaksi selesai', value: completedOrders.length, icon: '✓', detail: 'Lihat riwayat order', href: '/seller/history', tone: 'bg-emerald-100 text-emerald-700' }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-3xl border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl font-black ${stat.tone}`}>{stat.icon}</span>
              <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#008bd0]">→</span>
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.detail}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008bd0]">Ringkasan performa</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Halo, {user?.username ?? 'Penjual'} 👋</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Pantau kegiatan toko dan kelola transaksi dari satu panel. Pastikan stok serta informasi barang selalu diperbarui.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/seller/items" className="rounded-xl bg-[#008bd0] px-5 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/10 transition hover:bg-[#0073ad]">Kelola daftar barang</Link>
            <Link href="/seller/orders" className="rounded-xl border border-sky-200 px-5 py-3 text-sm font-bold text-[#0073ad] transition hover:bg-sky-50">Lihat pesanan aktif</Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-sky-900 p-6 text-white shadow-lg">
          <span className="text-3xl">💰</span>
          <p className="mt-5 text-sm font-semibold text-sky-200">Nilai transaksi selesai</p>
          <p className="mt-1 text-2xl font-black">Rp {totalSales.toLocaleString('id-ID')}</p>
          <p className="mt-2 text-xs text-slate-300">Berdasarkan pesanan yang berstatus selesai.</p>
          <Link href="/seller/history" className="mt-5 inline-block text-sm font-bold text-sky-300 hover:text-white">Buka riwayat →</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008bd0]">Butuh perhatian</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Pesanan terbaru</h2>
          </div>
          <Link href="/seller/orders" className="text-sm font-bold text-[#008bd0] hover:underline">Lihat semua</Link>
        </div>
        {activeOrders.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Tidak ada pesanan yang perlu diproses saat ini.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {activeOrders.slice(0, 3).map((order) => (
              <Link key={order.id} href="/seller/orders" className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <img src={order.product.image} alt={order.product.name} className="h-12 w-12 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-slate-800">{order.product.name}</span>
                  <span className="block text-xs text-slate-500">{order.id} · {order.buyer}</span>
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{order.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
