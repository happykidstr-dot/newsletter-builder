import {NextRequest,NextResponse} from 'next/server';
import {allowedSiteOrigin} from '@/lib/publication-origin';
import {requireAuthorizedPublisher} from '@/lib/security/access';
import {storeAudioRequest} from '@/lib/newsletter-audio';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const publisher=await requireAuthorizedPublisher();
  if(publisher.error)return publisher.error;
  const origin=req.headers.get('origin')||'';
  if(!origin||!allowedSiteOrigin(origin)||new URL(origin).hostname!==new URL(req.url).hostname)
    return NextResponse.json({error:'Ses ekleme yalnızca editörden yapılabilir.'},{status:403});
  if(req.headers.get('content-type')?.split(';')[0]!=='application/json')
    return NextResponse.json({error:'JSON isteği gerekli.'},{status:415});
  if(Number(req.headers.get('content-length')||0)>2_100_000)
    return NextResponse.json({error:'Dosya parçası çok büyük.'},{status:413});
  try{
    const payload=await req.text();
    if(payload.length>2_100_000)return NextResponse.json({error:'Dosya parçası çok büyük.'},{status:413});
    const ip=req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
    return await storeAudioRequest(JSON.parse(payload),publisher.userId,ip);
  }catch(e){
    console.error('Audio upload failed:',e instanceof Error?e.message:e);
    return NextResponse.json({error:'Ses yüklenemedi.'},{status:503});
  }
}
