import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import { mapDbChatToChatMessage } from '@/lib/mappers';

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

    // Ambil daftar order yang melibatkan user ini sebagai pembeli atau penjual
    const { data: userOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .or(`buyer.eq.${authUser.username},seller.eq.${authUser.username}`);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const orderIds = (userOrders ?? []).map((row) => String(row.id));
    if (orderIds.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .in('order_id', orderIds)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    return NextResponse.json({
      messages: (messagesData ?? []).map(mapDbChatToChatMessage)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat pesan chat.' },
      { status: 500 }
    );
  }
}

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
    const orderId = String(body.orderId ?? '').trim();
    const text = String(body.text ?? '').trim();

    if (!orderId || !text) {
      return NextResponse.json(
        { error: 'Order ID dan isi pesan wajib diisi.' },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Pesan maksimal 1000 karakter.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: orderRow } = await supabase
      .from('orders')
      .select('id, buyer, seller')
      .eq('id', orderId)
      .maybeSingle();

    if (!orderRow) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    if (orderRow.buyer !== authUser.username && orderRow.seller !== authUser.username) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke percakapan pesanan ini.' },
        { status: 403 }
      );
    }

    const messageId = `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sentAt = new Date().toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        id: messageId,
        order_id: orderId,
        sender: authUser.username,
        text,
        sent_at: sentAt
      })
      .select('*')
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message || 'Gagal mengirim pesan.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: mapDbChatToChatMessage(inserted) },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan saat mengirim pesan.' },
      { status: 500 }
    );
  }
}
