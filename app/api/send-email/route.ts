import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import {requireSignedInUser,checkSameOrigin,boundedJson,requestProblem} from '@/lib/security/access';
import {reserveQuota} from '@/lib/security/quotas';
import {makeCampaignToken} from '@/lib/security/campaign-token';
import {suppressionHash} from '@/lib/security/email-suppression';

export const runtime='nodejs';
type Recipient={email:string;name?:string;consentAt?:string;consentSource?:string;unsubscribedAt?:string;trackingConsent?:boolean};
const emailOkay=(v:unknown)=>typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const escape=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const noStore={'Cache-Control':'no-store'};
const refuse=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
const websiteOrigin=(req:NextRequest):string=>{
 const from=process.env.NEXT_PUBLIC_APP_URL;
 const value=from||new URL(req.url).origin;
 const url=new URL(value);
 if(url.protocol!=='https:'&&url.hostname!=='localhost'&&url.hostname!=='127.0.0.1')throw new Error('INVALID_APP_ORIGIN');
 return url.origin;
};

export async function POST(req:NextRequest){
 const identity=await requireSignedInUser();
 if(identity.error)return identity.error;
 const err=checkSameOrigin(req);if(err)return err;
 let value:unknown;
 try{value=await boundedJson(req,270_000);}catch(e){return requestProblem(e);}
 const body=value as {
  subject?:unknown;html?:unknown;customMsg?:unknown;
  listId?:unknown;isTest?:unknown;testEmail?:unknown;trackingEnabled?:unknown;
 };
 if(typeof body?.subject!=='string'||!body.subject.trim()||body.subject.length>180||
    typeof body?.html!=='string'||body.html.length<1||body.html.length>250_000||
    (body.customMsg!==undefined&&(typeof body.customMsg!=='string'||body.customMsg.length>3000))||
    (body.isTest!==undefined&&typeof body.isTest!=='boolean')||
    (body.trackingEnabled!==undefined&&typeof body.trackingEnabled!=='boolean'))
   return refuse('Gönderim içeriği veya büyüklüğü geçersiz.',400);
 const test=body.isTest===true;
 if((!test&&(typeof body.listId!=='string'||!/^[A-Za-z0-9_-]{4,100}$/.test(body.listId)))||
    (test&&!emailOkay(body.testEmail)))return refuse('Gönderim listesi veya test e-postası geçersiz.',400);

 const resend=process.env.RESEND_API_KEY;
 const from=process.env.RESEND_FROM_EMAIL;
 const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseSecret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!resend||!from||!process.env.CAMPAIGN_SECURITY_SECRET||
    process.env.CAMPAIGN_SECURITY_SECRET.length<32)
   return refuse('Güvenli e-posta gönderimi yapılandırılmamış.',503);
 if(!test&&(!supabaseUrl||!supabaseSecret))
   return refuse('Abonelik ve izin kayıtları için veritabanı yapılandırılmamış.',503);
 let recipients:Recipient[]=[];
 let listId:string;
 try{
   if(test){
     // The address must belong to the independently verified Supabase session.
     // An arbitrary testEmail supplied by the browser must never be accepted.
     if(!identity.emailVerified||!identity.email||
        identity.email!==String(body.testEmail).trim().toLowerCase())
       return refuse('Test e-postası yalnızca hesabınızdaki doğrulanmış adrese gönderilebilir.',403);
     recipients=[{email:identity.email,name:identity.displayName||'Test'}];
     listId='test';
   }else{
     listId=body.listId as string;
     const db=createClient(supabaseUrl!,supabaseSecret!);
     const {data,error}=await db.from('mailing_lists').select('id,contacts')
       .eq('id',listId).eq('user_id',identity.userId).maybeSingle();
     if(error||!data)return refuse('Size ait gönderim listesi bulunamadı.',404);
     const list=Array.isArray(data.contacts)?data.contacts as Recipient[]:[];
     recipients=list.filter(c=>emailOkay(c.email)&&!c.unsubscribedAt&&
       Boolean(c.consentAt)&&typeof c.consentSource==='string'&&c.consentSource.trim().length>2);
     if(recipients.length<1)return refuse('İzin kaydı bulunan aktif alıcı yok. Önce abonelik izinlerini kaydedin.',422);
     if(recipients.length>30)return refuse('Tek seferde en fazla 30 alıcıya gönderin. Listeyi gruplara ayırın.',413);
     const hashes=recipients.map(c=>suppressionHash(c.email));
     const {data:blocked,error:blockError}=await db.from('email_suppressions')
       .select('email_hash').eq('user_id',identity.userId).in('email_hash',hashes);
     if(blockError)throw blockError;
     const blacklist=new Set((blocked||[]).map(v=>v.email_hash));
     recipients=recipients.filter(c=>!blacklist.has(suppressionHash(c.email)));
     if(!recipients.length)return refuse('Bu listedeki tüm izinli alıcılar abonelikten ayrılmış.',422);
   }
 }catch{return refuse('Alıcı izinleri doğrulanamadı.',503);}
 const quotaCount=recipients.length;
 try{
   const quota=await reserveQuota(identity.userId,'email',quotaCount);
   if(!quota.allowed)return refuse(quota.reason,429);
 }catch{return refuse('E-posta kotası doğrulanamadı.',503);}

 const origin=websiteOrigin(req);
 const campaignId=randomUUID();
 const text=escape(body.customMsg?String(body.customMsg):'').replace(/\r?\n/g,'<br>');
 const cleaned=sanitizeHtml(body.html,{
   allowedTags:[...sanitizeHtml.defaults.allowedTags,'img','table','thead','tbody','tr','td','th','figure','figcaption','section','main','header','footer'],
   allowedAttributes:{
     '*':['style','class','id','width','height','align','role','aria-label'],
     a:['href','target','rel','style'],
     img:['src','alt','width','height','style','loading'],
   },
   allowedSchemes:['https','http','mailto'],
   disallowedTagsMode:'discard',
 });
 const batches=recipients.map((recipient)=>{
   const first=escape((recipient.name||'Değerli Okurumuz').slice(0,120));
   let html=cleaned.replace(/\{\{isim\}\}|\[Ad\]/gi,first);
   if(text)html='<div style="padding:18px 20px;font:14px sans-serif;">'+text+'</div>'+html;
   let subject=body.subject!.toString().replace(/\{\{isim\}\}|\[Ad\]/gi,recipient.name||'');
   const common={userId:identity.userId,listId,campaignId,email:recipient.email.toLowerCase()};
   if(body.trackingEnabled===true&&recipient.trackingConsent===true&&!test){
      html=html.replace(/(<a\b[^>]*?)href="(https?:\/\/[^"]+)"([^>]*>)/gi,(full,before,url,after)=>{
        try{
          const token=makeCampaignToken({...common,kind:'click',url});
          return before+'href="'+origin+'/api/track/click?t='+encodeURIComponent(token)+'"'+after;
        }catch{return full;}
      });
      const openToken=makeCampaignToken({...common,kind:'open'});
      html+='<img src="'+origin+'/api/track/open?t='+encodeURIComponent(openToken)+'" alt="" width="1" height="1" style="display:none" />';
   }
   if(!test){
     const unsubscribeToken=makeCampaignToken({...common,kind:'unsubscribe'},365);
     html+='<div style="border-top:1px solid #e2e8f0;padding:16px;font:12px sans-serif;color:#475569;">'+
       'Bu e-posta, kayıtlı abonelik izniniz kapsamında gönderilmiştir. '+
       '<a href="'+origin+'/api/unsubscribe?t='+encodeURIComponent(unsubscribeToken)+'">Abonelikten ayrıl</a></div>';
   }
   return {from,to:recipient.email,subject,html};
 });
 try{
   const upstream=await fetch('https://api.resend.com/emails/batch',{
     method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+resend},
     body:JSON.stringify(batches),signal:AbortSignal.timeout(45_000),
   });
   if(!upstream.ok){
     console.error('Resend request failed',upstream.status);
     return refuse('E-posta hizmeti gönderimi kabul etmedi. Ayarları kontrol edin.',502);
   }
   return NextResponse.json({success:true,sent:recipients.length,campaignId,
     trackingEnabled:body.trackingEnabled===true&&!test},{headers:noStore});
 }catch{return refuse('E-posta hizmetine bağlanılamadı.',502);}
}
