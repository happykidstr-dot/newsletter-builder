import { NextRequest, NextResponse } from 'next/server';
import { adminDb, limitAction, requireUser, tooLarge, unavailableDb } from '@/lib/server-security';

const MAX_FILE=8*1024*1024;
const MIME:Record<string,string[]> = {
  txt:['text/plain','application/octet-stream'], md:['text/markdown','text/plain','application/octet-stream'],
  csv:['text/csv','text/plain','application/vnd.ms-excel','application/octet-stream'],
  pdf:['application/pdf','application/octet-stream'],
  docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream'],
};
export async function POST(req:NextRequest){
  const session=await requireUser();if('error'in session)return session.error;
  const db=adminDb();if(!db)return unavailableDb();
  if(tooLarge(req,MAX_FILE+100000))return NextResponse.json({error:'Dosya 8 MB sınırını aşıyor.'},{status:413});
  try{
    const form=await req.formData();
    const f=form.get('file');
    if(!(f instanceof File))return NextResponse.json({error:'Dosya bulunamadı.'},{status:400});
    if(f.size>MAX_FILE)return NextResponse.json({error:'Dosya en fazla 8 MB olabilir.'},{status:413});
    const ext=f.name.split('.').pop()?.toLowerCase()||'';
    if(!MIME[ext]||!MIME[ext].includes(f.type||'application/octet-stream'))
      return NextResponse.json({error:'Desteklenmeyen dosya türü.'},{status:415});
    const rate=await limitAction(db,session.userId,'parse',30);if(rate)return rate;
    const buffer=Buffer.from(await f.arrayBuffer());
    let output='';
    if(['txt','md','csv'].includes(ext))output=buffer.toString('utf8');
    else if(ext==='pdf'){
      if(!buffer.subarray(0,5).equals(Buffer.from('%PDF-')))
        return NextResponse.json({error:'PDF dosyası geçersiz.'},{status:400});
      const pdfParse=(await import('pdf-parse')).default;
      const pdf=await pdfParse(buffer);
      output=pdf.text||'';
    } else if(ext==='docx'){
      if(buffer[0]!==0x50||buffer[1]!==0x4b)
        return NextResponse.json({error:'DOCX dosyası geçersiz.'},{status:400});
      const mammothModule=await import('mammoth');
      const mammoth=mammothModule.default||mammothModule;
      output=(await mammoth.extractRawText({buffer})).value||'';
    }
    if(output.length>150000)return NextResponse.json({error:'Dosya metni çok uzun; 150.000 karakter sınırı aşıldı.'},{status:413});
    return NextResponse.json({text:output.trim()});
  }catch{return NextResponse.json({error:'Dosya ayrıştırılamadı; dosya biçimini kontrol edin.'},{status:400});}
}
