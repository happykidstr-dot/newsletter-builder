'use client';
import {createBrowserClient} from '@supabase/ssr';

/** The publishable key is public. Never expose a Supabase secret/service-role key. */
export function browserAuthConfigured():boolean{
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export function createBrowserSupabaseClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Supabase Auth ayarları henüz tamamlanmadı.');
  return createBrowserClient(url,key,{auth:{flowType:'pkce'}});
}

/**
 * Netlify's explicit publication function does not run through Next.js proxy.
 * Send the current access token; the function validates it against Supabase Auth.
 * getSession is used ONLY to forward the token, never as a server-side trust check.
 */
export async function publisherAuthorizationHeaders():Promise<Record<string,string>>{
  if(!browserAuthConfigured())return {};
  const {data:{session},error}=await createBrowserSupabaseClient().auth.getSession();
  if(error||!session?.access_token)throw new Error('Yayımlamak veya yayından kaldırmak için giriş yapın.');
  return {Authorization:'Bearer '+session.access_token};
}
