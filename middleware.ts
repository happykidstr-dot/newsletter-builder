import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', '/sign-up(.*)', '/api/track(.*)'
]);
const clerkGuard = clerkMiddleware(async (auth, req) => {
  // Keep the editor reachable so the Clerk sign-in modal can be opened.
  // All non-public API routes require login, and sensitive handlers recheck it.
  if (req.nextUrl.pathname.startsWith('/api/') && !isPublicRoute(req)) await auth.protect();
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  if (configured) return clerkGuard(req, event);
  // A visitor may open the editor locally; sensitive API routes must never silently run
  // without authentication configuration. Public tracking routes verify signed tokens.
  const path = req.nextUrl.pathname;
  if (path.startsWith('/api/') && !path.startsWith('/api/track/')) {
    return NextResponse.json({ error:'Oturum güvenliği yapılandırılmadı.' }, { status:503 });
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
