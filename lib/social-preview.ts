import sanitizeHtml from 'sanitize-html';
import type {PublishedNewsletter} from './newsletter-publication-store';

export const SOCIAL_IMAGE_WIDTH=1200;
export const SOCIAL_IMAGE_HEIGHT=630;

/** An image is available even for old publications with no cover photograph. */
export function socialPreviewImageUrl(record:PublishedNewsletter,canonical:string):string {
  const url=new URL(canonical);
  const slug=url.pathname.match(/^\/b\/([A-Za-z0-9_-]{16})$/)?.[1];
  if(!slug)return '';
  const image=new URL('/api/share-image/'+slug,url.origin);
  image.searchParams.set('v',String(record.revision||1));
  return image.toString();
}

/** Never let image rendering become a URL proxy for arbitrary user input. */
export function socialCoverPath(record:PublishedNewsletter,origin:string):string {
  const candidates=[record.headerImgUrl||''];
  for(const match of record.bodyHtml.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/gi)){
    candidates.push(match[1].replace(/&amp;/g,'&'));
    if(candidates.length>=20)break;
  }
  for(const candidate of candidates){
    if(!candidate)continue;
    try{
      const url=new URL(candidate,origin);
      if(url.origin!==origin||url.username||url.password)continue;
      if(/^\/media\/[A-Za-z0-9_-]{22}$/.test(url.pathname)||
         /^\/bulten_resimler\/(?:kapak|icerik1|yeni[1-4])\.jpg$/.test(url.pathname)||
         url.pathname==='/bulten_resimler/yeni5.png')return url.pathname;
    }catch{/* Use the text cover if an image address is invalid. */}
  }
  return '';
}

export function socialPreviewExcerpt(record:PublishedNewsletter):string {
  const text=sanitizeHtml(record.bodyHtml,{allowedTags:[],allowedAttributes:{}})
    .replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/\s+/g,' ').trim();
  return text.slice(0,240);
}
