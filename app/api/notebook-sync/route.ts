import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';

const PAYLOAD_FILE = join(process.cwd(), 'data', 'notebook-payload.json');

export async function GET() {
  try {
    const data = await readFile(PAYLOAD_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'No notebook payload' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to read payload' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reader = req.body?.getReader();
    let bodyText = '';
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bodyText += new TextDecoder().decode(value);
      }
    }
    const body = bodyText ? JSON.parse(bodyText) : {};
    
    // Minimal validation to ensure it looks like a newsletter payload
    if (!body || !Array.isArray(body.blocks)) {
      return NextResponse.json({ error: 'Invalid payload format. Expected { title, subtitle, blocks: [] }' }, { status: 400 });
    }

    await writeFile(PAYLOAD_FILE, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'Payload received and saved.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save payload' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await rm(PAYLOAD_FILE, { force: true });
    return NextResponse.json({ success: true, message: 'Payload cleared.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear payload' }, { status: 500 });
  }
}
