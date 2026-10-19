import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import {
  calculateOrderPricing,
  validateVoucherEligibility,
  type VoucherRecord
} from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { valid: false, message: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const code = String(body.code ?? '').trim().toUpperCase();
    const productId = Number(body.productId);
    const qty = Math.max(1, Math.round(Number(body.qty) || 1));
    const wantsProof = Boolean(body.wantsProof);

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Masukkan kode voucher terlebih dahulu.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Ambil harga produk langsung dari server (database)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, provides_proof')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        { valid: false, message: 'Produk tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    // Cari semua baris voucher dengan kode tersebut (karena di DB boleh duplikat)
    const { data: voucherRows, error: voucherError } = await supabase
      .from('vouchers')
      .select('*')
      .ilike('code', code)
      .eq('is_active', true);

    if (voucherError || !voucherRows || voucherRows.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Kode voucher tidak ditemukan atau sudah terpakai.' },
        { status: 404 }
      );
    }

    // Pilih 1 baris voucher yang dimiliki user ini atau voucher umum (owner_username null)
    const matchedRow = voucherRows.find(
      (row: Record<string, any>) =>
        !row.owner_username ||
        String(row.owner_username).toLowerCase() === authUser.username.toLowerCase()
    );

    if (!matchedRow) {
      return NextResponse.json(
        { valid: false, message: 'Kode voucher ini bukan milik akun Anda.' },
        { status: 403 }
      );
    }

    const voucher: VoucherRecord = {
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

    const subtotal = Math.round(Number(product.price) * qty);
    const eligibility = validateVoucherEligibility(voucher, subtotal);

    if (!eligibility.valid) {
      return NextResponse.json(
        { valid: false, message: eligibility.message },
        { status: 400 }
      );
    }

    const pricing = calculateOrderPricing({
      unitPrice: Number(product.price),
      qty,
      providesProof: Boolean(product.provides_proof),
      wantsProof,
      voucher
    });

    return NextResponse.json({
      valid: true,
      message: `Voucher ${voucher.code} berhasil diterapkan! Hemat Rp ${pricing.voucherDiscount.toLocaleString('id-ID')}.`,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discount_type,
        discountValue: voucher.discount_value,
        maxDiscount: voucher.max_discount,
        minPurchase: voucher.min_purchase
      },
      pricing
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, message: error?.message || 'Gagal memvalidasi kode voucher.' },
      { status: 500 }
    );
  }
}
