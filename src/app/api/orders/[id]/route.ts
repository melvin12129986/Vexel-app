import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import { mapDbOrderToOrder, mapDbProductToProduct } from '@/lib/mappers';
import { cancelUnpaidOrderInDb } from '@/lib/orderSettlement';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: orderRow, error: fetchError } = await supabase
      .from('orders')
      .select('id, buyer, status')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError || !orderRow) {
      // Jika sudah terhapus sebelumnya, kembalikan sukses
      return NextResponse.json({ cancelled: true, orderId });
    }

    if (orderRow.buyer !== authUser.username) {
      return NextResponse.json(
        { error: 'Hanya pembeli pesanan ini yang dapat membatalkan pembayaran.' },
        { status: 403 }
      );
    }

    if (orderRow.status !== 'Menunggu Pembayaran') {
      return NextResponse.json(
        { error: 'Pesanan yang sudah dibayar tidak dapat dibatalkan.' },
        { status: 400 }
      );
    }

    await cancelUnpaidOrderInDb(orderId);
    return NextResponse.json({ cancelled: true, orderId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal membatalkan pesanan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    const body = await request.json();
    const action = String(body.action ?? '');

    const supabase = getSupabaseAdmin();
    const { data: orderRow, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError || !orderRow) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // 0. Pembeli membatalkan pesanan yang belum dibayar
    if (action === 'cancel_order') {
      if (orderRow.buyer !== authUser.username) {
        return NextResponse.json(
          { error: 'Hanya pembeli pesanan ini yang dapat membatalkan pesanan.' },
          { status: 403 }
        );
      }

      if (orderRow.status !== 'Menunggu Pembayaran') {
        return NextResponse.json(
          { error: 'Pesanan yang sudah dibayar tidak dapat dibatalkan.' },
          { status: 400 }
        );
      }

      await cancelUnpaidOrderInDb(orderId);
      return NextResponse.json({ cancelled: true, orderId });
    }

    // 1. Penjual mengunggah bukti pengiriman
    if (action === 'upload_proof') {
      if (orderRow.seller !== authUser.username) {
        return NextResponse.json(
          { error: 'Hanya penjual pesanan ini yang dapat mengunggah bukti pengiriman.' },
          { status: 403 }
        );
      }

      const proofImage = String(body.proofImage ?? '').trim();
      if (!proofImage) {
        return NextResponse.json({ error: 'URL bukti pengiriman tidak valid.' }, { status: 400 });
      }

      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({ proof_image: proofImage })
        .eq('id', orderId)
        .select('*')
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message || 'Gagal menyimpan bukti pengiriman.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ order: mapDbOrderToOrder(updated) });
    }

    // 2. Penjual mengonfirmasi pengiriman
    if (action === 'confirm_shipment') {
      if (orderRow.seller !== authUser.username) {
        return NextResponse.json(
          { error: 'Hanya penjual pesanan ini yang dapat mengonfirmasi pengiriman.' },
          { status: 403 }
        );
      }

      if (orderRow.status !== 'Menunggu Pengiriman') {
        return NextResponse.json(
          { error: 'Status pesanan tidak valid untuk konfirmasi pengiriman.' },
          { status: 400 }
        );
      }

      const proofImage = String(body.proofImage ?? orderRow.proof_image ?? '').trim();
      if (orderRow.wants_proof && !proofImage) {
        return NextResponse.json(
          { error: 'Pembeli meminta bukti pengiriman. Unggah foto bukti terlebih dahulu.' },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'Dikirim',
          proof_image: proofImage || null
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message || 'Gagal mengonfirmasi pengiriman.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ order: mapDbOrderToOrder(updated) });
    }

    // 3. Pembeli mengonfirmasi barang diterima
    if (action === 'confirm_receipt') {
      if (orderRow.buyer !== authUser.username) {
        return NextResponse.json(
          { error: 'Hanya pembeli pesanan ini yang dapat mengonfirmasi penerimaan barang.' },
          { status: 403 }
        );
      }

      if (orderRow.status !== 'Dikirim') {
        return NextResponse.json(
          { error: 'Pesanan belum berstatus Dikirim.' },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Menunggu Penilaian' })
        .eq('id', orderId)
        .select('*')
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message || 'Gagal mengonfirmasi penerimaan barang.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ order: mapDbOrderToOrder(updated) });
    }

    // 4. Pembeli memberikan rating 1-5 bintang
    if (action === 'submit_rating') {
      if (orderRow.buyer !== authUser.username) {
        return NextResponse.json(
          { error: 'Hanya pembeli pesanan ini yang dapat memberikan rating.' },
          { status: 403 }
        );
      }

      if (orderRow.status !== 'Menunggu Penilaian') {
        return NextResponse.json(
          { error: 'Pesanan belum berada pada tahap pemberian rating.' },
          { status: 400 }
        );
      }

      const rating = Math.round(Number(body.rating));
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating harus bernilai antara 1 hingga 5 bintang.' },
          { status: 400 }
        );
      }

      const { data: updatedOrder, error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          status: 'Selesai',
          rating
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (orderUpdateErr || !updatedOrder) {
        return NextResponse.json(
          { error: orderUpdateErr?.message || 'Gagal menyimpan rating pesanan.' },
          { status: 500 }
        );
      }

      let updatedProduct = null;
      if (orderRow.product_id) {
        const { data: productRow } = await supabase
          .from('products')
          .select('*')
          .eq('id', orderRow.product_id)
          .maybeSingle();

        if (productRow) {
          const prevCount = Number(productRow.rating_count ?? 0);
          const prevRating = Number(productRow.rating ?? 0);
          const nextCount = prevCount + 1;
          const nextRating = Number(((prevRating * prevCount + rating) / nextCount).toFixed(2));

          const { data: savedProduct } = await supabase
            .from('products')
            .update({
              rating: nextRating,
              rating_count: nextCount
            })
            .eq('id', productRow.id)
            .select('*')
            .single();

          if (savedProduct) {
            updatedProduct = mapDbProductToProduct(savedProduct);
          }
        }
      }

      return NextResponse.json({
        order: mapDbOrderToOrder(updatedOrder),
        product: updatedProduct
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
