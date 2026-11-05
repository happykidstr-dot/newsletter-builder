import { NextRequest, NextResponse } from 'next/server';
import { adminDb, requireUser, tooLarge, unavailableDb } from '@/lib/server-security';

type NewsletterRow = {
  id:string; title:string; subtitle:string|null; design:string|null;
  logo_url:string|null; header_img_url:string|null; show_toc:boolean|null;
  blocks: unknown; created_at:string;
};
function toClient(row:NewsletterRow) {
  return { id:row.id, title:row.title, subtitle:row.subtitle||'', design:row.design||'modern',
    logoUrl:row.logo_url||'', headerImgUrl:row.header_img_url||'',
    showTOC:row.show_toc!==false, blocks:Array.isArray(row.blocks)?row.blocks:[], savedAt:row.created_at };
}
export async function GET() {
  const session = await requireUser(); if ('error' in session) return session.error;
  const db = adminDb(); if (!db) return unavailableDb();
  const { data, error } = await db.from('newsletters').select('id,title,subtitle,design,logo_url,header_img_url,show_toc,blocks,created_at')
    .eq('user_id',session.userId).order('created_at',{ascending:false}).limit(200);
  if (error) return NextResponse.json({error:'Bültenler okunamadı.'},{status:503});
  return NextResponse.json((data||[]).map(toClient),{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest) {
  const session = await requireUser(); if ('error' in session) return session.error;
  const db = adminDb(); if (!db) return unavailableDb();
  if (tooLarge(req,1024*1024)) return NextResponse.json({error:'Bülten 1 MB sınırını aşıyor.'},{status:413});
  try {
    const b=await req.json();
    if (!b||typeof b.id!=='string'||b.id.length<3||b.id.length>90||
      typeof b.title!=='string'||b.title.length>250||!Array.isArray(b.blocks)||b.blocks.length>200||
      !b.blocks.every((x:any)=>x&&typeof x.id==='string'&&typeof x.type==='string'&&x.data&&typeof x.data==='object')) {
      return NextResponse.json({error:'Bülten verileri geçersiz.'},{status:400});
    }
    const {data:existing,error:checkError}=await db.from('newsletters').select('user_id').eq('id',b.id).maybeSingle();
    if(checkError)return NextResponse.json({error:'Kayıt yetkisi denetlenemedi.'},{status:503});
    if(existing && existing.user_id!==session.userId) return NextResponse.json({error:'Bu kaydı değiştirme yetkiniz yok.'},{status:403});
    const row={
      id:b.id,user_id:session.userId,title:b.title,subtitle:String(b.subtitle||'').slice(0,500),
      design:['modern','classic','bold','minimal'].includes(b.design)?b.design:'modern',
      header_img_url:String(b.headerImgUrl||'').slice(0,10000),
      logo_url:String(b.logoUrl||'').slice(0,10000),show_toc:b.showTOC!==false,
      blocks:b.blocks,created_at:existing?undefined:new Date().toISOString(),
    };
    const {data,error}=await db.from('newsletters').upsert(row,{onConflict:'id'})
      .select('id,title,subtitle,design,logo_url,header_img_url,show_toc,blocks,created_at').single();
    if(error)return NextResponse.json({error:'Bülten kaydedilemedi.'},{status:503});
    return NextResponse.json({success:true,newsletter:toClient(data as NewsletterRow)});
  }catch{return NextResponse.json({error:'Bülten JSON verisi geçersiz.'},{status:400});}
}
export async function DELETE(req:NextRequest){
  const session=await requireUser();if('error'in session)return session.error;
  const db=adminDb();if(!db)return unavailableDb();
  const id=new URL(req.url).searchParams.get('id');
  if(!id||id.length>90)return NextResponse.json({error:'Geçersiz bülten kimliği.'},{status:400});
  const {data,error}=await db.from('newsletters').delete().eq('id',id).eq('user_id',session.userId).select('id');
  if(error)return NextResponse.json({error:'Bülten silinemedi.'},{status:503});
  if(!data?.length)return NextResponse.json({error:'Bülten bulunamadı.'},{status:404});
  return NextResponse.json({success:true});
}
