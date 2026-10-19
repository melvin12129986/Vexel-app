# Vexel Gameshop

Marketplace item game fullstack berbasis **Next.js 15 (App Router)**, **Supabase (Database, Auth, Storage, Realtime)**, dan **Midtrans Snap Payment Gateway**.

## Requirements

- Node.js 18.18 or newer
- npm
- Project **Supabase**
- Akun **Midtrans** (Sandbox / Production)

## 1. Setup Database & Storage di Supabase

1. Buka **Supabase Dashboard** $\rightarrow$ **SQL Editor**.
2. Salin seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql) lalu klik **Run**.
   - Script ini otomatis membuat tabel `profiles`, `products`, `vouchers`, `orders`, `chat_messages`, mengaktifkan Realtime, membuat bucket Storage (`product-images` & `order-proofs`), serta mengisi **data produk awal** dan **kode voucher contoh** (`VEXEL10`, `HEMAT20K`, `NEWPLAYER`).

## 2. Setup Environment Variables (`.env.local`)

Salin file `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Lalu isi nilai key berikut di `.env.local`:

```env
# Supabase Configuration (Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Midtrans Configuration (Settings -> Access Keys)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```

## 3. Run Locally

```bash
npm.cmd install
npm.cmd run dev
```

Buka [http://localhost:3000](http://localhost:3000).
Untuk mengecek tipe TypeScript, jalankan `npm.cmd run typecheck`.