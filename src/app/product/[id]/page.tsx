'use client';
import { useMarket, type Product } from '@/context/MarketContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { products, selectedQty, setSelectedQty } = useMarket();

  const product = products.find((p: Product) => p.id === Number(id));

  useEffect(() => {
    if (product) {
      setSelectedQty(product.minBuy);
    }
  }, [product, setSelectedQty]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-700">Produk tidak ditemukan.</h2>
        <button onClick={() => router.push('/')} className="mt-4 bg-[#008bd0] text-white px-4 py-2 rounded-xl text-sm font-bold">
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const handleQtyChange = (val: number) => {
    const validVal = Math.max(product.minBuy, Math.min(product.stock, val));
    setSelectedQty(validVal);
  };

  const currentTotal = selectedQty * product.price;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.push('/')} className="text-sm bg-white/80 hover:bg-white px-4 py-2 rounded-xl text-slate-700 font-semibold shadow-sm border border-sky-200 transition-all hover:-translate-x-1">
        ← Kembali ke Katalog
      </button>

      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-sky-200 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/5 flex flex-col gap-4">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-sky-50 shadow-inner bg-sky-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="w-full md:w-3/5 space-y-6 flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-[#008bd0] font-black uppercase tracking-wider bg-sky-100 px-3 py-1 rounded-full">{product.game}</span>
            <h2 className="text-3xl font-bold text-slate-800 leading-tight mt-2">{product.name}</h2>
            <p className="text-sm text-slate-500 mt-2">
              Penjual: <span className="text-[#008bd0] font-bold">{product.seller}</span>
              <span className="ml-2 text-amber-500">
                {product.ratingCount && product.rating !== undefined
                  ? `★ ${product.rating.toFixed(1)} (${product.ratingCount} ulasan)`
                  : 'Belum ada rating'}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-sky-50/80 p-5 rounded-2xl border border-sky-200/60 shadow-inner">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Harga Satuan</p>
              <p className="text-xl font-bold text-[#008bd0]">Rp {product.price.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Min. Beli</p>
              <p className="text-lg font-semibold text-slate-700">{product.minBuy}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Stok</p>
              <p className="text-lg font-semibold text-slate-700">{product.stock}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Deskripsi & Ketentuan Trade</h3>
            <div className="bg-white/60 p-4 rounded-2xl border border-sky-100 shadow-sm text-sm text-slate-600 leading-relaxed whitespace-pre-line h-28 overflow-y-auto">
              {product.desc || "Tidak ada deskripsi tambahan."}
            </div>
            <p className="text-sm text-slate-600">
              {product.providesProof
                ? 'Opsi bukti transaksi tersedia saat checkout dengan biaya tambahan 5%.'
                : 'Penjual tidak menyediakan bukti transaksi.'}
            </p>
          </div>

          <div className="border-t border-sky-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1">Atur Jumlah</label>
                <input 
                  type="number" 
                  min={product.minBuy} 
                  max={product.stock} 
                  value={selectedQty}
                  onChange={(e) => handleQtyChange(Number(e.target.value))}
                  className="w-24 px-3 py-2.5 bg-white border-2 border-sky-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-[#008bd0] text-center shadow-sm" 
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">Harga barang</p>
                <p className="text-2xl font-black text-[#008bd0]">Rp {currentTotal.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => router.push(`/payment/${product.id}?qty=${selectedQty}`)} className="flex-1 sm:flex-none bg-gradient-to-r from-[#008bd0] to-[#006a9d] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:-translate-y-1 transition-transform">
                Beli Sekarang →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}