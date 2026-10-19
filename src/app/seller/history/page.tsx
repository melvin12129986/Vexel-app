'use client';
import { useMarket } from '@/context/MarketContext';
import SellerOrderList from '@/components/seller/SellerOrderList';
import { useMemo, useState } from 'react';

const tabs = [
  { id: 'process', label: 'Perlu Diproses' },
  { id: 'shipped', label: 'Menunggu Konfirmasi' },
  { id: 'rating', label: 'Menunggu Rating' },
  { id: 'complete', label: 'Pesanan Selesai' },
  { id: 'cancelling', label: 'Sedang Dibatalkan' },
  { id: 'cancelled', label: 'Pesanan Dibatalkan' },
  { id: 'all', label: 'Semua Pesanan' }
] as const;

type HistoryTab = typeof tabs[number]['id'];

export default function SellerHistoryPage() {
  const { orders, user } = useMarket();
  const sellerOrders = orders.filter((order) => order.product.seller === user?.username);
  const [activeTab, setActiveTab] = useState<HistoryTab>('complete');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [proofOnly, setProofOnly] = useState(false);

  const tabOrders = (tab: HistoryTab) => {
    switch (tab) {
      case 'process':
        return sellerOrders.filter((order) => order.status === 'Menunggu Pengiriman');
      case 'shipped':
        return sellerOrders.filter((order) => order.status === 'Dikirim');
      case 'rating':
        return sellerOrders.filter((order) => order.status === 'Menunggu Penilaian');
      case 'complete':
        return sellerOrders.filter((order) => order.status === 'Selesai');
      case 'cancelling':
      case 'cancelled':
        return [];
      case 'all':
        return sellerOrders;
    }
  };

  const gameOptions = Array.from(new Set(sellerOrders.map((order) => order.product.game)));
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return tabOrders(activeTab)
      .filter((order) => (
        !query ||
        order.id.toLocaleLowerCase().includes(query) ||
        order.product.name.toLocaleLowerCase().includes(query) ||
        order.buyer.toLocaleLowerCase().includes(query)
      ))
      .filter((order) => selectedGame === 'all' || order.product.game === selectedGame)
      .filter((order) => !proofOnly || order.wantsProof)
      .sort((a, b) => sortOrder === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id));
  }, [activeTab, searchQuery, selectedGame, proofOnly, sortOrder, sellerOrders]);

  const totalSales = tabOrders('complete').reduce(
    (total, order) => total + (order.sellerEarning ?? order.subtotal + order.proofFee),
    0
  );
  const counts: Record<HistoryTab, number> = {
    process: tabOrders('process').length,
    shipped: tabOrders('shipped').length,
    rating: tabOrders('rating').length,
    complete: tabOrders('complete').length,
    cancelling: tabOrders('cancelling').length,
    cancelled: tabOrders('cancelled').length,
    all: sellerOrders.length
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p><span className="mr-2 text-blue-600" aria-hidden="true">ⓘ</span>Kelola dan pantau semua transaksi tokomu dari halaman ini.</p>
        <span className="shrink-0 font-semibold text-[#2678d4]">Total pendapatan bersih selesai: Rp {totalSales.toLocaleString('id-ID')}</span>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#087cc1]">Pesanan</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">Riwayat Pesanan</h2>
      </div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div role="tablist" aria-label="Filter status pesanan" className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`history-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max flex-1 border-b-[3px] px-4 py-4 text-sm font-medium transition sm:px-5 ${activeTab === tab.id ? 'border-[#3788e8] text-[#3788e8]' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.id ? 'text-[#3788e8]' : 'text-slate-400'}`}>{counts[tab.id]}</span>
            </button>
          ))}
        </div>
        <div className="space-y-4 p-4">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <select aria-label="Jenis pencarian" className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option>Nomor Pesanan</option>
              <option>Nama Barang</option>
              <option>Nama Pembeli</option>
            </select>
            <label className="relative">
              <span className="sr-only">Cari nomor pesanan</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">⌕</span>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nomor, barang, pembeli" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
            </label>
            <select aria-label="Filter game" value={selectedGame} onChange={(event) => setSelectedGame(event.target.value)} className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option value="all">Semua Game</option>
              {gameOptions.map((game) => <option key={game} value={game}>{game}</option>)}
            </select>
            <select aria-label="Urutkan riwayat" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setProofOnly(false)} className={`rounded-full border px-3 py-2 text-sm transition ${!proofOnly ? 'border-blue-500 text-blue-600' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>Semua Pesanan</button>
            <button onClick={() => setProofOnly(true)} className={`rounded-full border px-3 py-2 text-sm transition ${proofOnly ? 'border-blue-500 text-blue-600' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>Bukti Diminta</button>
            <button onClick={() => setActiveTab('process')} className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-blue-400 hover:text-blue-600">Perlu Diproses</button>
          </div>
        </div>
      </section>
      <section role="tabpanel" aria-labelledby={`history-tab-${activeTab}`} className="min-h-64 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {filteredOrders.length > 0 ? (
          <SellerOrderList orders={filteredOrders} history />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="relative grid h-36 w-36 place-items-center rounded-full bg-sky-50">
              <span className="text-6xl" aria-hidden="true">🧾</span>
              <span className="absolute right-3 top-2 grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-2xl font-black text-blue-500">?</span>
            </div>
            <p className="mt-5 font-semibold text-slate-700">Pesanan tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        )}
      </section>
    </section>
  );
}
