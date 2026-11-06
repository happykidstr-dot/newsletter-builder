import {randomBytes} from 'node:crypto';
import {checkMediaUploadQuota,mediaStore} from './newsletter-publication-store';

/** A single audio control accepts these formats; playback still depends on the browser. */
export const MAX_AUDIO_BYTES=60*1024*1024;
export const AUDIO_CHUNK_BYTES=1_500_000;
const TYPES:Record<string,string>={
  mp3:'audio/mpeg',mp2:'audio/mpeg',mpeg:'audio/mpeg',wav:'audio/wav',wave:'audio/wav',
  m4a:'audio/mp4',m4b:'audio/mp4',m4r:'audio/mp4',mp4:'audio/mp4',
  ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',spx:'audio/ogg',
  flac:'audio/flac',aac:'audio/aac',webm:'audio/webm',weba:'audio/webm',
  aif:'audio/aiff',aiff:'audio/aiff',aifc:'audio/aiff',caf:'audio/x-caf',
  wma:'audio/x-ms-wma',amr:'audio/amr','3gp':'audio/3gpp','3ga':'audio/3gpp',
  alac:'audio/mp4',ape:'audio/x-ape',au:'audio/basic',ra:'audio/x-realaudio',
  ram:'audio/x-realaudio',dsf:'audio/x-dsf',dff:'audio/x-dff',
  mid:'audio/midi',midi:'audio/midi',mka:'audio/x-matroska',
  ac3:'audio/ac3',eac3:'audio/eac3',dts:'audio/vnd.dts',
  pcm:'application/octet-stream',raw:'application/octet-stream',
  tta:'application/octet-stream',wv:'audio/x-wavpack',
  mpc:'audio/x-musepack',mod:'audio/x-mod',xm:'audio/x-xm',
};
const PLAYER_EXTENSIONS=new Set(['mp3','mp2','mpeg','wav','wave','m4a','m4b','mp4','ogg','oga','opus','spx','flac','aac','webm','weba']);
export const AUDIO_ACCEPT='audio/*,'+Object.keys(TYPES).map(e=>'.'+e).join(',');
export const isAudioId=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{22}$/.test(v);
export function audioFormat(filename:string,declaredMime=''): {mime:string;playback:boolean}|null {
  const name=filename.trim();
  if(name.length<1||name.length>180||/[\\/\0\r\n]/.test(name))return null;
  const ext=name.toLowerCase().split('.').pop()||'';
  if(TYPES[ext])return {mime:TYPES[ext],playback:PLAYER_EXTENSIONS.has(ext)};
  // Future/less common audio formats may be uploaded, but are served as
  // download-only rather than trusted as arbitrary executable MIME types.
  if(/^[a-z0-9]{1,8}$/.test(ext)&&/^audio\/[a-z0-9.+-]+$/i.test(declaredMime))
    return {mime:'application/octet-stream',playback:false};
  return null;
}
type AudioManifest={
  id:string;name:string;mime:string;bytes:number;parts:number;state:'uploading'|'ready';
  owner:string;playback:boolean;createdAt:number;
};
const manifestKey=(id:string)=>'audio-manifest-'+id;
const partKey=(id:string,index:number)=>'audio-part-'+id+'-'+index;
const json=(value:unknown,status:number)=>Response.json(value,{status,headers:{
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
}});
function parsePayload(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('INVALID_AUDIO');
  return value as Record<string,unknown>;
}
async function lookup(id:string,hostname?:string):Promise<AudioManifest|null>{
  if(!isAudioId(id))return null;
  const value=await mediaStore(hostname).get(manifestKey(id),{type:'json'});
  return value as AudioManifest|null;
}
export async function storeAudioRequest(
  payload:unknown,owner:string,ip:string,hostname?:string,
):Promise<Response>{
  const input=parsePayload(payload);
  const store=mediaStore(hostname);
  if(input.action==='start'){
    if(typeof input.name!=='string'||typeof input.mime!=='string'||
      typeof input.size!=='number'||!Number.isSafeInteger(input.size)||input.size<1||input.size>MAX_AUDIO_BYTES)
      return json({error:'Ses dosyası geçersiz veya 60 MB sınırını aşıyor.'},413);
    const format=audioFormat(input.name,input.mime);
    if(!format)return json({error:'Lütfen ses dosyası seçin. Dosya uzantısı tanınamadı.'},415);
    if(!await checkMediaUploadQuota(ip,1,hostname))return json({error:'Yükleme kotasına ulaşıldı.'},429);
    const id=randomBytes(16).toString('base64url');
    const bytes=Number(input.size);
    const parts=Math.ceil(bytes/AUDIO_CHUNK_BYTES);
    const manifest:AudioManifest={
      id,name:input.name,mime:format.mime,playback:format.playback,
      bytes,parts,state:'uploading',owner,createdAt:Date.now(),
    };
    await store.setJSON(manifestKey(id),manifest);
    return json({id,parts,chunkBytes:AUDIO_CHUNK_BYTES,maxBytes:MAX_AUDIO_BYTES},201);
  }
  if(!isAudioId(input.id))return json({error:'Geçersiz ses kaydı kimliği.'},400);
  const manifest=await lookup(input.id,hostname);
  if(!manifest||manifest.owner!==owner)return json({error:'Ses dosyası bulunamadı veya erişim yok.'},403);
  if(input.action==='chunk'){
    if(manifest.state!=='uploading')return json({error:'Yükleme zaten tamamlandı.'},409);
    const index=input.index;
    if(typeof index!=='number'||!Number.isSafeInteger(index)||index<0||index>=manifest.parts||
      typeof input.base64!=='string'||input.base64.length>2_100_000||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(input.base64))
      return json({error:'Ses parçası geçersiz.'},400);
    const bytes=Buffer.from(input.base64,'base64');
    const expected=Math.min(AUDIO_CHUNK_BYTES,manifest.bytes-Number(index)*AUDIO_CHUNK_BYTES);
    if(bytes.length!==expected)return json({error:'Ses parçası boyutu yanlış.'},400);
    if(!await checkMediaUploadQuota(ip,bytes.length,hostname))
      return json({error:'Ses yükleme kotasına ulaşıldı.'},429);
    await store.set(partKey(manifest.id,Number(index)),new Blob([new Uint8Array(bytes)]));
    return json({stored:true,index},200);
  }
  if(input.action==='finish'){
    if(manifest.state!=='uploading')return json({error:'Yükleme zaten tamamlandı.'},409);
    // Never expose an incompletely stored file to public readers.
    for(let i=0;i<manifest.parts;i++){
      const part=await store.get(partKey(manifest.id,i),{type:'blob'});
      const expected=Math.min(AUDIO_CHUNK_BYTES,manifest.bytes-i*AUDIO_CHUNK_BYTES);
      if(!part||part.size!==expected)
        return json({error:'Ses dosyası tam yüklenmedi. Lütfen yeniden deneyin.'},409);
    }
    await store.setJSON(manifestKey(manifest.id),{...manifest,state:'ready'} as AudioManifest);
    return json({url:'/audio/'+manifest.id,name:manifest.name,mime:manifest.mime,playback:manifest.playback},201);
  }
  return json({error:'Geçersiz yükleme işlemi.'},400);
}
function formatDisposition(name:string,inline:boolean){
  const fallback=name.replace(/[^A-Za-z0-9._ -]/g,'_').replace(/"/g,'').slice(0,120)||'sound';
  return (inline?'inline':'attachment')+'; filename="'+fallback+'"; filename*=UTF-8\'\''+encodeURIComponent(name);
}
export async function servePublicAudio(
  id:string,hostname?:string,rangeHeader?:string|null,
):Promise<Response>{
  const manifest=await lookup(id,hostname);
  if(!manifest||manifest.state!=='ready')return new Response('Ses kaydı bulunamadı.',{status:404});
  let start=0,end=manifest.bytes-1,partial=false;
  if(rangeHeader){
    const range=/^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if(!range||(!range[1]&&!range[2]))
      return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+manifest.bytes}});
    if(!range[1]){
      const suffix=Number(range[2]);
      if(!Number.isSafeInteger(suffix)||suffix<1)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+manifest.bytes}});
      start=Math.max(0,manifest.bytes-suffix);
    }else{
      start=Number(range[1]);
      if(range[2])end=Math.min(manifest.bytes-1,Number(range[2]));
    }
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=manifest.bytes||end<start)
      return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+manifest.bytes}});
    partial=true;
  }
  const startPart=Math.floor(start/AUDIO_CHUNK_BYTES);
  const endPart=Math.floor(end/AUDIO_CHUNK_BYTES);
  const buffer=new Uint8Array(end-start+1);
  const store=mediaStore(hostname);
  let writeOffset=0;
  for(let i=startPart;i<=endPart;i++){
    const part=await store.get(partKey(id,i),{type:'blob'});
    if(!part)return new Response('Ses dosyası eksik.',{status:503});
    const bytes=new Uint8Array(await part.arrayBuffer());
    const from=Math.max(0,start-i*AUDIO_CHUNK_BYTES);
    const to=Math.min(bytes.length,end-i*AUDIO_CHUNK_BYTES+1);
    buffer.set(bytes.subarray(from,to),writeOffset);
    writeOffset+=to-from;
  }
  if(writeOffset!==buffer.length)return new Response('Ses dosyası eksik.',{status:503});
  return new Response(buffer,{
    status:partial?206:200,
    headers:{
      'Content-Type':manifest.mime,
      'Content-Length':String(buffer.byteLength),
      'Accept-Ranges':'bytes',
      ...(partial?{'Content-Range':`bytes ${start}-${end}/${manifest.bytes}`}:{}),
      'Cache-Control':'public, max-age=86400',
      'Content-Disposition':formatDisposition(manifest.name,manifest.playback),
      'X-Content-Type-Options':'nosniff',
      'Cross-Origin-Resource-Policy':'cross-origin',
      'Content-Security-Policy':"default-src 'none'; sandbox",
    },
  });
}
