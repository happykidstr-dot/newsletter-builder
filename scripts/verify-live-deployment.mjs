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
  // Previous live versions also served /api/publish. Distinguish the NEW
  // Edit/Publish/Update interface from the old deployment before reporting success.
  if(!homepage.includes('Düzenle') || !homepage.includes('Yayınla')){
    return {ok:false,reason:'Live editor still lacks Smore-style Düzenle / Yayınla controls'};
  }
  // Phase 2 acceptance marker: ensure production is no longer serving the
  // pre-Phase-2 editor, which lacked a responsive mobile panel navigator.
  if(!homepage.includes('bulten-mobile-nav') || !homepage.includes('Mobil editör panelleri')){
    return {ok:false,reason:'Phase 2 mobile editor is not yet present in the live homepage'};
  }
  // Phase 3: the live site must expose genuine publication preview and
  // progressive disclosure, not merely pass the old Phase 2 health check.
  if(!homepage.includes('bulten-palette-mode')||
     !homepage.includes('Yayın Önizleme')||
     !homepage.includes('advanced-tools-toggle')){
    return {ok:false,reason:'Phase 3 editor controls are missing from Netlify production'};
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
  if(![302,303,307,308].includes(callback.status)||
     callbackTarget.origin!==base||
     callbackTarget.searchParams.get('auth_error')!=='callback')
    return {ok:false,reason:'Supabase Auth PKCE callback is not deployed yet ('+callback.status+')'};
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
for(let n=1;n<=18;n++){
  try{
    const result=await check();
    console.log('Production check #'+n+': '+result.reason);
    if(result.ok){
      console.log('PASS production deployment: '+base);
      process.exit(0);
    }
    last=result.reason;
  }catch(e){last=String(e);console.error('Production check #'+n+': '+last);}
  if(n<18)await sleep(10000);
}
console.error('Production was not verifiably deployed: '+last);
process.exit(1);
