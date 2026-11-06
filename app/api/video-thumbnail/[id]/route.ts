import {NextRequest,NextResponse} from 'next/server';
import {validYoutubeId,youtubePosterUrl} from '@/lib/video-thumbnail';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/**
 * Public, tightly scoped image proxy used by the PDF exporter so html2canvas
 * can rasterise YouTube posters without tainted cross-origin canvases.
 * Accept IDs only: never fetch arbitrary browser-supplied URLs (SSRF).
 */
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!validYoutubeId(id))
    return NextResponse.json({error:'Geçersiz YouTube video kimliği.'},{status:400,headers:{'Cache-Control':'no-store'}});
  try{
    const response=await fetch(youtubePosterUrl(id),{
      signal:AbortSignal.timeout(8000),
      headers:{Accept:'image/jpeg'},
      cache:'force-cache',
    });
    const contentType=response.headers.get('content-type')||'';
    const contentLength=Number(response.headers.get('content-length')||0);
    if(!response.ok||!/^image\/jpe?g(?:;|$)/i.test(contentType)||
      contentLength>1_500_000)return new NextResponse('Video kapak görseli bulunamadı.',{status:404});
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength<100||bytes.byteLength>1_500_000)
      return new NextResponse('Video kapak görseli bulunamadı.',{status:404});
    const first=new Uint8Array(bytes);
    if(first[0]!==0xff||first[1]!==0xd8)
      return new NextResponse('Video görseli geçersiz.',{status:502});
    return new NextResponse(bytes,{
      status:200,headers:{
        'Content-Type':'image/jpeg',
        'Cache-Control':'public, max-age=86400, s-maxage=86400',
        'X-Content-Type-Options':'nosniff',
        'Content-Disposition':'inline',
      },
    });
  }catch{
    return new NextResponse('Video önizlemesine ulaşılamadı.',{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
