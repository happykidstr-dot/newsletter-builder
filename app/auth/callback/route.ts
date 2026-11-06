import {NextRequest,NextResponse} from 'next/server';
import {createServerSupabaseClient,serverAuthConfigured} from '@/lib/supabase/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Supabase OAuth / email-confirmation callback using the cookie-bound PKCE verifier. */
export async function GET(request:NextRequest){
  const origin=request.nextUrl.origin;
  const code=request.nextUrl.searchParams.get('code');
  const destination=request.nextUrl.searchParams.get('next')||'/';
  // Only same-origin relative paths may be used after sign-in.
  const next=destination.startsWith('/')&&!destination.startsWith('//')&&
    !destination.includes('\\')?destination:'/';
  if(!code||code.length>4096||!serverAuthConfigured())
    return NextResponse.redirect(new URL('/?auth_error=callback',origin),{headers:{'Cache-Control':'no-store'}});
  try{
    const client=await createServerSupabaseClient();
    const {error}=await client.auth.exchangeCodeForSession(code);
    if(error)throw error;
    return NextResponse.redirect(new URL(next,origin),{headers:{'Cache-Control':'private, no-store'}});
  }catch{
    return NextResponse.redirect(new URL('/?auth_error=callback',origin),{headers:{'Cache-Control':'no-store'}});
  }
}
