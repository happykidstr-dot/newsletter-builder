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
