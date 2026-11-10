import {createHash} from 'node:crypto';

/** Per-file secret binds every audio chunk to its initiating browser. */
export function anonymousAudioOwner(req:Request):string|null {
  const key=req.headers.get('x-audio-upload-key')||'';
  if(!/^[A-Za-z0-9_-]{43}$/.test(key))return null;
  return 'anonymous-audio:'+createHash('sha256').update(key).digest('hex');
}
