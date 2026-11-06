import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireSignedInUser,checkSameOrigin,boundedJson,requestProblem} from '@/lib/security/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&secret?createClient(url,secret):null;
}
type Draft={
  id:string;title:string;subtitle:string;design:string;
  headerImgUrl:string;logoUrl:string;showTOC:boolean;
  blocks:Array<{id:string;type:string;data:Record<string,string>}>;
  savedAt:string;publicNewsletterUrl:string;
};
const validId=(id:unknown):id is string=>typeof id==='string'&&/^[A-Za-z0-9_-]{4,100}$/.test(id);
function parseDraft(input:unknown):Draft {
  const v=input as Record<string,unknown>;
  if(!v||!validId(v.id)||typeof v.title!=='string'||v.title.length>180||
     typeof v.subtitle!=='string'||v.subtitle.length>600||
     typeof v.design!=='string'||v.design.length>40||
     !Array.isArray(v.blocks)||v.blocks.length>300)throw Error('INVALID_DRAFT');
  for(const b of v.blocks){
    if(!b||typeof b.id!=='string'||typeof b.type!=='string'||typeof b.data!=='object'||!b.data||
      Object.values(b.data).some(value=>typeof value!=='string'))throw Error('INVALID_DRAFT');
  }
  return {
    id:v.id,title:v.title,subtitle:v.subtitle,design:v.design,
    headerImgUrl:typeof v.headerImgUrl==='string'?v.headerImgUrl:'',
    logoUrl:typeof v.logoUrl==='string'?v.logoUrl:'',
    showTOC:v.showTOC!==false,blocks:v.blocks,
    savedAt:typeof v.savedAt==='string'&&Number.isFinite(Date.parse(v.savedAt))?v.savedAt:new Date().toISOString(),
    publicNewsletterUrl:typeof v.publicNewsletterUrl==='string'?v.publicNewsletterUrl:'',
  };
}
// Never accept publication.editToken or other browser-held publishing secrets.
export async function GET(){
  const identity=await requireSignedInUser();if(identity.error)return identity.error;
  const client=db();if(!client)return error('Bulut arşiv bağlantısı yapılandırılmadı.',503);
  try{
    const {data,error:readError}=await client.from('newsletters')
      .select('id,title,subtitle,design,header_img_url,blocks,created_at,content,updated_at')
      .eq('user_id',identity.userId).order('created_at',{ascending:false}).limit(100);
    if(readError)throw readError;
    const records=(data||[]).map(row=>{
      const saved=row.content&&typeof row.content==='object'?row.content:{};
      return {
        ...saved,id:row.id,title:saved.title||row.title,
        subtitle:saved.subtitle??row.subtitle??'',design:saved.design||row.design,
        headerImgUrl:saved.headerImgUrl||row.header_img_url||'',
        blocks:saved.blocks||row.blocks||[],
        savedAt:saved.savedAt||row.updated_at||row.created_at,
      };
    });
    return NextResponse.json(records,{headers:{'Cache-Control':'no-store'}});
  }catch{return error('Bulut arşivi okunamadı. Faz 2 veritabanı geçişi gerekli olabilir.',503);}
}
export async function POST(req:NextRequest){
  const identity=await requireSignedInUser();if(identity.error)return identity.error;
  const origin=checkSameOrigin(req);if(origin)return origin;
  const client=db();if(!client)return error('Bulut arşiv bağlantısı yapılandırılmadı.',503);
  let input:unknown;try{input=await boundedJson(req,900_000);}catch(e){return requestProblem(e);}
  let draft:Draft;try{draft=parseDraft(input);}catch{return error('Bülten kayıt verileri geçersiz.',400);}
  try{
    const {data:existing,error:lookupError}=await client.from('newsletters')
      .select('id,user_id').eq('id',draft.id).maybeSingle();
    if(lookupError)throw lookupError;
    if(existing&&existing.user_id!==identity.userId)return error('Bu kayıt başka hesaba ait.',403);
    const now=new Date().toISOString();
    const payload={
      title:draft.title,subtitle:draft.subtitle,design:draft.design,
      header_img_url:draft.headerImgUrl,blocks:draft.blocks,
      content:draft,updated_at:now,
    };
    if(existing){
      const {error:writeError}=await client.from('newsletters').update(payload)
        .eq('id',draft.id).eq('user_id',identity.userId);
      if(writeError)throw writeError;
    }else{
      const {error:writeError}=await client.from('newsletters').insert({
        id:draft.id,user_id:identity.userId,...payload,created_at:now,
      });
      if(writeError)throw writeError;
    }
    return NextResponse.json({success:true,savedAt:now},{headers:{'Cache-Control':'no-store'}});
  }catch{return error('Bulut kaydı başarısız. Faz 2 şemasını ve depolama sınırını kontrol edin.',503);}
}
export async function DELETE(req:NextRequest){
  const identity=await requireSignedInUser();if(identity.error)return identity.error;
  const origin=checkSameOrigin(req);if(origin)return origin;
  const client=db();if(!client)return error('Bulut arşiv bağlantısı yapılandırılmadı.',503);
  const id=new URL(req.url).searchParams.get('id');
  if(!validId(id))return error('Bülten kimliği geçersiz.',400);
  try{
    const {error:del}=await client.from('newsletters').delete()
      .eq('id',id).eq('user_id',identity.userId);
    if(del)throw del;
    return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return error('Bülten bulut arşivinden silinemedi.',503);}
}
