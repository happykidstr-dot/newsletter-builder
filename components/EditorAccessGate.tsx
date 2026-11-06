'use client';
import React from 'react';
import {AccountAction} from './AccountAction';
import {browserAuthConfigured,createBrowserSupabaseClient} from '@/lib/supabase/client';

type AccessStatus='loading'|'allowed'|'signin'|'denied'|'setup'|'error';
/** Do not mount the editor or load its local drafts until access is approved by the server. */
export function EditorAccessGate({children}:{children:React.ReactNode}){
  const [status,setStatus]=React.useState<AccessStatus>('loading');
  const [message,setMessage]=React.useState('');

  React.useEffect(()=>{
    let active=true;
    let revision=0;
    const refresh=async()=>{
      const current=++revision;
      try{
        const response=await fetch('/api/editor-access',{cache:'no-store'});
        if(!active||current!==revision)return;
        if(response.ok){setStatus('allowed');setMessage('');return;}
        const payload=await response.json().catch(()=>({}));
        setMessage(typeof payload.error==='string'?payload.error:'İzin kontrolü başarısız.');
        setStatus(response.status===401?'signin':response.status===403?'denied':response.status===503?'setup':'error');
      }catch{
        if(active&&current===revision){
          setStatus('error');setMessage('İzin denetimine ulaşılamadı. Sayfayı yeniden yükleyin.');
        }
      }
    };
    void refresh();
    if(!browserAuthConfigured())return ()=>{active=false;};
    const client=createBrowserSupabaseClient();
    const {data:{subscription}}=client.auth.onAuthStateChange(()=>{
      // Run after the auth listener unlocks, not within the listener itself.
      Promise.resolve().then(()=>{if(active)void refresh();});
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);

  if(status==='allowed')return <>{children}</>;
  return <main className="bulten-private-gate">
    <section className="bulten-private-panel" aria-busy={status==='loading'}>
      <div className="bulten-private-mark" aria-hidden="true">✉</div>
      <h1>BÜLTEN READ</h1>
      <p className="bulten-private-intro">Project Factory · Özel bülten yönetim alanı</p>
      {status==='loading'
        ? <p role="status">Yayıncı yetkisi kontrol ediliyor…</p>
        : status==='signin'
        ? <p>Bu editöre erişebilmek için yetkili Google hesabınızla giriş yapın.</p>
        : status==='denied'
        ? <p role="alert">Bu hesap için bülten hazırlama veya yayımlama yetkisi verilmemiştir.</p>
        : status==='setup'
        ? <p role="alert">Yayıncı doğrulaması yapılandırılmadığı için editör güvenlik amacıyla kapalıdır.</p>
        : <p role="alert">Yetki kontrolü gerçekleştirilemedi.</p>
      }
      {status!=='loading'&&<div className="bulten-private-account"><AccountAction/></div>}
      {status==='error'&&<button type="button" className="bulten-auth-submit" onClick={()=>window.location.reload()}>Yeniden dene</button>}
      <p className="bulten-private-note">Yalnızca iki onaylı hesap bülten oluşturabilir. Yayımlanmış bültenler, kendilerine verilen bağlantı üzerinden herkes tarafından okunabilir.</p>
      <a href="https://bultenoku.netlify.app" rel="home">BÜLTEN READ ana sayfası</a>
      {status==='setup'&&<small>Yönetici: Supabase URL ve publishable key değerlerini Netlify ortamına ekleyin.</small>}
      {message&&status!=='signin'&&status!=='denied'&&status!=='setup'&&status!=='loading'&&<small role="alert">{message}</small>}
    </section>
  </main>;
}
