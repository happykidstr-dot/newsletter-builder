import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Lütfen giriş yapın.' }, { status: 401 });
    if (!supabaseUrl) return NextResponse.json([], { status: 200 }); // Return empty if not configured

    const response = await fetch(`${supabaseUrl}/rest/v1/newsletters?user_id=eq.${userId}&order=created_at.desc`, {
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
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Lütfen giriş yapın.' }, { status: 401 });
    if (!supabaseUrl) return NextResponse.json({ error: 'Supabase URL yapılandırılmadı.' }, { status: 500 });

    const body = await req.json();
    const { id, title, subtitle, design, headerImgUrl, blocks } = body;

    const payload = {
      id,
      user_id: userId,
      title,
      subtitle,
      design,
      header_img_url: headerImgUrl,
      blocks,
      created_at: new Date().toISOString()
    };

    // Upsert using REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/newsletters`, {
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

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Lütfen giriş yapın.' }, { status: 401 });
    if (!supabaseUrl) return NextResponse.json({ error: 'Supabase URL yapılandırılmadı.' }, { status: 500 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const response = await fetch(`${supabaseUrl}/rest/v1/newsletters?id=eq.${id}&user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) throw new Error(await response.text());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
