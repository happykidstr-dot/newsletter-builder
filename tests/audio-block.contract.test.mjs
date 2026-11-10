import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('only one Ses Ekle block covers dozens of audio formats',()=>{
  const page=read('app/page.tsx'),uploader=read('lib/upload-newsletter-audio.ts');
  assert.match(page,/type:'audio',\s+icon:'🔊',\s+label:'Ses Ekle'/);
  assert.match(page,/case 'audio': return/);
  assert.match(page,/type BT = [^\n]+\|'audio'\|/);
  assert.match(uploader,/audio\/\*/);
  for(const ext of ['mp3','wav','m4a','flac','ogg','opus','aac','aiff','wma','amr','ape','caf']){
    assert.match(uploader,new RegExp("'"+ext+"'"),ext);
  }
});
test('audio chunks require Turnstile and a per-file secret and remain private until finalised',()=>{
  const audio=read('lib/newsletter-audio.ts');
  const netlify=read('netlify/functions/newsletter-audio.ts');
  const next=read('app/api/audio/route.ts');
  assert.match(audio,/MAX_AUDIO_BYTES=60\*1024\*1024/);
  assert.match(audio,/state:'uploading'/);
  assert.match(audio,/state:'ready'/);
  assert.match(audio,/manifest\.owner!==owner/);
  assert.match(audio,/checkMediaUploadQuota/);
  assert.match(audio,/Content-Range/);
  assert.match(audio,/Accept-Ranges/);
  assert.match(netlify,/verifyAnonymousWrite\(req\)/);
  assert.match(netlify,/anonymousAudioOwner\(req\)/);
  assert.match(next,/verifyAnonymousWrite\(req\)/);
  assert.match(next,/anonymousAudioOwner\(req\)/);
});
test('published HTML uses audio-safe CSP and PDF keeps listening links',()=>{
  const render=read('lib/newsletter-render.ts');
  const sanitizer=read('lib/public-newsletter-render.ts');
  const pdf=read('lib/newsletter-pdf.ts');
  const uploader=read('lib/upload-newsletter-audio.ts');
  assert.match(render,/b\.type==='audio'/);
  assert.match(render,/<audio controls preload="metadata"/);
  assert.match(render,/Ses dosyasını dinle \/ indir/);
  assert.match(sanitizer,/"media-src https: http:"/);
  assert.match(sanitizer,/audio:\['src','controls','preload'/);
  assert.match(pdf,/bulten-audio-block audio/);
  assert.match(pdf,/enableLinks:true/);
  assert.match(uploader,/new URL\(url,window\.location\.origin\)/);
});
