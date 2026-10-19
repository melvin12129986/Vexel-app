import { NextResponse, type NextRequest } from 'next/server';
import { verifyRequestUser } from '@/lib/supabaseServer';
import { fetchMidtransTransactionStatus } from '@/lib/midtrans';
import { syncOrderSettlementInDb } from '@/lib/orderSettlement';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const { orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib disertakan.' }, { status: 400 });
    }

    const midtransStatus = await fetchMidtransTransactionStatus(orderId);
    const result = await syncOrderSettlementInDb({
      orderId,
      transactionStatus: midtransStatus.transaction_status,
      fraudStatus: midtransStatus.fraud_status
    });

    return NextResponse.json({
      transactionStatus: midtransStatus.transaction_status,
      settled: result.settled,
      cancelled: result.cancelled,
      order: result.order
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memeriksa status pembayaran ke Midtrans.' },
      { status: 500 }
    );
  }
}
