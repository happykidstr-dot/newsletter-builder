'use client';
import React from 'react';
import type {User} from '@supabase/supabase-js';
import {browserAuthConfigured,createBrowserSupabaseClient} from '@/lib/supabase/client';
import {clearLocalNewsletterData} from '@/lib/local-newsletter-db';

type Mode='login'|'signup'|'forgot';
const buttonStyle:React.CSSProperties={
  padding:'8px 11px',fontSize:12,fontWeight:800,borderRadius:7,
  border:'1px solid #67e8f9',color:'#155e75',background:'#ecfeff',cursor:'pointer',
};

function ConfiguredAccount(){
  const client=React.useMemo(()=>createBrowserSupabaseClient(),[]);
  const [user,setUser]=React.useState<User|null>(null);
  const [loaded,setLoaded]=React.useState(false);
  const [open,setOpen]=React.useState(false);
  const [mode,setMode]=React.useState<Mode>('login');
  const [email,setEmail]=React.useState('');
  const [password,setPassword]=React.useState('');
  const [busy,setBusy]=React.useState(false);
  const [message,setMessage]=React.useState('');
  const [privacyStatus,setPrivacyStatus]=React.useState('');
  const modalRef=React.useRef<HTMLElement>(null);

  React.useEffect(()=>{
    let live=true;
    client.auth.getUser().then(({data})=>{
      if(live){setUser(data.user||null);setLoaded(true);}
    }).catch(()=>{if(live){setUser(null);setLoaded(true);}});
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
      if(live){setUser(session?.user||null);setLoaded(true);}
    });
    return ()=>{live=false;subscription.unsubscribe();};
  },[client]);

  React.useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const raf=requestAnimationFrame(()=>modalRef.current?.querySelector<HTMLInputElement>('input')?.focus());
    return ()=>{cancelAnimationFrame(raf);previous?.focus();};
  },[open,mode]);

  React.useEffect(()=>{
    if(new URLSearchParams(window.location.search).get('auth_error')==='callback'){
      setMessage('Giriş bağlantısı doğrulanamadı veya süresi doldu. Yeniden deneyin.');
      setOpen(true);
      window.history.replaceState(null,'',window.location.pathname);
    }
  },[]);

  const show=(next:Mode)=>{setMode(next);setMessage('');setPassword('');setOpen(true);};
  const doGoogle=async()=>{
    setBusy(true);setMessage('');
    try{
      const redirectTo=new URL('/auth/callback',window.location.origin).toString();
      const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
      if(error)throw error;
    }catch(error){
      setMessage(error instanceof Error?error.message:'Google ile giriş başlatılamadı.');
      setBusy(false);
    }
  };
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();setBusy(true);setMessage('');
    try{
      const address=email.trim().toLowerCase();
      if(!address||!address.includes('@'))throw new Error('Geçerli e-posta adresi girin.');
      if(mode==='forgot'){
        const callback=new URL('/auth/callback',window.location.origin);
        callback.searchParams.set('next','/auth/reset-password');
        const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo:callback.toString()});
        if(error)throw error;
        setMessage('Şifre sıfırlama bağlantısı gönderilebildiyse e-postanızı kontrol edin. Supabase SMTP kurulumu gerekebilir.');
      }else if(mode==='signup'){
        if(password.length<8)throw new Error('Şifre en az 8 karakter olmalıdır.');
        const {data,error}=await client.auth.signUp({
          email:address,password,
          options:{emailRedirectTo:new URL('/auth/callback',window.location.origin).toString()},
        });
        if(error)throw error;
        if(data.session){setOpen(false);setPassword('');}
        else setMessage('Hesap isteği alındı. Doğrulama e-postası gereklidir; ücretsiz varsayılan e-posta hizmeti kısıtlıdır.');
      }else{
        const {error}=await client.auth.signInWithPassword({email:address,password});
        if(error)throw error;
        setOpen(false);setPassword('');
      }
    }catch(error){setMessage(error instanceof Error?error.message:'Giriş işlemi başarısız.');}
    finally{setBusy(false);}
  };
  const logout=async()=>{
    setBusy(true);setPrivacyStatus('');
    try{
      const {error}=await client.auth.signOut();
      if(error)throw error;
      setUser(null);
      setPrivacyStatus('Oturum kapatıldı. Bu cihazdaki kayıtlı bültenler korunuyor.');
    }catch(error){setPrivacyStatus(error instanceof Error?error.message:'Çıkış yapılamadı.');}
    finally{setBusy(false);}
  };
  const exportPersonalData=async()=>{
    setPrivacyStatus('Veriler hazırlanıyor…');
    try{
      const response=await fetch('/api/account/privacy',{cache:'no-store'});
      if(!response.ok)throw new Error((await response.json()).error||'Veri dışa aktarılamadı.');
      const blob=await response.blob(),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='bulten-read-kisisel-veriler.json';
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setPrivacyStatus('Kişisel verileriniz indirildi.');
    }catch(error){setPrivacyStatus(error instanceof Error?error.message:'Veriler alınamadı.');}
  };
  const erasePersonalData=async()=>{
    const confirmation=window.prompt(
      'Hesabınıza ait bülten, liste ve analitik kayıtları ile bu cihazdaki taslaklar silinecek. '+
      'Yayımlanmış bültenleri ayrıca Yayından Kaldır ile kapatmanız gerekir. Onaylamak için SİL yazın:'
    );
    if(confirmation!=='SİL')return;
    setPrivacyStatus('Veriler siliniyor…');
    try{
      const response=await fetch('/api/account/privacy',{
        method:'DELETE',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({confirmation:'DELETE-MY-DATA'}),
      });
      if(!response.ok)throw new Error((await response.json()).error||'Silme başarısız.');
      await clearLocalNewsletterData();
      for(const key of ['bulten_saved_newsletters_v2','bulten_draft_v1','bulten_mailing_lists','bulten_published_media_cache_v1']){
        try{window.localStorage.removeItem(key);}catch{}
      }
      setPrivacyStatus('Veriler silindi; yayımlanmış bültenler ayrıca yayından kaldırılmalıdır.');
      window.location.reload();
    }catch(error){setPrivacyStatus(error instanceof Error?error.message:'Silme işlemi tamamlanamadı.');}
  };

  if(!loaded)return <span role="status" style={{fontSize:12,color:'#64748b'}}>Hesap yükleniyor…</span>;
  return <>
    {user ? <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
      <span title={user.email||''} style={{fontSize:12,fontWeight:750,color:'#155e75',maxWidth:185,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {user.email||'Hesabım'}
      </span>
      <button type="button" onClick={logout} disabled={busy} style={buttonStyle}>Çıkış</button>
      <button type="button" onClick={exportPersonalData} title="Kişisel verileri JSON olarak indir"
        style={{...buttonStyle,borderColor:'#cbd5e1',background:'#fff',color:'#334155'}}>Verilerim</button>
      <button type="button" onClick={erasePersonalData} title="Hesap verilerini sil"
        style={{...buttonStyle,borderColor:'#fecdd3',background:'#fff1f2',color:'#9f1239'}}>Verilerimi Sil</button>
    </div> : <div style={{display:'flex',alignItems:'center',gap:5}}>
      <button type="button" aria-label="Hesaba giriş yap" onClick={()=>show('login')} style={buttonStyle}>Giriş Yap</button>
      <span style={{fontSize:11,color:'#64748b',maxWidth:140}}>Yalnızca izinli yayıncılar</span>
    </div>}
    {privacyStatus&&<span role="status" style={{fontSize:11,color:'#334155',maxWidth:240}}>{privacyStatus}</span>}
    {open&&<div className="bulten-auth-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOpen(false);}}>
      <section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="bulten-auth-title"
        className="bulten-auth-modal" onKeyDown={e=>{if(e.key==='Escape'&&!busy)setOpen(false);}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
          <div><strong id="bulten-auth-title" style={{fontSize:19,color:'#15283c'}}>
            {mode==='login'?'BÜLTEN READ · Giriş':mode==='signup'?'BÜLTEN READ · Kayıt':'BÜLTEN READ · Şifremi Unuttum'}
          </strong><p style={{fontSize:12,color:'#536579',margin:'7px 0 0'}}>Güvenli hesap sistemi: Supabase Auth</p></div>
          <button type="button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Giriş penceresini kapat"
            className="bulten-auth-close">✕</button>
        </div>
        {mode!=='forgot'&&<button type="button" onClick={doGoogle} disabled={busy} className="bulten-auth-google">
          <span aria-hidden="true">G</span> Google ile {mode==='signup'?'Kayıt Ol':'Giriş Yap'}
        </button>}
        <form onSubmit={submit} style={{display:'grid',gap:10}}>
          <label htmlFor="bulten-auth-email" style={{fontWeight:750,fontSize:12,color:'#334155'}}>E-posta adresi</label>
          <input id="bulten-auth-email" type="email" autoComplete="email" required value={email}
            onChange={e=>setEmail(e.target.value)} placeholder="ornek@kurum.org"
            className="bulten-auth-input"/>
          {mode!=='forgot'&&<>
            <label htmlFor="bulten-auth-password" style={{fontWeight:750,fontSize:12,color:'#334155'}}>Şifre</label>
            <input id="bulten-auth-password" type="password" required value={password}
              minLength={mode==='signup'?8:1}
              autoComplete={mode==='signup'?'new-password':'current-password'}
              onChange={e=>setPassword(e.target.value)} className="bulten-auth-input"/>
          </>}
          <button type="submit" disabled={busy} className="bulten-auth-submit">
            {busy?'İşleniyor…':mode==='login'?'Giriş Yap':mode==='signup'?'Kayıt Ol':'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>
        {message&&<p role="status" className="bulten-auth-notice">{message}</p>}
        {mode==='signup'&&<p className="bulten-auth-helper">
          E-posta ile kayıt ve şifre sıfırlama için Supabase'in e-posta gönderim kuralları geçerlidir.
          Google girişi için ayrıca e-posta gönderimi gerekmez.
        </p>}
        <div className="bulten-auth-links">
          {mode!=='login'&&<button type="button" onClick={()=>show('login')}>Giriş Yap</button>}

          {mode!=='forgot'&&<button type="button" onClick={()=>show('forgot')}>Şifremi Unuttum</button>}
        </div>
      </section>
    </div>}
  </>;
}

export function AccountAction(){
  if(!browserAuthConfigured())return <span
    role="status" title="Supabase URL ve publishable key Netlify ortam değişkenlerine eklenmeli."
    style={{fontSize:11,color:'#64748b',padding:'6px 8px',border:'1px dashed #cbd5e1',borderRadius:7}}>
    🔒 Hesap ayarı gerekli
  </span>;
  return <ConfiguredAccount/>;
}
