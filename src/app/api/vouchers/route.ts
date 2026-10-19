import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = Date.now();
    const vouchers = (data ?? [])
      .filter((row: Record<string, any>) => {
        // Filter kepemilikan: tampilkan jika milik user ini atau voucher umum (owner_username null/tidak ada)
        if (
          row.owner_username &&
          String(row.owner_username).toLowerCase() !== authUser.username.toLowerCase()
        ) {
          return false;
        }
        // Filter tanggal kadaluarsa
        if (row.expires_at && new Date(row.expires_at).getTime() < now) {
          return false;
        }
        // Jika menggunakan kolom quota lama, pastikan > 0
        if (row.quota !== undefined && row.quota !== null && Number(row.quota) <= 0) {
          return false;
        }
        return true;
      })
      .map((row: Record<string, any>, idx: number) => ({
        id: row.id ?? `${row.code}-${idx}`,
        code: String(row.code),
        discountType: row.discount_type as 'percentage' | 'fixed',
        discountValue: Number(row.discount_value),
        minPurchase: Number(row.min_purchase ?? 0),
        maxDiscount:
          row.max_discount !== null && row.max_discount !== undefined
            ? Number(row.max_discount)
            : null,
        expiresAt: row.expires_at ? String(row.expires_at) : null,
        ownerUsername: row.owner_username ? String(row.owner_username) : null
      }));

    return NextResponse.json({ vouchers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat daftar voucher pengguna.' },
      { status: 500 }
    );
  }
}
