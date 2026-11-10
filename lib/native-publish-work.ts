import {sha256} from '@noble/hashes/sha256';

/** A bounded, yielding computation; it is an abuse cost, not a human CAPTCHA. */
export async function nativeWriteHeaders(path:string):Promise<Record<string,string>>{
  const clientKey=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const response=await fetch('/api/publish-challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,clientKey})});
  const value=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(value.error||'Yayın doğrulaması başlatılamadı.');
  if(typeof value.ticket!=='string'||value.ticket.length>1800||value.bits!==18)throw Error('Geçersiz doğrulama yanıtı.');
  const encoder=new TextEncoder(),base=sha256.create().update(encoder.encode(value.ticket+'.'));
  const started=Date.now();
  for(let i=0;i<20_000_000;i++){
    const hash=base.clone().update(encoder.encode(String(i))).digest();
    if(hash[0]===0&&hash[1]===0&&hash[2]<64)return {'X-Bulten-Proof':value.ticket,'X-Bulten-Work':String(i),'X-Bulten-Client-Key':clientKey};
    if(i%2048===0){
      if(Date.now()-started>45_000)throw Error('Doğrulama zaman aşımına uğradı. Yeniden deneyin.');
      await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
  }
  throw Error('Doğrulama tamamlanamadı. Yeniden deneyin.');
}
