import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin, verifyRequestUser } from '@/lib/supabaseServer';

const ALLOWED_BUCKETS = new Set(['product-images', 'order-proofs']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const bucket = String(formData.get('bucket') ?? 'product-images');

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket penyimpanan tidak valid.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File gambar tidak ditemukan.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File yang diunggah harus berupa gambar.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran gambar maksimal adalah 5MB.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Pastikan bucket sudah ada (otomatis dibuat jika belum ada)
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE
    });

    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filePath = `${authUser.username}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Gagal mengunggah gambar ke Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filePath
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan saat mengunggah gambar.' },
      { status: 500 }
    );
  }
}
