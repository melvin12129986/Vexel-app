'use client';
import { useMarket } from '@/context/MarketContext';
import SellerOrderList from '@/components/seller/SellerOrderList';

export default function SellerOrdersPage() {
  const { orders, user } = useMarket();
  const activeOrders = orders.filter(
    (order) => order.product.seller === user?.username && order.status !== 'Selesai' && order.status !== 'Menunggu Pembayaran'
  );

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008bd0]">Kelola transaksi</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">Pesanan Aktif <span className="text-[#008bd0]">({activeOrders.length})</span></h2>
        <p className="mt-1 text-sm text-slate-500">Konfirmasi pengiriman dan pantau komunikasi dengan pembeli.</p>
      </div>
      <SellerOrderList orders={activeOrders} />
    </section>
  );
}
