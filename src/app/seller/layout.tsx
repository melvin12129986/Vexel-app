import SellerNavigation from '@/components/seller/SellerNavigation';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-800">
      <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-8">
        <a href="/seller" className="flex items-center gap-2.5" aria-label="Vexel Seller Center">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#008bd0] text-lg font-black text-white">V</span>
          <span className="leading-tight">
            <span className="block text-xl font-black tracking-tight text-[#087cc1]">vexel</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">seller center</span>
          </span>
        </a>
        <div className="flex items-center gap-3 sm:gap-6">
          <a href="/" className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#087cc1] sm:flex">
            <span aria-hidden="true">⌂</span> Belanja di Vexel
          </a>
          <a href="/" className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-lg" aria-hidden="true">🎮</span>
            <span className="hidden sm:inline">Kembali ke market</span>
          </a>
        </div>
      </header>
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1600px]">
        <aside className="hidden w-[232px] shrink-0 border-r border-slate-200 bg-white lg:block">
          <SellerNavigation />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <SellerNavigation />
          </div>
          <main className="mx-auto w-full max-w-[1280px] space-y-6 p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
