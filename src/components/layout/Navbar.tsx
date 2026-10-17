'use client';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';

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
          <div className="flex gap-2 md:hidden">
            <Link href="/chat" aria-label="Chat" className="rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30">
              💬
            </Link>
            <Link href="/orders" className="text-xs bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-2 rounded-xl backdrop-blur-sm">
              📦
            </Link>
            <Link href="/seller" className="text-xs bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-2 rounded-xl backdrop-blur-sm">
              Penjual
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
        <div className="hidden md:flex items-center gap-3">
          <Link href="/" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white">
            Katalog
          </Link>
          <Link href="/chat" className="text-sm bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2">
            💬 Chat
          </Link>
          <Link href="/orders" className="text-sm bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2">
            📦 Pesanan Saya
          </Link>
          <Link href="/seller" className="text-sm bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-xl backdrop-blur-sm transition-all">
            Mulai Jualan
          </Link>
        </div>

      </div>
    </nav>
  );
}