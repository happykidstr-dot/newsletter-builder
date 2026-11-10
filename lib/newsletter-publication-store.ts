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

/** Conditional writes prevent concurrent requests from spending the same quota. */
async function reserveQuota(store:ReturnType<typeof getStore>,key:string,bytes:number,maxCount:number,maxBytes:number):Promise<boolean>{
  for(let attempt=0;attempt<16;attempt++){
    const current=await store.getWithMetadata(key,{type:'json'});
    const state=current?.data as {count:number,bytes?:number}|undefined;
    const count=state?.count||0,used=state?.bytes||0;
    if(!Number.isSafeInteger(count)||count<0||!Number.isSafeInteger(used)||used<0)return false;
    if(count>=maxCount||used+bytes>maxBytes)return false;
    if(current&&!current.etag)return false;
    const result=await store.setJSON(key,{count:count+1,bytes:used+bytes,updatedAt:Date.now()},
      current?{onlyIfMatch:current.etag!}:{onlyIfNew:true});
    if(result.modified)return true;
  }
  return false;
}

/** Abuse control on upload traffic, not a limit on newsletter total media size. */
export async function checkMediaUploadQuota(ip:string,bytes:number,hostname?:string):Promise<boolean> {
  if(!Number.isSafeInteger(bytes)||bytes<0)return false;
  const hour=Math.floor(Date.now()/3_600_000);
  const hash=createHash('sha256').update(ip).digest('hex').slice(0,24);
  const key='media-'+hour+'-'+hash;
  return reserveQuota(mediaQuotaStore(hostname),key,bytes,180,360*1024*1024);
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

/** Per-IP hourly quota uses conditional writes to reject concurrent overspending. */
export async function checkPublishQuota(ip: string, hostname?:string): Promise<boolean> {
  const hour = Math.floor(Date.now()/(60*60*1000));
  const hash = createHash('sha256').update(ip).digest('hex').slice(0,24);
  const key = hour+'-'+hash;
  return reserveQuota(rateStore(hostname),key,0,12,0);
}
