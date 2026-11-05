import { getDeployStore, getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const STORE_NAME = 'bulten-publications-v1';
const RATE_STORE_NAME = 'bulten-publish-limits-v1';

/** Public newsletters are persistent on production, isolated on deploy previews. */
function isProduction(): boolean {
  return process.env.CONTEXT === 'production';
}

export function publicationStore() {
  return isProduction()
    ? getStore({name: STORE_NAME, consistency:'strong'})
    : getDeployStore({name: STORE_NAME, consistency:'strong'});
}

function rateStore() {
  return isProduction()
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
}

/** Best-effort per-IP throttling; do not present this as a bot-proof quota. */
export async function checkPublishQuota(ip: string): Promise<boolean> {
  const hour = Math.floor(Date.now()/(60*60*1000));
  const hash = createHash('sha256').update(ip).digest('hex').slice(0,24);
  const key = hour+'-'+hash;
  const store = rateStore();
  const current = await store.get(key, {type:'json'}) as {count:number}|null;
  if (current && current.count >= 12) return false;
  await store.setJSON(key, {count:(current?.count||0)+1,updatedAt:Date.now()});
  return true;
}
