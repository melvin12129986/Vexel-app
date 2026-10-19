import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import { mapDbProductToProduct } from '@/lib/mappers';

export async function PUT(
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

    const { id } = await context.params;
    const productId = Number(id);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    if (existing.seller !== authUser.username) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk mengubah produk milik penjual lain.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = String(body.name ?? existing.name).trim();
    const game = String(body.game ?? existing.game).trim();
    const category = String(body.category ?? existing.category).trim();
    const price = Math.round(Number(body.price ?? existing.price));
    const stock = Math.round(Number(body.stock ?? existing.stock));
    const minBuy = Math.round(Number(body.minBuy ?? body.min_buy ?? existing.min_buy));
    const desc = String(body.desc ?? existing.desc).trim();
    const avgDelivery = String(body.avgDelivery ?? body.avg_delivery ?? existing.avg_delivery).trim();
    const providesProof = Boolean(body.providesProof ?? body.provides_proof ?? existing.provides_proof);
    const image = String(body.image ?? existing.image).trim();

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        name,
        game,
        category,
        price,
        stock,
        min_buy: minBuy,
        image,
        provides_proof: providesProof,
        desc,
        avg_delivery: avgDelivery
      })
      .eq('id', productId)
      .select('*')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || 'Gagal memperbarui produk.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: mapDbProductToProduct(updated) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

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

    const { id } = await context.params;
    const productId = Number(id);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('products')
      .select('id, seller')
      .eq('id', productId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    if (existing.seller !== authUser.username) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus produk ini.' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Gagal menghapus produk.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
