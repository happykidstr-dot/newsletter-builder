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

// Non-destructive security checks: anonymous callers must never be able
// to reach billable or private endpoints. Empty bodies cannot send mail/AI.
for(const path of ['/api/ai-generate','/api/chat','/api/send-email']){
  const response=await fetch(BASE+path,{
    method:'POST',headers:{Origin:BASE,'Content-Type':'application/json'},
    body:JSON.stringify({}),signal:AbortSignal.timeout(15000),
  });
  assert.ok([401,403,503].includes(response.status),
    path+' was not session-locked: '+response.status);
}
for(const path of ['/api/db/analytics','/api/account/privacy']){
  const response=await fetch(BASE+path,{signal:AbortSignal.timeout(15000)});
  assert.ok([401,403,503].includes(response.status),
    path+' leaked personal data: '+response.status);
}
const unsignedClick=await fetch(BASE+'/api/track/click?u=https%3A%2F%2Fevil.example',{
  redirect:'manual',signal:AbortSignal.timeout(15000),
});
assert.equal(unsignedClick.status,400,'Legacy public redirect must not be accepted.');
const badUnsubscribe=await fetch(BASE+'/api/unsubscribe?t=fake',{
  redirect:'manual',signal:AbortSignal.timeout(15000),
});
assert.equal(badUnsubscribe.status,400,'Invalid unsubscribe token must not change subscriber data.');


// Test the independent media store before publishing an image-rich article.
const pngOnePixel='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2VQAAAABJRU5ErkJggg==';
const mediaSent=await fetch(BASE+'/api/media',{
  method:'POST',
  headers:{Origin:BASE,'Content-Type':'application/json','User-Agent':'bulten-preview-e2e'},
  body:JSON.stringify({mime:'image/png',base64:pngOnePixel}),
  signal:AbortSignal.timeout(25000),
});
const mediaSaved=await mediaSent.json().catch(()=>({}));
assert.equal(mediaSent.status,201,'Media upload failed: '+JSON.stringify(mediaSaved));
const mediaUrl=new URL(mediaSaved.url);
assert.equal(mediaUrl.origin,BASE,'Media must have a public same-origin reader URL.');
assert.match(mediaUrl.pathname,/^\/media\/[A-Za-z0-9_-]{22}$/);
const servedImage=await fetch(mediaSaved.url,{signal:AbortSignal.timeout(25000)});
assert.equal(servedImage.status,200,'Published image is not accessible to social readers.');
assert.match(servedImage.headers.get('content-type')||'',/image\/png/);
const bytes=Buffer.from(await servedImage.arrayBuffer());
assert.equal(bytes.subarray(0,4).toString('hex'),'89504e47','Media bytes changed during delivery.');

const title='BÜLTEN READ QA — Paylaşım Denemesi';
const snippet='Yalnızca otomatik test içerir; gerçek kullanıcı verisi yoktur.';
const fakeHtml=`<!doctype html><html lang="tr"><body><div style="max-width:640px">
  <h1>${title}</h1>
  <div id="bulten-reading-content"><p>${snippet}</p><img src="${mediaSaved.url}" alt="Test görseli"><script>window.__SHOULD_NOT_EXECUTE__=1;</script>
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
assert.match(result.editToken,/^[A-Za-z0-9_-]{43}$/,'New publication must return a private edit credential');
assert.equal(result.revision,1);

const doc=await fetch(BASE+'/b/'+result.slug,{signal:AbortSignal.timeout(25000)});
assert.equal(doc.status,200,'Published newsletter not readable.');
assert.match(doc.headers.get('content-type')||'',/text\/html/);
assert.match(doc.headers.get('content-security-policy')||'',/sandbox/);
const html=await doc.text();
assert.ok(html.includes(snippet),'Published document lost current newsletter content.');
assert.ok(html.includes(mediaSaved.url),'Reader article lost its separately stored image URL.');
assert.ok(html.includes('og:title'),'Social previews lack Open Graph title.');
assert.ok(html.includes('linkedin.com/sharing/share-offsite'),'Reader share links were not generated.');
assert.ok(!html.includes('__SHOULD_NOT_EXECUTE__'),'Untrusted scripts leaked into published document.');
assert.ok(!html.includes('javascript:alert'),'Unsafe user links survived sanitisation.');
assert.ok(html.includes('SpeechSynthesisUtterance'),'Browser voice reader did not remain available.');
const revisedHtml=fakeHtml.replace(snippet,'Bu bülten yeniden düzenlendi; yeni sürüm yayında.');
const malicious=await fetch(BASE+'/api/publish',{
  method:'POST',headers:{Origin:BASE,'Content-Type':'application/json'},
  body:JSON.stringify({title,subtitle:'Otomatik test',headerImgUrl:'',
    html:revisedHtml,slug:result.slug,editToken:'B'.repeat(43),expectedRevision:1}),
  signal:AbortSignal.timeout(25000),
});
assert.equal(malicious.status,403,'Another reader must not overwrite the published newsletter.');
const edited=await fetch(BASE+'/api/publish',{
  method:'POST',headers:{Origin:BASE,'Content-Type':'application/json'},
  body:JSON.stringify({title,subtitle:'Otomatik test',headerImgUrl:'',
    html:revisedHtml,slug:result.slug,editToken:result.editToken,expectedRevision:1}),
  signal:AbortSignal.timeout(25000),
});
const update=await edited.json().catch(()=>({}));
assert.equal(edited.status,200,'Publisher update failed: '+JSON.stringify(update));
assert.equal(update.slug,result.slug,'Updated newsletter must retain its original link.');
assert.equal(update.revision,2,'Revision did not increase');
const refreshed=await fetch(BASE+'/b/'+result.slug,{cache:'no-store',signal:AbortSignal.timeout(25000)});
assert.equal(refreshed.status,200,'Updated newsletter is not readable');
const newHtml=await refreshed.text();
assert.ok(newHtml.includes('Bu bülten yeniden düzenlendi; yeni sürüm yayında.'),'The published URL did not update');
assert.ok(!newHtml.includes(snippet),'Old newsletter body remained visible');

const forbiddenRemoval=await fetch(BASE+'/api/unpublish',{
  method:'POST',headers:{Origin:BASE,'Content-Type':'application/json'},
  body:JSON.stringify({slug:result.slug,editToken:'B'.repeat(43)}),
  signal:AbortSignal.timeout(25000),
});
assert.equal(forbiddenRemoval.status,403,'Anyone who sees the public URL must not be able to unpublish.');
const removed=await fetch(BASE+'/api/unpublish',{
  method:'POST',headers:{Origin:BASE,'Content-Type':'application/json'},
  body:JSON.stringify({slug:result.slug,editToken:result.editToken}),
  signal:AbortSignal.timeout(25000),
});
assert.equal(removed.status,200,'Publisher should be able to revoke newsletter URL.');
const afterRemoval=await fetch(BASE+'/b/'+result.slug,{cache:'no-store',signal:AbortSignal.timeout(25000)});
assert.equal(afterRemoval.status,404,'Revoked public newsletter must no longer be readable.');
console.log('PASS: Netlify preview publish, private update, denied foreign access, and owner unpublish');
