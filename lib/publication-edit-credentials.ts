import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';

/**
 * Publication edit credentials never appear on reader-facing pages or share links.
 * The browser stores the secret locally; only a SHA-256 digest is persisted in Blobs.
 */
export function newPublicationCredential(): {token:string;hash:string} {
  const token=randomBytes(32).toString('base64url');
  return {token,hash:hashEditToken(token)};
}
export function hashEditToken(token:string):string {
  return createHash('sha256').update(token,'utf8').digest('hex');
}
export function matchesEditToken(token:unknown,expectedHash:unknown):boolean {
  if(typeof token!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(token))return false;
  if(typeof expectedHash!=='string'|| !/^[a-f0-9]{64}$/.test(expectedHash))return false;
  const supplied=Buffer.from(hashEditToken(token),'hex');
  const stored=Buffer.from(expectedHash,'hex');
  return supplied.length===stored.length && timingSafeEqual(supplied,stored);
}
export function validPublicationSlug(value:unknown):value is string {
  return typeof value==='string'&&/^[A-Za-z0-9_-]{16}$/.test(value);
}
