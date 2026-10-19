import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import { mapDbOrderToOrder } from '@/lib/mappers';
import { cancelUnpaidOrderInDb } from '@/lib/orderSettlement';

const PAYMENT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 jam

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
      .from('orders')
      .select('*')
      .or(`buyer.eq.${authUser.username},seller.eq.${authUser.username}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = Date.now();
    const validRows: Record<string, any>[] = [];

    for (const row of data ?? []) {
      if (row.status === 'Menunggu Pembayaran') {
        const expiryTime = row.expires_at
          ? new Date(row.expires_at).getTime()
          : row.created_at
          ? new Date(row.created_at).getTime() + PAYMENT_EXPIRY_MS
          : null;

        if (expiryTime && now > expiryTime) {
          // Waktu pembayaran habis -> hapus otomatis dari database
          await cancelUnpaidOrderInDb(String(row.id));
          continue;
        }
      }
      validRows.push(row);
    }

    const orders = validRows.map(mapDbOrderToOrder);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat riwayat pesanan dari server.' },
      { status: 500 }
    );
  }
}
