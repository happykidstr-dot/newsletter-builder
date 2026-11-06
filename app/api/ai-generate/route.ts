import {NextRequest,NextResponse} from 'next/server';
import {requireAuthorizedPublisher,checkSameOrigin,boundedJson,requestProblem} from '@/lib/security/access';
import {reserveQuota} from '@/lib/security/quotas';

export const runtime='nodejs';
export async function POST(req:NextRequest){
  const session=await requireAuthorizedPublisher();
  if(session.error)return session.error;
  const originError=checkSameOrigin(req);if(originError)return originError;
  let payload:unknown;
  try{payload=await boundedJson(req,28_000);}catch(e){return requestProblem(e);}
  const p=payload as {prompt?:unknown;maxTokens?:unknown;systemPrompt?:unknown};
  if(typeof p?.prompt!=='string'||p.prompt.length<1||p.prompt.length>18_000||
     (p.systemPrompt!==undefined&&(typeof p.systemPrompt!=='string'||p.systemPrompt.length>4000))||
     (p.maxTokens!==undefined&&(!Number.isInteger(p.maxTokens)||Number(p.maxTokens)>2500||Number(p.maxTokens)<1)))
    return NextResponse.json({error:'İstek uzunluğu veya token sınırı geçersiz.'},{status:400});
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
        messages:[
          {role:'system',content:typeof p.systemPrompt==='string'?p.systemPrompt:'Profesyonel ve erişilebilir bülten editörü yardımcısısın.'},
          {role:'user',content:p.prompt}
        ],
        max_tokens:Number(p.maxTokens)||1000,temperature:0.7,
      }),signal:AbortSignal.timeout(45_000),
    });
    if(!response.ok)return NextResponse.json({error:'AI hizmetinden yanıt alınamadı.'},{status:502});
    const data=await response.json();
    return NextResponse.json({result:String(data.choices?.[0]?.message?.content||'').trim()},{
      headers:{'Cache-Control':'no-store'}
    });
  }catch{return NextResponse.json({error:'AI bağlantısı başarısız.'},{status:502});}
}
