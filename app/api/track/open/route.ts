import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1x1 transparent GIF pixel
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('c');
    const encodedEmail = searchParams.get('e');

    if (campaignId && encodedEmail) {
      const email = Buffer.from(encodedEmail, 'base64').toString('ascii');
      
      // Log to database asynchronously without blocking the response
      supabase.from('campaign_analytics').insert({
        id: Math.random().toString(36).slice(2, 11),
        campaign_id: campaignId,
        event_type: 'open',
        email: email,
        created_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error('Tracking insert error:', error);
      });
    }

    // Always return the 1x1 pixel with correct headers to prevent caching
    return new NextResponse(PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    // If anything fails, still return the pixel so we don't break the email
    return new NextResponse(PIXEL, { headers: { 'Content-Type': 'image/gif' } });
  }
}
