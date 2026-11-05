import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type AuthResult = { userId: string } | { error: NextResponse };

export async function requireUser(): Promise<AuthResult> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return { error: NextResponse.json({ error: 'Güvenli oturum yapılandırılmadı.' }, { status: 503 }) };
  }
  try {
    const session = await auth();
    if (!session.userId) return { error: NextResponse.json({ error: 'Oturum açılması gerekiyor.' }, { status: 401 }) };
    return { userId: session.userId };
  } catch {
    return { error: NextResponse.json({ error: 'Oturum doğrulanamadı.' }, { status: 401 }) };
  }
}

export function adminDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function unavailableDb() {
  return NextResponse.json({ error: 'Güvenli veri depolaması yapılandırılmadı.' }, { status: 503 });
}

export async function limitAction(db: SupabaseClient, userId: string, action: 'ai' | 'send' | 'parse', maximum: number, windowSeconds = 3600): Promise<NextResponse | null> {
  // Atomic, shared database rate limit; fails closed if migration is missing.
  const { data, error } = await db.rpc('consume_action_quota', {
    p_user_id: userId, p_action: action, p_maximum: maximum, p_window_seconds: windowSeconds,
  });
  if (error) return NextResponse.json({ error: 'Kota denetimi kullanılamıyor; işlem güvenlik nedeniyle durduruldu.' }, { status: 503 });
  if (data !== true) return NextResponse.json({ error: 'İşlem kotası doldu. Lütfen daha sonra tekrar deneyin.' }, { status: 429 });
  return null;
}

export function validWebUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function tooLarge(req: Request, limit: number): boolean {
  const length = Number(req.headers.get('content-length') || '0');
  return length > limit;
}
