import {NextRequest,NextResponse} from 'next/server';
import {publicationStore,type PublishedNewsletter} from '@/lib/newsletter-publication-store';
import {matchesEditToken,validPublicationSlug} from '@/lib/publication-edit-credentials';
import {allowedSiteOrigin,publicOriginForRequest} from '@/lib/publication-origin';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const origin=req.headers.get('origin')||'';
  if(!allowedSiteOrigin(origin))return NextResponse.json({error:'Yayından kaldırma yalnızca editörden yapılabilir.'},{status:403});
  try{
    if(new URL(origin).origin!==publicOriginForRequest(req))
      return NextResponse.json({error:'İstek kaynağı doğrulanamadı.'},{status:403});
    if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
      return NextResponse.json({error:'JSON bekleniyor.'},{status:415});
    const raw=await req.text();
    if(raw.length>4_000)return NextResponse.json({error:'İstek çok büyük.'},{status:413});
    const body=JSON.parse(raw);
    if(!validPublicationSlug(body?.slug))return NextResponse.json({error:'Geçersiz bülten kimliği.'},{status:400});
    const store=publicationStore();
    const record=await store.get(body.slug,{type:'json'}) as PublishedNewsletter|null;
    if(!record)return NextResponse.json({error:'Bülten bulunamadı.'},{status:404});
    if(!matchesEditToken(body.editToken,record.editTokenHash))
      return NextResponse.json({error:'Düzenleme yetkiniz yok.'},{status:403});
    await store.delete(body.slug);
    return NextResponse.json({success:true,slug:body.slug},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Yayından kaldırma servisi kullanılamıyor.'},{status:503});}
}
