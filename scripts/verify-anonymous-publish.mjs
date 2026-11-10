import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const BASE=process.env.PREVIEW_URL?.replace(/\/$/,'');
if(!BASE)throw Error('PREVIEW_URL required');
// Real deployment acceptance. No auth, CAPTCHA mocks, private cookies or keys.
async function proof(path){
  const r=await fetch(BASE+'/api/publish-challenge',{method:'POST',headers:{Origin:BASE,'Content-Type':'application/json'},body:JSON.stringify({path}),signal:AbortSignal.timeout(20000)});
  const j=await r.json();assert.equal(r.status,200,'Native challenge unavailable: '+(j.error||r.status));assert.equal(j.bits,18);
  for(let i=0;i<20_000_000;i++){
    const h=createHash('sha256').update(j.ticket+'.'+i).digest();
    if(h[0]===0&&h[1]===0&&h[2]<64)return {'X-Bulten-Proof':j.ticket,'X-Bulten-Work':String(i)};
  }
  throw Error('Work budget exhausted');
}
async function post(path,body,headers){return fetch(BASE+path,{method:'POST',headers:{Origin:BASE,'Content-Type':'application/json',...(headers||await proof(path))},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});}
const tinyPng='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2VQAAAABJRU5ErkJggg==';
const image=await post('/api/media',{mime:'image/png',base64:tinyPng});assert.equal(image.status,201,'Image upload failed');const photo=await image.json();
assert.equal((await fetch(photo.url)).status,200);
const wav=Buffer.alloc(44+16000);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);
const uploadKey='U'.repeat(43);
async function audio(body,key=uploadKey){return post('/api/audio',body,{...(await proof('/api/audio')),'X-Audio-Upload-Key':key});}
const start=await audio({action:'start',name:'audit-tone.wav',mime:'audio/wav',size:wav.length});assert.equal(start.status,201,'Audio start failed');const {id}=await start.json();
assert.equal((await audio({action:'chunk',id,index:0,base64:wav.toString('base64')},'V'.repeat(43))).status,403,'Another audio owner was accepted');
assert.equal((await audio({action:'chunk',id,index:0,base64:wav.toString('base64')})).status,200);
const finish=await audio({action:'finish',id});assert.equal(finish.status,201);const sound=await finish.json();
const audioRead=await fetch(BASE+sound.url,{headers:{Range:'bytes=0-43'}});assert.equal(audioRead.status,206);assert.equal((await audioRead.arrayBuffer()).byteLength,44);
const initial={title:'BültenOku gerçek anonim kabul testi',subtitle:'Disposable automated acceptance',headerImgUrl:'',html:`<html><body><div id="bulten-reading-content"><h1>Native acceptance</h1><img src="${photo.url}" onerror="auditXssHandler()"><audio controls src="${BASE+sound.url}"></audio><script>auditXssScript()</script></div></body></html>`};
const firstProof=await proof('/api/publish');const created=await post('/api/publish',initial,firstProof);assert.equal(created.status,201,'Anonymous publish failed: '+await created.clone().text());
const record=await created.json();assert.match(record.slug,/^[A-Za-z0-9_-]{16}$/);assert.match(record.editToken,/^[A-Za-z0-9_-]{43}$/);
try{
  const reader=await fetch(record.url,{headers:{'User-Agent':'Mozilla/5.0 independent-reader'}});assert.equal(reader.status,200);
  const page=await reader.text();assert.ok(page.includes('Native acceptance'));assert.ok(!page.includes('auditXssHandler')&&!page.includes('auditXssScript')&&!page.includes(record.editToken));assert.match(reader.headers.get('content-security-policy')||'',/sandbox/);
  assert.equal((await post('/api/publish',initial,firstProof)).status,403,'Replayed proof accepted');
  assert.equal((await post('/api/publish',{...initial,slug:record.slug,editToken:'W'.repeat(43)})).status,403);
  assert.equal((await post('/api/unpublish',{slug:record.slug,editToken:'W'.repeat(43)})).status,403);
  const updated=await post('/api/publish',{...initial,title:'UPDATED acceptance',html:initial.html.replace('Native acceptance','Updated public content'),slug:record.slug,editToken:record.editToken,expectedRevision:1});assert.equal(updated.status,200);
  assert.equal((await updated.json()).url,record.url);assert.ok((await (await fetch(record.url)).text()).includes('Updated public content'));
  assert.equal((await post('/api/publish',{...initial,slug:record.slug,editToken:record.editToken,expectedRevision:1})).status,409);
}finally{
  assert.equal((await post('/api/unpublish',{slug:record.slug,editToken:record.editToken})).status,200);
  assert.equal((await fetch(record.url)).status,404);
}
console.log('PASS: REAL anonymous image/audio upload, audio ownership/range, publish, independent reader, XSS removal, replay rejection, wrong edit/delete key, same-URL update, stale revision and unpublish.');
