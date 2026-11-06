import {createServerSupabaseClient,serverAuthConfigured} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';
import {isApprovedPublisher} from '@/lib/security/publisher-allowlist';

export type AccessResult=
  |{userId:string;email:string|null;emailVerified:boolean;displayName:string;error?:never}
  |{userId?:never;error:NextResponse};

/** Never use a client-supplied user ID. All paid and personal APIs fail closed. */
export async function requireSignedInUser():Promise<AccessResult>{
  if(!serverAuthConfigured())
    return {error:NextResponse.json(
      {error:'Supabase Auth yapılandırılmamış. Netlify ortam değişkenlerini ayarlayın.'},
      {status:503,headers:{'Cache-Control':'no-store'}})};
  try{
    const client=await createServerSupabaseClient();
    // getUser verifies the session against Supabase Auth, not an untrusted client JWT.
    const {data:{user},error}=await client.auth.getUser();
    if(error||!user?.id)return {error:NextResponse.json(
      {error:'İşlem için hesabınıza giriş yapın.'},
      {status:401,headers:{'Cache-Control':'no-store'}})};
    const email=user.email?.trim().toLowerCase()||null;
    return {
      userId:user.id,email,emailVerified:Boolean(user.email_confirmed_at),
      displayName:typeof user.user_metadata?.full_name==='string'
        ?user.user_metadata.full_name.slice(0,100):'',
    };
  }catch{
    return {error:NextResponse.json(
      {error:'Oturum doğrulanamadı. Tekrar giriş yapın.'},
      {status:401,headers:{'Cache-Control':'no-store'}})};
  }
}

/** Editorial and billable operations require one of two named, verified accounts. */
export async function requireAuthorizedPublisher():Promise<AccessResult>{
  const identity=await requireSignedInUser();
  if(identity.error)return {error:identity.error};
  if(!isApprovedPublisher(identity.email,identity.emailVerified))
    return {error:NextResponse.json(
      {error:'BÜLTEN READ yalnızca izin verilen iki doğrulanmış hesap tarafından yönetilebilir.'},
      {status:403,headers:{'Cache-Control':'no-store'}})};
  return identity;
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
