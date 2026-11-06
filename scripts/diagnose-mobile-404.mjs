// Read-only checks of production Netlify routing from the GitHub Actions runner.
// Compare browser user agents, query strings, trailing slash and app endpoints.
const base='https://bultenoku.netlify.app';
const browsers={
  'desktop-chrome':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'android-chrome':'Mozilla/5.0 (Linux; Android 16; 25040RP0AG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  'chatgpt-webview':'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 ChatGPT/1.2026.300',
  'bot':'BultenRead-Deploy-Diagnostics/2026-11-06',
};
const urls=['/','/?diagnostic='+Date.now(),'/index.html','/auth/callback','/api/editor-access','/audio/invalid'];
for(const [name,userAgent] of Object.entries(browsers)){
  for(const path of urls){
    try{
      const res=await fetch(base+path,{
        redirect:'manual',
        headers:{'User-Agent':userAgent,'Cache-Control':'no-cache','Pragma':'no-cache','Accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'},
        signal:AbortSignal.timeout(15000),
      });
      const body=await res.text();
      const entry={
        variant:name,path,status:res.status,location:res.headers.get('location'),
        server:res.headers.get('server'),cache:res.headers.get('cache-control'),
        nfId:res.headers.get('x-nf-request-id'),
        contentType:res.headers.get('content-type'),
        title:body.match(/<title>([\s\S]{0,130}?)<\/title>/i)?.[1]||null,
        containsGate:body.includes('bulten-private-gate'),
        snippet:body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,150),
      };
      console.log(JSON.stringify(entry));
    }catch(error){console.log(JSON.stringify({variant:name,path,error:String(error)}));}
  }
}
