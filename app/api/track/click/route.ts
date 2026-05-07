import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('c');
    const encodedEmail = searchParams.get('e');
    const encodedUrl = searchParams.get('u');

    if (!encodedUrl) {
      return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    }

    const targetUrl = decodeURIComponent(encodedUrl);

    if (campaignId && encodedEmail) {
      const email = Buffer.from(encodedEmail, 'base64').toString('ascii');
      const supabase = getSupabase();
      if (supabase) {
        // Log to database asynchronously without blocking the redirect
        supabase.from('campaign_analytics').insert({
          id: Math.random().toString(36).slice(2, 11),
          campaign_id: campaignId,
          event_type: 'click',
          email: email,
          url: targetUrl,
          created_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error('Click tracking insert error:', error);
        });
      }
    }

    // Redirect the user to the actual destination URL
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    // If anything fails, redirect to homepage
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  }
}
