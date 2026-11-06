import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireSignedInUser} from '@/lib/security/access';

export const runtime='nodejs';
export async function GET(){
  const identity=await requireSignedInUser();if(identity.error)return identity.error;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:'Analitik veri bağlantısı henüz yapılandırılmadı.'},{status:503});
  try{
    const db=createClient(url,key);
    // Service-role clients bypass RLS; the user's ID filter is mandatory.
    // Never return raw email addresses or other users' campaigns.
    const {data,error}=await db.from('campaign_analytics')
      .select('event_type,email,created_at')
      .eq('user_id',identity.userId).order('created_at',{ascending:false}).limit(10000);
    if(error)throw error;
    const events=data||[];
    const opens=events.filter(e=>e.event_type==='open');
    const clicks=events.filter(e=>e.event_type==='click');
    const sevenDaysAgo=Date.now()-7*86_400_000;
    return NextResponse.json({
      totalOpens:opens.length,
      uniqueOpens:new Set(opens.map(e=>String(e.email).toLowerCase())).size,
      totalClicks:clicks.length,
      uniqueClicks:new Set(clicks.map(e=>String(e.email).toLowerCase())).size,
      lastWeek:opens.filter(e=>new Date(e.created_at).getTime()>=sevenDaysAgo).length,
      dataSource:'opt-in-email-campaigns',
    },{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Analitik kayıtlarına erişilemiyor. Veritabanı geçişini kontrol edin.'},{status:503});}
}
