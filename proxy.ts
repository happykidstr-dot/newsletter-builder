import {clerkMiddleware} from '@clerk/nextjs/server';
import {NextResponse,type NextFetchEvent,type NextRequest} from 'next/server';

// Next.js 16 uses proxy.ts. Keep the editor and published readers accessible
// without a Clerk deployment, but fail closed INSIDE every sensitive API.
const clerkEnabled=Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY&&process.env.CLERK_SECRET_KEY);
const withClerk=clerkEnabled?clerkMiddleware():null;

export default function proxy(req:NextRequest,event:NextFetchEvent){
  if(!withClerk)return NextResponse.next();
  return withClerk(req,event);
}
export const config={
  matcher:[
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
