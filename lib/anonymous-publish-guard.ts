import {NextRequest,NextResponse} from 'next/server';

export function anonymousPublishingEnabled():boolean {
  return process.env.ENABLE_ANONYMOUS_PUBLISHING==='true';
}

/** Turnstile verification is mandatory for every anonymous write. Fail closed. */
export async function verifyAnonymousWrite(req:NextRequest):Promise<NextResponse|null> {
  if(!anonymousPublishingEnabled())
    return NextResponse.json({error:'Anonim yayınlama henüz etkinleştirilmedi.'},{status:503});
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret)
    return NextResponse.json({error:'Yayınlama güvenlik doğrulaması henüz yapılandırılmadı.'},{status:503});
  const token=req.headers.get('x-turnstile-token')||'';
  if(!/^[A-Za-z0-9._-]{20,2048}$/.test(token))
    return NextResponse.json({error:'Yayınlamak için güvenlik doğrulamasını tamamlayın.'},{status:403});
  const ip=req.headers.get('x-nf-client-connection-ip')||undefined;
  try{
    const form=new URLSearchParams({secret,response:token});
    if(ip)form.set('remoteip',ip);
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',body:form,signal:AbortSignal.timeout(8000),cache:'no-store',
    });
    if(!response.ok)throw new Error('Turnstile unavailable');
    const result=await response.json() as {success?:boolean,hostname?:string,action?:string};
    const hostname=new URL(req.url).hostname;
    if(!result.success||result.hostname!==hostname)
      return NextResponse.json({error:'Güvenlik doğrulaması başarısız oldu. Yeniden deneyin.'},{status:403});
    return null;
  }catch{
    return NextResponse.json({error:'Güvenlik doğrulama servisine ulaşılamıyor.'},{status:503});
  }
}
