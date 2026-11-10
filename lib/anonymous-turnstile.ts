/* Request a fresh, single-use Turnstile challenge for every public write. */
type TurnstileApi={
 render:(container:HTMLElement,options:Record<string,unknown>)=>string;
 execute:(widgetId:string)=>void;
 remove:(widgetId:string)=>void;
};
declare global {interface Window {turnstile?:TurnstileApi}}
let scriptPromise:Promise<void>|undefined;
function loadScript():Promise<void>{
  if(window.turnstile)return Promise.resolve();
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error('Güvenlik doğrulaması yüklenemedi.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export async function anonymousWriteHeaders():Promise<Record<string,string>>{
  const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if(!sitekey)throw new Error('Yayınlama güvenlik ayarları henüz tamamlanmadı.');
  await loadScript();
  const loadedApi=window.turnstile;
  if(!loadedApi)throw new Error('Güvenlik doğrulaması kullanılamıyor.');
  const api:TurnstileApi=loadedApi;
  const container=document.createElement('div');
  container.style.cssText='position:fixed;bottom:12px;right:12px;z-index:2147483647';
  document.body.appendChild(container);
  return new Promise((resolve,reject)=>{
    let finished=false;let widgetId='';
    const timeout=window.setTimeout(()=>finish(new Error('Güvenlik doğrulaması zaman aşımına uğradı.')),120000);
    function finish(value:string|Error){
      if(finished)return;finished=true;window.clearTimeout(timeout);
      try{if(widgetId)api.remove(widgetId);}catch{}
      container.remove();
      if(value instanceof Error)reject(value);else resolve({'X-Turnstile-Token':value});
    }
    try{
      widgetId=api.render(container,{
        sitekey,execution:'execute',appearance:'interaction-only',
        callback:(token:string)=>finish(token),
        'error-callback':()=>finish(new Error('Güvenlik doğrulaması başarısız oldu.')),
        'expired-callback':()=>finish(new Error('Güvenlik doğrulaması süresi doldu.')),
      });
      api.execute(widgetId);
    }catch{finish(new Error('Güvenlik doğrulaması başlatılamadı.'));}
  });
}
