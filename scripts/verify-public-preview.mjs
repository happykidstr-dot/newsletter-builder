// Verifies the real preview private APIs and anonymous publishing acceptance.
// No synthetic newsletter is published by unauthenticated CI runners.
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
const editableHome=await fetch(BASE+'/',{
  headers:{'User-Agent':'Mozilla/5.0 (Linux; Android 16) Chrome/130.0 Mobile'},
  signal:AbortSignal.timeout(20000),
});
const editorMarkup=await editableHome.text();
assert.equal(editableHome.status,200,'Passwordless newsletter editor homepage returned an error.');
assert.ok(editorMarkup.includes('bulten-editor-layout'),
  'Local editor is not directly rendered to guest visitors.');
assert.ok(!editorMarkup.includes('bulten-private-gate'),
  'Old Supabase gate still blocks the passwordless editor.');
console.log('PASS: local newsletter editor is available without signup or Supabase keys.');


// Netlify Next.js has / as the homepage. Legacy /index.html bookmarks must
// redirect, rather than showing the stock Next.js 404 seen on mobile.
for(const [browser,userAgent] of [
  ['desktop','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0'],
  ['android','Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'],
]){
  const homepage=await fetch(BASE+'/',{
    headers:{'User-Agent':userAgent},
    signal:AbortSignal.timeout(15000),
  });
  const html=await homepage.text();
  assert.equal(homepage.status,200,browser+' homepage is unavailable.');
  assert.match(html,/BÜLTEN READ/,browser+' homepage rendered the wrong app.');
}
const legacy=await fetch(BASE+'/index.html',{
  redirect:'manual',signal:AbortSignal.timeout(15000),
});
assert.ok([301,302,307,308].includes(legacy.status),
  'Old /index.html URL still returns '+legacy.status+' instead of a redirect.');
const landing=new URL(legacy.headers.get('location')||'',BASE);
assert.equal(landing.origin+landing.pathname,BASE+'/',
  'Legacy bookmark is not redirected to the live homepage.');
console.log('PASS: Android/desktop homepage 200 and legacy /index.html redirects to /.');


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


// Private editor access remains account-controlled; public writes need a proof.
// The GitHub runner has no user credentials: verify a real preview rejects
// every attempted anonymous write, rather than creating QA publications.
const access=await fetch(BASE+'/api/editor-access',{signal:AbortSignal.timeout(20000)});
assert.ok([401,403,503].includes(access.status),
  'Editor unexpectedly open without approved credentials: '+access.status);

const tinyPng='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2VQAAAABJRU5ErkJggg==';
const deniedMedia=await fetch(BASE+'/api/media',{
  method:'POST',
  headers:{Origin:BASE,'Content-Type':'application/json','User-Agent':'bulten-read-security-smoke'},
  body:JSON.stringify({mime:'image/png',base64:tinyPng}),
  signal:AbortSignal.timeout(20000),
});
assert.ok([401,403,503].includes(deniedMedia.status),
  'Anonymous media upload incorrectly accepted: '+deniedMedia.status);

const synthetic={
  title:'BÜLTEN READ unauthorized QA',subtitle:'automated write denial',
  headerImgUrl:'',html:'<!doctype html><html lang="tr"><body><h1>Denied</h1></body></html>',
};
const deniedPublication=await fetch(BASE+'/api/publish',{
  method:'POST',
  headers:{Origin:BASE,'Content-Type':'application/json','User-Agent':'bulten-read-security-smoke'},
  body:JSON.stringify(synthetic),signal:AbortSignal.timeout(20000),
});
assert.ok([401,403,503].includes(deniedPublication.status),
  'Anonymous newsletter publication incorrectly accepted: '+deniedPublication.status);

const fakeAuthPublication=await fetch(BASE+'/api/publish',{
  method:'POST',
  headers:{Origin:BASE,'Content-Type':'application/json',
    Authorization:'Bearer '+ 'A'.repeat(70)},
  body:JSON.stringify(synthetic),signal:AbortSignal.timeout(20000),
});
assert.ok([401,403,503].includes(fakeAuthPublication.status),
  'Forged publisher token incorrectly accepted: '+fakeAuthPublication.status);

const deniedUnpublish=await fetch(BASE+'/api/unpublish',{
  method:'POST',
  headers:{Origin:BASE,'Content-Type':'application/json'},
  body:JSON.stringify({slug:'AQIDBAUGBwgJCgsM',editToken:'A'.repeat(43)}),
  signal:AbortSignal.timeout(20000),
});
assert.ok([401,403,503].includes(deniedUnpublish.status),
  'Anonymous unpublish not blocked: '+deniedUnpublish.status);

const invalidReader=await fetch(BASE+'/b/not-a-valid-id',{
  signal:AbortSignal.timeout(20000),
});
assert.equal(invalidReader.status,404,'Unrecognized reader URL should not expose content.');

console.log('PASS: real Netlify preview blocks unauthorised editor, uploads, publish and unpublish.');
await import('./verify-anonymous-publish.mjs');
