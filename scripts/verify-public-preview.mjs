// Verifies a REAL deployment preview of the Netlify Blobs publish/get workflow.
// This test posts a synthetic QA document only; never accesses user newsletters.
import assert from 'node:assert/strict';

const BASE=process.env.PREVIEW_URL?.replace(/\/$/,'');
const SHA=process.env.PREVIEW_HEAD_SHA;
if(!BASE||!SHA)throw new Error('PREVIEW_URL and PREVIEW_HEAD_SHA are required.');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function ready(){
  const url='https://api.github.com/repos/happykidstr-dot/newsletter-builder/commits/'+SHA+'/status';
  for(let i=0;i<24;i++){
    const response=await fetch(url,{headers:{'Accept':'application/vnd.github+json','User-Agent':'bulten-read-qa'},signal:AbortSignal.timeout(15000)}).catch(()=>null);
    if(response?.ok){
      const data=await response.json();
      const state=(data.statuses||[]).find(s=>s.context==='netlify/bultenoku/deploy-preview');
      if(state?.state==='success')return;
      if(state?.state==='failure'||state?.state==='error')throw Error('Netlify preview failed: '+state.state);
    }
    await sleep(10000);
  }
  throw Error('Netlify preview success status was not observed.');
}
await ready();

const title='BÜLTEN READ QA — Paylaşım Denemesi';
const snippet='Yalnızca otomatik test içerir; gerçek kullanıcı verisi yoktur.';
const fakeHtml=`<!doctype html><html lang="tr"><body><div style="max-width:640px">
  <h1>${title}</h1>
  <div id="bulten-reading-content"><p>${snippet}</p><script>window.__SHOULD_NOT_EXECUTE__=1;</script>
  <a href="javascript:alert(1)" onclick="alert(2)">Test Bağlantısı</a></div>
  </div></body></html>`;
const posted=await fetch(BASE+'/api/publish',{
  method:'POST',
  headers:{'Origin':BASE,'Content-Type':'application/json','User-Agent':'bulten-preview-e2e'},
  body:JSON.stringify({title,subtitle:'Otomatik test',headerImgUrl:'',html:fakeHtml}),
  signal:AbortSignal.timeout(25000),
});
const result=await posted.json().catch(()=>({}));
assert.equal(posted.status,201,'publish failed: '+JSON.stringify(result));
assert.match(result.slug,/^[A-Za-z0-9_-]{16}$/);
const doc=await fetch(BASE+'/b/'+result.slug,{signal:AbortSignal.timeout(25000)});
assert.equal(doc.status,200,'Published newsletter not readable.');
assert.match(doc.headers.get('content-type')||'',/text\/html/);
assert.match(doc.headers.get('content-security-policy')||'',/sandbox/);
const html=await doc.text();
assert.ok(html.includes(snippet),'Published document lost current newsletter content.');
assert.ok(html.includes('og:title'),'Social previews lack Open Graph title.');
assert.ok(html.includes('linkedin.com/sharing/share-offsite'),'Reader share links were not generated.');
assert.ok(!html.includes('__SHOULD_NOT_EXECUTE__'),'Untrusted scripts leaked into published document.');
assert.ok(!html.includes('javascript:alert'),'Unsafe user links survived sanitisation.');
assert.ok(html.includes('SpeechSynthesisUtterance'),'Browser voice reader did not remain available.');
console.log('PASS: Netlify preview public publish -> /b/'+result.slug+' -> sanitised HTML, shares and speech');
