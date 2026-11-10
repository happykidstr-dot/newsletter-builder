import type {Config,Context} from '@netlify/functions';
import {allowedSiteOrigin} from '../../lib/publication-origin';
import {verifyAnonymousWrite} from '../../lib/anonymous-publish-guard';
import {anonymousAudioOwner} from '../../lib/anonymous-audio-owner';
import {servePublicAudio,storeAudioRequest} from '../../lib/newsletter-audio';

export const config:Config={path:['/api/audio','/audio/:asset'],rateLimit:{windowLimit:300,windowSize:60,aggregateBy:['ip','domain']}};
const json=(value:unknown,status:number)=>Response.json(value,{
  status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
});
const MAX_REQUEST_BYTES=2_100_000;
export default async function audioRoute(req:Request,context:Context):Promise<Response>{
  const url=new URL(req.url),hostname=url.hostname;
  if(req.method==='GET'&&url.pathname.startsWith('/audio/')){
    const id=context.params.asset||url.pathname.split('/').pop()||'';
    try{return await servePublicAudio(id,hostname,req.headers.get('range'));}
    catch(e){console.error('Audio playback failed:',e instanceof Error?e.message:e);
      return new Response('Ses dosyasına erişilemiyor.',{status:503});}
  }
  if(req.method==='POST'&&url.pathname==='/api/audio'){
    const origin=req.headers.get('origin')||'';
    if(!origin||!allowedSiteOrigin(origin)||new URL(origin).hostname!==hostname)
      return json({error:'Ses ekleme yalnızca BÜLTEN READ editöründen yapılabilir.'},403);
    const verification=await verifyAnonymousWrite(req);if(verification)return verification;
    const owner=anonymousAudioOwner(req);
    if(!owner)return json({error:'Ses yükleme anahtarı geçersiz.'},403);
    if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
      return json({error:'JSON isteği gerekli.'},415);
    if(Number(req.headers.get('content-length')||0)>MAX_REQUEST_BYTES)
      return json({error:'Ses parçası çok büyük.'},413);
    try{
      const raw=await req.text();
      if(raw.length>MAX_REQUEST_BYTES)return json({error:'Ses parçası çok büyük.'},413);
      const ip=req.headers.get('x-nf-client-connection-ip')||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
      return await storeAudioRequest(JSON.parse(raw),owner,ip,hostname);
    }catch(e){
      console.error('Audio storage failed:',e instanceof Error?e.message:e);
      return json({error:'Ses dosyası depolanamadı.'},503);
    }
  }
  return json({error:'Yöntem desteklenmiyor.'},405);
}
