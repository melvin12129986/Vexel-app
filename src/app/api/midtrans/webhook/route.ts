import { NextResponse, type NextRequest } from 'next/server';
import { verifyMidtransSignature } from '@/lib/midtrans';
import { syncOrderSettlementInDb } from '@/lib/orderSettlement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.order_id ?? '');
    const statusCode = String(body.status_code ?? '');
    const grossAmount = String(body.gross_amount ?? '');
    const signatureKey = String(body.signature_key ?? '');
    const transactionStatus = String(body.transaction_status ?? '');
    const fraudStatus = body.fraud_status ? String(body.fraud_status) : undefined;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json({ error: 'Payload notifikasi tidak lengkap.' }, { status: 400 });
    }

    // Verifikasi keaslian notifikasi dari Midtrans menggunakan SHA-512 signature_key
    const isValidSignature = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      signatureKey
    });

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Signature key tidak valid.' }, { status: 403 });
    }

    const result = await syncOrderSettlementInDb({
      orderId,
      transactionStatus,
      fraudStatus
    });

    return NextResponse.json({
      received: true,
      settled: result.settled,
      order: result.order
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses webhook Midtrans.' },
      { status: 500 }
    );
  }
}
