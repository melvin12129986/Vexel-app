'use client';
import { useMarket } from '@/context/MarketContext';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, orders, selectedQty, user, executeWithLoading, setOrders } = useMarket();
  const [showQRIS, setShowQRIS] = useState(false);
  const [wantsProof, setWantsProof] = useState(false);
  const [checkoutQty, setCheckoutQty] = useState(selectedQty);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const existingOrderId = searchParams.get('orderId');
  const existingOrder = orders.find((order) =>
    order.id === existingOrderId &&
    order.product.id === Number(id) &&
    order.buyer === user?.username &&
    order.status === 'Menunggu Pembayaran'
  );
  const product = existingOrder?.product ?? products.find((p: any) => p.id === Number(id));

  useEffect(() => {
    if (existingOrder) {
      setCheckoutQty(existingOrder.qty);
      setWantsProof(existingOrder.wantsProof);
      setPendingOrderId(existingOrder.id);
    } else {
      setCheckoutQty(selectedQty);
      setWantsProof(false);
      setPendingOrderId(null);
    }
  }, [existingOrder, id, selectedQty]);

  if (!product) return null;

  const subtotal = product.price * checkoutQty;
  const proofFee = existingOrder?.proofFee ?? (wantsProof && product.providesProof ? Math.round(subtotal * 0.05) : 0);
  const total = existingOrder?.total ?? subtotal + proofFee;

  const beginPayment = () => {
    if (pendingOrderId) {
      setShowQRIS(true);
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    const order = {
      id: orderId,
      product,
      qty: checkoutQty,
      buyer: user?.username ?? 'Player',
      wantsProof,
      proofFee,
      total,
      status: 'Menunggu Pembayaran' as const,
      date: 'Hari ini'
    };
    setOrders((currentOrders) => [order, ...currentOrders]);
    setPendingOrderId(orderId);
    setShowQRIS(true);
  };

  const processPayment = () => {
    if (!pendingOrderId) return;
    setShowQRIS(false);
    executeWithLoading(() => {
      setOrders((currentOrders) => currentOrders.map((order) =>
        order.id === pendingOrderId && order.status === 'Menunggu Pembayaran'
          ? { ...order, status: 'Menunggu Pengiriman' }
          : order
      ));
      router.push('/orders');
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 p-6 rounded-3xl shadow-xl">
            <h2 className="text-lg font-bold text-[#008bd0] mb-4">📋 Data Tujuan Trade</h2>
            <input type="text" placeholder="Nickname In-Game" className="w-full px-4 py-3 border-2 border-sky-200 rounded-xl outline-none" />
          </div>
          <div className="bg-white/90 p-6 rounded-3xl shadow-xl">
             <h2 className="text-lg font-bold text-[#008bd0] mb-4">💳 Metode Pembayaran</h2>
             <label className="flex items-center p-4 bg-sky-50 rounded-2xl border-2 border-[#008bd0] cursor-pointer">
              <input type="radio" checked readOnly className="w-5 h-5 accent-[#008bd0]" />
              <span className="ml-3 font-bold text-slate-700">QRIS Instant</span>
            </label>
          </div>
          {product.providesProof && (
            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border-2 border-sky-200 bg-white/90 p-6 shadow-xl">
              <input
                type="checkbox"
                checked={wantsProof}
                disabled={Boolean(existingOrder)}
                onChange={(event) => setWantsProof(event.target.checked)}
                className="mt-1 h-5 w-5 accent-[#008bd0] disabled:cursor-not-allowed"
              />
              <span>
                <span className="block font-bold text-slate-800">Saya ingin bukti pengiriman (+5%)</span>
                <span className="text-sm text-slate-500">Penjual wajib mengunggah foto bukti sebelum mengonfirmasi pengiriman.</span>
              </span>
            </label>
          )}
        </div>
        
        <div className="bg-white/90 p-6 rounded-3xl shadow-xl h-fit">
          <h2 className="text-lg font-bold text-[#008bd0] border-b-2 border-sky-100 pb-3">Ringkasan</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Harga barang ({checkoutQty} × Rp {product.price.toLocaleString('id-ID')})</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {wantsProof && product.providesProof && (
              <div className="flex justify-between text-slate-600">
                <span>Biaya bukti transaksi (5%)</span>
                <span>Rp {proofFee.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between border-t border-sky-100 pt-3 font-bold text-lg">
            <span>Total</span><span className="text-[#008bd0]">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <button onClick={beginPayment} className="w-full mt-6 bg-[#008bd0] text-white font-bold py-4 rounded-xl">Bayar Sekarang</button>
        </div>
      </div>

      {showQRIS && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Scan QRIS</h3>
            <div className="w-48 h-48 bg-slate-800 rounded mx-auto my-6 flex items-center justify-center text-white text-xs border-4 border-sky-100">QR_CODE_MOCKUP</div>
            <p className="text-2xl font-black text-[#008bd0] mb-6">Rp {total.toLocaleString('id-ID')}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowQRIS(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-xl">Batal</button>
              <button onClick={processPayment} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl">Bayar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}