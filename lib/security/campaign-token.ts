import {createHash,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';

export type CampaignToken={
  kind:'open'|'click'|'unsubscribe';
  userId:string;listId:string;campaignId:string;email:string;url?:string;exp:number;
};
function secret():Buffer{
  const raw=process.env.CAMPAIGN_SECURITY_SECRET;
  if(!raw||raw.length<32)throw new Error('CAMPAIGN_SECURITY_NOT_CONFIGURED');
  return createHash('sha256').update(raw,'utf8').digest();
}
const isWebUrl=(value:string):boolean=>{
  try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password
    &&!['localhost','127.0.0.1','0.0.0.0','::1'].includes(u.hostname)
    &&!u.hostname.endsWith('.localhost');}catch{return false;}
};
export function makeCampaignToken(p:Omit<CampaignToken,'exp'>,days=90):string{
  if(!p.userId||!p.listId||!p.email||!p.campaignId
    ||(p.kind==='click'&&(!p.url||!isWebUrl(p.url))))throw new Error('INVALID_CAMPAIGN');
  const exp=Date.now()+Math.min(Math.max(days,1),365)*86_400_000;
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',secret(),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify({...p,exp}),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.concat([iv,tag,encrypted]).toString('base64url');
}
export function readCampaignToken(token:string,kind:CampaignToken['kind']):CampaignToken|null{
  if(typeof token!=='string'||token.length<40||token.length>3500||!/^[A-Za-z0-9_-]+$/.test(token))return null;
  try{
    const data=Buffer.from(token,'base64url');
    const decipher=createDecipheriv('aes-256-gcm',secret(),data.subarray(0,12));
    decipher.setAuthTag(data.subarray(12,28));
    const json=Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8');
    const value=JSON.parse(json) as CampaignToken;
    if(value.kind!==kind||!value.userId||!value.listId||!value.campaignId||
       !value.email||!Number.isFinite(value.exp)||value.exp<Date.now()||
       (kind==='click'&&(!value.url||!isWebUrl(value.url))))return null;
    return value;
  }catch{return null;}
}
