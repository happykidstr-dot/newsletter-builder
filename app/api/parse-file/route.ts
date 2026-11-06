import { NextRequest, NextResponse } from 'next/server';
import {requireAuthorizedPublisher,checkSameOrigin} from '@/lib/security/access';

export async function POST(req: NextRequest) {
  const identity=await requireAuthorizedPublisher();
  if(identity.error)return identity.error;
  const originError=checkSameOrigin(req);
  if(originError)return originError;
  if(Number(req.headers.get('content-length')||0)>8_000_000)
    return NextResponse.json({error:'Dosya çok büyük (en fazla 8 MB).'},{status:413});
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }
    if(file.size>8_000_000)return NextResponse.json({error:'En fazla 8 MB dosya yüklenebilir.'},{status:413});

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = '';

    if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
      text = buffer.toString('utf-8');
    } else if (name.endsWith('.pdf')) {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (err) {
        console.error('PDF Parse error:', err);
        return NextResponse.json({ error: 'PDF okuması için "pdf-parse" paketi gerekli. Lütfen "npm install pdf-parse" komutunu çalıştırın.' }, { status: 500 });
      }
    } else if (name.endsWith('.docx')) {
      try {
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (err) {
        console.error('DOCX Parse error:', err);
        return NextResponse.json({ error: 'DOCX okuması için "mammoth" paketi gerekli. Lütfen "npm install mammoth" komutunu çalıştırın.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Desteklenmeyen dosya formatı. Lütfen TXT, MD, PDF veya DOCX yükleyin.' }, { status: 400 });
    }

    return NextResponse.json({ text: text.trim().slice(0,24_000) },{headers:{'Cache-Control':'no-store'}});
  } catch (error: any) {
    console.error('Parse file error:', error);
    return NextResponse.json({ error: error.message || 'Dosya işlenirken hata oluştu.' }, { status: 500 });
  }
}
