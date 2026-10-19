import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';
import { mapDbProductToProduct } from '@/lib/mappers';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const products = (data ?? []).map(mapDbProductToProduct);
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat daftar produk dari server.' },
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
    const name = String(body.name ?? '').trim();
    const game = String(body.game ?? '').trim();
    const category = String(body.category ?? 'Skin').trim();
    const price = Math.round(Number(body.price));
    const stock = Math.round(Number(body.stock));
    const minBuy = Math.round(Number(body.minBuy ?? body.min_buy ?? 1));
    const desc = String(body.desc ?? '').trim();
    const avgDelivery = String(body.avgDelivery ?? body.avg_delivery ?? '10 Menit').trim();
    const providesProof = Boolean(body.providesProof ?? body.provides_proof ?? false);
    const image =
      String(body.image ?? '').trim() ||
      'https://placehold.co/400x300/008bd0/ffffff?text=No+Image';

    if (!name || !game || !desc) {
      return NextResponse.json(
        { error: 'Nama item, nama game, dan deskripsi wajib diisi.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Harga satuan harus lebih dari Rp 0.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(stock) || stock < 0 || !Number.isFinite(minBuy) || minBuy < 1) {
      return NextResponse.json(
        { error: 'Stok dan minimal pembelian tidak valid.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        game,
        category,
        price,
        stock,
        min_buy: minBuy,
        image,
        seller: authUser.username,
        provides_proof: providesProof,
        desc,
        avg_delivery: avgDelivery
      })
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Gagal menyimpan produk ke database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: mapDbProductToProduct(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
