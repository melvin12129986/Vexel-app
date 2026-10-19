import { getSupabaseAdmin } from '@/lib/supabaseServer';
import {
  cancelMidtransTransaction,
  isMidtransPaymentCancelled,
  isMidtransPaymentSettled
} from '@/lib/midtrans';
import { mapDbOrderToOrder } from '@/lib/mappers';
import type { Order } from '@/context/MarketContext';

export async function cancelUnpaidOrderInDb(orderId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: orderRow, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !orderRow) {
    return false;
  }

  if (orderRow.status !== 'Menunggu Pembayaran') {
    return false;
  }

  // Kembalikan 1 baris voucher ke database jika pesanan yang dibatalkan sempat menggunakan voucher
  if (orderRow.voucher_snapshot && typeof orderRow.voucher_snapshot === 'object') {
    const snap = orderRow.voucher_snapshot as Record<string, any>;
    if (snap.code) {
      await supabase.from('vouchers').insert({
        code: String(snap.code),
        owner_username: snap.owner_username ?? null,
        discount_type: snap.discount_type ?? 'percentage',
        discount_value: Number(snap.discount_value ?? 10),
        min_purchase: Number(snap.min_purchase ?? 0),
        max_discount: snap.max_discount ?? null,
        expires_at: snap.expires_at ?? null,
        is_active: true
      });
    }
  }

  // Batalkan juga di sisi Midtrans (jika user sudah sempat memilih metode bayar di Snap)
  await cancelMidtransTransaction(orderId);

  // Hapus pesanan dari database karena telah dibatalkan atau waktu pembayaran habis
  const { error: deleteErr } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  return !deleteErr;
}

export async function syncOrderSettlementInDb(params: {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
}): Promise<{ order: Order | null; settled: boolean; cancelled: boolean }> {
  const supabase = getSupabaseAdmin();

  const { data: orderRow, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.orderId)
    .maybeSingle();

  if (error || !orderRow) {
    return { order: null, settled: false, cancelled: false };
  }

  // Jika pembayaran dibatalkan / kadaluarsa (expire) / ditolak di Midtrans, hapus order dari "Perlu Dibayar"
  if (
    orderRow.status === 'Menunggu Pembayaran' &&
    isMidtransPaymentCancelled(params.transactionStatus)
  ) {
    await cancelUnpaidOrderInDb(params.orderId);
    return { order: null, settled: false, cancelled: true };
  }

  const settled = isMidtransPaymentSettled(params.transactionStatus, params.fraudStatus);
  const updates: Record<string, any> = {
    midtrans_transaction_status: params.transactionStatus
  };

  if (settled && orderRow.status === 'Menunggu Pembayaran') {
    updates.status = 'Menunggu Pengiriman';
  }

  // Kurangi stok produk sekali saja saat pembayaran terverifikasi lunas
  if (settled && !orderRow.stock_deducted && orderRow.product_id) {
    const { data: productRow } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', orderRow.product_id)
      .maybeSingle();

    if (productRow) {
      const nextStock = Math.max(0, Number(productRow.stock) - Number(orderRow.qty));
      await supabase
        .from('products')
        .update({ stock: nextStock })
        .eq('id', productRow.id);
    }
    updates.stock_deducted = true;
  }

  const { data: updatedRow } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', params.orderId)
    .select('*')
    .single();

  return {
    order: mapDbOrderToOrder(updatedRow ?? { ...orderRow, ...updates }),
    settled,
    cancelled: false
  };
}
