'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';
import { useState } from 'react';

export default function OrdersPage() {
  const { orders, setOrders, setProducts, orderStorageError, user } = useMarket();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const buyerOrders = orders.filter((order) => order.buyer === user?.username);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'shipping' | 'shipped' | 'completed'>('unpaid');
  const ordersByTab = {
    unpaid: buyerOrders.filter((order) => order.status === 'Menunggu Pembayaran'),
    shipping: buyerOrders.filter((order) => order.status === 'Menunggu Pengiriman'),
    shipped: buyerOrders.filter((order) => order.status === 'Dikirim' || order.status === 'Menunggu Penilaian'),
    completed: buyerOrders.filter((order) => order.status === 'Selesai')
  };
  const tabs = [
    { id: 'unpaid' as const, label: 'Perlu Dibayar', count: ordersByTab.unpaid.length },
    { id: 'shipping' as const, label: 'Sedang Dikirim', count: ordersByTab.shipping.length },
    { id: 'shipped' as const, label: 'Sudah Dikirim', count: ordersByTab.shipped.length },
    { id: 'completed' as const, label: 'Selesai', count: ordersByTab.completed.length }
  ];
  const visibleOrders = ordersByTab[activeTab];

  const confirmReceipt = (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId && order.buyer === user?.username && order.status === 'Dikirim'
          ? { ...order, status: 'Menunggu Penilaian' }
          : order
      )
    );
  };

  const submitRating = (orderId: string) => {
    const rating = ratings[orderId];
    const order = buyerOrders.find((item) => item.id === orderId);
    if (!order || order.status !== 'Menunggu Penilaian' || !rating) return;

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        if (product.id !== order.product.id) return product;
        const previousCount = product.ratingCount ?? 0;
        const previousTotal = (product.rating ?? 0) * previousCount;
        const ratingCount = previousCount + 1;
        return {
          ...product,
          rating: (previousTotal + rating) / ratingCount,
          ratingCount
        };
      })
    );
    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === orderId && currentOrder.buyer === user?.username && currentOrder.status === 'Menunggu Penilaian'
          ? { ...currentOrder, status: 'Selesai', rating }
          : currentOrder
      )
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">📦 Pesanan Saya</h2>
      {orderStorageError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{orderStorageError}</p>
      )}
      <div role="tablist" aria-label="Status pesanan" className="flex overflow-x-auto rounded-2xl border border-sky-100 bg-white/90 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-max flex-1 border-b-[3px] px-5 py-4 text-sm font-bold transition ${activeTab === tab.id ? 'border-[#008bd0] text-[#008bd0]' : 'border-transparent text-slate-600 hover:bg-sky-50'}`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>
      {visibleOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-300 bg-white/75 px-6 py-14 text-center">
          <span className="text-4xl" aria-hidden="true">{activeTab === 'completed' ? '🧾' : '📦'}</span>
          <p className="mt-3 font-bold text-slate-700">
            {buyerOrders.length === 0 ? 'Belum ada pesanan' : `Belum ada pesanan ${tabs.find((tab) => tab.id === activeTab)?.label.toLocaleLowerCase()}`}
          </p>
          <p className="mt-1 text-sm text-slate-500">Pesananmu akan muncul di sini sesuai statusnya.</p>
        </div>
      ) : (
        visibleOrders.map((order) => (
          <article key={order.id} className="space-y-4 rounded-3xl border border-sky-200 bg-white/90 p-5 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <img src={order.product.image} alt={order.product.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="w-full flex-1">
                <h3 className="font-bold text-slate-800">{order.product.name}</h3>
                <p className="text-xs text-slate-500">{order.id} • {order.qty} × Rp {order.product.price.toLocaleString('id-ID')}</p>
                {order.wantsProof && (
                  <p className="text-xs text-slate-500">Bukti diminta • Biaya 5%: Rp {order.proofFee.toLocaleString('id-ID')}</p>
                )}
                {order.proofImage && (
                  <a href={order.proofImage} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#008bd0] underline">
                    Lihat bukti pengiriman
                  </a>
                )}
                <Link href={`/chat/${order.id}`} className="mt-2 inline-block rounded-lg bg-sky-100 px-3 py-2 text-sm font-bold text-[#008bd0]">
                  Chat Penjual
                </Link>
              </div>
              <div className="text-left md:text-right">
                <p className="font-black text-[#008bd0]">Rp {order.total.toLocaleString('id-ID')}</p>
                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{order.status}</span>
              </div>
            </div>
            {order.status === 'Dikirim' && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-slate-800">Penjual sudah mengirim pesanan</p>
                  <p className="text-sm text-slate-500">Konfirmasi penerimaan barang untuk melanjutkan ke pemberian rating.</p>
                </div>
                <button onClick={() => confirmReceipt(order.id)} className="rounded-xl bg-[#008bd0] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0073ad]">
                  Konfirmasi Barang Diterima
                </button>
              </div>
            )}
            {order.status === 'Menunggu Pembayaran' && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-slate-800">Pesanan menunggu pembayaran</p>
                  <p className="text-sm text-slate-500">Selesaikan pembayaran untuk meneruskan pesanan ke penjual.</p>
                </div>
                <Link href={`/payment/${order.product.id}?orderId=${encodeURIComponent(order.id)}`} className="rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-600">
                  Lanjutkan Pembayaran
                </Link>
              </div>
            )}
            {order.status === 'Menunggu Pengiriman' && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="font-bold text-slate-800">Pesanan sedang disiapkan penjual</p>
                <p className="text-sm text-slate-500">Pesanan tetap tersimpan di tab Sedang Dikirim. Penjual belum mengonfirmasi pengiriman.</p>
              </div>
            )}
            {order.status === 'Menunggu Penilaian' && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-slate-800">Beri rating untuk barang ini</p>
                  <p className="text-sm text-slate-500">Pilih 1 sampai 5 bintang untuk menyelesaikan pesanan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div role="radiogroup" aria-label={`Rating untuk ${order.product.name}`} className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={ratings[order.id] === value}
                        aria-label={`${value} bintang`}
                        onClick={() => setRatings((currentRatings) => ({ ...currentRatings, [order.id]: value }))}
                        className={`text-2xl transition hover:scale-110 ${value <= (ratings[order.id] ?? 0) ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => submitRating(order.id)}
                    disabled={!ratings[order.id]}
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Kirim Rating
                  </button>
                </div>
              </div>
            )}
            {order.status === 'Selesai' && order.rating && (
              <p className="text-sm font-semibold text-slate-600">Rating Anda: <span className="text-amber-500">{'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}</span></p>
            )}
          </article>
        ))
      )}
    </div>
  );
}