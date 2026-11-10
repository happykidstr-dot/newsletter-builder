import {createHash} from 'node:crypto';
import {NextRequest} from 'next/server';
import {publicationStore,mediaStore,type PublishedNewsletter} from '@/lib/newsletter-publication-store';
import {publicOriginForRequest} from '@/lib/publication-origin';
import {servePublicMedia} from '@/lib/public-newsletter-media';
import {socialCoverPath} from '@/lib/social-preview';
import {renderSocialPreview} from '@/lib/social-preview-image';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!/^[A-Za-z0-9_-]{16}$/.test(slug))return new Response('Bülten bulunamadı.',{status:404});
  try{
    const origin=publicOriginForRequest(req),host=new URL(origin).hostname;
    const record=await publicationStore(host).get(slug,{type:'json'}) as PublishedNewsletter|null;
    if(!record||record.version!==1||typeof record.title!=='string'||typeof record.bodyHtml!=='string')
      return new Response('Bülten bulunamadı.',{status:404,headers:{'Cache-Control':'no-store'}});
    const imageStore=mediaStore(host),cacheKey='social-preview-v1-'+slug;
    const fingerprint=createHash('sha256').update(JSON.stringify([record.title,record.subtitle,record.bodyHtml,record.headerImgUrl,record.revision])).digest('hex');
    const headers={'Content-Type':'image/png','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'};
    try{
      const cached=await imageStore.getWithMetadata(cacheKey,{type:'blob'});
      if(cached?.data&&cached.metadata?.fingerprint===fingerprint)return new Response(cached.data as Blob,{headers});
    }catch{/* Rendering is still possible if the optional image cache fails. */}
    let cover:string|undefined;
    const path=socialCoverPath(record,origin);
    if(path){
      try{
        const response=path.startsWith('/media/')?await servePublicMedia(path.slice(7),host):
          await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(4000)});
        const mime=response.headers.get('content-type')?.split(';')[0]||'';
        if(response.ok&&/^image\/(?:png|jpeg|webp|gif)$/.test(mime)){
          const reader=response.body?.getReader();let total=0;const chunks:Uint8Array[]=[];
          if(reader)for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>2_500_000){await reader.cancel();throw Error('Image too large');}chunks.push(value);}
          if(total)cover='data:'+mime+';base64,'+Buffer.concat(chunks).toString('base64');
        }
      }catch{/* A missing/unsupported cover must not suppress the sharing image. */}
    }
    // Consume the render here so unsupported images can fall back to text.
    let png:ArrayBuffer;
    try{png=await renderSocialPreview(record,cover).arrayBuffer();}
    catch{png=await renderSocialPreview(record).arrayBuffer();}
    try{await imageStore.set(cacheKey,new Blob([new Uint8Array(png)],{type:'image/png'}),{metadata:{fingerprint}});}
    catch{/* A cache write must not hide a successfully rendered cover. */}
    return new Response(png,{headers});
  }catch(error){
    console.error('Share image unavailable:',error instanceof Error?error.message:'unknown');
    return new Response('Paylaşım görseli oluşturulamadı.',{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
