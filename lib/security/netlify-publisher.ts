import {createClient} from '@supabase/supabase-js';
import {isApprovedPublisher} from './publisher-allowlist';

/**
 * Netlify's explicit function routes bypass Next.js proxy.
 * Require an actual Supabase-issued bearer token, validated by Auth,
 * then independently require an email-confirmed, allowlisted identity.
 */
export type PublisherDecision=
  |{userId:string;error?:never;status?:never}
  |{userId?:never;error:string;status:401|403|503};
export async function verifyNetlifyPublisher(req:Request):Promise<PublisherDecision>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return {status:503,error:'Yayıncı girişi henüz yapılandırılmadı.'};
  const bearer=req.headers.get('authorization')||'';
  const match=/^Bearer ([A-Za-z0-9._~-]{50,4000})$/.exec(bearer);
  if(!match)return {status:401,error:'Bülten yönetimi için oturum açın.'};
  try{
    const client=createClient(url,key,{auth:{
      persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,
    }});
    const {data:{user},error}=await client.auth.getUser(match[1]);
    if(error||!user?.id)return {status:401,error:'Oturum geçersiz veya süresi dolmuş.'};
    if(!isApprovedPublisher(user.email,Boolean(user.email_confirmed_at)))
      return {status:403,error:'Bu hesap BÜLTEN READ yayıncı listesinde bulunmuyor.'};
    return {userId:user.id};
  }catch{
    return {status:503,error:'Yayıncı kimliği doğrulanamadı.'};
  }
}
