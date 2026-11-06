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
async function readAll(userId:string){
 const db=getDB();if(!db)throw new Error('DATABASE_MISSING');
 const results=await Promise.all([
   db.from('newsletters').select('*').eq('user_id',userId).limit(2000),
   db.from('mailing_lists').select('*').eq('user_id',userId).limit(2000),
   db.from('campaign_analytics').select('*').eq('user_id',userId).limit(10000),
   db.from('email_suppressions').select('*').eq('user_id',userId).limit(10000),
 ]);
 if(results.some(r=>r.error))throw new Error('DATABASE_UNAVAILABLE');
 return {newsletters:results[0].data||[],mailingLists:results[1].data||[],
   analyticsEvents:results[2].data||[],emailSuppressions:results[3].data||[]};
}
export async function GET(){
 const identity=await requireSignedInUser();if(identity.error)return identity.error;
 try{
   const data=await readAll(identity.userId);
   return NextResponse.json({exportedAt:new Date().toISOString(),userId:identity.userId,
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
   for(const table of ['campaign_analytics','email_suppressions','mailing_lists','newsletters']){
     const {error}=await db.from(table).delete().eq('user_id',identity.userId);
     if(error)throw error;
   }
   return NextResponse.json({success:true,message:'Hesabınıza ait kayıtlı listeler, taslaklar ve analitik verileri silindi.',
     note:'Ayrı yayımlanmış bültenlerin public URL bağlantılarını Yayından Kaldır ile kapatın.'},{
     headers:{'Cache-Control':'no-store'}
   });
 }catch{return fail('Bazı kayıtlar silinemedi. Güvenli destek talebi oluşturun.',503);}
}
