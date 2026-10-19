export const SERVICE_FEE_RATE = 0.04; // 4% dari harga base barang
export const PROOF_FEE_RATE = 0.05;   // 5% dari harga base barang (jika pakai bukti pengiriman)

export type VoucherRecord = {
  id?: number | string;
  code: string;
  owner_username?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  quota?: number;
  expires_at: string | null;
  is_active: boolean;
};

export type PricingBreakdown = {
  subtotal: number;
  serviceFee: number;
  proofFee: number;
  voucherCode: string | null;
  voucherDiscount: number;
  total: number;
  sellerEarning: number;
};

export function validateVoucherEligibility(
  voucher: VoucherRecord | null | undefined,
  subtotal: number
): { valid: boolean; message?: string } {
  if (!voucher || !voucher.is_active) {
    return { valid: false, message: 'Kode voucher tidak ditemukan atau sudah tidak aktif.' };
  }

  if (voucher.quota !== undefined && voucher.quota !== null && Number(voucher.quota) <= 0) {
    return { valid: false, message: 'Voucher ini sudah habis.' };
  }

  if (voucher.expires_at && new Date(voucher.expires_at).getTime() < Date.now()) {
    return { valid: false, message: 'Kode voucher sudah kadaluarsa.' };
  }

  if (subtotal < voucher.min_purchase) {
    return {
      valid: false,
      message: `Minimal pembelian untuk voucher ini adalah Rp ${Number(voucher.min_purchase).toLocaleString('id-ID')}.`
    };
  }

  return { valid: true };
}

export function calculateVoucherDiscount(
  voucher: VoucherRecord | null | undefined,
  subtotal: number
): number {
  const check = validateVoucherEligibility(voucher, subtotal);
  if (!check.valid || !voucher) return 0;

  let rawDiscount = 0;
  if (voucher.discount_type === 'percentage') {
    rawDiscount = Math.round(subtotal * (Number(voucher.discount_value) / 100));
    if (voucher.max_discount !== null && voucher.max_discount !== undefined) {
      rawDiscount = Math.min(rawDiscount, Math.round(Number(voucher.max_discount)));
    }
  } else {
    rawDiscount = Math.round(Number(voucher.discount_value));
  }

  // Potongan memotong dari Harga Base Barang (Subtotal) dan tidak boleh membuat subtotal menjadi minus
  return Math.max(0, Math.min(rawDiscount, subtotal));
}

export function calculateOrderPricing(params: {
  unitPrice: number;
  qty: number;
  providesProof: boolean;
  wantsProof: boolean;
  voucher?: VoucherRecord | null;
}): PricingBreakdown {
  const safePrice = Math.max(0, Math.round(Number(params.unitPrice) || 0));
  const safeQty = Math.max(1, Math.round(Number(params.qty) || 1));

  const subtotal = safePrice * safeQty;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const proofFee = params.providesProof && params.wantsProof
    ? Math.round(subtotal * PROOF_FEE_RATE)
    : 0;

  const voucherDiscount = calculateVoucherDiscount(params.voucher, subtotal);
  const voucherCode = voucherDiscount > 0 && params.voucher ? params.voucher.code : null;

  const discountedSubtotal = Math.max(0, subtotal - voucherDiscount);
  const total = discountedSubtotal + serviceFee + proofFee;

  // Service Fee 4% masuk ke platform Vexel; Seller menerima Harga Base Barang + Biaya Bukti 5% (jika ada)
  const sellerEarning = subtotal + proofFee;

  return {
    subtotal,
    serviceFee,
    proofFee,
    voucherCode,
    voucherDiscount,
    total,
    sellerEarning
  };
}
