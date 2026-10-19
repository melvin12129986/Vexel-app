import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseServerConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    (supabaseServiceKey || supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-id')
  );
};

let adminClient: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!isSupabaseServerConfigured()) {
    throw new Error(
      'Konfigurasi Supabase belum lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diatur di .env.local.'
    );
  }

  if (!adminClient) {
    const keyToUse =
      supabaseServiceKey && !supabaseServiceKey.includes('your-supabase-service-role-key')
        ? supabaseServiceKey
        : supabaseAnonKey;

    adminClient = createClient(supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return adminClient;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
};

export async function verifyRequestUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return null;
  }

  const user = authData.user;
  const email = user.email ?? '';

  // Cari username dari tabel profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.username) {
    return {
      id: user.id,
      email: profile.email || email,
      username: profile.username
    };
  }

  // Fallback ke user_metadata jika baris profile belum terbuat
  const metadataUsername =
    typeof user.user_metadata?.username === 'string' && user.user_metadata.username.trim()
      ? user.user_metadata.username.trim()
      : email.split('@')[0] || `user_${user.id.slice(0, 6)}`;

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      username: metadataUsername,
      email
    },
    { onConflict: 'id' }
  );

  return {
    id: user.id,
    email,
    username: metadataUsername
  };
}
