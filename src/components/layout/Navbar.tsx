'use client';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import SessionActions from '@/components/auth/SessionActions';

export default function Navbar() {
  const { searchQuery, setSearchQuery } = useMarket();

  return (
    <nav className="bg-[#008bd0] p-4 sticky top-0 z-50 shadow-lg shadow-[#008bd0]/20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Logo & Mobile Actions */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <img 
              src="https://placehold.co/100x100/ffffff/008bd0?text=V&font=Montserrat" 
              alt="Vexel Logo" 
              className="h-11 w-11 rounded-xl shadow-md group-hover:scale-105 transition-transform" 
            />
            <div>
              <h1 className="text-2xl font-bold text-[#f5ebe6] leading-none tracking-tight">Vexel</h1>
              <span className="text-[10px] text-yellow-200 tracking-[0.2em] uppercase font-semibold">Gameshop</span>
            </div>
          </Link>
          
          {/* Mobile Buttons */}
          <div className="flex items-center gap-1.5 md:hidden">
            <SessionActions />
            <Link href="/chat" aria-label="Chat" title="Chat" className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/15">
              <ChatIcon />
            </Link>
            <Link href="/orders" aria-label="Pesanan" title="Pesanan saya" className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/15">
              <OrdersIcon />
            </Link>
            <Link href="/seller" aria-label="Panel penjual" title="Panel penjual" className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/15">
              <StoreIcon />
            </Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="w-full md:w-1/3 relative group">
          <input 
            type="text" 
            placeholder="Cari skin, weapon..." 
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/95 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-yellow-300/50 text-sm shadow-inner" 
          />
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white">
            Katalog
          </Link>
          <Link href="/chat" aria-label="Chat" title="Chat" className="grid h-11 w-11 place-items-center rounded-xl text-white transition hover:bg-white/15">
            <ChatIcon />
          </Link>
          <Link href="/orders" aria-label="Pesanan saya" title="Pesanan saya" className="grid h-11 w-11 place-items-center rounded-xl text-white transition hover:bg-white/15">
            <OrdersIcon />
          </Link>
          <Link href="/seller" aria-label="Panel penjual" title="Panel penjual" className="grid h-11 w-11 place-items-center rounded-xl text-white transition hover:bg-white/15">
            <StoreIcon />
          </Link>
          <SessionActions />
        </div>

      </div>
    </nav>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.7-.9L4 19l1-4.1a7.5 7.5 0 1 1 15-3.4Z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.5" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12a2.5 2.5 0 0 1 2-2.5Z" />
      <path d="M14 4v4h4M9 12h6M9 16h6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v10h16V10M3 10l2-6h14l2 6" />
      <path d="M3 10a3 3 0 0 0 5 2.2A3 3 0 0 0 12 12a3 3 0 0 0 4 0 3 3 0 0 0 5-2M9 20v-5h6v5" />
    </svg>
  );
}