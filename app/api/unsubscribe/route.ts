import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {readCampaignToken} from '@/lib/security/campaign-token';

export const runtime='nodejs';
const page=(title:string,body:string)=>'<!doctype html><html lang="tr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>'+title+'</title></head><body style="font:16px system-ui;background:#f8fafc;color:#172554;display:grid;place-items:center;min-height:100vh"><main style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:30px;max-width:520px"><h1>'+title+'</h1>'+body+'</main></body></html>';
const answer=(title:string,body:string,status=200)=>new NextResponse(page(title,body),{
 status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
 'X-Content-Type-Options':'nosniff'},
});
export async function GET(req:NextRequest){
 const t=new URL(req.url).searchParams.get('t')||'';
 if(!readCampaignToken(t,'unsubscribe'))return answer('Bağlantı geçersiz','<p>Bu abonelik bağlantısının süresi dolmuş veya geçersiz.</p>',400);
 const safe=encodeURIComponent(t);
 return answer('Bülten aboneliğinden ayrıl','<p>Gelecekteki toplu bülten e-postalarını almak istemiyorsanız aşağıdaki düğmeye basın.</p>'+
 '<form method="post"><input type="hidden" name="t" value="'+safe+'"><button type="submit" style="background:#0f766e;color:#fff;border:none;border-radius:8px;padding:12px 20px;cursor:pointer">Aboneliği iptal et</button></form>');
}
export async function POST(req:NextRequest){
 let raw='';
 try{
   const form=await req.formData();
   raw=String(form.get('t')||'');
   // The displayed token is URI-encoded in the hidden field.
   raw=decodeURIComponent(raw);
 }catch{return answer('İstek geçersiz','<p>Abonelik bağlantısı okunamadı.</p>',400);}
 const token=readCampaignToken(raw,'unsubscribe');
 if(!token)return answer('Bağlantı geçersiz','<p>Abonelik bağlantısı geçersiz veya süresi dolmuş.</p>',400);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return answer('İşlem yapılamadı','<p>Abonelik servisine erişilemiyor. Lütfen gönderen kuruluşla iletişime geçin.</p>',503);
 try{
   const db=createClient(url,key);
   const {data,error}=await db.from('mailing_lists').select('contacts')
     .eq('id',token.listId).eq('user_id',token.userId).maybeSingle();
   if(error||!data)return answer('Abonelik bulunamadı','<p>İlgili kayıt bulunamadı.</p>',404);
   const contacts=Array.isArray(data.contacts)?data.contacts as Array<Record<string,unknown>>:[];
   const updated=contacts.map(contact=>String(contact.email||'').toLowerCase()===token.email.toLowerCase()
     ?{...contact,unsubscribedAt:contact.unsubscribedAt||new Date().toISOString(),trackingConsent:false}:contact);
   const {error:writeError}=await db.from('mailing_lists')
     .update({contacts:updated}).eq('id',token.listId).eq('user_id',token.userId);
   if(writeError)throw writeError;
   return answer('Abonelik iptal edildi','<p>Talebiniz kaydedildi. Bu listeden yeni toplu bülten e-postaları almayacaksınız.</p>');
 }catch{return answer('İşlem yapılamadı','<p>İptal işlemi kaydedilemedi. Lütfen gönderen kuruluşla iletişime geçin.</p>',503);}
}
