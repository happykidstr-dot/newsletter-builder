import { NextResponse } from 'next/server';
import { adminDb, requireUser, unavailableDb } from '@/lib/server-security';

export async function GET() {
  const session = await requireUser(); if ('error' in session) return session.error;
  const db = adminDb(); if (!db) return unavailableDb();
  const { data, error } = await db.from('campaign_analytics')
    .select('event_type,created_at,recipient_token').eq('user_id',session.userId).order('created_at',{ascending:false}).limit(10000);
  if (error) return NextResponse.json({ error: 'Analitik verileri alınamadı.' }, { status: 503 });
  const events = data ?? [];
  const lastWeekFrom = Date.now() - 7*24*3600*1000;
  const isOpen = (evt: any) => evt.event_type === 'open';
  const isClick = (evt: any) => evt.event_type === 'click';
  return NextResponse.json({
    totalOpens: events.filter(isOpen).length,
    uniqueOpens: new Set(events.filter(isOpen).map((e:any)=>e.recipient_token).filter(Boolean)).size,
    totalClicks: events.filter(isClick).length,
    uniqueClicks: new Set(events.filter(isClick).map((e:any)=>e.recipient_token).filter(Boolean)).size,
    lastWeekOpens: events.filter((evt: any)=>isOpen(evt) && new Date(evt.created_at).getTime()>=lastWeekFrom).length,
    // For privacy, recipient details and raw events are never exposed.
    privacyNote: 'Açılma sayıları görsel yüklenmesine bağlıdır; kesin okuma sayısı değildir.',
  }, { headers: { 'Cache-Control':'no-store' } });
}
