'use client';
import { useMarket } from '@/context/MarketContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axiosClient from '@/lib/axiosClient';
import { SERVICE_FEE_RATE, PROOF_FEE_RATE } from '@/lib/pricing';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, orders, selectedQty, user, setOrders } = useMarket();

  const [wantsProof, setWantsProof] = useState(false);
  const [checkoutQty, setCheckoutQty] = useState(selectedQty);
  const [inGameNickname, setInGameNickname] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // State Voucher
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // State Checkout
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const existingOrderId = searchParams.get('orderId');
  const qtyFromUrl = Number(searchParams.get('qty'));

  const existingOrder = orders.find(
    (order) =>
      order.id === existingOrderId &&
      order.product.id === Number(id) &&
      order.buyer === user?.username &&
      order.status === 'Menunggu Pembayaran'
  );
  const product =
    existingOrder?.product ?? products.find((p) => p.id === Number(id));

  useEffect(() => {
    if (existingOrder) {
      setCheckoutQty(existingOrder.qty);
      setWantsProof(existingOrder.wantsProof);
      setInGameNickname(existingOrder.inGameNickname || '');
      setPendingOrderId(existingOrder.id);
      setAppliedVoucherCode(existingOrder.voucherCode ?? null);
      setVoucherInput(existingOrder.voucherCode ?? '');
      setVoucherDiscount(existingOrder.voucherDiscount ?? 0);
    } else {
      const initialQty =
        Number.isFinite(qtyFromUrl) && qtyFromUrl > 0 ? qtyFromUrl : selectedQty;
      setCheckoutQty(initialQty);
      setWantsProof(false);
      setPendingOrderId(null);
    }
  }, [existingOrder, id, qtyFromUrl, selectedQty]);

  if (!product) return null;

  // Perhitungan ringkasan tampilan (divalidasi ulang 100% di server saat checkout)
  const subtotal = existingOrder
    ? existingOrder.subtotal
    : Math.round(product.price * checkoutQty);

  const serviceFee = existingOrder
    ? existingOrder.serviceFee
    : Math.round(subtotal * SERVICE_FEE_RATE);

  const proofFee = existingOrder
    ? existingOrder.proofFee
    : wantsProof && product.providesProof
    ? Math.round(subtotal * PROOF_FEE_RATE)
    : 0;

  const effectiveVoucherDiscount = existingOrder
    ? existingOrder.voucherDiscount
    : Math.min(voucherDiscount, subtotal);

  const discountedSubtotal = Math.max(0, subtotal - effectiveVoucherDiscount);
  const total = existingOrder
    ? existingOrder.total
    : discountedSubtotal + serviceFee + proofFee;

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setVoucherMessage({
        type: 'error',
        text: 'Masukkan kode voucher terlebih dahulu.'
      });
      return;
    }

    setValidatingVoucher(true);
    setVoucherMessage(null);

    try {
      const response = await axiosClient.post('/api/vouchers/validate', {
        code,
        productId: product.id,
        qty: checkoutQty,
        wantsProof
      });

      const data = response.data;
      if (data.valid && data.pricing) {
        setAppliedVoucherCode(data.voucher.code);
        setVoucherDiscount(Number(data.pricing.voucherDiscount ?? 0));
        setVoucherMessage({
          type: 'success',
          text: data.message || `Voucher ${data.voucher.code} berhasil diterapkan!`
        });
      }
    } catch (error: any) {
      setAppliedVoucherCode(null);
      setVoucherDiscount(0);
      setVoucherMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Kode voucher tidak valid atau tidak memenuhi syarat.'
      });
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucherCode(null);
    setVoucherDiscount(0);
    setVoucherInput('');
    setVoucherMessage(null);
  };

  const beginPayment = async () => {
    if (processingPayment) return;
    setPaymentError(null);

    if (!existingOrder && !inGameNickname.trim()) {
      setPaymentError('Silakan isi Nickname In-Game terlebih dahulu untuk tujuan trade.');
      return;
    }

    setProcessingPayment(true);

    try {
      const response = await axiosClient.post('/api/midtrans/checkout', {
        orderId: pendingOrderId,
        productId: product.id,
        qty: checkoutQty,
        wantsProof,
        voucherCode: appliedVoucherCode,
        inGameNickname: inGameNickname.trim()
      });

      const { order } = response.data;
      if (!order) {
        throw new Error('Gagal membuat pesanan.');
      }

      // Masukkan langsung ke daftar pesanan berstatus Menunggu Pembayaran (Perlu Dibayar)
      setOrders((currentOrders) => {
        const exists = currentOrders.some((item) => item.id === order.id);
        if (exists) {
          return currentOrders.map((item) => (item.id === order.id ? order : item));
        }
        return [order, ...currentOrders];
      });

      // Langsung redirect ke halaman Pesanan Saya (tab Perlu Dibayar) dan buka Midtrans Snap di sana
      // sehingga user tidak bisa melakukan spam klik tombol Bayar Sekarang
      router.replace(`/orders?payOrderId=${encodeURIComponent(order.id)}`);
    } catch (error: any) {
      setPaymentError(
        error?.response?.data?.error ||
          error?.message ||
          'Gagal memulai pembayaran Midtrans.'
      );
      setProcessingPayment(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* 1. Data Tujuan Trade */}
        <div className="bg-white/90 p-6 rounded-3xl shadow-xl border border-sky-100">
          <h2 className="text-lg font-bold text-[#008bd0] mb-4">📋 Data Tujuan Trade</h2>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Nickname / ID In-Game Penerima
          </label>
          <input
            type="text"
            required
            disabled={Boolean(existingOrder) || processingPayment}
            value={inGameNickname}
            onChange={(e) => setInGameNickname(e.target.value)}
            placeholder="Masukkan Nickname In-Game atau Steam Trade URL"
            className="w-full px-4 py-3 border-2 border-sky-200 focus:border-[#008bd0] rounded-xl outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* 2. Opsi Bukti Pengiriman (+5%) */}
        {product.providesProof && (
          <label className="flex cursor-pointer items-start gap-3 rounded-3xl border-2 border-sky-200 bg-white/90 p-6 shadow-xl">
            <input
              type="checkbox"
              checked={wantsProof}
              disabled={Boolean(existingOrder) || Boolean(pendingOrderId) || processingPayment}
              onChange={(event) => setWantsProof(event.target.checked)}
              className="mt-1 h-5 w-5 accent-[#008bd0] disabled:cursor-not-allowed"
            />
            <span>
              <span className="block font-bold text-slate-800">
                Saya ingin bukti pengiriman (+5% dari harga barang)
              </span>
              <span className="text-sm text-slate-500">
                Penjual wajib mengunggah foto bukti pengiriman sebelum mengonfirmasi pesanan dikirim.
              </span>
            </span>
          </label>
        )}

        {/* 3. Kode Voucher */}
        <div className="bg-white/90 p-6 rounded-3xl shadow-xl border border-sky-100">
          <h2 className="text-lg font-bold text-[#008bd0] mb-2">🎟️ Kode Voucher Promo</h2>
          <p className="text-xs text-slate-500 mb-4">
            Punya kode promo? Masukkan di bawah untuk mendapatkan potongan harga base barang.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={voucherInput}
              disabled={
                Boolean(existingOrder) ||
                Boolean(pendingOrderId) ||
                Boolean(appliedVoucherCode) ||
                processingPayment
              }
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              placeholder="Contoh: VEXEL10 / HEMAT20K / NEWPLAYER"
              className="flex-1 px-4 py-3 border-2 border-sky-200 focus:border-[#008bd0] rounded-xl outline-none uppercase font-bold text-sm disabled:bg-slate-100 disabled:text-slate-500"
            />
            {appliedVoucherCode && !existingOrder && !pendingOrderId ? (
              <button
                type="button"
                disabled={processingPayment}
                onClick={handleRemoveVoucher}
                className="px-5 py-3 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition disabled:opacity-50"
              >
                Hapus Voucher
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={
                  validatingVoucher ||
                  Boolean(existingOrder) ||
                  Boolean(pendingOrderId) ||
                  processingPayment ||
                  !voucherInput.trim()
                }
                className="px-6 py-3 rounded-xl bg-sky-100 hover:bg-[#008bd0] text-[#0073ad] hover:text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validatingVoucher ? 'Memeriksa...' : 'Terapkan'}
              </button>
            )}
          </div>

          {voucherMessage && (
            <p
              role="status"
              className={`mt-3 text-xs font-semibold px-3.5 py-2.5 rounded-xl border ${
                voucherMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {voucherMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* 4. Ringkasan Pembayaran */}
      <div className="bg-white/90 p-6 rounded-3xl shadow-xl border border-sky-100 h-fit space-y-4">
        <h2 className="text-lg font-bold text-[#008bd0] border-b-2 border-sky-100 pb-3">
          Ringkasan Pembayaran
        </h2>

        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="h-14 w-14 rounded-xl object-cover border border-sky-100"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase text-[#008bd0]">{product.game}</p>
            <p className="font-bold text-slate-800 truncate">{product.name}</p>
            <p className="text-xs text-slate-500">Penjual: {product.seller}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-700">
            <span>
              Harga barang ({checkoutQty} × Rp {product.price.toLocaleString('id-ID')})
            </span>
            <span className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          {effectiveVoucherDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Potongan Voucher ({appliedVoucherCode})</span>
              <span>- Rp {effectiveVoucherDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Biaya layanan (4%)</span>
            <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
          </div>

          {wantsProof && product.providesProof && (
            <div className="flex justify-between text-slate-600">
              <span>Biaya bukti pengiriman (5%)</span>
              <span>Rp {proofFee.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-sky-100 pt-3 font-bold text-lg">
          <span>Total Bayar</span>
          <span className="text-[#008bd0]">Rp {total.toLocaleString('id-ID')}</span>
        </div>

        {paymentError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
          >
            {paymentError}
          </div>
        )}

        <button
          onClick={beginPayment}
          disabled={processingPayment}
          className="w-full bg-[#008bd0] hover:bg-[#0073ad] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition"
        >
          {processingPayment ? 'Membuat Pesanan...' : 'Bayar Sekarang'}
        </button>

        <p className="text-[11px] text-center text-slate-400">
          Setelah menekan Bayar Sekarang, pesanan otomatis masuk ke daftar Perlu Dibayar dan kamu akan diarahkan ke halaman pesanan.
        </p>
      </div>
    </div>
  );
}