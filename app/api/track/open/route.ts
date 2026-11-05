import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/server-security';
const PIXEL=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
function pixel(){return new NextResponse(PIXEL,{headers:{'Content-Type':'image/gif','Cache-Control':'no-store, no-cache, max-age=0'}});}
export async function GET(req:NextRequest){
  const url=new URL(req.url),token=url.searchParams.get('t')||'',sig=url.searchParams.get('s')||'';
  const secret=process.env.TRACKING_SIGNING_SECRET;
  if(!secret||secret.length<24||!/^[a-f0-9]{36}$/.test(token)||!/^[a-f0-9]{64}$/.test(sig))return pixel();
  const expected=createHmac('sha256',secret).update(token+'|open').digest('hex');
  if(!timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return pixel();
  const db=adminDb();if(!db)return pixel();
  const {data:recipient}=await db.from('campaign_recipients').select('user_id,campaign_id,email,unsubscribed_at')
    .eq('token',token).maybeSingle();
  if(recipient&&!recipient.unsubscribed_at){
    await db.from('campaign_analytics').insert({id:randomUUID(),user_id:recipient.user_id,campaign_id:recipient.campaign_id,
      email:recipient.email,recipient_token:token,event_type:'open',created_at:new Date().toISOString()});
  }
  return pixel();
}
