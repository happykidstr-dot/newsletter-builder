import {NextRequest} from 'next/server';
import {servePublicMedia} from '@/lib/public-newsletter-media';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest,{params}:{params:Promise<{asset:string}>}){
  const {asset}=await params;
  try{return await servePublicMedia(asset);}
  catch{return new Response('Görsel görüntülenemiyor.',{status:503});}
}
