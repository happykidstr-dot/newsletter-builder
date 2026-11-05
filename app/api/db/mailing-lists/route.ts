import { NextRequest, NextResponse } from 'next/server';
import { adminDb, requireUser, tooLarge, unavailableDb } from '@/lib/server-security';

function toClient(r:any){return {id:r.id,name:r.name,contacts:Array.isArray(r.contacts)?r.contacts:[],createdAt:r.created_at};}
export async function GET(){
  const session=await requireUser();if('error'in session)return session.error;
  const db=adminDb();if(!db)return unavailableDb();
  const {data,error}=await db.from('mailing_lists').select('id,name,contacts,created_at')
    .eq('user_id',session.userId).order('created_at',{ascending:false}).limit(100);
  if(error)return NextResponse.json({error:'Listeler alınamadı.'},{status:503});
  return NextResponse.json((data||[]).map(toClient),{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
  const session=await requireUser();if('error'in session)return session.error;
  const db=adminDb();if(!db)return unavailableDb();
  if(tooLarge(req,1024*1024))return NextResponse.json({error:'İletişim listesi çok büyük.'},{status:413});
  try{
    const input=await req.json();
    const lists=Array.isArray(input)?input:[input];
    if(lists.length<1||lists.length>100||lists.some((l:any)=>!l||typeof l.id!=='string'||
      l.id.length>90||typeof l.name!=='string'||l.name.length>150||!Array.isArray(l.contacts)||
      l.contacts.length>2000||!l.contacts.every((c:any)=>c&&typeof c.email==='string'&&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)&&c.email.length<=254))) {
      return NextResponse.json({error:'İletişim listesi veya e-posta adresi geçersiz.'},{status:400});
    }
    const ids=lists.map((l:any)=>l.id);
    if(new Set(ids).size!==ids.length)return NextResponse.json({error:'Tekrarlanan liste kimliği.'},{status:400});
    const {data:existing,error:readError}=await db.from('mailing_lists').select('id,user_id,created_at').in('id',ids);
    if(readError)return NextResponse.json({error:'Liste yetkisi kontrol edilemedi.'},{status:503});
    if((existing||[]).some((r:any)=>r.user_id!==session.userId))return NextResponse.json({error:'Başka kullanıcıya ait listeye erişim reddedildi.'},{status:403});
    const old=new Map((existing||[]).map((r:any)=>[r.id,r.created_at]));
    const payload=lists.map((l:any)=>({
      id:l.id,user_id:session.userId,name:l.name,
      contacts:l.contacts.map((c:any)=>({email:c.email.toLowerCase().trim(),name:String(c.name||'').slice(0,200),addedAt:c.addedAt||new Date().toISOString()})),
      created_at:old.get(l.id)||new Date().toISOString(),updated_at:new Date().toISOString(),
    }));
    const {error}=await db.from('mailing_lists').upsert(payload,{onConflict:'id'});
    if(error)return NextResponse.json({error:'İletişim listeleri kaydedilemedi.'},{status:503});
    return NextResponse.json({success:true});
  }catch{return NextResponse.json({error:'Liste JSON verisi geçersiz.'},{status:400});}
}
