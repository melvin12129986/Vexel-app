# Vexel Gameshop
URL : vexel-web-lovat.vercel.app

## 1. Penjelasan Struktur File

```text
Vexel-Web/
├── public/
│   └── vexel-logo.png                 # Aset gambar logo resmi Vexel
├── src/
│   ├── app/                           # Next.js App Router (Halaman UI & Endpoint API Server)
│   │   ├── api/                       # Backend Route Handlers (berjalan di sisi server)
│   │   │   ├── auth/                  # Endpoint registrasi, resolusi login, & verifikasi sesi user
│   │   │   ├── chat/                  # Endpoint pengiriman & pengambilan pesan chat per pesanan
│   │   │   ├── midtrans/              # Endpoint checkout Snap, cek status, & webhook pembayaran
│   │   │   ├── orders/                # Endpoint daftar pesanan, update status, & pembatalan
│   │   │   ├── products/              # Endpoint CRUD katalog produk penjual
│   │   │   ├── upload/                # Endpoint unggah gambar produk & bukti pengiriman ke Storage
│   │   │   └── vouchers/              # Endpoint daftar voucher user & validasi kode promo
│   │   ├── chat/
│   │   │   ├── [id]/page.tsx          # Ruang obrolan spesifik antara pembeli & penjual per order
│   │   │   └── page.tsx               # Daftar seluruh percakapan aktif berdasarkan pesanan
│   │   ├── login/page.tsx             # Halaman autentikasi (Masuk & Daftar Akun)
│   │   ├── orders/page.tsx            # Halaman manajemen pesanan pembeli, pembayaran, & rating
│   │   ├── payment/[id]/page.tsx      # Halaman checkout item, input tujuan trade, & pemakaian voucher
│   │   ├── product/[id]/page.tsx      # Halaman detail produk, spesifikasi stok, & pemilihan jumlah
│   │   ├── profile/page.tsx           # Halaman profil akun pengguna & daftar voucher yang dimiliki
│   │   ├── seller/                    # Area Seller Center (Panel Penjual)
│   │   │   ├── history/page.tsx       # Riwayat seluruh pesanan toko beserta filter & total pendapatan
│   │   │   ├── items/page.tsx         # Manajemen inventaris barang toko (Tambah, Edit, Hapus)
│   │   │   ├── orders/page.tsx        # Daftar pesanan aktif yang perlu dikirim penjual
│   │   │   ├── layout.tsx             # Layout khusus Seller Center dengan header & navigasi samping
│   │   │   └── page.tsx               # Dashboard ringkasan performa toko & pesanan terbaru
│   │   ├── globals.css                # Konfigurasi stylesheet global & import Tailwind CSS
│   │   ├── layout.tsx                 # Root layout HTML utama aplikasi
│   │   └── page.tsx                   # Halaman beranda (Banner promosi, filter kategori game, & katalog)
│   ├── components/                    # Komponen UI yang dapat digunakan kembali
│   │   ├── auth/
│   │   │   ├── RequireAuth.tsx        # Pelindung rute halaman yang mewajibkan sesi login aktif
│   │   │   └── SessionActions.tsx     # Tombol aksi pintasan menuju profil atau halaman login
│   │   ├── layout/
│   │   │   ├── AppShell.tsx           # Pembungkus tata letak utama yang mengatur Navbar & proteksi rute
│   │   │   └── Navbar.tsx             # Navigasi bagian atas untuk pencarian item & menu pembeli
│   │   └── seller/
│   │       ├── SellerNavigation.tsx   # Menu navigasi sidebar pada panel penjual
│   │       └── SellerOrderList.tsx    # Komponen kartu pesanan penjual untuk unggah bukti & konfirmasi kirim
│   ├── context/
│   │   └── MarketContext.tsx          # State management global (User, Produk, Pesanan, Chat, & Realtime)
│   ├── lib/                           # Utilitas dan konfigurasi layanan
│   │   ├── axiosClient.ts             # Instance HTTP client Axios dengan interceptor token autentikasi
│   │   ├── mappers.ts                 # Konversi format data database ke tipe model aplikasi
│   │   ├── midtrans.ts                # Integrasi API server Midtrans Snap & verifikasi signature
│   │   ├── orderSettlement.ts         # Logika penyelesaian pesanan, pengurangan stok, & pembatalan
│   │   ├── pricing.ts                 # Kalkulasi harga barang, biaya layanan 4%, bukti 5%, & diskon voucher
│   │   ├── supabaseClient.ts          # Inisialisasi client Supabase untuk sisi browser
│   │   └── supabaseServer.ts          # Inisialisasi client admin Supabase & verifikasi autentikasi server
│   └── styles.d.ts                    # Deklarasi tipe TypeScript untuk modul CSS
├── next.config.ts                     # Konfigurasi framework Next.js
├── package.json                       # Daftar dependensi library dan skrip proyek
├── postcss.config.mjs                 # Konfigurasi PostCSS untuk Tailwind CSS v4
└── tsconfig.json                      # Konfigurasi compiler TypeScript
```

---

## 2. System Requirements

- **Operating System:** Windows 10/11, macOS, atau Linux
- **Node.js:** Versi `18.18.0` atau lebih baru (Disarankan Node.js `20 LTS` / `22 LTS`)
- **Package Manager:** `npm` (v9+), `pnpm`, atau `yarn`
- **Framework & Runtime:**
  - Next.js `^15.5.0`
  - React `^19.0.0` & React DOM `^19.0.0`
  - TypeScript `^5.7.0`
  - Tailwind CSS `^4.3.3`
- **External Services:**
  - **Supabase** (PostgreSQL Database, Authentication, Storage, & Realtime)
  - **Midtrans Payment Gateway** (Snap API & Core Status API)
- **Browser Modern:** Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari versi terbaru