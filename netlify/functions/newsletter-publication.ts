import {randomBytes} from 'node:crypto';
import {matchesEditToken,newPublicationCredential,validPublicationSlug} from '../../lib/publication-edit-credentials';
import type {Config,Context} from '@netlify/functions';
import {publicationStore, checkPublishQuota, type PublishedNewsletter} from '../../lib/newsletter-publication-store';
import {sanitiseNewsletterBody, renderPublishedNewsletter} from '../../lib/public-newsletter-render';
import {allowedSiteOrigin} from '../../lib/publication-origin';
import {createClient} from '@supabase/supabase-js';
import {verifyNetlifyPublisher} from '../../lib/security/netlify-publisher';

export const config:Config = {
  path:['/api/publish','/api/unpublish','/b/:slug'],
};

const MAX_BYTES=5_700_000;

async function recordAnonymousPageRequest(ownerUserId:string,slug:string,req:Request):Promise<void>{
  const userAgent=req.headers.get('user-agent')||'';
  if(/(bot|spider|crawl|preview|facebookexternalhit|twitterbot|linkedinbot|whatsapp|HeadlessChrome|slack|discord)/i.test(userAgent))return;
  if(req.headers.get('purpose')==='prefetch'||req.headers.get('sec-purpose')==='prefetch')return;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return;
  try{
    const {error}=await createClient(url,key).from('newsletter_web_events')
      .insert({user_id:ownerUserId,publication_slug:slug});
    if(error)console.warn('Web page request analytics unavailable:',error.message);
  }catch{
    console.warn('Web page request analytics temporarily unavailable.');
  }
}


async function parseBoundedRequest(req:Request){
  if(Number(req.headers.get('content-length')||'0')>MAX_BYTES)throw new Error('Bülten boyutu sınırı aşıldı.');
  const raw=await req.text();
  if(raw.length>MAX_BYTES)throw new Error('Bülten boyutu sınırı aşıldı.');
  return JSON.parse(raw);
}

