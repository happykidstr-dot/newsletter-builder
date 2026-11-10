'use client';
import {anonymousWriteHeaders} from './anonymous-turnstile';

/** The UI has one audio icon; file selection covers the major audio families. */
const extensions=[
  'mp3','mp2','mpeg','wav','wave','m4a','m4b','m4r','mp4','ogg','oga','opus',
  'spx','flac','aac','webm','weba','aif','aiff','aifc','caf','wma','amr',
  '3gp','3ga','alac','ape','au','ra','ram','dsf','dff','mid','midi','mka',
  'ac3','eac3','dts','pcm','raw','tta','wv','mpc','mod','xm',
];
export const AUDIO_FILE_ACCEPT='audio/*,'+extensions.map(ext=>'.'+ext).join(',');
const CHUNK_BYTES=1_500_000;
const MAX_BYTES=60*1024*1024;

async function encodePart(blob:Blob):Promise<string>{
  return new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const text=String(reader.result||'');
      const sep=text.indexOf(',');
      if(sep<0)return reject(new Error('Ses dosyası okunamadı.'));
      resolve(text.slice(sep+1));
    };
    reader.onerror=()=>reject(new Error('Ses dosyası okunamadı.'));
    reader.readAsDataURL(blob);
  });
}
async function postAudio(value:unknown,headers:Record<string,string>):Promise<Record<string,unknown>>{
  const response=await fetch('/api/audio',{
    method:'POST',headers:{'Content-Type':'application/json',...headers,...(await anonymousWriteHeaders('/api/audio'))},
    body:JSON.stringify(value),
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)
    throw new Error(typeof result.error==='string'?result.error:'Ses yükleme başarısız. Lütfen tekrar deneyin.');
  return result;
}
export async function uploadAudioFile(
  file:File,onProgress:(current:number,total:number)=>void,
):Promise<{url:string;name:string;playback:boolean}>{
  if(file.size<1)throw new Error('Boş ses dosyası yüklenemez.');
  if(file.size>MAX_BYTES)throw new Error('En fazla 60 MB boyutunda ses dosyası yükleyebilirsiniz.');
  const secret=crypto.getRandomValues(new Uint8Array(32));
  const uploadKey=btoa(String.fromCharCode(...secret)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const headers={'X-Audio-Upload-Key':uploadKey};
  const started=await postAudio({action:'start',name:file.name,mime:file.type||'audio/unknown',size:file.size},headers);
  const id=started.id;
  if(typeof id!=='string'||!/^[A-Za-z0-9_-]{22}$/.test(id))
    throw new Error('Ses için geçerli bir yükleme kimliği alınamadı.');
  const parts=Math.ceil(file.size/CHUNK_BYTES);
  if(started.parts!==parts||started.chunkBytes!==CHUNK_BYTES)
    throw new Error('Ses yükleme protokolü uyuşmuyor.');
  onProgress(0,parts);
  // Small sequential requests avoid exceeding Netlify Functions' request limits.
  for(let i=0;i<parts;i++){
    const base64=await encodePart(file.slice(i*CHUNK_BYTES,(i+1)*CHUNK_BYTES));
    await postAudio({action:'chunk',id,index:i,base64},headers);
    onProgress(i+1,parts);
  }
  const done=await postAudio({action:'finish',id},headers);
  const url=done.url;
  if(typeof url!=='string'||url!=='/audio/'+id)
    throw new Error('Ses dosyasının yayın bağlantısı oluşturulamadı.');
  return {url:new URL(url,window.location.origin).toString(),name:file.name,playback:done.playback===true};
}
