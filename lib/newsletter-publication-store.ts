import { getDeployStore, getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const STORE_NAME = 'bulten-publications-v1';
const RATE_STORE_NAME = 'bulten-publish-limits-v1';
const MEDIA_STORE_NAME = 'bulten-public-images-v1';
const MEDIA_RATE_STORE_NAME = 'bulten-media-quotas-v1';

/** Public newsletters are persistent on production, isolated on deploy previews. */
function isProduction(hostname?:string): boolean {
  // Direct Netlify Functions know the public hostname; preview hosts include '--'.
  if(hostname&&hostname.endsWith('.netlify.app'))return !hostname.includes('--');
  return process.env.PUBLISH_BUILD_CONTEXT === 'production' || process.env.CONTEXT === 'production';
}

export function publicationStore(hostname?:string) {
  return isProduction(hostname)
    ? getStore({name: STORE_NAME, consistency:'strong'})
    : getDeployStore({name: STORE_NAME, consistency:'strong'});
}

export function mediaStore(hostname?:string) {
  return isProduction(hostname)
    ? getStore({name:MEDIA_STORE_NAME,consistency:'strong'})
    : getDeployStore({name:MEDIA_STORE_NAME,consistency:'strong'});
}

function mediaQuotaStore(hostname?:string) {
  return isProduction(hostname)
    ? getStore({name:MEDIA_RATE_STORE_NAME,consistency:'strong'})
    : getDeployStore({name:MEDIA_RATE_STORE_NAME,consistency:'strong'});
}

/** Abuse control on upload traffic, not a limit on newsletter total media size. */
export async function checkMediaUploadQuota(ip:string,bytes:number,hostname?:string):Promise<boolean> {
  const hour=Math.floor(Date.now()/3_600_000);
  const hash=createHash('sha256').update(ip).digest('hex').slice(0,24);
  const key='media-'+hour+'-'+hash;
  const store=mediaQuotaStore(hostname);
  const state=await store.get(key,{type:'json'}) as {count:number,bytes:number}|null;
  if((state?.count||0)>=180 || (state?.bytes||0)+bytes>360*1024*1024)return false;
  await store.setJSON(key,{
    count:(state?.count||0)+1,bytes:(state?.bytes||0)+bytes,updatedAt:Date.now(),
  });
  return true;
}

function rateStore(hostname?:string) {
  return isProduction(hostname)
    ? getStore({name: RATE_STORE_NAME, consistency:'strong'})
    : getDeployStore({name: RATE_STORE_NAME, consistency:'strong'});
}

export interface PublishedNewsletter {
  version: 1;
  bodyHtml: string;
  title: string;
  subtitle: string;
  headerImgUrl: string;
  createdAt: string;
  /** Added for newly published newsletters; older records remain readable. */
  updatedAt?: string;
  revision?: number;
  editTokenHash?: string;
  /** Verified Clerk publisher ID; never exposed in public HTML. */
  ownerUserId?: string;
}

/** Best-effort per-IP throttling; do not present this as a bot-proof quota. */
export async function checkPublishQuota(ip: string, hostname?:string): Promise<boolean> {
  const hour = Math.floor(Date.now()/(60*60*1000));
  const hash = createHash('sha256').update(ip).digest('hex').slice(0,24);
  const key = hour+'-'+hash;
  const store = rateStore(hostname);
  const current = await store.get(key, {type:'json'}) as {count:number}|null;
  if (current && current.count >= 12) return false;
  await store.setJSON(key, {count:(current?.count||0)+1,updatedAt:Date.now()});
  return true;
}
