import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, requireUser, tooLarge, unavailableDb } from '@/lib/server-security';

function validWebhook(req: NextRequest): boolean {
  const secret = process.env.NOTEBOOK_SYNC_SECRET;
  if (!secret || secret.length < 24) return false;
  const received = req.headers.get('x-notebook-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!received) return false;
  const left = Buffer.from(received); const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}
function ownerId(): string | null {
  return process.env.NOTEBOOK_SYNC_USER_ID?.trim() || null;
}
export async function GET() {
  const session = await requireUser();
  if ('error' in session) return session.error;
  const db = adminDb(); if (!db) return unavailableDb();
  const { data, error } = await db.from('notebook_payloads').select('payload').eq('user_id', session.userId).maybeSingle();
  if (error) return NextResponse.json({ error: 'Notebook verisi okunamadı.' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'Henüz gelen Notebook verisi yok.' }, { status: 404 });
  return NextResponse.json(data.payload, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: NextRequest) {
  if (!validWebhook(req)) return NextResponse.json({ error: 'Geçersiz senkronizasyon anahtarı.' }, { status: 401 });
  const userId = ownerId();
  if (!userId) return NextResponse.json({ error: 'Notebook hedef kullanıcısı yapılandırılmadı.' }, { status: 503 });
  if (tooLarge(req, 1024 * 1024)) return NextResponse.json({ error: 'Notebook verisi 1 MB sınırını aşıyor.' }, { status: 413 });
  const db = adminDb(); if (!db) return unavailableDb();
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.blocks) || body.blocks.length > 100 ||
      !body.blocks.every((b: any) => b && typeof b === 'object' &&
        typeof b.id === 'string' && typeof b.type === 'string' && b.data && typeof b.data === 'object')) {
      return NextResponse.json({ error: 'Bülten şeması geçersiz.' }, { status: 400 });
    }
    const { error } = await db.from('notebook_payloads').upsert({ user_id: userId, payload: body, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: 'Notebook kaydı başarısız.' }, { status: 503 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Notebook JSON ayrıştırılamadı.' }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  if (!validWebhook(req)) return NextResponse.json({ error: 'Geçersiz senkronizasyon anahtarı.' }, { status: 401 });
  const userId = ownerId();
  if (!userId) return NextResponse.json({ error: 'Notebook hedef kullanıcısı yapılandırılmadı.' }, { status: 503 });
  const db = adminDb(); if (!db) return unavailableDb();
  const { error } = await db.from('notebook_payloads').delete().eq('user_id', userId);
  if (error) return NextResponse.json({ error: 'Notebook verisi silinemedi.' }, { status: 503 });
  return NextResponse.json({ success: true });
}
