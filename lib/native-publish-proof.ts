import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {abuseStore,reserveQuota} from './newsletter-publication-store';
import {allowedSiteOrigin,publicOriginForRequest} from './publication-origin';

const PATHS=new Set(['/api/publish','/api/unpublish','/api/media','/api/audio']);
const BITS=18;
const ttl=120_000;
function ipHash(req:Request):string {
  // Netlify sets this header; forwarded client-supplied headers are not trusted.
  return createHash('sha256').update(req.headers.get('x-nf-client-connection-ip')||'unknown').digest('hex');
}
async function signingKey(host:string):Promise<string>{
  const store=abuseStore(host);
  const key=await store.get('signing-key-v1',{type:'json'}) as {secret?:string}|null;
  if(key?.secret&&/^[a-f0-9]{64}$/.test(key.secret))return key.secret;
  const secret=randomBytes(32).toString('hex');
  const result=await store.setJSON('signing-key-v1',{secret},{onlyIfNew:true});
  if(result.modified)return secret;
  const existing=await store.get('signing-key-v1',{type:'json'}) as {secret?:string}|null;
  if(!existing?.secret||!/^[a-f0-9]{64}$/.test(existing.secret))throw Error('Proof storage unavailable');
  return existing.secret;
}
function signature(payload:string,key:string){return createHmac('sha256',key).update(payload).digest('base64url');}
function denial(message:string,status=403){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});}
function sameOrigin(req:Request):string|null {
  const origin=req.headers.get('origin')||'';
  if(!allowedSiteOrigin(origin))return null;
  const expected=publicOriginForRequest(req);
  return origin===expected&&new URL(origin).host===new URL(req.url).host?origin:null;
}
export async function issuePublishProof(req:Request):Promise<Response>{
  const origin=sameOrigin(req);if(!origin)return denial('Doğrulama yalnızca bu editörden başlatılabilir.');
  if(req.headers.get('content-type')?.split(';')[0]!=='application/json')return denial('JSON isteği gerekli.',415);
  if(Number(req.headers.get('content-length')||0)>1000)return denial('İstek çok büyük.',413);
  try{
    const raw=await req.text();if(raw.length>1000)return denial('İstek çok büyük.',413);
    const body=JSON.parse(raw);if(!PATHS.has(body.path))return denial('Geçersiz işlem.',400);
    const host=new URL(origin).hostname,store=abuseStore(host),ip=ipHash(req);
    const hour=Math.floor(Date.now()/3_600_000),day=Math.floor(Date.now()/86_400_000);
    if(!await reserveQuota(store,`issue-${hour}-${ip}`,0,240,0)||!await reserveQuota(store,`issue-global-${day}`,0,5000,0))
      return denial('Doğrulama isteği sınırına ulaşıldı. Daha sonra yeniden deneyin.',429);
    const payload=Buffer.from(JSON.stringify({v:1,nonce:randomBytes(16).toString('hex'),origin,ip,path:body.path,expires:Date.now()+ttl,bits:BITS})).toString('base64url');
    const ticket=payload+'.'+signature(payload,await signingKey(host));
    return Response.json({ticket,bits:BITS,expiresIn:120},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch{return denial('Yayın doğrulama servisi kullanılamıyor.',503);}
}
export async function verifyNativePublishProof(req:Request):Promise<Response|null>{
  const origin=sameOrigin(req);if(!origin)return denial('İstek kaynağı doğrulanamadı.');
  const ticket=req.headers.get('x-bulten-proof')||'',counter=req.headers.get('x-bulten-work')||'';
  if(ticket.length>1800||! /^[A-Za-z0-9_-]{40,1700}\.[A-Za-z0-9_-]{43}$/.test(ticket)||! /^\d{1,10}$/.test(counter))
    return denial('Yayın doğrulamasını yeniden başlatın.');
  try{
    const host=new URL(origin).hostname;
    const [payload,sig]=ticket.split('.');
    const expected=signature(payload,await signingKey(host));
    if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return denial('Doğrulama geçersiz.');
    const value=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    if(value.v!==1||value.origin!==origin||value.ip!==ipHash(req)||value.path!==new URL(req.url).pathname||value.bits!==BITS||
       typeof value.expires!=='number'||value.expires<Date.now()||value.expires>Date.now()+ttl+5000||! /^[a-f0-9]{32}$/.test(value.nonce))
      return denial('Doğrulama süresi dolmuş veya farklı bir işleme ait.');
    const hash=createHash('sha256').update(ticket+'.'+counter).digest();
    if(hash[0]!==0||hash[1]!==0||hash[2]>=64)return denial('Doğrulama hesaplaması geçersiz.');
    const store=abuseStore(host);
    const used=await store.setJSON('used-'+value.nonce,{updatedAt:Date.now()},{onlyIfNew:true});
    if(!used.modified)return denial('Bu doğrulama daha önce kullanılmış.');
    return null;
  }catch{return denial('Yayın doğrulama servisi kullanılamıyor.',503);}
}
