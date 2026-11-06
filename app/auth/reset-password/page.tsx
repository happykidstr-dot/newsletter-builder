'use client';
import React from 'react';
import {browserAuthConfigured,createBrowserSupabaseClient} from '@/lib/supabase/client';

export default function PasswordResetPage(){
  const [password,setPassword]=React.useState('');
  const [message,setMessage]=React.useState('');
  const [pending,setPending]=React.useState(false);
  const configured=browserAuthConfigured();
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!configured)return;
    setPending(true);setMessage('');
    try{
      const client=createBrowserSupabaseClient();
      const {data:{user}}=await client.auth.getUser();
      if(!user)throw new Error('Bağlantı süresi dolmuş. Yeni bir şifre sıfırlama bağlantısı isteyin.');
      const {error}=await client.auth.updateUser({password});
      if(error)throw error;
      setPassword('');
      setMessage('Şifreniz yenilendi. BÜLTEN READ’e dönebilirsiniz.');
    }catch(e){setMessage(e instanceof Error?e.message:'Şifre yenilenemedi.');}
    finally{setPending(false);}
  };
  return <main style={{fontFamily:'Inter,system-ui,sans-serif',minHeight:'100dvh',background:'#f1f5f9',display:'grid',placeItems:'center',padding:20}}>
    <form onSubmit={submit} style={{background:'#fff',border:'1px solid #cbd5e1',padding:30,borderRadius:16,width:'min(440px,100%)',display:'grid',gap:14}}>
      <h1 style={{fontSize:23}}>BÜLTEN READ · Yeni Şifre</h1>
      <label htmlFor="new-password">Yeni şifre (en az 8 karakter)</label>
      <input id="new-password" type="password" value={password} minLength={8} required autoComplete="new-password"
        onChange={e=>setPassword(e.target.value)}
        style={{border:'1px solid #94a3b8',padding:12,borderRadius:8,fontSize:16}}/>
      <button type="submit" disabled={pending||!configured}
        style={{border:0,background:'#0e7490',color:'#fff',padding:13,borderRadius:8,cursor:'pointer',fontWeight:800}}>
        {pending?'Kaydediliyor…':'Şifremi Yenile'}
      </button>
      {message&&<p role="status" style={{color:'#334155'}}>{message}</p>}
      <a href="/" style={{color:'#0e7490'}}>← Editöre dön</a>
    </form>
  </main>;
}
