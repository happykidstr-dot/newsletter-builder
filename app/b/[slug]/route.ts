import { NextRequest, NextResponse } from 'next/server';
import {publicationStore, type PublishedNewsletter} from '@/lib/newsletter-publication-store';
import {renderPublishedNewsletter} from '@/lib/public-newsletter-render';
import {publicOriginForRequest} from '@/lib/publication-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!/^[A-Za-z0-9_-]{16}$/.test(slug)){
    return new NextResponse('Bülten bulunamadı.',{status:404});
  }
  try{
    const row=await publicationStore().get(slug,{type:'json'}) as PublishedNewsletter|null;
    if(!row||row.version!==1||typeof row.bodyHtml!=='string'||typeof row.title!=='string'){
      return new NextResponse('Bülten bulunamadı.',{status:404});
    }
    const url=new URL('/b/'+slug,publicOriginForRequest(req)).toString();
    const {html,csp}=renderPublishedNewsletter(row,url);
    return new NextResponse(html,{
      status:200,
      headers:{
        'Content-Type':'text/html; charset=utf-8',
        'Cache-Control':'public, max-age=0, must-revalidate',
        'Content-Security-Policy':csp,
        'X-Content-Type-Options':'nosniff',
        'Referrer-Policy':'strict-origin-when-cross-origin',
      },
    });
  }catch(error){
    console.error('published newsletter fetch failed',error instanceof Error?error.message:error);
    return new NextResponse('Bülten şu anda görüntülenemiyor.',{status:503});
  }
}
