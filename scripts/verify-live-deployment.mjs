// Run from GitHub Actions to verify the latest publicly deployed BÜLTEN READ.
// This is read-only to user data: malformed cross-origin publish requests never
// create newsletters, even when publication is working.
const base='https://bultenoku.netlify.app';
const sleep=(n)=>new Promise(r=>setTimeout(r,n));

async function check(){
  const home=await fetch(base+'/',{cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'user-agent':'BultenReadDeploymentQA/1.0'}});
  const homepage=await home.text();
  if(home.status!==200)return {ok:false,reason:'Homepage HTTP '+home.status};
  if(!homepage.includes('BÜLTEN') && !homepage.includes('READ'))return {ok:false,reason:'Homepage did not contain BÜLTEN READ branding'};
  // Old static bookmarks and embedded browsers sometimes open index.html.
  // This exact path formerly returned Next.js's generic 404 page.
  const legacy=await fetch(base+'/index.html',{
    redirect:'manual',
    headers:{'User-Agent':'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'},
    cache:'no-store',signal:AbortSignal.timeout(20000),
  });
  if(![301,302,307,308].includes(legacy.status))
    return {ok:false,reason:'Legacy index.html still returns HTTP '+legacy.status+' instead of redirect'};
  const target=new URL(legacy.headers.get('location')||'',base);
  if(target.origin!==base||target.pathname!=='/')
    return {ok:false,reason:'Legacy index.html redirects to an unexpected destination'};

  // Default local editor is passwordless and must be visible even when
  // Supabase Auth has not yet been configured. Cloud operations remain locked.
  if(!homepage.includes('bulten-editor-layout')||
     !homepage.includes('Şifresiz')||
     homepage.includes('bulten-private-gate')){
    return {ok:false,reason:'Passwordless local editor is not deployed'};
  }
  // Supabase Auth rollout marker: before this migration the callback route
  // returned 404. This checks deploy presence without requiring real login.
  if(!homepage.includes('BÜLTEN READ | Project Factory'))
    return {ok:false,reason:'Supabase Auth build metadata is not live yet'};
  const callback=await fetch(base+'/auth/callback',{
    redirect:'manual',signal:AbortSignal.timeout(20000),
  });
  let callbackTarget;
  try{callbackTarget=new URL(callback.headers.get('location')||'',base);}
  catch{return {ok:false,reason:'Auth callback returned invalid redirect'};}
  // Netlify may report its immutable deploy alias (or main--bultenoku)
  // as the request origin inside a production Next.js Function. Both are
  // dedicated hostnames of this one Netlify project, not arbitrary redirects.
  const sameNetlifySite=callbackTarget.origin===base||
    /^[a-z0-9-]+--bultenoku\.netlify\.app$/i.test(callbackTarget.hostname);
  if(![302,303,307,308].includes(callback.status)||
     callbackTarget.protocol!=='https:'||
     !sameNetlifySite||
     callbackTarget.pathname!=='/'||
     callbackTarget.searchParams.get('auth_error')!=='callback')
    return {ok:false,reason:'Supabase Auth callback redirect mismatch: HTTP '+callback.status+
      ' target='+callbackTarget.origin+callbackTarget.pathname+callbackTarget.search};
  // Private editor is an enforced allowlisted workspace. Confirm deployment
  // before sending anonymous same-origin write probes to avoid the old version.
  const access=await fetch(base+'/api/editor-access',{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(![401,403,503].includes(access.status))
    return {ok:false,reason:'Anonymous editor access was granted: HTTP '+access.status};
  const deniedPublication=await fetch(base+'/api/publish',{
    method:'POST',headers:{Origin:base,'Content-Type':'application/json'},
    body:JSON.stringify({title:'Unauthorized QA probe',subtitle:'Access test',headerImgUrl:'',
      html:'<!doctype html><html lang="tr"><body><h1>Denied</h1></body></html>'}),
    signal:AbortSignal.timeout(20000),
  });
  if(![401,403,503].includes(deniedPublication.status))
    return {ok:false,reason:'Anonymous publication was not blocked: HTTP '+deniedPublication.status};
  const deniedMedia=await fetch(base+'/api/media',{
    method:'POST',headers:{Origin:base,'Content-Type':'application/json'},
    body:JSON.stringify({mime:'image/png',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2VQAAAABJRU5ErkJggg=='}),
    signal:AbortSignal.timeout(20000),
  });
  if(![401,403,503].includes(deniedMedia.status))
    return {ok:false,reason:'Anonymous media upload was not blocked: HTTP '+deniedMedia.status};
  // Video posters use this same-origin route for PDF snapshots.
  // Require a real remote YouTube JPEG, not merely a locally mocked response.
  const poster=await fetch(base+'/api/video-thumbnail/dQw4w9WgXcQ',{
    cache:'no-store',signal:AbortSignal.timeout(20000),
  });
  if(poster.status!==200||!/^image\/jpe?g/i.test(poster.headers.get('content-type')||''))
    return {ok:false,reason:'YouTube video thumbnail proxy is not ready: HTTP '+poster.status};
  const jpeg=new Uint8Array(await poster.arrayBuffer());
  if(jpeg.length<100||jpeg[0]!==255||jpeg[1]!==216)
    return {ok:false,reason:'YouTube video poster endpoint returned invalid JPEG data'};
  const unsafeThumbnail=await fetch(base+'/api/video-thumbnail/invalid',{
    cache:'no-store',signal:AbortSignal.timeout(20000),
  });
  if(unsafeThumbnail.status!==400)
    return {ok:false,reason:'YouTube thumbnail proxy did not validate the video ID'};

  // Audio publisher endpoints must fail closed for anonymous users while the
  // public media route must validate IDs without requiring a login.
  const deniedAudio=await fetch(base+'/api/audio',{
    method:'POST',headers:{Origin:base,'Content-Type':'application/json'},
    body:JSON.stringify({action:'start',name:'sample.mp3',mime:'audio/mpeg',size:1280}),
    signal:AbortSignal.timeout(20000),
  });
  if(![401,403,503].includes(deniedAudio.status))
    return {ok:false,reason:'Anonymous audio upload unexpectedly allowed: '+deniedAudio.status};
  const missingAudio=await fetch(base+'/audio/not-a-valid-audio-id',{
    cache:'no-store',signal:AbortSignal.timeout(20000),
  });
  if(missingAudio.status!==404)
    return {ok:false,reason:'Public audio GET failed ID validation: '+missingAudio.status};

  // A live Netlify publication endpoint denies cross-site POST with 403.
  // Legacy versions responded 404 or redirected, so this tests new deployment.
  const publish=await fetch(base+'/api/publish',{
    method:'POST',
    redirect:'manual',
    headers:{Origin:'https://example.invalid','Content-Type':'application/json','user-agent':'BultenReadDeploymentQA/1.0'},
    body:'{}',
    signal:AbortSignal.timeout(20000),
  });
  const text=await publish.text();
  const analytics=await fetch(base+'/api/db/analytics',{signal:AbortSignal.timeout(20000)});
  const ai=await fetch(base+'/api/ai-generate',{
    method:'POST',headers:{Origin:base,'Content-Type':'application/json'},
    body:'{}',signal:AbortSignal.timeout(20000),
  });
  const forgedClick=await fetch(base+'/api/track/click?u=https%3A%2F%2Fexample.org',{
    redirect:'manual',signal:AbortSignal.timeout(20000),
  });
  const badUnsub=await fetch(base+'/api/unsubscribe?t=invalid',{
    redirect:'manual',signal:AbortSignal.timeout(20000),
  });
  const unpublishCross=await fetch(base+'/api/unpublish',{
    method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/json'},
    body:'{}',signal:AbortSignal.timeout(20000),
  });
  const statuses={publish:publish.status,analytics:analytics.status,ai:ai.status,
    forgedClick:forgedClick.status,badUnsub:badUnsub.status,unpublishCross:unpublishCross.status};
  const ok=publish.status===403&&[401,403,503].includes(analytics.status)&&
    [401,403,503].includes(ai.status)&&forgedClick.status===400&&
    badUnsub.status===400&&unpublishCross.status===403;
  return {ok,reason:'homepage='+home.status+' statuses='+JSON.stringify(statuses)+' response='+text.slice(0,80)};
}

let last='';
for(let n=1;n<=8;n++){
  try{
    const result=await check();
    console.log('Production check #'+n+': '+result.reason);
    if(result.ok){
      console.log('PASS production deployment: '+base);
      process.exit(0);
    }
    last=result.reason;
  }catch(e){last=String(e);console.error('Production check #'+n+': '+last);}
  if(n<8)await sleep(10000);
}
console.error('Production was not verifiably deployed: '+last);
process.exit(1);
