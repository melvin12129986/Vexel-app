'use client';
import { useMarket } from '@/context/MarketContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { setUser, executeWithLoading } = useMarket();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = String(formData.get('username') ?? '').trim();
    if (!username) return;

    const requestedPath = new URLSearchParams(window.location.search).get('redirect');
    const redirectPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.startsWith('/login')
      ? requestedPath
      : '/';

    executeWithLoading(() => {
      setUser({ username });
      router.push(redirectPath);
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full border border-sky-200 text-center">
        <h1 className="text-4xl font-black text-[#008bd0] mb-2">Vexel</h1>
        <p className="text-sm text-slate-500 mb-8">Masuk untuk mulai trading item game.</p>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-600">Email / Username</label>
            <input name="username" type="text" required autoComplete="username" className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#008bd0] outline-none mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Password</label>
            <input name="password" type="password" required autoComplete="current-password" className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#008bd0] outline-none mt-1" />
          </div>
          <p className="text-xs text-slate-500">Mode demo: login menggunakan username saja; autentikasi akun belum terhubung ke server.</p>
          <button type="submit" className="w-full bg-[#008bd0] hover:bg-[#0073ad] text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg hover:-translate-y-1">
            Masuk Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}