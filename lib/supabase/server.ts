import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

/**
 * Route handlers read the signed-in user's cookie-backed PKCE session.
 * Use auth.getUser() or auth.getClaims() for authorization, never getSession().user.
 */
export function serverAuthConfigured():boolean{
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export async function createServerSupabaseClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('SUPABASE_AUTH_NOT_CONFIGURED');
  const cookieStore=await cookies();
  return createServerClient(url,key,{
    auth:{flowType:'pkce'},
    cookies:{
      getAll(){return cookieStore.getAll();},
      setAll(items){
        try {
          for(const {name,value,options} of items) cookieStore.set(name,value,options);
        } catch {
          // Server Component reads are not allowed to write cookies.
          // Next.js proxy.ts refreshes and persists them before rendering.
        }
      },
    },
  });
}
