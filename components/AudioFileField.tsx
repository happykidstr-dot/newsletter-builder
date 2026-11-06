'use client';
import React from 'react';
import {AUDIO_FILE_ACCEPT,uploadAudioFile} from '@/lib/upload-newsletter-audio';
import {safeReaderLinkUrl} from '@/lib/reader-social-share';

export function AudioFileField({value,name,playback,onFileReady}:{
  value:string;name:string;playback:string;
  onFileReady:(data:{url:string;name:string;playback:boolean})=>void;
}){
  const fileRef=React.useRef<HTMLInputElement>(null);
  const [busy,setBusy]=React.useState(false);
  const [progress,setProgress]=React.useState('');
  const [error,setError]=React.useState('');
  const safeUrl=value?safeReaderLinkUrl(value):'';
  const valid=Boolean(safeUrl&&safeUrl!=='#');
  const choose=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    setBusy(true);setError('');setProgress('Hazırlanıyor…');
    try{
      const uploaded=await uploadAudioFile(file,(completed,total)=>{
        setProgress('Ses yükleniyor: '+Math.round(completed/total*100)+'%');
      });
      onFileReady(uploaded);
      setProgress('Ses dosyası yüklendi.');
    }catch(e){
      setError(e instanceof Error?e.message:'Ses yüklenemedi.');
      setProgress('');
    }finally{
      setBusy(false);
      event.target.value='';
    }
  };
  return <div className="bulten-audio-uploader">
    <input ref={fileRef} data-testid="audio-file-input" type="file"
      accept={AUDIO_FILE_ACCEPT} aria-label="Ses dosyası seç"
      onChange={choose} disabled={busy}
      style={{position:'absolute',width:1,height:1,opacity:0,overflow:'hidden'}}/>
    <button type="button" data-testid="audio-upload-button"
      onClick={()=>fileRef.current?.click()} disabled={busy}
      className="bulten-action-button">
      {busy?'⏳ Yükleniyor…':'🔊 Ses dosyası seç'}
    </button>
    <p style={{margin:'7px 0',color:'#64748b',fontSize:11,lineHeight:1.45}}>
      MP3, WAV, M4A, AAC, OGG, FLAC, OPUS, WMA, AIFF ve diğer ses türleri · en fazla 60 MB.
      Tarayıcının desteklemediği türler indirme bağlantısıyla sunulur.
    </p>
    {progress&&<p role="status" style={{fontSize:12,color:'#0f766e'}}>{progress}</p>}
    {error&&<p role="alert" style={{fontSize:12,color:'#b91c1c'}}>{error}</p>}
    {valid&&<div className="bulten-audio-current">
      <strong style={{fontSize:12}}>🔊 {name||'Ses kaydı'}</strong>
      {playback!=='false'&&<audio controls preload="metadata"
        src={safeUrl} style={{width:'100%',maxWidth:450,margin:'8px 0'}} />}
      <a href={safeUrl} download={name||undefined} target="_blank" rel="noopener noreferrer"
        style={{fontSize:12,color:'#0e7490'}}>Ses dosyasını aç / indir</a>
    </div>}
  </div>;
}