function reply(body:unknown,status:number):Response{
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export default async (req:Request,context:Context):Promise<Response>=>{
  const host=new URL(req.url).hostname;
  if(req.method==='POST'&&new URL(req.url).pathname==='/api/publish'){
    const origin=req.headers.get('origin')||'';
    if(!allowedSiteOrigin(origin))return reply({error:'Yayınlama yalnızca BÜLTEN READ editöründen yapılabilir.'},403);
    if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
      return reply({error:'JSON isteği gerekli.'},415);
    try{
      const body=await parseBoundedRequest(req);
      if(typeof body?.html!=='string'||body.html.length>MAX_BYTES||
        typeof body?.title!=='string'||!body.title.trim()||body.title.length>180||
        typeof body?.subtitle!=='string'||body.subtitle.length>550||
        typeof body?.headerImgUrl!=='string'||body.headerImgUrl.length>3000){
        return reply({error:'Bülten bilgileri geçersiz veya çok uzun.'},400);
      }
      const decision=await verifyNetlifyPublisher(req);
      if(decision.error)return reply({error:decision.error},decision.status);
      const owner=decision.userId;
      const clean=sanitiseNewsletterBody(body.html);
      const ip=req.headers.get('x-nf-client-connection-ip')||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
      if(!(await checkPublishQuota(ip,host)))
        return reply({error:'Paylaşım sınırına ulaşıldı. Daha sonra yeniden deneyin.'},429);
      const store=publicationStore(host);
      const editing=body.slug!==undefined && body.slug!==null;
      if(editing && !validPublicationSlug(body.slug))
        return reply({error:'Yayın bağlantısı geçersiz.'},400);
      const slug:string=editing ? body.slug : randomBytes(12).toString('base64url');
      const previous=editing ? await store.get(slug,{type:'json'}) as PublishedNewsletter|null : null;
      if(editing && !previous)return reply({error:'Yayınlanmış bülten bulunamadı.'},404);
      if(editing && !matchesEditToken(body.editToken,previous?.editTokenHash))
        return reply({error:'Bu yayını değiştirmek için düzenleme yetkisi gerekiyor.'},403);
      if(editing&&previous?.ownerUserId&&previous.ownerUserId!==owner)
        return reply({error:'Bu yayın farklı bir kullanıcı hesabına ait.'},403);
      if(editing && Number.isInteger(body.expectedRevision) &&
         body.expectedRevision!==(previous?.revision||1))
        return reply({error:'Bu bülten başka bir oturumda güncellenmiş. Son sürümü açıp tekrar deneyin.'},409);
      const credential=editing ? null : newPublicationCredential();
      const timestamp=new Date().toISOString();
      const record:PublishedNewsletter={
        version:1,bodyHtml:clean,title:body.title.trim(),subtitle:body.subtitle,
        headerImgUrl:body.headerImgUrl,
        createdAt:previous?.createdAt||timestamp,
        updatedAt:timestamp,
        revision:(previous?.revision||0)+1,
        editTokenHash:previous?.editTokenHash||credential!.hash,
        ownerUserId:previous?.ownerUserId||owner,
      };
      await store.setJSON(slug,record);
      return reply({
        slug,url:new URL('/b/'+slug,origin).toString(),
        updated:editing,revision:record.revision,
        ...(credential ? {editToken:credential.token}:{}),
      },editing?200:201);
    }catch(error){
      const detail=error instanceof Error?error.message:'Bülten yayımlanamadı.';
      console.error('Netlify publication failed:',detail);
      const oversized=detail.includes('boyutu');
      return reply({error:oversized?'Bülten çok büyük. Görselleri küçültüp yeniden deneyin.':'Bülten yayımlanamadı. Depolama servisi kullanılamıyor.'},oversized?413:503);
    }
  }
  if(req.method==='POST'&&new URL(req.url).pathname==='/api/unpublish'){
    const origin=req.headers.get('origin')||'';
    if(!allowedSiteOrigin(origin)||new URL(origin).hostname!==host)
      return reply({error:'Yayından kaldırma sadece kendi editörünüzden yapılabilir.'},403);
    if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
      return reply({error:'JSON bekleniyor.'},415);
    try{
      const decision=await verifyNetlifyPublisher(req);
      if(decision.error)return reply({error:decision.error},decision.status);
      const raw=await req.text();
      if(raw.length>4_000)return reply({error:'İstek çok büyük.'},413);
      const body=JSON.parse(raw);
      if(!validPublicationSlug(body?.slug))return reply({error:'Yayın adresi geçersiz.'},400);
      const store=publicationStore(host);
      const existing=await store.get(body.slug,{type:'json'}) as PublishedNewsletter|null;
      if(!existing)return reply({error:'Bülten bulunamadı.'},404);
      if(existing.ownerUserId&&existing.ownerUserId!==decision.userId)
        return reply({error:'Bu yayın başka kullanıcı hesabına ait.'},403);
      if(!matchesEditToken(body.editToken,existing.editTokenHash))
        return reply({error:'Bu bülteni yayından kaldırma yetkiniz yok.'},403);
      await store.delete(body.slug);
      return reply({success:true,slug:body.slug},200);
    }catch(error){
      console.error('unpublish failed',error instanceof Error?error.message:error);
      return reply({error:'Bülten yayından kaldırılamadı.'},503);
    }
  }
  if(req.method==='GET'){
    const slug=context.params.slug||new URL(req.url).pathname.split('/').pop()||'';
    if(!/^[A-Za-z0-9_-]{16}$/.test(slug))return new Response('Bülten bulunamadı.',{status:404});
    try{
      const record=await publicationStore(host).get(slug,{type:'json'}) as PublishedNewsletter|null;
      if(!record||record.version!==1||typeof record.bodyHtml!=='string'||typeof record.title!=='string')
        return new Response('Bülten bulunamadı.',{status:404});
      const url=new URL('/b/'+slug,req.url).toString();
      const {html,csp}=renderPublishedNewsletter(record,url);
      if(record.ownerUserId)await recordAnonymousPageRequest(record.ownerUserId,slug,req);
      return new Response(html,{status:200,headers:{
        'Content-Type':'text/html; charset=utf-8',
        'Cache-Control':'public, max-age=0, must-revalidate',
        'Content-Security-Policy':csp,
        'X-Content-Type-Options':'nosniff',
        'Referrer-Policy':'strict-origin-when-cross-origin',
      }});
    }catch(error){
      console.error('Netlify reader failed:',error instanceof Error?error.message:error);
      return new Response('Bülten şu anda görüntülenemiyor.',{status:503});
    }
  }
  return reply({error:'Yöntem desteklenmiyor.'},405);
};
