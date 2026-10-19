'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axiosClient from '@/lib/axiosClient';

type UserVoucherItem = {
  id: string | number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  expiresAt: string | null;
};

export default function ProfilePage() {
  const { user, signOut } = useMarket();
  const router = useRouter();

  const [showVouchers, setShowVouchers] = useState(false);
  const [vouchers, setVouchers] = useState<UserVoucherItem[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  if (!user) return null;

  const handleToggleVouchers = async () => {
    const nextState = !showVouchers;
    setShowVouchers(nextState);

    if (nextState) {
      setLoadingVouchers(true);
      setVoucherError(null);
      try {
        const res = await axiosClient.get('/api/vouchers');
        if (Array.isArray(res.data?.vouchers)) {
          setVouchers(res.data.vouchers);
        }
      } catch (error: any) {
        setVoucherError(
          error?.response?.data?.error || 'Gagal memuat daftar voucher.'
        );
      } finally {
        setLoadingVouchers(false);
      }
    }
  };

  const handleCopyCode = async (id: string | number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1800);
    } catch {
      // Abaikan jika browser tidak mendukung clipboard API
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008bd0]">Akun Vexel</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Profil Saya</h1>
      </header>

      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-[#008bd0]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{user.username}</h2>
            {user.email && <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Link
            href="/orders"
            className="flex-1 rounded-xl bg-sky-50 px-4 py-3 text-center text-sm font-bold text-[#0073ad] transition hover:bg-sky-100"
          >
            Lihat Pesanan Saya
          </Link>
          <button
            type="button"
            onClick={handleToggleVouchers}
            className="flex-1 rounded-xl bg-[#008bd0] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#0073ad]"
          >
            🎟️ {showVouchers ? 'Tutup Daftar Voucher' : 'Lihat Voucher Saya'}
          </button>
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
          >
            Keluar
          </button>
        </div>
      </div>

      {showVouchers && (
        <div className="rounded-3xl border border-sky-200 bg-white/95 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">🎟️ Voucher Saya</h2>
              <p className="text-xs text-slate-500">
                Setiap voucher hanya berlaku untuk 1× pemakaian dan otomatis terhapus setelah digunakan.
              </p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-[#0073ad]">
              {vouchers.length} Tersedia
            </span>
          </div>

          {loadingVouchers ? (
            <p className="py-8 text-center text-sm font-semibold text-slate-500">
              Memuat daftar voucher...
            </p>
          ) : voucherError ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700"
            >
              {voucherError}
            </p>
          ) : vouchers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 py-10 text-center">
              <span className="text-3xl">🎟️</span>
              <p className="mt-2 text-sm font-bold text-slate-700">
                Kamu belum memiliki voucher aktif
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Semua voucher yang sudah kamu gunakan telah dihapus dari daftar.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-4 transition hover:border-[#008bd0]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-[#008bd0] px-3 py-1 font-mono text-sm font-black tracking-wider text-white">
                        {voucher.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(voucher.id, voucher.code)}
                        className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0073ad] transition hover:bg-sky-100"
                      >
                        {copiedId === voucher.id ? '✓ Tersalin' : 'Salin Kode'}
                      </button>
                    </div>

                    <p className="mt-3 text-base font-black text-slate-800">
                      {voucher.discountType === 'percentage'
                        ? `Diskon ${voucher.discountValue}%`
                        : `Potongan Rp ${voucher.discountValue.toLocaleString('id-ID')}`}
                    </p>

                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      <li>
                        • Min. pembelian:{' '}
                        <span className="font-semibold text-slate-800">
                          {voucher.minPurchase > 0
                            ? `Rp ${voucher.minPurchase.toLocaleString('id-ID')}`
                            : 'Tanpa minimal pembelian'}
                        </span>
                      </li>
                      {voucher.discountType === 'percentage' && voucher.maxDiscount !== null && (
                        <li>
                          • Maks. potongan:{' '}
                          <span className="font-semibold text-slate-800">
                            Rp {voucher.maxDiscount.toLocaleString('id-ID')}
                          </span>
                        </li>
                      )}
                      <li>
                        • Berlaku hingga:{' '}
                        <span className="font-semibold text-slate-800">
                          {voucher.expiresAt
                            ? new Date(voucher.expiresAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Selamanya'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <p className="mt-3 border-t border-sky-100 pt-2 text-[11px] font-semibold text-[#008bd0]">
                    Berlaku 1× pakai (memotong harga base barang)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
