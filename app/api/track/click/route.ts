import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {readCampaignToken} from '@/lib/security/campaign-token';

export const runtime='nodejs';
export async function GET(req:NextRequest){
  const token=readCampaignToken(new URL(req.url).searchParams.get('t')||'','click');
  if(!token?.url)return new NextResponse('Bağlantı geçerli değil.',{status:400});
  if(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY){
    try{
      const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
      await db.from('campaign_analytics').insert({
        id:randomUUID(),user_id:token.userId,campaign_id:token.campaignId,
        event_type:'click',email:token.email,url:token.url,created_at:new Date().toISOString(),
      });
    }catch{}
  }
  // Target URL was authenticated inside an encrypted, short-lived token,
  // not accepted from a public ?u= parameter (old open-redirect vulnerability).
  return NextResponse.redirect(token.url,{status:302,headers:{
    'Referrer-Policy':'no-referrer','Cache-Control':'no-store'
  }});
}
