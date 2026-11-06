import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireSignedInUser} from '@/lib/security/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
  const identity=await requireSignedInUser();if(identity.error)return identity.error;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:'Analitik veritabanı yapılandırılmadı.'},{status:503});
  try{
    const db=createClient(url,key);
    // A service-role client bypasses RLS. ALWAYS restrict to the verified publisher.
    const lastSevenDays=new Date(Date.now()-7*86_400_000).toISOString();
    const [campaign,webAll,webWeek]=await Promise.all([
      db.from('campaign_analytics')
        .select('event_type,email,created_at')
        .eq('user_id',identity.userId).order('created_at',{ascending:false}).limit(10000),
      db.from('newsletter_web_events')
        .select('id',{head:true,count:'exact'}).eq('user_id',identity.userId),
      db.from('newsletter_web_events')
        .select('id',{head:true,count:'exact'}).eq('user_id',identity.userId).gte('viewed_at',lastSevenDays),
    ]);
    if(campaign.error)throw campaign.error;
    const events=campaign.data||[];
    const opens=events.filter(e=>e.event_type==='open');
    const clicks=events.filter(e=>e.event_type==='click');
    const webStatsAvailable=!webAll.error&&!webWeek.error;
    return NextResponse.json({
      totalOpens:opens.length,
      uniqueOpens:new Set(opens.map(e=>String(e.email).toLowerCase())).size,
      totalClicks:clicks.length,
      uniqueClicks:new Set(clicks.map(e=>String(e.email).toLowerCase())).size,
      lastWeek:opens.filter(e=>new Date(e.created_at).getTime()>=Date.parse(lastSevenDays)).length,
      webViews:webStatsAvailable?(webAll.count??0):null,
      webLastWeek:webStatsAvailable?(webWeek.count??0):null,
      webStatsAvailable,
      webMetricDefinition:'anonymous page requests; excludes common crawlers, not unique visitors',
      emailMetricDefinition:'consented email open/click events; up to 10000 most recent',
    },{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Analitik kayıtlarına erişilemiyor. Veritabanı geçişini kontrol edin.'},{status:503});}
}
