import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireSignedInUser,checkSameOrigin,boundedJson,requestProblem} from '@/lib/security/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
function getDB(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&key?createClient(url,key):null;
}
type OwnerTable='newsletters'|'mailing_lists'|'campaign_analytics'|'email_suppressions'|'newsletter_web_events';
const PRIVATE_TABLES:[OwnerTable,string][]=[
  ['newsletters','id'],
  ['mailing_lists','id'],
  ['campaign_analytics','id'],
  ['email_suppressions','email_hash'],
  ['newsletter_web_events','id'],
];

/**
 * Supabase/PostgREST can cap individual result sets (often at 1,000 rows).
 * A personal data export must not silently omit older records.
 */
async function fetchOwnerRecords(
  db:NonNullable<ReturnType<typeof getDB>>,table:OwnerTable,sortColumn:string,userId:string
):Promise<Record<string,unknown>[]>{
  const pageSize=500,maxPages=200;
  const result:Record<string,unknown>[]=[];
  for(let page=0;page<maxPages;page++){
    const {data,error}=await db.from(table).select('*').eq('user_id',userId)
      .order(sortColumn,{ascending:true})
      .range(page*pageSize,(page+1)*pageSize-1);
    if(error)throw error;
    const rows=(data||[]) as Record<string,unknown>[];
    result.push(...rows);
    if(rows.length<pageSize)return result;
  }
  // A dedicated bulk-export job is required for very large accounts.
  // Do not label a partial archive as complete.
  throw new Error('EXPORT_TOO_LARGE');
}
async function readAll(userId:string){
  const db=getDB();if(!db)throw new Error('DATABASE_MISSING');
  const records=await Promise.all(PRIVATE_TABLES.map(([name,sort])=>fetchOwnerRecords(db,name,sort,userId)));
  return {
    newsletters:records[0],mailingLists:records[1],
    analyticsEvents:records[2],emailSuppressions:records[3],
    newsletterWebEvents:records[4],
  };
}
export async function GET(){
 const identity=await requireSignedInUser();if(identity.error)return identity.error;
 try{
   const data=await readAll(identity.userId);
   return NextResponse.json({exportedAt:new Date().toISOString(),userId:identity.userId,account:{email:identity.email,verified:identity.emailVerified},
     ...data,note:'Herkese açık yayınlar ayrı düzenleme anahtarı ile yayından kaldırılır.'},{
     headers:{'Cache-Control':'no-store','Content-Disposition':'attachment; filename="bulten-read-kisisel-veriler.json"'}
   });
 }catch{return fail('Veri dışa aktarma hizmeti henüz yapılandırılmamış.',503);}
}
export async function DELETE(req:NextRequest){
 const identity=await requireSignedInUser();if(identity.error)return identity.error;
 const origin=checkSameOrigin(req);if(origin)return origin;
 let body:unknown;try{body=await boundedJson(req,1000);}catch(e){return requestProblem(e);}
 if((body as {confirmation?:unknown})?.confirmation!=='DELETE-MY-DATA')
   return fail('Bu işlem için açık onay gereklidir.',400);
 const db=getDB();if(!db)return fail('Veri silme hizmeti yapılandırılmamış.',503);
 try{
   for(const table of ['newsletter_web_events','campaign_analytics','email_suppressions','mailing_lists','newsletters']){
     const {error}=await db.from(table).delete().eq('user_id',identity.userId);
     if(error)throw error;
   }
   return NextResponse.json({success:true,message:'Hesabınıza ait kayıtlı listeler, taslaklar, e-posta istatistikleri ve web görüntülenme kayıtları silindi.',
     note:'Ayrı yayımlanmış bültenlerin public URL bağlantılarını Yayından Kaldır ile kapatın.'},{
     headers:{'Cache-Control':'no-store'}
   });
 }catch{return fail('Bazı kayıtlar silinemedi. Güvenli destek talebi oluşturun.',503);}
}
