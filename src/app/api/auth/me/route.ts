import { NextResponse, type NextRequest } from 'next/server';
import { verifyRequestUser } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyRequestUser(request);
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: authUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat profil pengguna.' },
      { status: 500 }
    );
  }
}
