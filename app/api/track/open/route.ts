import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {readCampaignToken} from '@/lib/security/campaign-token';

export const runtime='nodejs';
const PIXEL=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
export async function GET(req:NextRequest){
  // Email clients may block images. This is opt-in and never a reliable
  // count of every human reader; never leak a recipient's email to the URL.
  const token=readCampaignToken(new URL(req.url).searchParams.get('t')||'','open');
  if(token&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY){
    try{
      const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
      await db.from('campaign_analytics').insert({
        id:randomUUID(),user_id:token.userId,campaign_id:token.campaignId,
        event_type:'open',email:token.email,created_at:new Date().toISOString(),
      });
    }catch{ /* Readers never receive internal data or errors. */ }
  }
  return new NextResponse(new Uint8Array(PIXEL),{
    headers:{'Content-Type':'image/gif','Cache-Control':'no-store, no-cache, must-revalidate, max-age=0',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}
  });
}
