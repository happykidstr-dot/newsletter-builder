import {anonymousWriteHeaders} from '@/lib/anonymous-turnstile';
/**
 * Prepare a lightweight, shareable newsletter. Embedded raster photographs are
 * published as independent media files; their size no longer inflates the
 * newsletter HTML POST or the page delivered to social-media preview bots.
 *
 * The editor's original image data is NEVER modified.
 */
const DATA_IMAGE=/data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+/gi;
const MAX_TRANSFER_BYTES=2_400_000; // comfortably below Netlify's 6 MB request cap
const IMAGE_CACHE_KEY='bulten_published_media_cache_v1';

type Progress=(completed:number,total:number)=>void;

function readCache():Record<string,string> {
  try{
    const obj=JSON.parse(window.localStorage.getItem(IMAGE_CACHE_KEY)||'{}');
    return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
  }catch{return {};}
}
function saveCache(cache:Record<string,string>):void {
  try {
    // Keep the most recent 250 unique uploads only. This holds short URLs,
    // never image bytes or publisher edit credentials.
    window.localStorage.setItem(IMAGE_CACHE_KEY,
      JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-250))));
  } catch { /* publication still works if caching is unavailable */ }
}
async function sha256(blob:Blob):Promise<string>{
  const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function rasterise(blob:Blob,width:number,height:number,quality:number):Promise<Blob>{
  const bitmap=await createImageBitmap(blob);
  try{
    const scale=Math.min(1,width/bitmap.width,height/bitmap.height);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Görsel işleme desteklenmiyor.');
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    return await new Promise<Blob>((resolve,reject)=>{
      canvas.toBlob(b=>b?resolve(b):reject(new Error('Görsel sıkıştırılamadı.')),'image/webp',quality);
    });
  }finally{bitmap.close();}
}
async function fitMedia(blob:Blob):Promise<Blob>{
  if(blob.size<=MAX_TRANSFER_BYTES)return blob;
  // Resize images only for the publicly hosted copy; preserve local originals.
  // Repeated attempts use a smaller canvas/quality until the individual image
  // fits a single Netlify upload request.
  for(const side of [2200,1800,1450,1100,850,640,480]){
    for(const quality of [0.85,0.7,0.52]){
      const converted=await rasterise(blob,side,side,quality);
      if(converted.size<=MAX_TRANSFER_BYTES)return converted;
    }
  }
  throw new Error('Çok büyük bir görsel optimize edilemedi. Lütfen bu görseli JPG veya WebP olarak yeniden seçin.');
}
async function base64Of(blob:Blob):Promise<string>{
  const uri:string=await new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result||''));
    r.onerror=()=>reject(new Error('Fotoğraf okunamadı.'));
    r.readAsDataURL(blob);
  });
  const comma=uri.indexOf(',');
  if(comma===-1)throw new Error('Görsel kodlanamadı.');
  return uri.slice(comma+1);
}
async function publishSingleImage(original:string,cache:Record<string,string>):Promise<string>{
  const input=await fetch(original).then(r=>{
    if(!r.ok)throw new Error('Eklenen görsel okunamadı.');
    return r.blob();
  });
  const key=await sha256(input);
  const previously=cache[key];
  if(typeof previously==='string'&&
     previously.startsWith(window.location.origin+'/media/')&&
     /^https?:\/\//.test(previously))return previously;

  const fitted=await fitMedia(input);
  const mime=fitted.type==='image/png'||fitted.type==='image/jpeg'||
    fitted.type==='image/gif'||fitted.type==='image/webp'?fitted.type:'image/webp';
  const response=await fetch('/api/media',{
    method:'POST',headers:{'Content-Type':'application/json',...(await anonymousWriteHeaders('/api/media'))},
    body:JSON.stringify({mime,base64:await base64Of(fitted)}),
  });
  const json=await response.json().catch(()=>({}));
  if(!response.ok || typeof json.url!=='string')
    throw new Error(json.error||'Görsel sunucuya yüklenemedi.');
  const url=new URL(json.url,window.location.origin);
  if(url.origin!==window.location.origin||!/\/media\/[A-Za-z0-9_-]{22}$/.test(url.pathname))
    throw new Error('Görsel için güvenilir bir yayın bağlantısı oluşturulamadı.');
  delete cache[key];cache[key]=url.toString();
  saveCache(cache);
  return url.toString();
}

export async function prepareNewsletterForSharing(
  exportedHtml:string, headerImgUrl:string, onProgress?:Progress,
):Promise<{html:string,headerImgUrl:string,uploaded:number,mediaMap:Record<string,string>}> {
  const imageUrls=[...new Set(exportedHtml.match(DATA_IMAGE)||[])];
  if(/^data:image\//i.test(headerImgUrl)&&!imageUrls.includes(headerImgUrl)){
    imageUrls.push(headerImgUrl);
  }
  if(imageUrls.length===0)return {html:exportedHtml,headerImgUrl,uploaded:0,mediaMap:{}};
  let html=exportedHtml,header=headerImgUrl,completed=0;
  const cache=readCache();
  const mediaMap:Record<string,string>={};
  onProgress?.(0,imageUrls.length);
  // Sequential requests avoid overwhelming mobile devices and Netlify limits.
  for(const source of imageUrls){
    const hosted=await publishSingleImage(source,cache);
    mediaMap[source]=hosted;
    html=html.split(source).join(hosted);
    if(header===source)header=hosted;
    completed++;
    onProgress?.(completed,imageUrls.length);
  }
  return {html,headerImgUrl:header,uploaded:completed,mediaMap};
}
