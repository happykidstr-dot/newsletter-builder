import {randomBytes} from 'node:crypto';
import {checkMediaUploadQuota,mediaStore} from './newsletter-publication-store';

const MAX_IMAGE_BYTES=2_500_000; // below Netlify's request and buffered response ceilings
const supported=['image/jpeg','image/png','image/webp','image/gif'] as const;
type ImageMime=typeof supported[number];

export function isPublicMediaId(id:unknown):id is string {
  return typeof id==='string'&&/^[A-Za-z0-9_-]{22}$/.test(id);
}

function realImageType(data:Uint8Array):ImageMime|null {
  if(data.length>=12 && data[0]===0x89&&data[1]===0x50&&data[2]===0x4e&&data[3]===0x47) return 'image/png';
  if(data.length>=4 && data[0]===0xff&&data[1]===0xd8&&data[2]===0xff) return 'image/jpeg';
  if(data.length>=12 && String.fromCharCode(...data.slice(0,4))==='RIFF' &&
     String.fromCharCode(...data.slice(8,12))==='WEBP')return 'image/webp';
  if(data.length>=6 && ['GIF87a','GIF89a'].includes(String.fromCharCode(...data.slice(0,6))))return 'image/gif';
  return null;
}

export async function storePublicMedia(
  payload:unknown,ip:string,hostname?:string
):Promise<{id:string,contentType:ImageMime,bytes:number}> {
  const data=payload as {mime?:unknown,base64?:unknown};
  if(!data||typeof data.base64!=='string'||typeof data.mime!=='string'||
     !supported.includes(data.mime as ImageMime)||
     data.base64.length>Math.ceil(MAX_IMAGE_BYTES*4/3)+64||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(data.base64))
    throw new Error('INVALID_IMAGE');
  const bytes=Buffer.from(data.base64,'base64');
  if(bytes.length<15||bytes.length>MAX_IMAGE_BYTES)throw new Error('INVALID_IMAGE');
  const actualMime=realImageType(bytes);
  if(!actualMime || actualMime!==data.mime)throw new Error('INVALID_IMAGE');
  if(!(await checkMediaUploadQuota(ip,bytes.length,hostname)))throw new Error('MEDIA_QUOTA');
  const id=randomBytes(16).toString('base64url');
  const blob=new Blob([new Uint8Array(bytes)],{type:actualMime});
  await mediaStore(hostname).set(id,blob,{metadata:{type:actualMime}});
  return {id,contentType:actualMime,bytes:bytes.length};
}

export async function servePublicMedia(id:string,hostname?:string):Promise<Response> {
  if(!isPublicMediaId(id))return new Response('Görsel bulunamadı.',{status:404});
  const result=await mediaStore(hostname).getWithMetadata(id,{type:'blob'});
  if(!result?.data)return new Response('Görsel bulunamadı.',{status:404});
  const mime=result.metadata?.type;
  if(!supported.includes(mime as ImageMime))return new Response('Görsel bulunamadı.',{status:404});
  return new Response(result.data as Blob,{
    status:200,headers:{
      'Content-Type':mime as string,
      'Cache-Control':'public, max-age=31536000, immutable',
      'X-Content-Type-Options':'nosniff',
      'Cross-Origin-Resource-Policy':'cross-origin',
      'Content-Security-Policy':"default-src 'none'; sandbox",
    },
  });
}
