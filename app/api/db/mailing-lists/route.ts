import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireSignedInUser,checkSameOrigin,boundedJson,requestProblem} from '@/lib/security/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&secret?createClient(url,secret):null;
}
export async function GET(){
 const user=await requireSignedInUser();if(user.error)return user.error;
 const client=db();if(!client)return error('Abonelik veritabanı yapılandırılmadı.',503);
 try{
   const {data,error:readError}=await client.from('mailing_lists').select('*')
     .eq('user_id',user.userId).order('created_at',{ascending:false}).limit(200);
   if(readError)throw readError;
   return NextResponse.json(data||[],{headers:{'Cache-Control':'no-store'}});
 }catch{return error('Listeler okunamadı.',503);}
}
export async function POST(req:NextRequest){
 const user=await requireSignedInUser();if(user.error)return user.error;
 const origin=checkSameOrigin(req);if(origin)return origin;
 const client=db();if(!client)return error('Abonelik veritabanı yapılandırılmadı.',503);
 let input:unknown;try{input=await boundedJson(req,300_000);}catch(e){return requestProblem(e);}
 const lists=Array.isArray(input)?input:[input];
 if(!lists.length||lists.length>40)return error('Liste sayısı geçersiz.',400);
 try{
   const identifiers:string[]=[];
   const parsed=lists.map(item=>{
     const obj=item as {id?:unknown;name?:unknown;contacts?:unknown;created_at?:unknown};
     if(!obj||typeof obj.id!=='string'||!/^[a-zA-Z0-9_-]{4,100}$/.test(obj.id)||
        typeof obj.name!=='string'||obj.name.length<1||obj.name.length>120||
        !Array.isArray(obj.contacts)||obj.contacts.length>2000)throw Error('BAD_LIST');
     identifiers.push(obj.id);
     const seen=new Set<string>();
     const contacts=obj.contacts.map((raw:unknown)=>{
       const c=raw as Record<string,unknown>;
       if(!c||typeof c.email!=='string'||c.email.length>254||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))throw Error('BAD_CONTACT');
       const email=c.email.trim().toLowerCase();
       if(seen.has(email))throw Error('DUPLICATE');
       seen.add(email);
       const record:{email:string;name:string;addedAt:string;consentAt?:string;consentSource?:string;trackingConsent:boolean;unsubscribedAt?:string}={
         email,name:typeof c.name==='string'?c.name.slice(0,140):email,
         addedAt:typeof c.addedAt==='string'?c.addedAt:new Date().toISOString(),
         trackingConsent:c.trackingConsent===true,
       };
       if(typeof c.consentAt==='string'&&Number.isFinite(Date.parse(c.consentAt))&&
          typeof c.consentSource==='string'&&c.consentSource.trim().length>=3){
         record.consentAt=c.consentAt;
         record.consentSource=c.consentSource.trim().slice(0,200);
       }
       if(typeof c.unsubscribedAt==='string'&&Number.isFinite(Date.parse(c.unsubscribedAt)))
         record.unsubscribedAt=c.unsubscribedAt;
       return record;
     });
     return {id:obj.id,user_id:user.userId,name:obj.name,contacts,
       created_at:typeof obj.created_at==='string'?obj.created_at:new Date().toISOString()};
   });
   const {data:old,error:oldError}=await client.from('mailing_lists').select('id,contacts')
     .eq('user_id',user.userId).in('id',identifiers);
   if(oldError)throw oldError;
   const oldById=new Map((old||[]).map(v=>[v.id,v]));
   for(const list of parsed){
     const previous=oldById.get(list.id);
     const existing=new Map(((previous?.contacts||[]) as Array<Record<string,unknown>>)
       .map(v=>[String(v.email||'').toLowerCase(),v]));
     list.contacts=list.contacts.map(contact=>{
       const was=existing.get(contact.email);
       // Previous unsubscribe must never be overwritten by a stale browser save.
       if(typeof was?.unsubscribedAt==='string')contact.unsubscribedAt=was.unsubscribedAt;
       return contact;
     });
   }
   const {error:writeError}=await client.from('mailing_lists').upsert(parsed,{onConflict:'id'});
   if(writeError)throw writeError;
   return NextResponse.json({success:true,count:parsed.length},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
   if(e instanceof Error&&['BAD_LIST','BAD_CONTACT','DUPLICATE'].includes(e.message))
     return error('Liste veya izin verileri geçersiz.',400);
   return error('Abonelik listesi kaydedilemedi.',503);
 }
}
export async function DELETE(req:NextRequest){
 const user=await requireSignedInUser();if(user.error)return user.error;
 const origin=checkSameOrigin(req);if(origin)return origin;
 const client=db();if(!client)return error('Veritabanı yapılandırılmadı.',503);
 const id=new URL(req.url).searchParams.get('id');
 if(!id||!/^[a-zA-Z0-9_-]{4,100}$/.test(id))return error('Liste kimliği geçersiz.',400);
 try{
   const {error:del}=await client.from('mailing_lists').delete().eq('id',id).eq('user_id',user.userId);
   if(del)throw del;
   return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return error('Liste silinemedi.',503);}
}
