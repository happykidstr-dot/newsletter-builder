import {NextRequest} from 'next/server';
import {servePublicAudio} from '@/lib/newsletter-audio';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest,{params}:{params:Promise<{asset:string}>}){
  const {asset}=await params;
  try{return await servePublicAudio(asset,undefined,req.headers.get('range'));}
  catch(e){console.error('Public audio access failed:',e instanceof Error?e.message:e);
    return new Response('Ses dosyası yüklenemedi.',{status:503});}
}
