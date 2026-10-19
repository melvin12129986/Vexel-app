import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: 'Username minimal terdiri dari 3 karakter.' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal terdiri dari 6 karakter.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Cek apakah username sudah dipakai
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan. Silakan pilih username lain.' },
        { status: 409 }
      );
    }

    // Cek apakah email sudah dipakai
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan masuk menggunakan akun Anda.' },
        { status: 409 }
      );
    }

    // Buat user di Supabase Auth via Admin API (otomatis terkonfirmasi agar langsung bisa login)
    const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    });

    if (createError || !createdAuth?.user) {
      // Fallback ke signUp standar jika SUPABASE_SERVICE_ROLE_KEY belum diisi (hanya memakai anon key)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (signUpError || !signUpData.user) {
        return NextResponse.json(
          { error: signUpError?.message || createError?.message || 'Gagal mendaftarkan akun.' },
          { status: 400 }
        );
      }

      await supabase.from('profiles').upsert(
        {
          id: signUpData.user.id,
          username,
          email
        },
        { onConflict: 'id' }
      );

      return NextResponse.json({
        user: {
          id: signUpData.user.id,
          username,
          email
        }
      });
    }

    // Simpan ke tabel profiles
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: createdAuth.user.id,
        username,
        email
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      return NextResponse.json(
        { error: `Gagal menyimpan profil pengguna: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: createdAuth.user.id,
        username,
        email
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server saat registrasi.' },
      { status: 500 }
    );
  }
}
