import {auth} from '@clerk/nextjs/server';
import {NextResponse} from 'next/server';

export type AccessResult={userId:string;error?:never}|{userId?:never;error:NextResponse};

/** Never use a client-supplied user ID. All paid and personal APIs fail closed. */
export async function requireSignedInUser():Promise<AccessResult>{
  if(!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY||!process.env.CLERK_SECRET_KEY)
    return {error:NextResponse.json(
      {error:'Hesap doğrulaması yapılandırılmamış. Yönetici Clerk anahtarlarını eklemeli.'},
      {status:503,headers:{'Cache-Control':'no-store'}})};
  try{
    const {userId}=await auth();
    if(!userId)return {error:NextResponse.json(
      {error:'İşlem için hesabınıza giriş yapın.'},
      {status:401,headers:{'Cache-Control':'no-store'}})};
    return {userId};
  }catch{
    return {error:NextResponse.json(
      {error:'Hesap doğrulanamadı. Tekrar giriş yapın.'},
      {status:401,headers:{'Cache-Control':'no-store'}})};
  }
}
export function checkSameOrigin(req:Request):NextResponse|null{
  const origin=req.headers.get('origin');
  // Only accept writes from the site's own browser origin.
  if(!origin)return NextResponse.json({error:'Origin bilgisi eksik.'},{status:403});
  try{
    const candidate=new URL(origin), actual=new URL(req.url);
    const forwarded=req.headers.get('x-forwarded-host')||req.headers.get('host');
    if(candidate.protocol!=='https:' && candidate.hostname!=='localhost' && candidate.hostname!=='127.0.0.1')
      throw new Error('protocol');
    if(candidate.origin!==actual.origin &&
       (!forwarded||candidate.host!==forwarded.split(',')[0].trim()))throw new Error('origin');
    return null;
  }catch{return NextResponse.json({error:'Yetkisiz istek kaynağı.'},{status:403});}
}
export async function boundedJson(req:Request,maxBytes=32_000):Promise<unknown>{
  if(Number(req.headers.get('content-length')||0)>maxBytes)throw new Error('PAYLOAD_TOO_LARGE');
  if(req.headers.get('content-type')?.split(';')[0]!=='application/json')throw new Error('INVALID_CONTENT_TYPE');
  const input=await req.text();
  if(input.length>maxBytes)throw new Error('PAYLOAD_TOO_LARGE');
  return JSON.parse(input);
}
export function requestProblem(error:unknown):NextResponse{
  const code=error instanceof Error?error.message:'';
  if(code==='PAYLOAD_TOO_LARGE')return NextResponse.json({error:'İstek boyutu çok büyük.'},{status:413});
  if(code==='INVALID_CONTENT_TYPE')return NextResponse.json({error:'JSON bekleniyor.'},{status:415});
  return NextResponse.json({error:'Geçersiz istek.'},{status:400});
}
