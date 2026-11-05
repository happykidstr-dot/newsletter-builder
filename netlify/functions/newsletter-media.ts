import type {Config,Context} from '@netlify/functions';
import {allowedSiteOrigin} from '../../lib/publication-origin';
import {servePublicMedia,storePublicMedia} from '../../lib/public-newsletter-media';

export const config:Config={path:['/api/media','/media/:asset']};

const MAX_JSON_BYTES=3_600_000;
const json=(value:unknown,status:number)=>Response.json(value,{
  status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
});
export default async function publicMedia(req:Request,context:Context):Promise<Response>{
  const location=new URL(req.url);
  const host=location.hostname;
  if(req.method==='GET'&&location.pathname.startsWith('/media/')){
    try {
      const asset=context.params.asset || location.pathname.split('/').pop() || '';
      return await servePublicMedia(asset,host);
    }catch(error){
      console.error('media read failed',error instanceof Error?error.message:error);
      return new Response('Görsel alınamadı.',{status:503});
    }
  }
  if(req.method==='POST'&&location.pathname==='/api/media'){
    const origin=req.headers.get('origin');
    if(!origin||!allowedSiteOrigin(origin)||new URL(origin).hostname!==host)
      return json({error:'Görsel yüklemek için bülten editörünü kullanın.'},403);
    if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
      return json({error:'JSON isteği gerekli.'},415);
    if(Number(req.headers.get('content-length')||0)>MAX_JSON_BYTES)
      return json({error:'Görseli küçültüp yeniden deneyin.'},413);
    try{
      const raw=await req.text();
      if(raw.length>MAX_JSON_BYTES)return json({error:'Görsel çok büyük.'},413);
      const value=JSON.parse(raw);
      const ip=req.headers.get('x-nf-client-connection-ip')||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
      const saved=await storePublicMedia(value,ip,host);
      return json({url:new URL('/media/'+saved.id,origin).toString(),bytes:saved.bytes},201);
    }catch(error){
      const code=error instanceof Error?error.message:'';
      if(code==='INVALID_IMAGE')return json({error:'Desteklenmeyen veya çok büyük görsel.'},413);
      if(code==='MEDIA_QUOTA')return json({error:'Görsel yükleme güvenlik kotasına ulaşıldı. Bir süre sonra yeniden deneyin.'},429);
      console.error('media upload failed',code);
      return json({error:'Görsel depolama servisine ulaşılamadı.'},503);
    }
  }
  return json({error:'Yöntem desteklenmiyor.'},405);
}
