import {createHash} from 'node:crypto';
import {getDeployStore,getStore} from '@netlify/blobs';

/**
 * Best-effort volume limits, independently keyed per account and time window.
 * A storage failure rejects billable operations rather than permitting them.
 * Blobs are not a transactional counter: high-scale limits need an atomic DB/Redis.
 */
function store(){
  const name='bulten-sensitive-api-quotas-v1';
  return process.env.CONTEXT==='production'
    ?getStore({name,consistency:'strong'})
    :getDeployStore({name,consistency:'strong'});
}
export type QuotaAction='ai'|'email';
const LIMITS={
  ai:[{duration:600_000,max:8},{duration:86_400_000,max:50}],
  email:[{duration:600_000,max:40},{duration:86_400_000,max:150}],
} as const;

export async function reserveQuota(
 userId:string,action:QuotaAction,quantity=1
):Promise<{allowed:true}|{allowed:false;reason:string}>{
 if(!Number.isInteger(quantity)||quantity<1||quantity>150)
   return {allowed:false,reason:'Geçersiz gönderim miktarı.'};
 const current=Date.now();
 const hashed=createHash('sha256').update(userId).digest('hex');
 const base=store();
 for(const limit of LIMITS[action]){
   const bucket=Math.floor(current/limit.duration);
   const key=action+'-'+limit.duration+'-'+bucket+'-'+hashed;
   const old=await base.get(key,{type:'json'}) as {used?:number}|null;
   const used=Number(old?.used||0);
   if(!Number.isFinite(used)||used+quantity>limit.max)
     return {allowed:false,reason:'Güvenli kullanım kotası doldu. Daha sonra yeniden deneyin.'};
   await base.setJSON(key,{used:used+quantity,updatedAt:current});
 }
 return {allowed:true};
}
