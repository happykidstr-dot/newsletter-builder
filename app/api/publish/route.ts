import { randomBytes } from 'node:crypto';
import {matchesEditToken,newPublicationCredential,validPublicationSlug} from '@/lib/publication-edit-credentials';
import { NextRequest, NextResponse } from 'next/server';
import {publicationStore, checkPublishQuota, type PublishedNewsletter} from '@/lib/newsletter-publication-store';
import {sanitiseNewsletterBody} from '@/lib/public-newsletter-render';
import {allowedSiteOrigin, publicOriginForRequest} from '@/lib/publication-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_BYTES = 5_700_000;

async function readWithLimit(req: Request): Promise<string> {
  const reader=req.body?.getReader();
  if(!reader)throw new Error('İstek içeriği yok.');
  const chunks:Uint8Array[]=[];
  let size=0;
  while(true){
    const result=await reader.read();
    if(result.done)break;
    size+=result.value.byteLength;
    if(size>MAX_BYTES){await reader.cancel();throw new Error('Bülten boyutu 5 MB sınırını aşıyor.');}
    chunks.push(result.value);
  }
  const data=new Uint8Array(size);
  let offset=0; for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder().decode(data);
}

export async function POST(req:NextRequest){
  // Require a browser request from this editor origin. Do not accept hidden
  // cross-site publication requests; server-to-server clients are not needed.
  const origin=req.headers.get('origin');
  if(!origin || !allowedSiteOrigin(origin)){

    return NextResponse.json({error:'Yayınlama yalnızca bu sitenin editöründen yapılabilir.'},{status:403});
  }
  if(Number(req.headers.get('content-length')||'0')>MAX_BYTES){
    return NextResponse.json({error:'Bülten boyutu sınırı aşıldı.'},{status:413});
  }
  if(req.headers.get('content-type')?.split(';')[0]!=='application/json'){
    return NextResponse.json({error:'JSON isteği gerekli.'},{status:415});
  }
  try{
    if(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY&&process.env.CLERK_SECRET_KEY){
      const {auth}=await import('@clerk/nextjs/server');
      const session=await auth();
      if(!session.userId)return NextResponse.json({error:'Bülteni yayımlamak için oturum açın.'},{status:401});
    }
    const publicOrigin=publicOriginForRequest(req);
    const raw=await readWithLimit(req);
    const body=JSON.parse(raw);
    if(typeof body?.html!=='string'||body.html.length>MAX_BYTES||
      typeof body?.title!=='string'||!body.title.trim()||body.title.length>180||
      typeof body?.subtitle!=='string'||body.subtitle.length>550||
      typeof body?.headerImgUrl!=='string'||body.headerImgUrl.length>3000){
      return NextResponse.json({error:'Bülten bilgileri eksik veya çok uzun.'},{status:400});
    }
    const sanitized=sanitiseNewsletterBody(body.html);
    const ip=req.headers.get('x-nf-client-connection-ip')||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    if(!(await checkPublishQuota(ip))){
      return NextResponse.json({error:'Çok sayıda paylaşım isteği gönderildi. Daha sonra tekrar deneyin.'},{status:429});
    }
    const store=publicationStore();
    const editing=body.slug!==undefined && body.slug!==null;
    if(editing&&!validPublicationSlug(body.slug))
      return NextResponse.json({error:'Yayın bağlantısı geçersiz.'},{status:400});
    const slug:string=editing?body.slug:randomBytes(12).toString('base64url');
    const previous=editing? await store.get(slug,{type:'json'}) as PublishedNewsletter|null:null;
    if(editing&&!previous)return NextResponse.json({error:'Yayınlanmış bülten bulunamadı.'},{status:404});
    if(editing&&!matchesEditToken(body.editToken,previous?.editTokenHash))
      return NextResponse.json({error:'Bu bülten için düzenleme yetkiniz yok.'},{status:403});
    if(editing&&Number.isInteger(body.expectedRevision)&&body.expectedRevision!==(previous?.revision||1))
      return NextResponse.json({error:'Yayının daha yeni bir sürümü bulunuyor.'},{status:409});
    const credential=editing?null:newPublicationCredential();
    const timestamp=new Date().toISOString();
    const record:PublishedNewsletter={
      version:1,bodyHtml:sanitized,title:body.title.trim(),subtitle:body.subtitle,
      headerImgUrl:body.headerImgUrl,createdAt:previous?.createdAt||timestamp,
      updatedAt:timestamp,revision:(previous?.revision||0)+1,
      editTokenHash:previous?.editTokenHash||credential!.hash,
    };
    await store.setJSON(slug,record);
    return NextResponse.json({
      slug,url:new URL('/b/'+slug,publicOrigin).toString(),updated:editing,
      revision:record.revision,...(credential?{editToken:credential.token}:{}),
    },{
      status:editing?200:201,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
    });
  }catch(error){
    const bad=error instanceof SyntaxError;
    const tooLarge=error instanceof Error&&error.message.includes('boyutu');
    const message=tooLarge?'Bülten çok büyük; görselleri küçültüp yeniden deneyin.':
      bad?'Gönderilen bülten verileri geçersiz.':
      error instanceof Error&&error.message.startsWith('Bülten')?error.message:
      'Bülten yayımlanamadı. Depolama bağlantısını kontrol edin.';
    console.error('newsletter publish failed',error instanceof Error?error.message:error);
    return NextResponse.json({error:message},{status:tooLarge?413:bad?400:503});
  }
}
