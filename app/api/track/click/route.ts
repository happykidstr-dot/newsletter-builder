import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, validWebUrl } from '@/lib/server-security';
export async function GET(req:NextRequest){
  const url=new URL(req.url);
  const token=url.searchParams.get('t')||'',destination=url.searchParams.get('u')||'',sig=url.searchParams.get('s')||'';
  const safe=validWebUrl(destination),secret=process.env.TRACKING_SIGNING_SECRET;
  if(!safe||!secret||secret.length<24||!/^[a-f0-9]{36}$/.test(token)||!/^[a-f0-9]{64}$/.test(sig))
    return NextResponse.json({error:'Geçersiz takip bağlantısı.'},{status:400});
  const expected=createHmac('sha256',secret).update(token+'|'+safe).digest('hex');
  if(!timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return NextResponse.json({error:'Bağlantı imzası geçersiz.'},{status:403});
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Takip servisi kullanılamıyor.'},{status:503});
  const {data:recipient,error}=await db.from('campaign_recipients').select('user_id,campaign_id,email,unsubscribed_at')
    .eq('token',token).maybeSingle();
  if(error||!recipient)return NextResponse.json({error:'Bağlantı bulunamadı.'},{status:404});
  if(!recipient.unsubscribed_at){
    await db.from('campaign_analytics').insert({id:crypto.randomUUID(),user_id:recipient.user_id,
      campaign_id:recipient.campaign_id,email:recipient.email,recipient_token:token,event_type:'click',url:safe,created_at:new Date().toISOString()});
  }
  return NextResponse.redirect(safe,{status:302});
}
