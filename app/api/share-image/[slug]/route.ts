import {createHash} from 'node:crypto';
import {NextRequest} from 'next/server';
import type {PublishedNewsletter} from '@/lib/newsletter-publication-store';
import {publicOriginForRequest} from '@/lib/publication-origin';
import {socialCoverPath} from '@/lib/social-preview';
import {renderSocialPreview} from '@/lib/social-preview-image';

export const runtime='nodejs';
export const dynamic='force-dynamic';
// Bounded warm-instance cache; publication existence is checked first.
const cache=new Map<string,ArrayBuffer>();

export async function GET(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!/^[A-Za-z0-9_-]{16}$/.test(slug))return new Response('Bülten bulunamadı.',{status:404});
  try{
    const origin=publicOriginForRequest(req);
    const data=await fetch(origin+'/api/share-image-data/'+slug,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
    if(!data.ok)return new Response('Bülten bulunamadı.',{status:data.status===404?404:503,headers:{'Cache-Control':'no-store'}});
    const record=await data.json() as PublishedNewsletter;
    if(record.version!==1||typeof record.title!=='string'||typeof record.bodyHtml!=='string')throw Error('Invalid preview data');
    const fingerprint=createHash('sha256').update(origin+JSON.stringify(record)).digest('hex');
    const headers={'Content-Type':'image/png','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'};
    const cached=cache.get(fingerprint);if(cached)return new Response(cached,{headers});
    let cover:string|undefined;
    const path=socialCoverPath(record,origin);
    if(path){
      try{
        const response=await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(4000)});
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
    if(png.byteLength<=2_500_000){
      if(cache.size>=8)cache.delete(cache.keys().next().value!);
      cache.set(fingerprint,png);
    }
    return new Response(png,{headers});
  }catch(error){
    console.error('Share image unavailable:',error instanceof Error?error.message:'unknown');
    return new Response('Paylaşım görseli oluşturulamadı.',{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
