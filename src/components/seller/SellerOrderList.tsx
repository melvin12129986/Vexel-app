'use client';
import { useMarket, type Order } from '@/context/MarketContext';
import Link from 'next/link';

export default function SellerOrderList({ orders, history = false }: { orders: Order[]; history?: boolean }) {
  const { setOrders } = useMarket();

  const handleProofUpload = (orderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const proofImage = URL.createObjectURL(file);
    setOrders((currentOrders) =>
      currentOrders.map((order) => order.id === orderId ? { ...order, proofImage } : order)
    );
  };

  const confirmShipment = (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId && order.status === 'Menunggu Pengiriman'
          ? { ...order, status: 'Dikirim' }
          : order
      )
    );
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-sky-300 bg-white/75 px-6 py-14 text-center">
        <span className="text-4xl">{history ? '🧾' : '📦'}</span>
        <p className="mt-3 font-bold text-slate-700">{history ? 'Belum ada riwayat pesanan' : 'Belum ada pesanan aktif'}</p>
        <p className="mt-1 text-sm text-slate-500">{history ? 'Pesanan yang selesai akan tercatat di sini.' : 'Pesanan baru dari pembeli akan muncul di sini.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={order.product.image} alt={order.product.name} className="h-16 w-16 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-400">{order.id} · {order.date}</p>
              <h3 className="mt-1 truncate font-bold text-slate-800">{order.product.name}</h3>
              <p className="text-sm text-slate-500">{order.qty} × Rp {order.product.price.toLocaleString('id-ID')} · Pembeli: {order.buyer}</p>
              {order.wantsProof && <p className="mt-1 text-xs font-semibold text-[#008bd0]">Bukti diminta · Biaya 5%: Rp {order.proofFee.toLocaleString('id-ID')}</p>}
            </div>
            <div className="sm:text-right">
              <p className="font-black text-slate-900">Rp {order.total.toLocaleString('id-ID')}</p>
              <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${order.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{order.status}</span>
            </div>
          </div>
          {order.proofImage && (
            <a href={order.proofImage} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-bold text-[#008bd0] underline">
              Lihat bukti pengiriman
            </a>
          )}
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
            <Link href={`/chat/${order.id}`} className="rounded-xl bg-sky-50 px-4 py-3 text-center text-sm font-bold text-[#0073ad] transition hover:bg-sky-100">
              Chat Pembeli
            </Link>
            {!history && order.status === 'Menunggu Pengiriman' && order.wantsProof && !order.proofImage && (
              <label className="flex-1 text-sm font-semibold text-slate-600">
                Unggah foto bukti pengiriman (wajib)
                <input type="file" accept="image/*" onChange={(event) => handleProofUpload(order.id, event)} className="mt-2 block w-full text-sm" />
              </label>
            )}
            {!history && order.status === 'Menunggu Pengiriman' && !order.wantsProof && (
              <label className="flex-1 text-sm font-semibold text-slate-600">
                Tambahkan foto bukti (opsional)
                <input type="file" accept="image/*" onChange={(event) => handleProofUpload(order.id, event)} className="mt-2 block w-full text-sm" />
              </label>
            )}
            {!history && order.status === 'Menunggu Pengiriman' && (
              <button
                onClick={() => confirmShipment(order.id)}
                disabled={order.wantsProof && !order.proofImage}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Konfirmasi Pengiriman
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
