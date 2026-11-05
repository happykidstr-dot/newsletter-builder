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
  return {ok:publish.status===403,reason:'homepage='+home.status+' publish_cross_site='+publish.status+' response='+text.slice(0,160)};
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
