import { NextRequest, NextResponse } from 'next/server';
import { adminDb, limitAction, requireUser, tooLarge, unavailableDb } from '@/lib/server-security';

export async function POST(req: NextRequest) {
  const session = await requireUser();
  if ('error' in session) return session.error;
  const db = adminDb();
  if (!db) return unavailableDb();
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI servisi yapılandırılmadı.' }, { status: 503 });
  if (tooLarge(req, 32000)) return NextResponse.json({ error: 'İstek çok büyük.' }, { status: 413 });
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 8 ||
      !messages.every(m => m && m.role === 'user' && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= 12000)) {
      return NextResponse.json({ error: 'Geçersiz veya çok uzun mesaj.' }, { status: 400 });
    }
    const rate = await limitAction(db, session.userId, 'ai', 25);
    if (rate) return rate;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, max_tokens: 1800, temperature: 0.7 }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) return NextResponse.json({ error: 'AI üretimi başarısız.' }, { status: 502 });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string') return NextResponse.json({ error: 'AI yanıtı geçersiz.' }, { status: 502 });
    return NextResponse.json({ reply: reply.trim() });
  } catch {
    return NextResponse.json({ error: 'AI isteği işlenemedi.' }, { status: 500 });
  }
}
