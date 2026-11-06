import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';

/**
 * Next.js 16 proxy refreshes Supabase PKCE cookies on every dynamic request.
 * Public readers and the editor remain accessible when Auth is not configured;
 * paid/private API handlers independently fail closed.
 */
export default async function proxy(request:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.next({request});
  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(items){
        for(const {name,value} of items)request.cookies.set(name,value);
        response=NextResponse.next({request});
        for(const {name,value,options} of items)response.cookies.set(name,value,options);
        // Refreshed auth cookies must never be stored in a shared CDN cache.
        response.headers.set('Cache-Control','private, no-store');
      },
    },
  });
  try{await supabase.auth.getClaims();}
  catch{/* Auth service unavailable: protected handlers fail closed. */}
  return response;
}
export const config={
  matcher:[
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
