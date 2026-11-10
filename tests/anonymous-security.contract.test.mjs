import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..');
const nativeRequire=createRequire(import.meta.url);
function load(file,mocks={},cache=new Map()){
  const absolute=path.resolve(root,file);
  if(cache.has(absolute))return cache.get(absolute).exports;
  const mod={exports:{}};cache.set(absolute,mod);
  const code=ts.transpileModule(readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const require=key=>{
    if(key in mocks)return mocks[key];
    if(key.startsWith('.'))return load(path.resolve(path.dirname(absolute),key+'.ts'),mocks,cache);
    return nativeRequire(key);
  };
  new Function('require','module','exports',code)(require,mod,mod.exports);
  return mod.exports;
}
const origin='https://bultenoku.netlify.app';
const token='A'.repeat(40);
const html='<html><body><div id="bulten-reading-content"><h1>Denetim</h1></div></body></html>';
function request(endpoint,body,headers={}){
  return new Request(origin+endpoint,{method:'POST',headers:{origin,'content-type':'application/json','x-turnstile-token':token,...headers},body:JSON.stringify(body)});
}
test('anonymous native routes fail closed, enforce ownership, sanitize HTML and respect quotas',async()=>{
  const savedEnv={...process.env}, savedFetch=globalThis.fetch;
  let cloudCalls=0,quota=true,deletes=0;
  const records=new Map();
  const store={get:async id=>records.get(id)||null,setJSON:async(id,value)=>records.set(id,value),delete:async id=>{deletes++;records.delete(id);}};
  const mocks={
    '../../lib/newsletter-publication-store':{publicationStore:()=>store,checkPublishQuota:async()=>quota},
    '../../lib/security/netlify-publisher':{verifyNetlifyPublisher:async()=>({error:'Unauthorized',status:403})},
  };
  try{
    process.env.URL=origin;process.env.SITE_NAME='bultenoku';
    process.env.ENABLE_ANONYMOUS_PUBLISHING='false';delete process.env.TURNSTILE_SECRET_KEY;
    globalThis.fetch=async()=>{cloudCalls++;return Response.json({success:true,hostname:'bultenoku.netlify.app'});};
    const handler=load('netlify/functions/newsletter-publication.ts',mocks).default;
    const media=load('netlify/functions/newsletter-media.ts',{'../../lib/public-newsletter-media':{storePublicMedia:async()=>{throw Error('must not store');}}}).default;
    const context={params:{}};
    const body={html,title:'Denetim',subtitle:'',headerImgUrl:''};
    assert.equal((await handler(request('/api/publish',body),context)).status,503);
    process.env.ENABLE_ANONYMOUS_PUBLISHING='true';
    assert.equal((await handler(request('/api/publish',body),context)).status,503);
    process.env.TURNSTILE_SECRET_KEY='unit-test-secret';
    for(const endpoint of ['/api/publish','/api/unpublish'])
      assert.equal((await handler(request(endpoint,body,{'x-turnstile-token':''}),context)).status,403);
    assert.equal((await media(request('/api/media',{}, {'x-turnstile-token':''}),context)).status,403);
    assert.equal(cloudCalls,0);
    globalThis.fetch=async()=>Response.json({success:false});
    assert.equal((await handler(request('/api/publish',body),context)).status,403);
    globalThis.fetch=async()=>Response.json({success:true,hostname:'other.netlify.app'});
    assert.equal((await handler(request('/api/publish',body),context)).status,403);
    globalThis.fetch=async()=>Response.json({success:true,hostname:'bultenoku.netlify.app'});
    const created=await handler(request('/api/publish',{...body,html:html.replace('</div>','<script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">X</a></div>')}),context);
    assert.equal(created.status,201);
    const info=await created.json();
    assert.match(info.editToken,/^[A-Za-z0-9_-]{43}$/);
    assert.doesNotMatch(records.get(info.slug).bodyHtml,/<script|onerror|javascript:/i);
    assert.equal(records.get(info.slug).ownerUserId,undefined);
    assert.equal((await handler(request('/api/publish',{...body,slug:info.slug,editToken:'wrong'}),context)).status,403);
    assert.equal((await handler(request('/api/unpublish',{slug:info.slug,editToken:'wrong'}),context)).status,403);
    assert.equal(deletes,0);
    assert.equal((await handler(request('/api/publish',{...body,slug:info.slug,editToken:info.editToken,expectedRevision:1}),context)).status,200);
    assert.equal(records.get(info.slug).revision,2);
    assert.equal((await handler(request('/api/publish',{...body,slug:info.slug,editToken:info.editToken,expectedRevision:1}),context)).status,409);
    records.get(info.slug).ownerUserId='legacy-owner';
    assert.equal((await handler(request('/api/publish',{...body,slug:info.slug,editToken:info.editToken}),context)).status,403);
    assert.equal((await handler(request('/api/unpublish',{slug:info.slug,editToken:info.editToken}),context)).status,403);
    delete records.get(info.slug).ownerUserId;
    quota=false;
    assert.equal((await handler(request('/api/publish',body),context)).status,429);
    quota=true;
    assert.equal((await handler(request('/api/publish',body,{'content-length':'5700001'}),context)).status,413);
    assert.equal((await handler(request('/api/unpublish',{slug:info.slug,editToken:info.editToken}),context)).status,200);
    assert.equal(deletes,1);
  }finally{globalThis.fetch=savedFetch;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv);}
});

test('anonymous audio uploads require a challenge and a private per-file key on every chunk',async()=>{
  const savedEnv={...process.env},savedFetch=globalThis.fetch;
  const values=new Map();
  const store={get:async key=>values.get(key)||null,setJSON:async(k,v)=>values.set(k,v),set:async(k,v)=>values.set(k,v)};
  try{
    process.env.URL=origin;process.env.SITE_NAME='bultenoku';process.env.ENABLE_ANONYMOUS_PUBLISHING='true';process.env.TURNSTILE_SECRET_KEY='test-only';
    globalThis.fetch=async()=>Response.json({success:true,hostname:'bultenoku.netlify.app'});
    const route=load('netlify/functions/newsletter-audio.ts',{'./newsletter-publication-store':{mediaStore:()=>store,checkMediaUploadQuota:async()=>true}}).default;
    const context={params:{}};
    const key='K'.repeat(43),headers={'x-audio-upload-key':key};
    const start={action:'start',name:'test.wav',mime:'audio/wav',size:16};
    assert.equal((await route(request('/api/audio',start),context)).status,403);
    assert.equal((await route(request('/api/audio',start,{...headers,'x-turnstile-token':''}),context)).status,403);
    assert.equal((await route(request('/api/audio',{...start,size:60*1024*1024+1},headers),context)).status,413);
    const response=await route(request('/api/audio',start,headers),context);assert.equal(response.status,201);
    const {id}=await response.json();
    const chunk={action:'chunk',id,index:0,base64:Buffer.alloc(16).toString('base64')};
    assert.equal((await route(request('/api/audio',chunk,{'x-audio-upload-key':'L'.repeat(43)}),context)).status,403);
    assert.equal((await route(request('/api/audio',chunk,headers),context)).status,200);
    assert.equal((await route(request('/api/audio',{action:'finish',id},headers),context)).status,201);
    assert.equal((await route(new Request(origin+'/audio/'+id),{params:{asset:id}})).status,200);
  }finally{globalThis.fetch=savedFetch;for(const k of Object.keys(process.env))if(!(k in savedEnv))delete process.env[k];Object.assign(process.env,savedEnv);}
});
