import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase ayarları eksik' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all analytics events
    const { data, error } = await supabase
      .from('campaign_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Aggregate the stats
    let totalOpens = 0;
    let totalClicks = 0;
    const opensByEmail = new Set();
    const uniqueClicksByEmail = new Set();

    (data || []).forEach(evt => {
      if (evt.event_type === 'open') {
        totalOpens++;
        opensByEmail.add(evt.email);
      } else if (evt.event_type === 'click') {
        totalClicks++;
        uniqueClicksByEmail.add(evt.email);
      }
    });

    return NextResponse.json({
      totalOpens,
      uniqueOpens: opensByEmail.size,
      totalClicks,
      uniqueClicks: uniqueClicksByEmail.size,
      rawEvents: data
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
