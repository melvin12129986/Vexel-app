import crypto from 'crypto';

const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

const SNAP_BASE_URL = isProduction
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

const CORE_API_BASE_URL = isProduction
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

function getServerKey(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey || serverKey.includes('SB-Mid-server-xxxxxxxxxxxx')) {
    throw new Error(
      'MIDTRANS_SERVER_KEY belum dikonfigurasi di .env.local. Masukkan Server Key Midtrans Anda.'
    );
  }
  return serverKey;
}

function getBasicAuthHeader(): string {
  const serverKey = getServerKey();
  const encoded = Buffer.from(`${serverKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

export type SnapItemDetail = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type CreateSnapTransactionInput = {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail?: string;
  items: SnapItemDetail[];
};

export type CreateSnapTransactionOutput = {
  token: string;
  redirect_url: string;
};

export async function createMidtransSnapTransaction(
  input: CreateSnapTransactionInput
): Promise<CreateSnapTransactionOutput> {
  const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: getBasicAuthHeader()
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount
      },
      item_details: input.items.map((item) => ({
        id: item.id,
        name: item.name.slice(0, 50),
        price: item.price,
        quantity: item.quantity
      })),
      customer_details: {
        first_name: input.customerName,
        email: input.customerEmail || undefined
      }
    })
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    const errorMessages = Array.isArray(data.error_messages)
      ? data.error_messages.join(', ')
      : data.message || 'Gagal membuat transaksi Midtrans Snap.';
    throw new Error(errorMessages);
  }

  return {
    token: data.token,
    redirect_url: data.redirect_url
  };
}

export type MidtransStatusResponse = {
  status_code: string;
  transaction_status: string;
  fraud_status?: string;
  order_id: string;
  gross_amount: string;
  payment_type?: string;
};

export async function fetchMidtransTransactionStatus(
  orderId: string
): Promise<MidtransStatusResponse> {
  const response = await fetch(`${CORE_API_BASE_URL}/${encodeURIComponent(orderId)}/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: getBasicAuthHeader()
    },
    cache: 'no-store'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.status_message || 'Gagal mengecek status transaksi di Midtrans.');
  }

  return data as MidtransStatusResponse;
}

export async function cancelMidtransTransaction(orderId: string): Promise<void> {
  try {
    await fetch(`${CORE_API_BASE_URL}/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: getBasicAuthHeader()
      }
    });
  } catch {
    // Abaikan jika transaksi di Midtrans belum tercatat (mis. popup ditutup sebelum pilih metode pembayaran)
  }
}

export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = getServerKey();
  const payload = `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`;
  const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');
  return expectedSignature === params.signatureKey;
}

export function isMidtransPaymentSettled(
  transactionStatus: string,
  fraudStatus?: string
): boolean {
  if (transactionStatus === 'settlement') {
    return true;
  }
  if (transactionStatus === 'capture') {
    return !fraudStatus || fraudStatus === 'accept';
  }
  return false;
}

export function isMidtransPaymentCancelled(transactionStatus: string): boolean {
  return ['cancel', 'deny', 'expire', 'failure'].includes(transactionStatus);
}
