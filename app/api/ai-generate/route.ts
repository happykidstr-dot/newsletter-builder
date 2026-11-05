import { NextRequest, NextResponse } from 'next/server';
import { adminDb, limitAction, requireUser, tooLarge, unavailableDb } from '@/lib/server-security';

export async function POST(req: NextRequest) {
  const session = await requireUser();
  if ('error' in session) return session.error;
  const db = adminDb();
  if (!db) return unavailableDb();
  if (tooLarge(req, 32000)) return NextResponse.json({ error: 'İstek çok büyük.' }, { status: 413 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI servisi yapılandırılmadı.' }, { status: 503 });

  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const systemPrompt = body?.systemPrompt || 'You are a professional assistant.';
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000 ||
        typeof systemPrompt !== 'string' || systemPrompt.length > 2000) {
      return NextResponse.json({ error: 'Geçersiz veya çok uzun AI isteği.' }, { status: 400 });
    }
    const budget = Number(body.maxTokens ?? 1000);
    if (!Number.isFinite(budget) || budget < 1) return NextResponse.json({ error: 'Geçersiz token sınırı.' }, { status: 400 });
    const rate = await limitAction(db, session.userId, 'ai', 25);
    if (rate) return rate;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          max_tokens: Math.min(1600, Math.floor(budget)), temperature: 0.7,
        }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) return NextResponse.json({ error: 'AI servisi bu isteği tamamlayamadı.' }, { status: 502 });
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    if (typeof result !== 'string' || !result.trim()) return NextResponse.json({ error: 'AI servisi boş yanıt verdi.' }, { status: 502 });
    return NextResponse.json({ result: result.trim() });
  } catch {
    return NextResponse.json({ error: 'AI isteği işlenemedi.' }, { status: 500 });
  }
}
