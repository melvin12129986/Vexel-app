'use client';
import { useEffect, useState } from 'react';
import { useMarket, type Product } from '@/context/MarketContext';
import Link from 'next/link';

const promotions = [
  { eyebrow: 'MARKETPLACE GAME FAVORITMU', title: 'Loot bagus, harga bersahabat.', description: 'Temukan item incaranmu dan lanjutkan petualangan tanpa jeda.', accent: 'from-slate-950 via-sky-950 to-[#008bd0]' },
  { eyebrow: 'TRANSAKSI LEBIH TENANG', title: 'Bukti transaksi, pilihanmu.', description: 'Pilih bukti pengiriman saat checkout untuk pengalaman belanja ekstra yakin.', accent: 'from-indigo-950 via-blue-900 to-cyan-700' },
  { eyebrow: 'WAKTUNYA UPGRADE', title: 'Gear baru. Main lebih seru.', description: 'Jelajahi katalog item pilihan dari berbagai game.', accent: 'from-violet-950 via-fuchsia-900 to-rose-700' }
];

const formatPrice = (price: number) => `Rp ${price.toLocaleString('id-ID')}`;

export default function HomePage() {
  const { products, searchQuery, setSearchQuery } = useMarket();
  const [activePromotion, setActivePromotion] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePromotion((current) => (current + 1) % promotions.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const categories = ['Semua', ...Array.from(new Set(products.map((product) => product.game)))];
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'Semua' || product.game === activeCategory;
    const query = searchQuery.trim().toLocaleLowerCase();
    const matchesSearch = !query || `${product.name} ${product.game} ${product.category}`.toLocaleLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const highlightedProduct = products.length > 0 ? products[activePromotion % products.length] : null;
  const promotion = promotions[activePromotion];

  return (
    <div className="space-y-12 pb-8">
      <section aria-label="Promosi" className={`relative isolate min-h-[360px] overflow-hidden rounded-[2rem] bg-gradient-to-br ${promotion.accent} p-7 text-white shadow-2xl shadow-sky-900/20 sm:min-h-[410px] sm:p-12`}>
        {highlightedProduct && (
          <img
            key={`${activePromotion}-${highlightedProduct.id}`}
            src={highlightedProduct.image}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full animate-[fade-in_700ms_ease-out] object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/10" />
        <div className="flex min-h-[300px] flex-col justify-between gap-8 sm:min-h-[305px] sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] text-sky-100 backdrop-blur">
              {promotion.eyebrow}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">{promotion.title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-sky-50/90 sm:text-base">{promotion.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {highlightedProduct ? (
                <Link href={`/product/${highlightedProduct.id}`} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50">
                  Lihat pilihan item <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <a href="#katalog" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg">Jelajahi katalog</a>
              )}
              <Link href="/seller" className="rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                Mulai berjualan
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 self-end rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur sm:self-auto">
            <button aria-label="Promosi sebelumnya" onClick={() => setActivePromotion((activePromotion + promotions.length - 1) % promotions.length)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl hover:bg-white/20">‹</button>
            <div className="flex gap-2" aria-label={`Promosi ${activePromotion + 1} dari ${promotions.length}`}>
              {promotions.map((item, index) => (
                <button
                  key={item.eyebrow}
                  aria-label={`Tampilkan promosi ${index + 1}`}
                  aria-current={index === activePromotion}
                  onClick={() => setActivePromotion(index)}
                  className={`h-2 rounded-full transition-all ${index === activePromotion ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
            <button aria-label="Promosi berikutnya" onClick={() => setActivePromotion((activePromotion + 1) % promotions.length)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl hover:bg-white/20">›</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: '⚡', title: 'Proses praktis', text: 'Pilih item, checkout, lalu pantau pesananmu.' },
          { icon: '🛡️', title: 'Bukti opsional', text: 'Tambahkan bukti pengiriman saat checkout.' },
          { icon: '💬', title: 'Terhubung langsung', text: 'Hubungi penjual lewat chat pesanan.' }
        ].map((feature) => (
          <div key={feature.title} className="flex gap-4 rounded-2xl border border-sky-100 bg-white/85 p-5 shadow-sm">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-2xl">{feature.icon}</span>
            <div>
              <h2 className="font-bold text-slate-800">{feature.title}</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">{feature.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="katalog" className="scroll-mt-28 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008bd0]">Temukan item favorit</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Jelajahi katalog</h2>
            <p className="mt-2 text-sm text-slate-500">Item game pilihan, siap menemani permainanmu.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Cari item</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari item atau game..." className="w-full rounded-xl border border-sky-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-[#008bd0] focus:ring-4 focus:ring-sky-100" />
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${category === activeCategory ? 'bg-[#008bd0] text-white shadow-md shadow-sky-900/20' : 'border border-sky-200 bg-white/80 text-slate-600 hover:border-[#008bd0] hover:text-[#008bd0]'}`}>
              {category}
            </button>
          ))}
        </div>
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-sky-300 bg-white/70 px-6 py-16 text-center">
            <span className="text-4xl">🎮</span>
            <p className="mt-3 font-bold text-slate-700">Item belum ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba kata kunci atau kategori yang berbeda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((item: Product) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Punya item untuk dijual?</p>
          <h2 className="mt-2 text-2xl font-black">Buka tokomu di Vexel</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">Atur daftar barang dan pantau pesanan langsung dari panel penjual.</p>
        </div>
        <Link href="/seller" className="mt-5 inline-flex rounded-xl bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-300 sm:mt-0">
          Buka panel penjual →
        </Link>
      </section>
    </div>
  );
}

function ProductCard({ item }: { item: Product }) {
  return (
    <Link href={`/product/${item.id}`} className="group overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/10">
      <div className="relative overflow-hidden bg-sky-100">
        <img src={item.image} alt={item.name} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#0073ad] shadow-sm backdrop-blur">{item.game}</span>
        {item.providesProof && <span className="absolute right-3 top-3 rounded-full bg-slate-900/75 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">Bukti tersedia</span>}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.category}</p>
        <h3 className="mt-1 truncate text-lg font-bold text-slate-800">{item.name}</h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Mulai dari</p>
            <p className="text-lg font-black text-[#008bd0]">{formatPrice(item.price)}</p>
          </div>
          <span className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-[#0073ad] transition group-hover:bg-[#008bd0] group-hover:text-white">Lihat item →</span>
        </div>
      </div>
    </Link>
  );
}
