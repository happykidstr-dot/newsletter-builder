'use client';
import {SignInButton,SignUpButton,UserButton,useUser} from '@clerk/nextjs';

function SignedInAccount(){
  const {isSignedIn,isLoaded}=useUser();
  if(!isLoaded)return <span style={{fontSize:12,color:'#64748b'}}>Hesap yükleniyor…</span>;
  if(isSignedIn)return <div style={{display:'flex',alignItems:'center',gap:8}}>
    <span style={{fontSize:12,fontWeight:750,color:'#155e75'}}>Hesabım</span>
    <UserButton/>
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
