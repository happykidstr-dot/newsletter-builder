import {NextRequest,NextResponse} from 'next/server';
import {allowedSiteOrigin} from '@/lib/publication-origin';
import {storePublicMedia} from '@/lib/public-newsletter-media';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(req:NextRequest){
  const origin=req.headers.get('origin')||'';
  if(!allowedSiteOrigin(origin)||new URL(origin).hostname!==new URL(req.url).hostname)
    return NextResponse.json({error:'Görsel yüklemek için bülten editörünü kullanın.'},{status:403});
  if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
    return NextResponse.json({error:'JSON isteği gerekli.'},{status:415});
  if(Number(req.headers.get('content-length')||0)>3_600_000)
    return NextResponse.json({error:'Görsel çok büyük.'},{status:413});
  try{
    const text=await req.text();
    if(text.length>3_600_000)return NextResponse.json({error:'Görsel çok büyük.'},{status:413});
    const ip=req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
    const value=await storePublicMedia(JSON.parse(text),ip);
    return NextResponse.json({url:new URL('/media/'+value.id,origin).toString(),bytes:value.bytes},{status:201});
  }catch(error){
    const code=error instanceof Error?error.message:'';
    return NextResponse.json({error:code==='MEDIA_QUOTA'?'Yükleme kotasına ulaşıldı.':
      code==='INVALID_IMAGE'?'Görsel desteklenmiyor veya çok büyük.':'Görsel depolanamadı.'},{
      status:code==='MEDIA_QUOTA'?429:code==='INVALID_IMAGE'?413:503,
    });
  }
}
