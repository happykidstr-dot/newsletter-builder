import {NextRequest,NextResponse} from 'next/server';
import {requireAuthorizedPublisher,checkSameOrigin,boundedJson,requestProblem} from '@/lib/security/access';
import {reserveQuota} from '@/lib/security/quotas';

export const runtime='nodejs';
export async function POST(req:NextRequest){
  const session=await requireAuthorizedPublisher();if(session.error)return session.error;
  const originError=checkSameOrigin(req);if(originError)return originError;
  let raw:unknown;
  try{raw=await boundedJson(req,34_000);}catch(e){return requestProblem(e);}
  const input=raw as {messages?:unknown};
  if(!Array.isArray(input?.messages)||input.messages.length<1||input.messages.length>16||
    input.messages.some((m:unknown)=>{
      const item=m as {role?:unknown;content?:unknown};
      return !item||!['user','assistant'].includes(String(item.role))||
        typeof item.content!=='string'||item.content.length<1||item.content.length>22_000;
    })||input.messages.reduce((sum:number,m:{content:string})=>sum+m.content.length,0)>30_000)
    return NextResponse.json({error:'İçerik boyutu veya mesaj biçimi uygun değil.'},{status:400});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return NextResponse.json({error:'AI hizmeti yapılandırılmadı.'},{status:503});
  try{
    const quota=await reserveQuota(session.userId,'ai');
    if(!quota.allowed)return NextResponse.json({error:quota.reason},{status:429});
  }catch{return NextResponse.json({error:'AI kota hizmetine erişilemiyor.'},{status:503});}
  try{
    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-4o-mini',
        messages:[{role:'system',content:'You are a professional newsletter assistant. Return the requested result.'},...input.messages],
        max_tokens:2500,temperature:0.7,
      }),signal:AbortSignal.timeout(45_000),
    });
    if(!response.ok)return NextResponse.json({error:'AI hizmetinden yanıt alınamadı.'},{status:502});
    const result=await response.json();
    return NextResponse.json({reply:String(result.choices?.[0]?.message?.content||'').trim()},{
      headers:{'Cache-Control':'no-store'}
    });
  }catch{return NextResponse.json({error:'AI bağlantısı başarısız.'},{status:502});}
}
