import type {Config,Context} from '@netlify/functions';
import {publicationStore,type PublishedNewsletter} from '../../lib/newsletter-publication-store';

// Keep Blobs access in the same native runtime as publication and media.
export const config:Config={path:'/api/share-image-data/:slug',method:'GET',rateLimit:{windowLimit:300,windowSize:60,aggregateBy:['ip','domain']}};
export default async(req:Request,context:Context)=>{
  const slug=context.params.slug||'';
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(!/^[A-Za-z0-9_-]{16}$/.test(slug))return Response.json({error:'Bülten bulunamadı.'},{status:404,headers});
  try{
    const row=await publicationStore(new URL(req.url).hostname).get(slug,{type:'json'}) as PublishedNewsletter|null;
    if(!row||row.version!==1||typeof row.title!=='string'||typeof row.bodyHtml!=='string')return Response.json({error:'Bülten bulunamadı.'},{status:404,headers});
    // Explicit public fields only: never return edit hashes or account IDs.
    return Response.json({version:1,title:row.title,subtitle:row.subtitle||'',headerImgUrl:row.headerImgUrl||'',bodyHtml:row.bodyHtml,revision:row.revision||1},{headers});
  }catch{return Response.json({error:'Bülten okunamadı.'},{status:503,headers});}
};
