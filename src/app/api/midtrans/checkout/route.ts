import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import {
  calculateOrderPricing,
  validateVoucherEligibility,
  type VoucherRecord
} from '@/lib/pricing';
import { createMidtransSnapTransaction, type SnapItemDetail } from '@/lib/midtrans';
import { mapDbOrderToOrder, mapDbProductToProduct } from '@/lib/mappers';

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const existingOrderId = body.orderId ? String(body.orderId).trim() : null;
    const supabase = getSupabaseAdmin();

    // 1. Jika melanjutkan pembayaran dari pesanan yang sudah ada (status Menunggu Pembayaran)
    if (existingOrderId) {
      const { data: existingOrder, error: existingErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', existingOrderId)
        .maybeSingle();

      if (existingErr || !existingOrder) {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
      }

      if (existingOrder.buyer !== authUser.username) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses ke pesanan ini.' },
          { status: 403 }
        );
      }

      if (existingOrder.status !== 'Menunggu Pembayaran') {
        return NextResponse.json(
          { error: 'Pesanan ini sudah dibayar atau sedang diproses.' },
          { status: 400 }
        );
      }

      if (existingOrder.snap_token) {
        return NextResponse.json({
          order: mapDbOrderToOrder(existingOrder),
          snapToken: String(existingOrder.snap_token)
        });
      }
    }

    // 2. Membuat pesanan baru: ambil harga & detail produk langsung dari database server
    const productId = Number(body.productId);
    const qty = Math.max(1, Math.round(Number(body.qty) || 1));
    const wantsProof = Boolean(body.wantsProof);
    const inGameNickname = String(body.inGameNickname ?? '').trim();
    const rawVoucherCode = String(body.voucherCode ?? '').trim().toUpperCase();

    if (!inGameNickname) {
      return NextResponse.json(
        { error: 'Nickname In-Game wajib diisi untuk keperluan pengiriman trade.' },
        { status: 400 }
      );
    }

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !productRow) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    const product = mapDbProductToProduct(productRow);

    if (qty < product.minBuy) {
      return NextResponse.json(
        { error: `Minimal pembelian untuk item ini adalah ${product.minBuy} unit.` },
        { status: 400 }
      );
    }

    if (qty > product.stock) {
      return NextResponse.json(
        { error: `Stok produk tidak mencukupi (tersisa ${product.stock} unit).` },
        { status: 400 }
      );
    }

    // 3. Validasi voucher di sisi server (mengambil 1 baris voucher yang cocok di DB)
    let voucher: VoucherRecord | null = null;
    let rawMatchedVoucherRow: Record<string, any> | null = null;

    if (rawVoucherCode) {
      const { data: voucherRows } = await supabase
        .from('vouchers')
        .select('*')
        .ilike('code', rawVoucherCode)
        .eq('is_active', true);

      const matchedRow = (voucherRows ?? []).find(
        (row: Record<string, any>) =>
          !row.owner_username ||
          String(row.owner_username).toLowerCase() === authUser.username.toLowerCase()
      );

      if (!matchedRow) {
        return NextResponse.json(
          { error: 'Kode voucher tidak ditemukan atau sudah habis digunakan.' },
          { status: 400 }
        );
      }

      rawMatchedVoucherRow = matchedRow;
      voucher = {
        id: matchedRow.id,
        code: String(matchedRow.code),
        owner_username: matchedRow.owner_username ?? null,
        discount_type: matchedRow.discount_type,
        discount_value: Number(matchedRow.discount_value),
        min_purchase: Number(matchedRow.min_purchase ?? 0),
        max_discount:
          matchedRow.max_discount !== null && matchedRow.max_discount !== undefined
            ? Number(matchedRow.max_discount)
            : null,
        quota: matchedRow.quota !== undefined ? Number(matchedRow.quota) : undefined,
        expires_at: matchedRow.expires_at ?? null,
        is_active: Boolean(matchedRow.is_active)
      };

      const subtotalCheck = Math.round(product.price * qty);
      const eligibility = validateVoucherEligibility(voucher, subtotalCheck);
      if (!eligibility.valid) {
        return NextResponse.json(
          { error: eligibility.message || 'Kode voucher tidak dapat digunakan.' },
          { status: 400 }
        );
      }
    }

    // 4. Hitung seluruh komponen biaya di server
    const pricing = calculateOrderPricing({
      unitPrice: product.price,
      qty,
      providesProof: product.providesProof,
      wantsProof,
      voucher
    });

    const orderId = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 5. Susun item_details untuk Midtrans Snap
    const snapItems: SnapItemDetail[] = [
      {
        id: `PROD-${product.id}`,
        name: product.name,
        price: Math.round(product.price),
        quantity: qty
      },
      {
        id: 'FEE-SERVICE-4PCT',
        name: 'Biaya Layanan Vexel (4%)',
        price: pricing.serviceFee,
        quantity: 1
      }
    ];

    if (pricing.proofFee > 0) {
      snapItems.push({
        id: 'FEE-PROOF-5PCT',
        name: 'Biaya Bukti Pengiriman (5%)',
        price: pricing.proofFee,
        quantity: 1
      });
    }

    if (pricing.voucherDiscount > 0 && pricing.voucherCode) {
      snapItems.push({
        id: `VOUCHER-${pricing.voucherCode}`,
        name: `Diskon Voucher (${pricing.voucherCode})`,
        price: -pricing.voucherDiscount,
        quantity: 1
      });
    }

    // 6. Buat transaksi ke Midtrans Snap API
    const snapResult = await createMidtransSnapTransaction({
      orderId,
      grossAmount: pricing.total,
      customerName: authUser.username,
      customerEmail: authUser.email,
      items: snapItems
    });

    // 7. Hapus 1 baris voucher yang telah digunakan dari database
    if (voucher && pricing.voucherDiscount > 0 && rawMatchedVoucherRow) {
      if (rawMatchedVoucherRow.id !== undefined && rawMatchedVoucherRow.id !== null) {
        await supabase.from('vouchers').delete().eq('id', rawMatchedVoucherRow.id);
      } else {
        await supabase.from('vouchers').delete().eq('code', voucher.code);
      }
    }

    const formattedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 8. Simpan order ke database Supabase dengan status Menunggu Pembayaran
    const orderPayload: Record<string, any> = {
      id: orderId,
      product_id: product.id,
      product_snapshot: product,
      qty,
      buyer: authUser.username,
      seller: product.seller,
      in_game_nickname: inGameNickname,
      wants_proof: Boolean(product.providesProof && wantsProof),
      subtotal: pricing.subtotal,
      service_fee: pricing.serviceFee,
      proof_fee: pricing.proofFee,
      voucher_code: pricing.voucherCode,
      voucher_discount: pricing.voucherDiscount,
      voucher_snapshot: rawMatchedVoucherRow
        ? {
            code: rawMatchedVoucherRow.code,
            owner_username: rawMatchedVoucherRow.owner_username ?? authUser.username,
            discount_type: rawMatchedVoucherRow.discount_type,
            discount_value: rawMatchedVoucherRow.discount_value,
            min_purchase: rawMatchedVoucherRow.min_purchase ?? 0,
            max_discount: rawMatchedVoucherRow.max_discount ?? null,
            expires_at: rawMatchedVoucherRow.expires_at ?? null,
            is_active: true
          }
        : null,
      total: pricing.total,
      seller_earning: pricing.sellerEarning,
      status: 'Menunggu Pembayaran',
      date: formattedDate,
      snap_token: snapResult.token,
      midtrans_transaction_status: 'pending',
      stock_deducted: false,
      expires_at: expiresAt
    };

    let { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('*')
      .single();

    // Fallback jika kolom voucher_snapshot / expires_at belum dijalankan di SQL lama
    if (insertError) {
      const { voucher_snapshot, expires_at, ...fallbackPayload } = orderPayload;
      const retry = await supabase
        .from('orders')
        .insert(fallbackPayload)
        .select('*')
        .single();
      insertedOrder = retry.data;
      insertError = retry.error;
    }

    if (insertError || !insertedOrder) {
      return NextResponse.json(
        { error: insertError?.message || 'Gagal menyimpan pesanan ke database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order: mapDbOrderToOrder(insertedOrder),
      snapToken: snapResult.token
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses checkout pembayaran.' },
      { status: 500 }
    );
  }
}
