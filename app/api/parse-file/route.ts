import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }

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

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Parse file error:', error);
    return NextResponse.json({ error: error.message || 'Dosya işlenirken hata oluştu.' }, { status: 500 });
  }
}
