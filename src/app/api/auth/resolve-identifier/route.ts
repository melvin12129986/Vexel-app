import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? '').trim();

    if (!identifier) {
      return NextResponse.json({ error: 'Email atau username wajib diisi.' }, { status: 400 });
    }

    // Jika input sudah berupa email
    if (identifier.includes('@')) {
      return NextResponse.json({ email: identifier.toLowerCase() });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, username')
      .ilike('username', identifier)
      .maybeSingle();

    if (error || !profile?.email) {
      return NextResponse.json(
        { error: 'Username tidak ditemukan. Pastikan username sudah terdaftar atau masuk dengan email.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: profile.email,
      username: profile.username
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memeriksa akun pengguna.' },
      { status: 500 }
    );
  }
}
