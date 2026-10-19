'use client';
import { useMarket, type Order } from '@/context/MarketContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import axiosClient from '@/lib/axiosClient';

declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        callbacks?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_SCRIPT_URL = isProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm font-semibold text-slate-500">
          Memuat pesanan...
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payOrderIdParam = searchParams.get('payOrderId');

  const {
    orders,
    setOrders,
    setProducts,
    orderStorageError,
    user,
    refreshOrders,
    refreshProducts
  } = useMarket();

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const openedOrderRef = useRef<string | null>(null);

  const buyerOrders = orders.filter((order) => order.buyer === user?.username);
  const [activeTab, setActiveTab] = useState<
    'unpaid' | 'shipping' | 'shipped' | 'completed'
  >('unpaid');

  const checkMidtransStatus = useCallback(
    async (orderId: string, silent = false) => {
      if (!silent) {
        setBusyOrderId(orderId);
        setActionError(null);
      }
      try {
        const res = await axiosClient.get(
          `/api/midtrans/status/${encodeURIComponent(orderId)}`
        );
        if (res.data?.cancelled) {
          // Hanya dihapus jika status di Midtrans действительно cancel / expire / deny
          setOrders((current) => current.filter((item) => item.id !== orderId));
          return;
        }
        if (res.data?.order) {
          setOrders((current) =>
            current.map((item) => (item.id === orderId ? res.data.order : item))
          );
        }
        if (res.data?.settled) {
          await refreshProducts();
          setActiveTab('shipping');
        }
      } catch (error: any) {
        if (!silent) {
          setActionError(
            error?.response?.data?.error ||
              'Pembayaran belum diselesaikan di Midtrans. Silakan klik Bayar Sekarang untuk memilih metode pembayaran.'
          );
        }
      } finally {
        if (!silent) {
          setBusyOrderId(null);
        }
      }
    },
    [refreshProducts, setOrders]
  );

  const openSnapPopupForOrder = useCallback(
    async (order: Order) => {
      setActionError(null);
      setBusyOrderId(order.id);

      try {
        let token = order.snapToken;
        if (!token) {
          const res = await axiosClient.post('/api/midtrans/checkout', {
            orderId: order.id
          });
          token = res.data?.snapToken;
        }

        if (!token || !window.snap) {
          throw new Error(
            'Panel pembayaran Midtrans sedang dimuat. Silakan klik tombol Bayar Sekarang sekali lagi.'
          );
        }

        window.snap.pay(token, {
          onSuccess: async () => {
            await checkMidtransStatus(order.id, true);
            await Promise.all([refreshOrders(), refreshProducts()]);
            setActiveTab('shipping');
          },
          onPending: async () => {
            await checkMidtransStatus(order.id, true);
            await refreshOrders();
          },
          onError: async () => {
            await checkMidtransStatus(order.id, true);
          },
          onClose: async () => {
            // Saat popup Midtrans ditutup (X), pesanan TETAP ADA di tab "Perlu Dibayar"
            // Kita hanya cek ke server apakah user sebenarnya sudah bayar atau transaksi sudah expire
            await checkMidtransStatus(order.id, true);
          }
        });
      } catch (error: any) {
        setActionError(
          error?.response?.data?.error ||
            error?.message ||
            'Gagal membuka panel pembayaran Midtrans.'
        );
      } finally {
        setBusyOrderId(null);
      }
    },
    [checkMidtransStatus, refreshOrders, refreshProducts]
  );

  // Jika baru di-redirect dari halaman Checkout (?payOrderId=...), otomatis buka tab Perlu Dibayar & tampilkan popup Midtrans
  useEffect(() => {
    if (!payOrderIdParam) return;
    setActiveTab('unpaid');

    const targetOrder = orders.find(
      (item) =>
        item.id === payOrderIdParam &&
        item.buyer === user?.username &&
        item.status === 'Menunggu Pembayaran'
    );

    if (!targetOrder) return;
    if (!snapLoaded && !window.snap) return;
    if (openedOrderRef.current === payOrderIdParam) return;

    openedOrderRef.current = payOrderIdParam;
    // Bersihkan query param agar jika halaman di-refresh tidak terus memunculkan popup
    router.replace('/orders', { scroll: false });
    openSnapPopupForOrder(targetOrder);
  }, [payOrderIdParam, orders, user?.username, snapLoaded, router, openSnapPopupForOrder]);

  // Sinkronisasi status ke Midtrans saat halaman dibuka untuk mengecek apakah ada yang sudah lunas atau sudah lewat batas waktu (expire)
  useEffect(() => {
    const unpaidWithSnap = orders.filter(
      (order) =>
        order.buyer === user?.username &&
        order.status === 'Menunggu Pembayaran' &&
        order.snapToken
    );
    if (unpaidWithSnap.length === 0) return;

    let cancelled = false;
    (async () => {
      let anySettled = false;
      let anyCancelled = false;
      for (const item of unpaidWithSnap) {
        try {
          const res = await axiosClient.get(
            `/api/midtrans/status/${encodeURIComponent(item.id)}`
          );
          if (res.data?.settled) {
            anySettled = true;
          }
          if (res.data?.cancelled) {
            anyCancelled = true;
          }
        } catch {
          // Abaikan jika user baru menutup popup dan belum memilih metode pembayaran di Midtrans
        }
      }
      if (!cancelled && (anySettled || anyCancelled)) {
        await Promise.all([refreshOrders(), refreshProducts()]);
        if (anySettled) {
          setActiveTab('shipping');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orders.length, user?.username, refreshOrders, refreshProducts]);

  const ordersByTab = {
    unpaid: buyerOrders.filter((order) => order.status === 'Menunggu Pembayaran'),
    shipping: buyerOrders.filter((order) => order.status === 'Menunggu Pengiriman'),
    shipped: buyerOrders.filter(
      (order) =>
        order.status === 'Dikirim' || order.status === 'Menunggu Penilaian'
    ),
    completed: buyerOrders.filter((order) => order.status === 'Selesai')
  };

  const tabs = [
    { id: 'unpaid' as const, label: 'Perlu Dibayar', count: ordersByTab.unpaid.length },
    { id: 'shipping' as const, label: 'Sedang Dikirim', count: ordersByTab.shipping.length },
    { id: 'shipped' as const, label: 'Sudah Dikirim', count: ordersByTab.shipped.length },
    { id: 'completed' as const, label: 'Selesai', count: ordersByTab.completed.length }
  ];
  const visibleOrders = ordersByTab[activeTab];

  const cancelUnpaidOrder = async (orderId: string) => {
    if (!confirm('Apakah kamu yakin ingin membatalkan pesanan ini?')) return;
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      await axiosClient.delete(`/api/orders/${encodeURIComponent(orderId)}`);
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== orderId)
      );
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error || 'Gagal membatalkan pesanan.'
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const confirmReceipt = async (orderId: string) => {
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      const response = await axiosClient.patch(`/api/orders/${encodeURIComponent(orderId)}`, {
        action: 'confirm_receipt'
      });
      if (response.data?.order) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? response.data.order : order
          )
        );
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error || 'Gagal mengonfirmasi penerimaan barang.'
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const submitRating = async (orderId: string) => {
    const rating = ratings[orderId];
    if (!rating) return;

    setBusyOrderId(orderId);
    setActionError(null);
    try {
      const response = await axiosClient.patch(`/api/orders/${encodeURIComponent(orderId)}`, {
        action: 'submit_rating',
        rating
      });

      if (response.data?.order) {
        setOrders((currentOrders) =>
          currentOrders.map((currentOrder) =>
            currentOrder.id === orderId ? response.data.order : currentOrder
          )
        );
      }

      if (response.data?.product) {
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === response.data.product.id
              ? response.data.product
              : product
          )
        );
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error || 'Gagal menyimpan rating pesanan.'
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {MIDTRANS_CLIENT_KEY && (
        <Script
          src={SNAP_SCRIPT_URL}
          data-client-key={MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
          onLoad={() => setSnapLoaded(true)}
          onReady={() => setSnapLoaded(true)}
        />
      )}

      <h2 className="text-2xl font-bold text-slate-800">📦 Pesanan Saya</h2>
      {(orderStorageError || actionError) && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {actionError || orderStorageError}
        </p>
      )}
      <div
        role="tablist"
        aria-label="Status pesanan"
        className="flex overflow-x-auto rounded-2xl border border-sky-100 bg-white/90 shadow-sm"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-max flex-1 border-b-[3px] px-5 py-4 text-sm font-bold transition ${
              activeTab === tab.id
                ? 'border-[#008bd0] text-[#008bd0]'
                : 'border-transparent text-slate-600 hover:bg-sky-50'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>
      {visibleOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-300 bg-white/75 px-6 py-14 text-center">
          <span className="text-4xl" aria-hidden="true">
            {activeTab === 'completed' ? '🧾' : '📦'}
          </span>
          <p className="mt-3 font-bold text-slate-700">
            {buyerOrders.length === 0
              ? 'Belum ada pesanan'
              : `Belum ada pesanan ${tabs
                  .find((tab) => tab.id === activeTab)
                  ?.label.toLocaleLowerCase()}`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Pesananmu akan muncul di sini sesuai statusnya.
          </p>
        </div>
      ) : (
        visibleOrders.map((order) => (
          <article
            key={order.id}
            className="space-y-4 rounded-3xl border border-sky-200 bg-white/90 p-5 shadow-lg"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <img
                src={order.product.image}
                alt={order.product.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="w-full flex-1 space-y-1">
                <h3 className="font-bold text-slate-800">{order.product.name}</h3>
                <p className="text-xs text-slate-500">
                  {order.id} • {order.qty} × Rp{' '}
                  {order.product.price.toLocaleString('id-ID')}
                  {order.inGameNickname ? ` • Nickname: ${order.inGameNickname}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  Biaya layanan 4%: Rp {order.serviceFee.toLocaleString('id-ID')}
                  {order.wantsProof
                    ? ` • Bukti pengiriman 5%: Rp ${order.proofFee.toLocaleString('id-ID')}`
                    : ''}
                  {order.voucherDiscount > 0
                    ? ` • Diskon Voucher (${order.voucherCode}): -Rp ${order.voucherDiscount.toLocaleString('id-ID')}`
                    : ''}
                </p>
                {order.proofImage && (
                  <a
                    href={order.proofImage}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 mr-3 inline-block text-sm font-semibold text-[#008bd0] underline"
                  >
                    Lihat bukti pengiriman
                  </a>
                )}
                <Link
                  href={`/chat/${order.id}`}
                  className="mt-2 inline-block rounded-lg bg-sky-100 px-3 py-2 text-sm font-bold text-[#008bd0]"
                >
                  Chat Penjual
                </Link>
              </div>
              <div className="text-left md:text-right">
                <p className="font-black text-[#008bd0]">
                  Rp {order.total.toLocaleString('id-ID')}
                </p>
                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  {order.status}
                </span>
              </div>
            </div>

            {order.status === 'Dikirim' && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-slate-800">
                    Penjual sudah mengirim pesanan
                  </p>
                  <p className="text-sm text-slate-500">
                    Konfirmasi penerimaan barang untuk melanjutkan ke pemberian rating.
                  </p>
                </div>
                <button
                  onClick={() => confirmReceipt(order.id)}
                  disabled={busyOrderId === order.id}
                  className="rounded-xl bg-[#008bd0] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0073ad] disabled:opacity-50"
                >
                  {busyOrderId === order.id
                    ? 'Memproses...'
                    : 'Konfirmasi Barang Diterima'}
                </button>
              </div>
            )}

            {order.status === 'Menunggu Pembayaran' && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-slate-800">
                    Pesanan menunggu pembayaran
                  </p>
                  <p className="text-sm text-slate-500">
                    Selesaikan pembayaran via Midtrans atau batalkan pesanan jika tidak jadi membeli.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => cancelUnpaidOrder(order.id)}
                    disabled={busyOrderId === order.id}
                    className="rounded-xl border border-rose-300 bg-white px-4 py-3 text-center text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    Batalkan Pesanan
                  </button>
                  <button
                    type="button"
                    onClick={() => checkMidtransStatus(order.id)}
                    disabled={busyOrderId === order.id}
                    className="rounded-xl border border-amber-400 bg-white px-4 py-3 text-center text-sm font-bold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    {busyOrderId === order.id ? 'Memeriksa...' : 'Cek Status Bayar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openSnapPopupForOrder(order)}
                    disabled={busyOrderId === order.id}
                    className="rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                  >
                    Bayar Sekarang
                  </button>
                </div>
              </div>
            )}

            {order.status === 'Menunggu Pengiriman' && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="font-bold text-slate-800">
                  Pembayaran terverifikasi • Sedang disiapkan penjual
                </p>
                <p className="text-sm text-slate-500">
                  Pesanan tetap tersimpan di tab Sedang Dikirim. Penjual akan segera mengirim item ke akunmu.
                </p>
              </div>
            )}

            {order.status === 'Menunggu Penilaian' && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-slate-800">
                    Beri rating untuk barang ini
                  </p>
                  <p className="text-sm text-slate-500">
                    Pilih 1 sampai 5 bintang untuk menyelesaikan pesanan.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    role="radiogroup"
                    aria-label={`Rating untuk ${order.product.name}`}
                    className="flex gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={ratings[order.id] === value}
                        aria-label={`${value} bintang`}
                        onClick={() =>
                          setRatings((currentRatings) => ({
                            ...currentRatings,
                            [order.id]: value
                          }))
                        }
                        className={`text-2xl transition hover:scale-110 ${
                          value <= (ratings[order.id] ?? 0)
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => submitRating(order.id)}
                    disabled={!ratings[order.id] || busyOrderId === order.id}
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyOrderId === order.id ? 'Menyimpan...' : 'Kirim Rating'}
                  </button>
                </div>
              </div>
            )}

            {order.status === 'Selesai' && order.rating && (
              <p className="text-sm font-semibold text-slate-600">
                Rating Anda:{' '}
                <span className="text-amber-500">
                  {'★'.repeat(order.rating)}
                  {'☆'.repeat(5 - order.rating)}
                </span>
              </p>
            )}
          </article>
        ))
      )}
    </div>
  );
}