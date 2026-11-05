import { NextRequest, NextResponse } from 'next/server';
import { adminDb, escapeHtml } from '@/lib/server-security';
function valid(t:string){return /^[a-f0-9]{36}$/.test(t);}
export async function GET(req:NextRequest){
  const token=new URL(req.url).searchParams.get('t')||'';
  if(!valid(token))return NextResponse.json({error:'Geçersiz bağlantı.'},{status:400});
  const page=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BÜLTEN READ – Abonelik</title><body style="font:18px system-ui;max-width:36rem;margin:3rem auto;padding:1rem"><h1>Abonelikten ayrıl</h1><p>Bu göndericiden artık bülten almak istemiyorsanız onaylayın.</p><form method="post"><input type="hidden" name="t" value="${escapeHtml(token)}"><button type="submit" style="padding:12px 20px">Abonelikten ayrılmayı onayla</button></form></body></html>`;
  return new NextResponse(page,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export async function POST(req:NextRequest){
  const form=await req.formData().catch(()=>null);
  const token=String(form?.get('t')||'');
  if(!valid(token))return NextResponse.json({error:'Geçersiz bağlantı.'},{status:400});
  const db=adminDb();if(!db)return NextResponse.json({error:'Servis kullanılamıyor.'},{status:503});
  const {data:recipient,error}=await db.from('campaign_recipients').select('user_id,email').eq('token',token).maybeSingle();
  if(error||!recipient)return NextResponse.json({error:'Abonelik bulunamadı.'},{status:404});
  const {error:writeError}=await db.from('suppressed_emails').upsert({user_id:recipient.user_id,email:recipient.email});
  if(writeError)return NextResponse.json({error:'İşlem kaydedilemedi.'},{status:503});
  await db.from('campaign_recipients').update({unsubscribed_at:new Date().toISOString()}).eq('token',token);
  return new NextResponse('<!doctype html><html lang="tr"><meta charset="utf-8"><title>Abonelikten ayrıldınız</title><p>Bu göndericinin bülten aboneliğinden ayrıldınız.</p></html>',
    {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
