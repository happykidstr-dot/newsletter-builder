import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // If Clerk keys are configured, use Clerk middleware
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    try {
      const { clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server');
      const isPublicRoute = createRouteMatcher([
        '/sign-in(.*)',
        '/sign-up(.*)',
        '/api/notebook-sync(.*)',
      ]);
      return clerkMiddleware(async (auth: any, req: NextRequest) => {
        if (!isPublicRoute(req)) {
          await auth.protect();
        }
      })(request, {} as any);
    } catch {}
  }

  // Without Clerk, allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
