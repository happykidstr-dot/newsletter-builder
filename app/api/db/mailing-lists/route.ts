import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Lütfen giriş yapın.' }, { status: 401 });
    if (!supabaseUrl) return NextResponse.json([], { status: 200 });

    const response = await fetch(`${supabaseUrl}/rest/v1/mailing_lists?user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Lütfen giriş yapın.' }, { status: 401 });
    if (!supabaseUrl) return NextResponse.json({ error: 'Supabase URL yapılandırılmadı.' }, { status: 500 });

    const body = await req.json();
    const lists = Array.isArray(body) ? body : [body];

    // Bulk upsert
    const payload = lists.map(list => ({
      id: list.id,
      user_id: userId,
      name: list.name,
      contacts: list.contacts,
      created_at: list.created_at || new Date().toISOString()
    }));

    const response = await fetch(`${supabaseUrl}/rest/v1/mailing_lists`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
