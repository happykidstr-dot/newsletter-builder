'use client';
import React from 'react';
import {SignInButton,SignUpButton,UserButton,useUser} from '@clerk/nextjs';

function SignedInAccount(){
  const {isSignedIn,isLoaded}=useUser();
  const [privacyStatus,setPrivacyStatus]=React.useState('');
  async function exportPersonalData(){
    setPrivacyStatus('Veriler hazırlanıyor…');
    try{
      const response=await fetch('/api/account/privacy',{cache:'no-store'});
      if(!response.ok)throw new Error((await response.json()).error||'Veri dışa aktarılamadı.');
      const blob=await response.blob(),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='bulten-read-kisisel-veriler.json';
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setPrivacyStatus('Veri dosyanız indirildi.');
    }catch(error){setPrivacyStatus(error instanceof Error?error.message:'Veriler alınamadı.');}
  }
  async function erasePersonalData(){
    if(window.prompt('Hesabınızdaki ve bu tarayıcıdaki kayıtlı listeler, taslaklar ve analitik veriler silinecek. Yayımlanmış bültenlerin bağlantıları ayrıca Yayından Kaldır ile kapatılmalıdır. Onaylamak için SİL yazın:')!=='SİL')return;
    setPrivacyStatus('Veriler siliniyor…');
    try{
      const response=await fetch('/api/account/privacy',{
        method:'DELETE',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({confirmation:'DELETE-MY-DATA'}),
      });
      if(!response.ok)throw new Error((await response.json()).error||'Silme başarısız.');
      for(const key of ['bulten_saved_newsletters_v2','bulten_draft_v1','bulten_mailing_lists','bulten_published_media_cache_v1']){
        try{window.localStorage.removeItem(key);}catch{}
      }
      setPrivacyStatus('Kişisel veriler silindi. Yayınlanmış bültenleri ayrıca Yayından Kaldır ile kapatın.');
      window.location.reload();
    }catch(error){setPrivacyStatus(error instanceof Error?error.message:'Silme işlemi tamamlanamadı.');}
  }
  if(!isLoaded)return <span style={{fontSize:12,color:'#64748b'}}>Hesap yükleniyor…</span>;
  if(isSignedIn)return <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
    <span style={{fontSize:12,fontWeight:750,color:'#155e75'}}>Hesabım</span>
    <UserButton/>
    <button type="button" onClick={exportPersonalData} title="Hesabınızdaki kişisel verileri JSON olarak indir"
      style={{fontSize:11,border:'1px solid #cbd5e1',borderRadius:7,padding:'6px 9px',background:'#fff',color:'#334155',cursor:'pointer'}}>Verilerim</button>
    <button type="button" onClick={erasePersonalData} title="Hesaba ait verileri kalıcı silme isteği"
      style={{fontSize:11,border:'1px solid #fecdd3',borderRadius:7,padding:'6px 9px',background:'#fff1f2',color:'#9f1239',cursor:'pointer'}}>Verilerimi Sil</button>
    {privacyStatus&&<span role="status" style={{fontSize:10,color:'#475569',maxWidth:210}}>{privacyStatus}</span>}
  </div>;
  return <div style={{display:'flex',alignItems:'center',gap:5}}>
    <SignInButton mode="modal"><button type="button" aria-label="Hesaba giriş yap"
      style={{padding:'8px 11px',fontSize:12,fontWeight:800,borderRadius:7,color:'#155e75',
        border:'1px solid #67e8f9',background:'#ecfeff',cursor:'pointer'}}>Giriş Yap</button></SignInButton>
    <SignUpButton mode="modal"><button type="button" aria-label="Hesap oluştur"
      style={{padding:'8px 10px',fontSize:12,fontWeight:700,borderRadius:7,color:'#334155',
        border:'1px solid #cbd5e1',background:'#fff',cursor:'pointer'}}>Kayıt Ol</button></SignUpButton>
  </div>;
}
export function AccountAction(){
  if(!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)return <span
    role="status" title="Hesap sistemi henüz yapılandırılmadı. Yönetici Netlify'de Clerk anahtarlarını tanımlamalı."
    style={{fontSize:11,color:'#64748b',padding:'6px 8px',border:'1px dashed #cbd5e1',borderRadius:7}}>
    🔒 Hesap ayarı gerekli
  </span>;
  return <SignedInAccount/>;
}
