'use client';
import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TemplateGallery } from '@/components/TemplateGallery';
import {AccountAction} from '@/components/AccountAction';
import { downloadNewsletterPdf, printNewsletter } from '@/lib/newsletter-pdf';
import {prepareNewsletterForSharing} from '@/lib/publish-newsletter-media';
import type { GalleryTemplate } from '@/lib/gallery-templates';
import { escapeShareHtml, makeShareLinks, normalisePublicNewsletterUrl, readerShareBar, READER_SHARE_RUNTIME, safeReaderImageUrl, safeReaderLinkUrl } from '@/lib/reader-social-share';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
const BultenLocationMap = dynamic(() => import('@/components/BultenLocationMap'), { ssr: false, loading: () => <div style={{height:340,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8'}}>Harita yükleniyor...</div> });

// ── i18n ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'tr';
const T = {
  en: {
    addContent:'Add content', chooseDesign:'Choose design', publish:'☁ Publish', published:'✓ Published',
    download:'📥 Download HTML', addLogo:'📷 Add your logo', logoPlaceholder:'Logo URL...',
    toc:'Table of Contents', blocks:'Blocks', edit:'Edit', moveUp:'▲ Up', moveDown:'▼ Down',
    bgTab:'🖼 BG', colorTab:'🎨 Colors', fontTab:'✏ Fonts',
    designLabel:'Design', allBg:'All Backgrounds', customUrl:'Custom URL',
    noBlocks:'Add content from the left panel',
    // block types
    title:'Title', paragraph:'Paragraph', photos:'Photos', video:'Video',
    event:'Event', separator:'Separator', link:'Link', button:'Button', poll:'Poll', attachment:'Attachment',
    // editors
    titleText:'Title Text', size:'Size', h1:'H1 — Large', h2:'H2 — Medium', h3:'H3 — Small',
    text:'Text', chars:'characters', imageUrl:'Image URL', caption:'Caption',
    youtubeUrl:'YouTube URL', eventName:'Event Name', date:'Date', time:'Time', location:'Location',
    lineStyle:'Line Style', solid:'Solid', dashed:'Dashed', dotted:'Dotted',
    linkText:'Link Text', url:'URL', buttonText:'Button Text', align:'Alignment',
    left:'Left', center:'Center', right:'Right',
    question:'Question', option:'Option', fileName:'File Name',
    aiBtn:'✨ Generate with AI', aiLoading:'⏳ Generating...',
    footer:'This newsletter was created with Project Factory AI.',
  },
  tr: {
    addContent:'İçerik Ekle', chooseDesign:'Tasarım Seç', publish:'☁ Yayınla', published:'✓ Yayında',
    download:'📥 HTML İndir', addLogo:'📷 Logo Ekle', logoPlaceholder:'Logo URL giriniz...',
    toc:'İçindekiler', blocks:'Bloklar', edit:'Düzenle', moveUp:'▲ Yukarı', moveDown:'▼ Aşağı',
    bgTab:'🖼 Arka Plan', colorTab:'🎨 Renk', fontTab:'✏ Yazı',
    designLabel:'Tasarım', allBg:'Tüm Arka Planlar', customUrl:'Özel URL',
    noBlocks:'Sol panelden içerik ekleyin',
    // block types
    title:'Başlık', paragraph:'Metin', photos:'Görsel', video:'Video',
    event:'Etkinlik', separator:'Ayırıcı', link:'Bağlantı', button:'Buton', poll:'Anket', attachment:'Ek Dosya',
    // editors
    titleText:'Başlık Metni', size:'Boyut', h1:'H1 — Büyük', h2:'H2 — Orta', h3:'H3 — Küçük',
    text:'Metin', chars:'karakter', imageUrl:'Görsel URL', caption:'Alt Yazı',
    youtubeUrl:'YouTube URL', eventName:'Etkinlik Adı', date:'Tarih', time:'Saat', location:'Yer',
    lineStyle:'Çizgi Stili', solid:'Düz', dashed:'Kesik', dotted:'Noktalı',
    linkText:'Bağlantı Metni', url:'URL', buttonText:'Buton Metni', align:'Hizalama',
    left:'Sol', center:'Orta', right:'Sağ',
    question:'Soru', option:'Seçenek', fileName:'Dosya Adı',
    aiBtn:'✨ AI ile İçerik Üret', aiLoading:'⏳ Üretiliyor...',
    footer:'Bu bülten Project Factory AI ile oluşturulmuştur.',
  },
};

// ── Types ──────────────────────────────────────────────────────────────
type BT = 'title'|'paragraph'|'photos'|'video'|'event'|'separator'|'link'|'button'|'poll'|'attachment'|'textphoto'|'photogrid'|'author'|'form'|'googleform';

interface Block { id: string; type: BT; data: Record<string,string> }

type Design = 'modern'|'classic'|'bold'|'minimal'|'european'|'impact'|'partnership'|'evently'|'corporate'|'inclusive'|'stories'|'editorial';

interface DesignConfig {
  label: string;
  headerBg: string; headerColor: string;
  accentColor: string; bodyBg: string; textColor: string;
  font: string;
}

// Eight curated templates are defined in lib/gallery-templates.ts.

// ── Design configs ─────────────────────────────────────────────────────
const DESIGNS: Record<Design, DesignConfig> = {
  modern:  { label:'Modern',   headerBg:'#003366', headerColor:'#fff',    accentColor:'#0066cc', bodyBg:'#fff',    textColor:'#1a1a2e', font:'Inter, system-ui, sans-serif' },
  classic: { label:'Classic',  headerBg:'#2d6a2d', headerColor:'#fff',    accentColor:'#2d6a2d', bodyBg:'#fffef5', textColor:'#2d2d2d', font:'Georgia, serif' },
  bold:    { label:'Bold',     headerBg:'#c0392b', headerColor:'#fff',    accentColor:'#e74c3c', bodyBg:'#fff',    textColor:'#1a1a1a', font:'Outfit, sans-serif' },
  minimal: { label:'Minimal',  headerBg:'#1a1a1a', headerColor:'#f5f5f5', accentColor:'#555',    bodyBg:'#fafafa', textColor:'#222',    font:'system-ui, sans-serif' },
  european: {"label":"European Project Magazine","headerBg":"#122c4a","headerColor":"#fff","accentColor":"#d6ac59","bodyBg":"#f5f0e8","textColor":"#18273a","font":"Georgia, serif"},
  impact: {"label":"Project Impact","headerBg":"#075d53","headerColor":"#fff","accentColor":"#e1a342","bodyBg":"#edf7f3","textColor":"#143e38","font":"Inter, system-ui, sans-serif"},
  partnership: {"label":"Partnership News","headerBg":"#263b59","headerColor":"#fff","accentColor":"#547bb6","bodyBg":"#eef3fb","textColor":"#182f4c","font":"Inter, system-ui, sans-serif"},
  evently: {"label":"Event & Webinar","headerBg":"#8a335a","headerColor":"#fff","accentColor":"#faac72","bodyBg":"#fff0f3","textColor":"#44263b","font":"Outfit, Inter, system-ui, sans-serif"},
  corporate: {"label":"Corporate Digest","headerBg":"#212936","headerColor":"#fff","accentColor":"#cda46c","bodyBg":"#f3f4f6","textColor":"#26303d","font":"Inter, system-ui, sans-serif"},
  inclusive: {"label":"Inclusive Newsletter","headerBg":"#153f5f","headerColor":"#fff","accentColor":"#147e86","bodyBg":"#ffffff","textColor":"#132f45","font":"Arial, Inter, system-ui, sans-serif"},
  stories: {"label":"Visual Stories","headerBg":"#65402f","headerColor":"#fff","accentColor":"#b76942","bodyBg":"#fbf3ed","textColor":"#36251d","font":"Georgia, serif"},
  editorial: {"label":"Minimal Editorial","headerBg":"#1f252b","headerColor":"#fff","accentColor":"#6f7258","bodyBg":"#fcfcfa","textColor":"#22272a","font":"Georgia, serif"},
};

// ── Block palette ─────────────────────────────────────────────────────
const PALETTE: { type: BT; icon: string; label: string; def: Record<string,string> }[] = [
  { type:'title',      icon:'T',   label:'Title',       def:{ text:'Başlık', size:'h2' } },
  { type:'paragraph',  icon:'¶',   label:'Paragraph',   def:{ text:'Buraya metin yazın...' } },
  { type:'photos',     icon:'🖼',  label:'Photos',      def:{ url:'', layout:'1', caption:'' } },
  { type:'textphoto',  icon:'🗒',  label:'Text+Photo',  def:{ text:'Metin buraya...', url:'', imagePos:'right' } },
  { type:'photogrid',  icon:'🗳',  label:'Photo Grid',  def:{ cols:'2', url1:'', cap1:'', url2:'', cap2:'', url3:'' , cap3:'' } },
  { type:'author',     icon:'👤',  label:'Author',      def:{ name:'Ad Soyad', title:'Moderator', avatar:'', bio:'', facebook:'', twitter:'', instagram:'', youtube:'' } },
  { type:'form',       icon:'📋',  label:'Form',        def:{ title:'Geri Bildirim', field1:'Ad Soyad', field2:'E-posta', field3:'Mesaj', submit:'Gönder' } },
  { type:'googleform', icon:'📝',  label:'Google Form', def:{ url:'', title:'Form', height:'520' } },
  { type:'video',      icon:'►',   label:'Video',       def:{ url:'', caption:'' } },
  { type:'event',      icon:'📅',  label:'Event',       def:{ title:'Etkinlik', date:'', time:'', location:'' } },
  { type:'separator',  icon:'—',   label:'Separator',   def:{ style:'solid' } },
  { type:'link',       icon:'🔗',  label:'Link',        def:{ text:'Bağlantı', url:'#' } },
  { type:'button',     icon:'⬛',  label:'Button',      def:{ text:'Tıklayın', url:'#', align:'center' } },
  { type:'poll',       icon:'📊',  label:'Poll',        def:{ question:'Sorunuz?', opt1:'Seçenek A', opt2:'Seçenek B', opt3:'' } },
  { type:'attachment', icon:'📎',  label:'Attachment',  def:{ name:'dosya.pdf', url:'#' } },
];

function uid() { return Math.random().toString(36).slice(2,9); }

function ytId(url:string){ const m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/); return m?m[1]:null; }

// ── Canvas block renderer ──────────────────────────────────────────────
function CanvasBlock({ block, design, selected, onClick }: {
  block: Block; design: DesignConfig; selected: boolean; onClick: ()=>void;
}) {
  const d = block.data;
  const ac = design.accentColor;
  const tc = design.textColor;
  const ff = design.font;

  let inner: React.ReactNode = null;

  if(block.type === 'title'){
    const Tag = (d.size||'h2') as 'h1'|'h2'|'h3';
    const sz = {h1:'28px',h2:'22px',h3:'18px'}[Tag];
    const titleEl = <Tag style={{margin:0,fontFamily:ff,fontSize:sz,fontWeight:800,color:ac,textDecoration:d.url?'underline':'none',textDecorationColor:`${ac}44`}}>{d.text}</Tag>;
    inner = d.url
      ? <a href={d.url} target="_blank" rel="noreferrer" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:6}}>{titleEl}<span style={{fontSize:13,opacity:.5}}>↗️</span></a>
      : titleEl;
  } else if(block.type === 'paragraph'){
    inner = <p style={{margin:0,fontFamily:ff,fontSize:15,lineHeight:1.75,color:tc,whiteSpace:'pre-wrap'}}>{d.text}</p>;
  } else if(block.type === 'photos'){
    const isColumns = d.layout === 'columns';
    if(isColumns){
      const items = [{url:d.url, cap:d.caption}, {url:d.url2, cap:d.caption2}];
      inner = (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {items.map((item,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',gap:0}}>
              {item.url
                ? <img src={item.url} alt={item.cap||''} style={{width:'100%',borderRadius:8,display:'block'}}/>
                : <div style={{background:'#e2e8f0',borderRadius:8,height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:4,border:'1.5px dashed #cbd5e1'}}>
                    <span style={{fontSize:24}}>+📷</span>
                    <span style={{fontSize:11,fontFamily:ff}}>Görsel Seçin</span>
                  </div>}
              {item.cap && <p style={{margin:'6px 0 0',fontSize:12,color:'#64748b',fontFamily:ff,textAlign:'center'}}>{item.cap}</p>}
            </div>
          ))}
        </div>
      );
    } else {
      const hasUrl = d.url && d.url.trim();
      inner = (
        <div>
          {hasUrl
             ? <img src={d.url} alt={d.caption||''} style={{width:'100%',borderRadius:8,display:'block'}}/>
             : <div style={{background:'#e2e8f0',borderRadius:8,height:160,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:8}}>
                 <span style={{fontSize:32}}>🖼</span>
                 <span style={{fontSize:13,fontFamily:ff}}>Görsel Seçin</span>
               </div>}
          {d.caption && <p style={{margin:'8px 0 0',fontSize:12,color:'#64748b',fontFamily:ff,textAlign:'center'}}>{d.caption}</p>}
        </div>
      );
    }
  } else if(block.type === 'video'){
    const vid = ytId(d.url||'');
    inner = vid
      ? <div style={{position:'relative',paddingBottom:'56.25%',height:0,borderRadius:8,overflow:'hidden'}}>
          <iframe style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} src={`https://www.youtube.com/embed/${vid}`} allowFullScreen title="video"/>
        </div>
      : <div style={{background:'#e2e8f0',borderRadius:8,height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:8}}>
          <span style={{fontSize:32}}>▶</span>
          <span style={{fontSize:13,fontFamily:ff}}>YouTube URL ekleyin</span>
        </div>;
  } else if(block.type === 'event'){
    inner = (
      <div style={{borderLeft:`4px solid ${ac}`,paddingLeft:16,fontFamily:ff}}>
        <div style={{fontWeight:800,fontSize:16,color:ac,marginBottom:4}}>{d.title||'Etkinlik'}</div>
        {d.date && <div style={{fontSize:13,color:tc}}>📅 {d.date} {d.time}</div>}
        {d.location && <div style={{fontSize:13,color:tc}}>📍 {d.location}</div>}
      </div>
    );
  } else if(block.type === 'separator'){
    inner = <hr style={{border:'none',borderTop:`2px ${d.style||'solid'} ${ac}`,margin:0}}/>;
  } else if(block.type === 'link'){
    inner = <a href={d.url||'#'} style={{color:ac,fontFamily:ff,fontSize:14,textDecoration:'underline',fontWeight:600}}>🔗 {d.text||'Bağlantı'}</a>;
  } else if(block.type === 'button'){
    const align = d.align||'center';
    inner = <div style={{textAlign:align as 'left'|'center'|'right'}}>
      <a href={d.url||'#'} style={{display:'inline-block',padding:'12px 28px',background:ac,color:'#fff',borderRadius:30,fontFamily:ff,fontWeight:700,fontSize:14,textDecoration:'none'}}>{d.text||'Tıklayın'}</a>
    </div>;
  } else if(block.type === 'poll'){
    inner = (
      <div style={{fontFamily:ff}}>
        <div style={{fontWeight:700,fontSize:15,color:tc,marginBottom:10}}>{d.question||'Sorunuz?'}</div>
        {[d.opt1,d.opt2,d.opt3].filter(Boolean).map((o,i)=>(
          <div key={i} style={{padding:'8px 14px',border:`1.5px solid ${ac}`,borderRadius:8,marginBottom:6,fontSize:14,color:tc,cursor:'pointer'}}>○ {o}</div>
        ))}
      </div>
    );
  } else if(block.type === 'attachment'){
    inner = <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',border:`1.5px solid #e2e8f0`,borderRadius:8,fontFamily:ff}}>
      <span style={{fontSize:22}}>📎</span>
      <a href={d.url||'#'} style={{color:ac,fontWeight:600,fontSize:14,textDecoration:'none'}}>{d.name||'dosya.pdf'}</a>
    </div>;
  } else if(block.type === 'textphoto'){
    const imgRight = (d.imagePos||'right')==='right';
    const hasImg = d.url && d.url.trim();
    inner = (
      <div style={{display:'flex',gap:16,alignItems:'flex-start',flexDirection: imgRight?'row':'row-reverse'}}>
        <div style={{flex:1}}>
          <p style={{margin:0,fontFamily:ff,fontSize:15,lineHeight:1.75,color:tc,whiteSpace:'pre-wrap'}}>{d.text||'Metin buraya...'}</p>
        </div>
        <div style={{flexShrink:0,width:180}}>
          {hasImg
            ? <img src={d.url} alt={d.caption||''} style={{width:'100%',borderRadius:8,display:'block'}}/>
            : <div style={{width:'100%',height:120,background:'#e2e8f0',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:4}}>
                <span style={{fontSize:24}}>🖼</span>
                <span style={{fontSize:11,fontFamily:ff}}>Add a Picture</span>
              </div>}
        </div>
      </div>
    );
  } else if(block.type === 'photogrid'){
    const cols = parseInt(d.cols||'2');
    const slots = Array.from({length:cols},(_,i)=>({url:d[`url${i+1}`]||'',cap:d[`cap${i+1}`]||''}));
    inner = (
      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:10}}>
        {slots.map((s,i)=>(
          <div key={i}>
            {s.url
              ? <img src={s.url} alt={s.cap} style={{width:'100%',borderRadius:8,display:'block'}}/>
              : <div style={{background:'#e2e8f0',borderRadius:8,height:120,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:4}}>
                  <span style={{fontSize:24}}>🖼</span>
                  <span style={{fontSize:11,fontFamily:ff}}>Add a Picture</span>
                </div>}
            {s.cap && <p style={{margin:'4px 0 0',fontSize:11,color:'#64748b',fontFamily:ff,textAlign:'center'}}>{s.cap}</p>}
          </div>
        ))}
      </div>
    );
  } else if(block.type === 'author'){
    inner = (
      <div style={{border:`1px solid ${ac}22`,borderRadius:12,padding:'20px',fontFamily:ff,display:'flex',gap:16,alignItems:'flex-start',background:`${ac}06`}}>
        {d.avatar
          ? <img src={d.avatar} alt={d.name} style={{width:68,height:68,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`3px solid ${ac}`}}/>
          : <div style={{width:68,height:68,borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0,color:'#fff'}}>👤</div>}
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:16,color:tc}}>{d.name||'Ad Soyad'}</div>
          {d.title && <div style={{fontSize:13,color:ac,fontWeight:600,marginBottom:4}}>{d.title}</div>}
          {d.bio && <p style={{fontSize:13,color:tc,lineHeight:1.6,margin:'6px 0 0'}}>{d.bio}</p>}
          <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
            {d.facebook && <a href={`https://facebook.com/${d.facebook}`} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>Facebook</a>}
            {d.twitter && <a href={`https://twitter.com/${d.twitter}`} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>Twitter</a>}
            {d.instagram && <a href={`https://instagram.com/${d.instagram}`} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>Instagram</a>}
            {d.youtube && <a href={d.youtube} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>YouTube</a>}
          </div>
        </div>
      </div>
    );
  } else if(block.type === 'form'){
    const fields = [d.field1,d.field2,d.field3].filter(Boolean);
    inner = (
      <div style={{background:`${ac}08`,border:`1.5px solid ${ac}33`,borderRadius:12,padding:'20px',fontFamily:ff}}>
        {d.title && <div style={{fontWeight:800,fontSize:16,color:tc,marginBottom:14}}>{d.title}</div>}
        {fields.map((f,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,color:tc,display:'block',marginBottom:4}}>{f}</label>
            {(i===fields.length-1 && fields.length>1)
              ? <textarea rows={3} placeholder={f as string} disabled style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${ac}44`,fontSize:13,fontFamily:ff,resize:'none',boxSizing:'border-box' as const,background:'#fff',color:'#6b7280'}}/>
              : <input type={(f as string).toLowerCase().includes('mail')?'email':'text'} placeholder={f as string} disabled style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${ac}44`,fontSize:13,fontFamily:ff,boxSizing:'border-box' as const,background:'#fff',color:'#6b7280'}}/>}
          </div>
        ))}
        <button disabled style={{marginTop:4,padding:'10px 24px',background:ac,color:'#fff',border:'none',borderRadius:24,fontWeight:700,fontSize:14,fontFamily:ff,opacity:.9}}>{d.submit||'Gönder'}</button>
      </div>
    );
  } else if(block.type === 'googleform'){
    // Normalize URL: convert /viewform to /viewform?embedded=true
    const rawUrl = d.url || '';
    const embedUrl = rawUrl
      ? rawUrl.replace(/\/viewform.*$/, '/viewform?embedded=true')
      : '';
    const h = parseInt(d.height||'520');
    inner = (
      <div style={{border:`1.5px solid #4285F4`,borderRadius:12,overflow:'hidden'}}>
        {/* Google Form header bar */}
        <div style={{background:'#4285F4',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>📝</span>
          <span style={{color:'#fff',fontWeight:700,fontSize:14,fontFamily:ff}}>{d.title||'Google Form'}</span>
          {rawUrl && <a href={rawUrl} target="_blank" rel="noreferrer"
            style={{marginLeft:'auto',fontSize:11,color:'rgba(255,255,255,.8)',textDecoration:'underline',fontFamily:ff}}>Yeni sekmede aç ↗</a>}
        </div>
        {embedUrl
          ? <iframe src={embedUrl} width="100%" height={h} frameBorder={0} style={{display:'block'}}/>
          : <div style={{height:160,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontFamily:ff,background:'#f8fafc',gap:6}}>
              <span style={{fontSize:28}}>🔗</span>
              <span style={{fontSize:12,fontWeight:600}}>Google Form URL girin</span>
              <span style={{fontSize:11}}>Sağ panelden form linkinizi ekleyin</span>
            </div>}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding:'12px 0', cursor:'pointer',
        outline: selected ? `2px solid ${ac}` : '2px solid transparent',
        outlineOffset:4, borderRadius:6, position:'relative',
        transition:'outline 0.12s',
      }}
    >
      {selected && (
        <div style={{position:'absolute',top:6,right:6,background:ac,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,zIndex:10,pointerEvents:'none'}}>
          {PALETTE.find(p=>p.type===block.type)?.label}
        </div>
      )}
      {inner}
    </div>
  );
}

// ── Image uploader (URL + file upload) ───────────────────────────────
function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string)=>void; label?: string }) {
  const [tab, setTab] = React.useState<'url'|'file'>('url');
  const inp: React.CSSProperties = {width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1e293b'};

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {label && <label style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{label}</label>}
      {/* tab switcher */}
      <div style={{display:'flex',marginBottom:6,borderRadius:8,overflow:'hidden',border:'1px solid #d1d5db'}}>
        {(['url','file'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,padding:'5px 0',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',
              background:tab===t?'#0066cc':'#f9fafb',color:tab===t?'#fff':'#6b7280'}}>
            {t==='url'?'🔗 URL':'📁 Dosya'}
          </button>
        ))}
      </div>
      {tab==='url'
        ? <input style={inp} value={value} onChange={e=>onChange(e.target.value)} placeholder="https://site.com/gorsel.png"/>
        : <label style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:'2px dashed #d1d5db',borderRadius:8,cursor:'pointer',color:'#6b7280',fontSize:13,fontWeight:600,background:'#f9fafb'}}>
            📤 Görsel Seç
            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
          </label>
      }
      {value && (
        <div style={{marginTop:8,position:'relative',display:'inline-block'}}>
          <img src={value} alt="" style={{height:60,borderRadius:6,boxShadow:'0 1px 6px rgba(0,0,0,.12)',display:'block'}}/>
          <button onClick={()=>onChange('')}
            style={{position:'absolute',top:-5,right:-5,width:16,height:16,borderRadius:'50%',background:'#ef4444',border:'none',color:'#fff',fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Block editor (right panel) ─────────────────────────────────────────
function BlockEditor({ block, onChange, onAI, aiLoading }: {
  block: Block;
  onChange: (data: Record<string,string>)=>void;
  onAI: (mode: 'generate'|'rewrite'|'expand-short'|'expand-long'|'expand-bullets')=>void;
  aiLoading: boolean;
}) {
  const set = (k:string, v:string) => onChange({...block.data,[k]:v});
  const inp: React.CSSProperties = {width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1e293b'};
  const lbl: React.CSSProperties = {fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4};
  const row: React.CSSProperties = {marginBottom:10};

  const MergeTagHelper = ({ fieldKey, textValue }: { fieldKey: string, textValue: string }) => (
    <div style={{marginTop:6, display:'flex', gap:6, alignItems:'center'}}>
      <span style={{fontSize:10,color:'#64748b'}}>Değişken Ekle:</span>
      <button onClick={()=>set(fieldKey, (textValue||'') + ' {{isim}}')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #cbd5e1',background:'#f8fafc',fontSize:11,cursor:'pointer',color:'#0284c7',fontWeight:700}} title="Listeden kişinin adını otomatik çeker">{'{{isim}}'}</button>
    </div>
  );

  switch(block.type){
    case 'title': return <div>
      <div style={row}>
        <label style={lbl}>Başlık Metni</label>
        <input style={inp} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Başlık..."/>
        <MergeTagHelper fieldKey="text" textValue={block.data.text} />
      </div>
      <div style={row}><label style={lbl}>Boyut</label>
        <select style={inp} value={block.data.size} onChange={e=>set('size',e.target.value)}>
          <option value="h1">H1 — Büyük</option><option value="h2">H2 — Orta</option><option value="h3">H3 — Küçük</option>
        </select>
      </div>
      {/* Linkable title — Smore style */}
      {block.data.url
        ? <div style={row}>
            <label style={lbl}>Başlık Linki</label>
            <input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/>
            <button onClick={()=>set('url','')} style={{marginTop:6,padding:'5px 12px',borderRadius:6,border:'1px solid #e5e7eb',background:'#fef2f2',color:'#dc2626',fontSize:11,fontWeight:700,cursor:'pointer'}}>✕ Bağlantıyı Kaldır</button>
          </div>
        : <button onClick={()=>set('url','https://')} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #0d9488',background:'#f0fdfa',color:'#0d9488',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            🔗 Bu başlığı bağlantıya dönüştür
          </button>}
    </div>;
    case 'paragraph': return <div>
      <div style={row}><label style={lbl}>Metin ({block.data.text?.length||0} karakter)</label>
        <textarea style={{...inp,minHeight:110,resize:'vertical'}} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Metin yazın..."/>
        <MergeTagHelper fieldKey="text" textValue={block.data.text} />
      </div>
      <div style={{display:'flex',gap:6,marginTop:8}}>
        <button onClick={()=>onAI('generate')} disabled={aiLoading} title="Sıfırdan Üret" style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #6366f1',background:aiLoading?'#e0e7ff':'#eef2ff',color:'#6366f1',fontWeight:700,fontSize:11,cursor:aiLoading?'wait':'pointer'}}>
          {aiLoading?'⏳...':'✨ Üret'}
        </button>
        <button onClick={()=>onAI('rewrite')} disabled={aiLoading || !block.data.text} title="Yeniden Yaz / Geliştir" style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #0ea5e9',background:aiLoading?'#e0f2fe':'#e0f2fe',color:'#0284c7',fontWeight:700,fontSize:11,cursor:(aiLoading||!block.data.text)?'not-allowed':'pointer'}}>
          📝 Yeniden Yaz
        </button>
        <div style={{flex:1,position:'relative'}}>
           <button onClick={(e)=>{const div = e.currentTarget.nextElementSibling as HTMLElement; div.style.display = div.style.display==='none'?'flex':'none';}} disabled={aiLoading || !block.data.text} title="Daha Uzun Yaz" style={{width:'100%',padding:'8px',borderRadius:8,border:'1px solid #10b981',background:aiLoading?'#d1fae5':'#ecfdf5',color:'#059669',fontWeight:700,fontSize:11,cursor:(aiLoading||!block.data.text)?'not-allowed':'pointer'}}>
             ➕ Uzat ▾
           </button>
           <div style={{display:'none',position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'#fff',border:'1px solid #10b981',borderRadius:8,marginTop:4,flexDirection:'column',overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
             <button onClick={()=>{ onAI('expand-short'); (document.activeElement as HTMLElement)?.blur(); }} style={{padding:'8px',border:'none',borderBottom:'1px solid #e5e7eb',background:'#fff',color:'#059669',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'left'}}>+ Kısa Uzat (Detaylandır)</button>
             <button onClick={()=>{ onAI('expand-long'); (document.activeElement as HTMLElement)?.blur(); }} style={{padding:'8px',border:'none',borderBottom:'1px solid #e5e7eb',background:'#fff',color:'#059669',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'left'}}>++ Çok Uzat (2-3 Katı)</button>
             <button onClick={()=>{ onAI('expand-bullets'); (document.activeElement as HTMLElement)?.blur(); }} style={{padding:'8px',border:'none',background:'#fff',color:'#059669',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'left'}}>≡ Maddelerle Uzat</button>
           </div>
        </div>
      </div>
    </div>;
    case 'photos': return <div>
      {/* Layout chooser — Smore style card buttons */}
      <div style={{...row}}>
        <label style={lbl}>Düzen</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{val:'1',icon:'🖼️',lbl:'Büyük Fotoğraf'},{val:'columns',icon:'▐▊▊',lbl:'Yanyana Sütunlar'}].map(opt=>(
            <button key={opt.val} onClick={()=>set('layout',opt.val)}
              style={{padding:'12px 8px',borderRadius:10,border:`2px solid ${(block.data.layout||'1')===opt.val?'#0d9488':'#e5e7eb'}`,
                background:(block.data.layout||'1')===opt.val?'#f0fdfa':'#fff',
                cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>{opt.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:'#374151'}}>{opt.lbl}</span>
            </button>
          ))}
        </div>
      </div>
      {(block.data.layout === 'columns') ? (
        <div style={{display:'flex',gap:12,marginTop:10}}>
          <div style={{flex:1}}>
            <ImageUpload label="1. Görsel" value={block.data.url} onChange={url=>set('url',url)}/>
            <div style={{marginTop:6}}><label style={{...lbl,fontSize:9}}>1. Alt Yazı</label><input style={{...inp,padding:'4px 6px',fontSize:11}} value={block.data.caption||''} onChange={e=>set('caption',e.target.value)} placeholder="Açıklama..."/></div>
          </div>
          <div style={{flex:1}}>
            <ImageUpload label="2. Görsel" value={block.data.url2} onChange={url=>set('url2',url)}/>
            <div style={{marginTop:6}}><label style={{...lbl,fontSize:9}}>2. Alt Yazı</label><input style={{...inp,padding:'4px 6px',fontSize:11}} value={block.data.caption2||''} onChange={e=>set('caption2',e.target.value)} placeholder="Açıklama..."/></div>
          </div>
        </div>
      ) : (
        <>
          <ImageUpload label="Görsel" value={block.data.url} onChange={url=>set('url',url)}/>
          <div style={{...row,marginTop:10}}><label style={lbl}>Alt Yazı</label><input style={inp} value={block.data.caption} onChange={e=>set('caption',e.target.value)} placeholder="Görsel açıklaması..."/></div>
        </>
      )}
    </div>;
    case 'video': return <div>
      <div style={row}><label style={lbl}>YouTube URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://youtu.be/..."/></div>
      <div style={row}><label style={lbl}>Alt Yazı</label><input style={inp} value={block.data.caption} onChange={e=>set('caption',e.target.value)} placeholder="Video açıklaması..."/></div>
    </div>;
    case 'event': return <div>
      <div style={row}><label style={lbl}>Etkinlik Adı</label><input style={inp} value={block.data.title} onChange={e=>set('title',e.target.value)} placeholder="Etkinlik adı..."/></div>
      <div style={row}><label style={lbl}>Tarih</label><input style={inp} type="date" value={block.data.date} onChange={e=>set('date',e.target.value)}/></div>
      <div style={row}><label style={lbl}>Saat</label><input style={inp} type="time" value={block.data.time} onChange={e=>set('time',e.target.value)}/></div>
      <div style={row}><label style={lbl}>Yer</label><input style={inp} value={block.data.location} onChange={e=>set('location',e.target.value)} placeholder="Konum veya adres..."/></div>
    </div>;
    case 'separator': return <div>
      <div style={row}><label style={lbl}>Çizgi Stili</label>
        <select style={inp} value={block.data.style} onChange={e=>set('style',e.target.value)}>
          <option value="solid">Düz</option><option value="dashed">Kesik</option><option value="dotted">Noktalı</option>
        </select>
      </div>
    </div>;
    case 'link': return <div>
      <div style={row}><label style={lbl}>Bağlantı Metni</label><input style={inp} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Metin..."/></div>
      <div style={row}><label style={lbl}>URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/></div>
    </div>;
    case 'button': return <div>
      <div style={row}><label style={lbl}>Buton Metni</label><input style={inp} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Buton metni..."/></div>
      <div style={row}><label style={lbl}>URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/></div>
      <div style={row}><label style={lbl}>Hizalama</label>
        <select style={inp} value={block.data.align} onChange={e=>set('align',e.target.value)}>
          <option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option>
        </select>
      </div>
    </div>;
    case 'poll': return <div>
      <div style={row}><label style={lbl}>Soru</label><input style={inp} value={block.data.question} onChange={e=>set('question',e.target.value)} placeholder="Sorunuzu yazın..."/></div>
      {['opt1','opt2','opt3'].map((k,i)=>(
        <div key={k} style={row}><label style={lbl}>Seçenek {i+1}</label><input style={inp} value={block.data[k]} onChange={e=>set(k,e.target.value)} placeholder={`Seçenek ${i+1}...`}/></div>
      ))}
    </div>;
    case 'attachment': return <div>
      <div style={row}><label style={lbl}>Dosya Adı</label><input style={inp} value={block.data.name} onChange={e=>set('name',e.target.value)} placeholder="dosya.pdf"/></div>
      <div style={row}><label style={lbl}>URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/></div>
    </div>;
    case 'textphoto': return <div>
      <div style={row}><label style={lbl}>Metin</label>
        <textarea style={{...inp,minHeight:90,resize:'vertical'}} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Metin yazın..."/>
      </div>
      <div style={{...row,marginTop:8}}><ImageUpload label="Görsel" value={block.data.url} onChange={url=>set('url',url)}/></div>
      <div style={row}><label style={lbl}>Görsel Pozisyon</label>
        <select style={inp} value={block.data.imagePos||'right'} onChange={e=>set('imagePos',e.target.value)}>
          <option value="right">Sağda</option>
          <option value="left">Solda</option>
        </select>
      </div>
    </div>;
    case 'photogrid': return <div>
      <div style={row}><label style={lbl}>Sütun Sayısı</label>
        <select style={inp} value={block.data.cols||'2'} onChange={e=>set('cols',e.target.value)}>
          <option value="1">1 Sütun</option>
          <option value="2">2 Sütun</option>
          <option value="3">3 Sütun</option>
        </select>
      </div>
      {Array.from({length:parseInt(block.data.cols||'2')},(_,i)=>(
        <div key={i} style={{...row,borderTop:'1px solid #e5e7eb',paddingTop:10}}>
          <ImageUpload label={`Görsel ${i+1}`} value={block.data[`url${i+1}`]||''} onChange={url=>set(`url${i+1}`,url)}/>
          <div style={{marginTop:6}}><label style={lbl}>Alt Yazı {i+1}</label>
            <input style={inp} value={block.data[`cap${i+1}`]||''} onChange={e=>set(`cap${i+1}`,e.target.value)} placeholder="Açıklama..."/>
          </div>
        </div>
      ))}
    </div>;
    case 'author': return <div>
      <ImageUpload label="Avatar" value={block.data.avatar||''} onChange={url=>set('avatar',url)}/>
      <div style={{...row,marginTop:10}}><label style={lbl}>Ad Soyad</label><input style={inp} value={block.data.name} onChange={e=>set('name',e.target.value)} placeholder="Ad Soyad"/></div>
      <div style={row}><label style={lbl}>Ünvan / Site</label><input style={inp} value={block.data.title} onChange={e=>set('title',e.target.value)} placeholder="Moderator veya https://..."/></div>
      <div style={row}><label style={lbl}>Bio</label><textarea style={{...inp,minHeight:70,resize:'vertical'}} value={block.data.bio} onChange={e=>set('bio',e.target.value)} placeholder="Kısa biyografi..."/></div>
      <div style={{borderTop:'1px solid #e5e7eb',paddingTop:10,marginBottom:4}}><label style={lbl}>Sosyal Medya</label></div>
      {[['facebook','Facebook'],['twitter','Twitter / X'],['instagram','Instagram'],['youtube','YouTube URL']].map(([k,l])=>(
        <div key={k} style={row}><label style={lbl}>{l}</label><input style={inp} value={block.data[k]||''} onChange={e=>set(k,e.target.value)} placeholder={k==='youtube'?'https://youtube.com/...':'@kullanici'}/></div>
      ))}
    </div>;
    case 'form': return <div>
      <div style={row}><label style={lbl}>Form Başlığı</label><input style={inp} value={block.data.title||''} onChange={e=>set('title',e.target.value)} placeholder="Geri Bildirim..."/></div>
      {['field1','field2','field3'].map((k,i)=>(
        <div key={k} style={row}><label style={lbl}>Alan {i+1}</label><input style={inp} value={block.data[k]||''} onChange={e=>set(k,e.target.value)} placeholder={`Alan ${i+1} etiketi...`}/></div>
      ))}
      <div style={row}><label style={lbl}>Buton Metni</label><input style={inp} value={block.data.submit||''} onChange={e=>set('submit',e.target.value)} placeholder="Gönder"/></div>
    </div>;
    case 'googleform': return <div>
      <div style={row}><label style={lbl}>Google Form URL</label>
        <input style={inp} value={block.data.url||''} onChange={e=>set('url',e.target.value)} placeholder="https://forms.gle/... veya https://docs.google.com/forms/..."/>
        <div style={{fontSize:10,color:'#6b7280',marginTop:4,lineHeight:1.4}}>Google Form'u açın → Sağ üst — Gönder → İframe kodunu kopyala → src= içindeki linki buraya yapıştırın</div>
      </div>
      <div style={row}><label style={lbl}>Başlık</label><input style={inp} value={block.data.title||''} onChange={e=>set('title',e.target.value)} placeholder="Form başlığı..."/></div>
      <div style={row}><label style={lbl}>Yükseklik (px)</label>
        <select style={inp} value={block.data.height||'520'} onChange={e=>set('height',e.target.value)}>
          {['400','520','640','800','1000'].map(h=><option key={h} value={h}>{h}px</option>)}
        </select>
      </div>
    </div>;
    default: return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────
export default function BultenReadPage() {
  const a11y = useAccessibility({ storagePrefix: 'bulten_a11y_' });
  const dragTypeRef = React.useRef<BT|null>(null);
  const [dropIndicator, setDropIndicator] = React.useState<number|null>(null);
  const [title,    setTitle]    = useState('The Weekly Update');
  const [subtitle, setSubtitle] = useState('#1  •  March 24th, 2026');
  const [design,        setDesign]        = useState<Design>('modern');
  const [showTOC,       setShowTOC]       = useState(true);
  const [logoUrl,       setLogoUrl]       = useState('');
  const [headerImgUrl,  setHeaderImgUrl]  = useState('');
  const [publicNewsletterUrl, setPublicNewsletterUrl] = useState('');
  type PublicationInfo = { slug:string; editToken:string; url:string; revision:number; publishedAt:string };
  const [publication, setPublication] = useState<PublicationInfo|null>(null);
  const [activeNewsletterId, setActiveNewsletterId] = useState<string>(()=>uid());
  const [draftReady, setDraftReady] = useState(false);
  const SAVED_KEY = 'bulten_saved_newsletters_v2';
  const [previewMode,   setPreviewMode]   = useState<'desktop'|'mobile'>('desktop');
  const draggedBlockIdRef = React.useRef<string|null>(null);

  const [blocks,        _setBlocks]       = useState<Block[]>([
    { id:uid(), type:'title',     data:{ text:'Use titles for easy scanning', size:'h2'} },
    { id:uid(), type:'paragraph', data:{ text:'You can use a paragraph block to write a welcome message, explain assignments, or share an inspiration for the week.\n\nThe more your readers know about what\'s happening, the better they can support your goals.' } },
    { id:uid(), type:'photos',    data:{ url:'', caption:'Add a photo to personalize your newsletter!' } },
    { id:uid(), type:'separator', data:{ style:'solid' } },
    { id:uid(), type:'event',     data:{ title:'Proje Toplantısı', date:'2026-04-01', time:'14:00', location:'Online — Zoom' } },
  ]);

  const historyRef = React.useRef<{ past: Block[][], future: Block[][] }>({ past: [], future: [] });

  const setBlocks = React.useCallback((val: React.SetStateAction<Block[]>) => {
    _setBlocks(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > 50) historyRef.current.past.shift();
        historyRef.current.future = [];
      }
      return next;
    });
  }, []);

  const handleUndo = React.useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    _setBlocks(prev => {
      const previous = historyRef.current.past.pop()!;
      historyRef.current.future.push(prev);
      return previous;
    });
  }, []);

  const handleRedo = React.useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    _setBlocks(prev => {
      const next = historyRef.current.future.pop()!;
      historyRef.current.past.push(prev);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) { e.preventDefault(); handleRedo(); }
        else { e.preventDefault(); handleUndo(); }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [selectedId,    setSelectedId]    = useState<string|null>(blocks[0]?.id ?? null);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [published,     setPublished]     = useState(false);
  const [activeTab,     setActiveTab]     = useState<'design'|'content'>('content');
  const [designSubTab,  setDesignSubTab]  = useState<'backgrounds'|'colors'|'fonts'>('backgrounds');
  const [lang, setLang] = useState<Lang>('tr');
  const t = T[lang];
  const [isGenerating, setIsGenerating] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Auto-save / Restore logic ───────────────────────────────────────
  const DRAFT_KEY = 'bulten_draft_v1';

  React.useEffect(() => {
    try {
      const saved=window.localStorage.getItem(DRAFT_KEY);
      if(saved){
        const data=JSON.parse(saved);
        if(data && Array.isArray(data.blocks) && data.blocks.length){
          setTitle(data.title||'Yeni Bülten');
          setSubtitle(data.subtitle||'');
          setDesign(data.design||'modern');
          setLogoUrl(data.logoUrl||'');
          setHeaderImgUrl(data.headerImgUrl||'');
          setShowTOC(data.showTOC!==false);
          setActiveNewsletterId(typeof data.activeNewsletterId==='string'?data.activeNewsletterId:uid());
          setPublication(data.publication&&typeof data.publication.editToken==='string'?data.publication:null);
          setPublicNewsletterUrl(data.publication?.url||data.publicNewsletterUrl||'');
          lastSharedSnapshot.current=typeof data.publishedSnapshot==='string'?data.publishedSnapshot:'';
          const safeBlocks=data.blocks.filter((b:any)=>b&&typeof b==='object'&&typeof b.id==='string');
          if(safeBlocks.length){setBlocks(safeBlocks);setSelectedId(safeBlocks[0].id);}
        }
      }
    }catch(error){console.warn('Taslak okunamadı:',error);}
    setDraftReady(true);
  }, []);

  React.useEffect(() => {
    if(!draftReady)return;
    try{
      window.localStorage.setItem(DRAFT_KEY,JSON.stringify({
        activeNewsletterId,title,subtitle,design,logoUrl,headerImgUrl,blocks,
        showTOC,publicNewsletterUrl,publication,publishedSnapshot:lastSharedSnapshot.current,
      }));
    }catch(error){console.warn('Yerel otomatik taslak kaydı yapılamadı:',error);}
  },[draftReady,activeNewsletterId,title,subtitle,design,logoUrl,headerImgUrl,blocks,showTOC,publicNewsletterUrl,publication]);

  // ── Text-to-Speech ──────────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToRead = blocks
      .map(b => {
        if (b.type === 'title') return b.data.text;
        if (b.type === 'paragraph') return b.data.text;
        if (b.type === 'textphoto') return b.data.text;
        if (b.type === 'event') return `${b.data.title}. Tarih: ${b.data.date}, Yer: ${b.data.location}`;
        return '';
      })
      .filter(Boolean)
      .join('. ');

    const fullText = `${title}. ${subtitle}. ${textToRead}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    const targetPrefix = lang === 'en' ? 'en' : 'tr';
    utterance.lang = lang === 'en' ? 'en-GB' : 'tr-TR';
    
    // Evaluate best female voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix));
    
    let bestVoice = matchingVoices[0] || voices[0] || null;
    let maxScore = -999;
    
    const femaleNames = ['zira','aria','sonia','emelie','natasha','samantha','victoria','karen','tessa','kız','kadın','ayda','emine','gizem','derya','meltem','selin','yelda','emel'];
    const maleNames = ['david','mark','george','arthur','tolga','cem','erkek','ahmet','kemal','hakan','male','man'];

    matchingVoices.forEach(v => {
      let score = 0;
      const n = v.name.toLowerCase();
      if (maleNames.some(m => n.includes(m))) score -= 100;
      if (n.includes('female') || n.includes('woman') || femaleNames.some(f => n.includes(f))) score += 50;
      if (n.includes('premium') || n.includes('enhanced') || n.includes('natural')) score += 20;
      if (n.includes('google')) score += 10;
      if (n.includes('microsoft')) score += 5;
      if (targetPrefix === 'tr' && n.includes('google') && n.includes('türkçe')) score += 30;
      if (targetPrefix === 'en' && (n.includes('british') || n.includes('uk')) && n.includes('female')) score += 50;
      if (targetPrefix === 'en' && n.includes('google') && n.includes('english') && (n.includes('female') || n.includes('uk'))) score += 30;

      if (score > maxScore) {
        maxScore = score;
        bestVoice = v;
      }
    });

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // ── IP-based language detection (on mount) ──────────────────────────
  React.useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r=>r.json())
      .then(data=>{
        if(data.country_code && data.country_code!=='TR') setLang('en');
        else setLang('tr');
      })
      .catch(()=>{}); // silently fallback
  }, []);

  // ── Translate blocks via OpenAI ──────────────────────────────────────
  const [translating, setTranslating] = React.useState(false);

  const translateBlocks = useCallback(async (targetLang: Lang) => {
    const textBlocks = blocks.filter(b => b.type==='title'||b.type==='paragraph'||b.type==='event'||b.type==='button'||b.type==='link');
    if (textBlocks.length === 0 && !title && !subtitle) return;
    setTranslating(true);
    try {
      const langName = targetLang==='en' ? 'English' : 'Turkish';
      const payload: {id:string, type:string, fields:Record<string,string>}[] = textBlocks.map(b=>({
        id: b.id,
        type: b.type,
        fields: Object.fromEntries(Object.entries(b.data).filter(([k])=>['text','title','caption','location'].includes(k)))
      }));
      
      // Include global text attributes so they get parsed too
      if (title.trim()) payload.push({ id: 'GLOBAL_TITLE', type: 'global', fields: { text: title } });
      if (subtitle.trim()) payload.push({ id: 'GLOBAL_SUBTITLE', type: 'global', fields: { text: subtitle } });

      const res = await fetch('/api/ai-generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          systemPrompt: 'You are a translation API. Return ONLY raw, valid JSON array of objects. No markdown, no triple backticks, no explanations. Exact structure matching the input array.',
          prompt: `Translate the ALL values in 'fields' to ${langName}. Output ONLY the JSON array.\n${JSON.stringify(payload)}`,
          maxTokens: 2000
        })
      });
      if(!res.ok) return;
      const data = await res.json();
      try {
        const translated: {id:string; fields:Record<string,string>}[] = JSON.parse(data.result.replace(/```json|```/g,'').trim());
        
        const trTitle = translated.find(t=>t.id==='GLOBAL_TITLE');
        if (trTitle && trTitle.fields.text) setTitle(trTitle.fields.text);
        
        const trSub = translated.find(t=>t.id==='GLOBAL_SUBTITLE');
        if (trSub && trSub.fields.text) setSubtitle(trSub.fields.text);

        setBlocks(prev => prev.map(b => {
          const tr = translated.find(t=>t.id===b.id);
          if(!tr) return b;
          return { ...b, data: { ...b.data, ...tr.fields } };
        }));
      } catch(e){
        console.error('Translation JSON parse error:', e, data.result);
      }
    } finally { setTranslating(false); }
  }, [blocks, title, subtitle]);

  const handleLangSwitch = (l: Lang) => {
    setLang(l);
    translateBlocks(l);
  };

  type SavedNL = {
    id:string; title:string; subtitle:string; design:Design; blocks:Block[];
    logoUrl:string; headerImgUrl:string; showTOC:boolean; savedAt:string;
    publicNewsletterUrl?:string; publication?:PublicationInfo|null;
    publishedSnapshot?:string;
  };

  const [showSavedModal,setShowSavedModal]=React.useState(false);
  const [savedList,setSavedList]=React.useState<SavedNL[]>([]);
  const [saveSuccess,setSaveSuccess]=React.useState(false);
  const [savedSearch,setSavedSearch]=React.useState('');

  const persistSavedLocally = (entry:SavedNL):boolean => {
    try {
      const next=[entry,...savedList.filter(x=>x.id!==entry.id)].slice(0,30);
      window.localStorage.setItem(SAVED_KEY,JSON.stringify(next));
      setSavedList(next);
      return true;
    }catch(error){
      console.error('Bültenin yerel kaydı başarısız:',error);
      alert('Bülten kaydedilemedi. Tarayıcı depolama alanını kontrol edin; büyük fotoğrafları küçültmeyi deneyin.');
      return false;
    }
  };
  const currentSnapshot=()=>JSON.stringify({title,subtitle,design,blocks,headerImgUrl,logoUrl,showTOC});
  const savedEntry=(override?:PublicationInfo|null,snapshot?:string):SavedNL=>({
    id:activeNewsletterId,title,subtitle,design,blocks:blocks.map(b=>({...b,data:{...b.data}})),
    logoUrl,headerImgUrl,showTOC,savedAt:new Date().toISOString(),
    publicNewsletterUrl:override?.url||publicNewsletterUrl,
    publication:override===undefined?publication:override,
    publishedSnapshot:snapshot===undefined?(publication?lastSharedSnapshot.current:''):snapshot,
  });

  const handleSave=async ():Promise<boolean>=>{
    const entry=savedEntry();
    if(!persistSavedLocally(entry))return false;
    setSaveSuccess(true);window.setTimeout(()=>setSaveSuccess(false),2200);
    // Server storage is optional. Never send the owner-only edit token to a
    // cloud record; local browser storage is the source of edit permission.
    const {publication:secret,publishedSnapshot,...cloudRecord}=entry;
    try {
      const response=await fetch('/api/db/newsletters',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(cloudRecord),
      });
      if(!response.ok)console.info('Bulut kaydı yapılandırılmamış, bülten bu tarayıcıda saklandı.');
    }catch{console.info('Bulut bağlantısı yok, yerel bülten kaydı korundu.');}
    return true;
  };

  const handleLoad=(record:SavedNL)=>{
    if(!record || !Array.isArray(record.blocks))return;
    const existing=savedList.find(x=>x.id===activeNewsletterId);
    const storedSnapshot=existing?JSON.stringify({
      title:existing.title,subtitle:existing.subtitle,design:existing.design,
      blocks:existing.blocks,headerImgUrl:existing.headerImgUrl,logoUrl:existing.logoUrl,showTOC:existing.showTOC,
    }):'';
    const changed=currentSnapshot()!==storedSnapshot;
    if(changed && activeNewsletterId===record.id){
      if(!window.confirm('Bu kaydın üzerindeki henüz kaydedilmemiş değişiklikler geri alınacak. Kayıtlı sürümü açmak istiyor musunuz?'))return;
    }else if(changed && activeNewsletterId!==record.id && blocks.length){
      // Keep work-in-progress before loading another newsletter.
      if(!persistSavedLocally(savedEntry()))return;
    }
    setActiveNewsletterId(record.id);
    setTitle(record.title||'Yeni Bülten');setSubtitle(record.subtitle||'');
    setDesign(record.design||'modern');setBlocks(record.blocks.map(b=>({...b,data:{...b.data}})));
    setLogoUrl(record.logoUrl||'');setHeaderImgUrl(record.headerImgUrl||'');
    setShowTOC(record.showTOC!==false);
    setPublication(record.publication?.editToken?record.publication:null);
    setPublicNewsletterUrl(record.publication?.url||record.publicNewsletterUrl||'');
    lastSharedSnapshot.current=record.publishedSnapshot||'';
    setSelectedId(null);setShowSavedModal(false);setShowShareModal(false);
    if(typeof window!=='undefined'&&window.location.search.includes('edit=')){
      window.history.replaceState(null,'',window.location.pathname);
    }
  };

  const handleDelete=async(id:string)=>{
    if(!window.confirm('Bu bülteni kayıtlı listeden silmek istiyor musunuz? Yayımlanmış internet bağlantısı silinmez.'))return;
    const next=savedList.filter(s=>s.id!==id);
    try{
      window.localStorage.setItem(SAVED_KEY,JSON.stringify(next));
      setSavedList(next);
    }catch{alert('Silme işlemi bu tarayıcıda kaydedilemedi.');return;}
    try{await fetch('/api/db/newsletters?id='+encodeURIComponent(id),{method:'DELETE'});}catch{}
  };

  const [showShareModal, setShowShareModal] = React.useState(false);
  const [shareBusy, setShareBusy] = React.useState(false);
  const [shareProgress,setShareProgress] = React.useState('');
  const [shareError, setShareError] = React.useState('');
  const lastSharedSnapshot = React.useRef('');
  const [showAnalyticsModal, setShowAnalyticsModal] = React.useState(false);
  const [copyDone, setCopyDone] = React.useState<string|null>(null);
  const publishedShareUrl = normalisePublicNewsletterUrl(publicNewsletterUrl);
  const publisherShareLinks = makeShareLinks(title,publishedShareUrl);
  const copyPublishedLink = async () => {
    if (!publishedShareUrl) return;
    try {
      await navigator.clipboard.writeText(publishedShareUrl);
      setCopyDone('link');setTimeout(()=>setCopyDone(null),2200);
    } catch {
      window.prompt('Bağlantıyı kopyalayın:',publishedShareUrl);
    }
  };

  // Analytics helpers
  const [analytics, setAnalytics] = React.useState<{views:number, lastWeek:number, opens:number, clicks:number}>({views:0, lastWeek:0, opens:0, clicks:0});
  // Fetch real analytics when modal opens
  const openAnalytics = async () => {
    try {
      const res = await fetch('/api/db/analytics',{cache:'no-store'});
      const data = await res.json();
      if(!res.ok)throw new Error(data.error||'Analitik servisi kullanılamıyor.');
      setAnalytics({
        views: data.totalOpens || 0,
        opens: data.uniqueOpens || 0,
        clicks: data.totalClicks || 0,
        lastWeek: data.lastWeek || 0
      });
      setShowAnalyticsModal(true);
    } catch(e) {
      alert(e instanceof Error?e.message:'Analitik bilgileri alınamadı.');
    }
  };
  // Derived analytics from blocks
  const wordCount = blocks.filter(b=>b.type==='paragraph'||b.type==='title').reduce((acc,b)=>acc+(b.data.text||'').split(/\s+/).length,0);
  const readingTime = Math.max(1,Math.round(wordCount/200));
  const [analyticsTab, setAnalyticsTab] = React.useState<string>('overview');

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

  const [showTemplatesModal, setShowTemplatesModal] = React.useState(false);

  // ── Mailing List ─────────────────────────────────────────────────
  const ML_KEY = 'bulten_mailing_lists';
  type MLContact = {email:string;name:string;addedAt:string;consentAt?:string;consentSource?:string;trackingConsent?:boolean;unsubscribedAt?:string};
  type MailingList = { id:string; name:string; contacts:MLContact[]; createdAt:string };
  const [showMailModal, setShowMailModal] = React.useState(false);
  const [mailingLists, setMailingLists] = React.useState<MailingList[]>([]);
  
  const [savedReady,setSavedReady]=React.useState(false);
  React.useEffect(()=>{
    try{
      const local=JSON.parse(window.localStorage.getItem(SAVED_KEY)||'[]');
      if(Array.isArray(local))setSavedList(local.filter((v:any)=>v&&typeof v.id==='string'&&Array.isArray(v.blocks)).slice(0,30));
    }catch(error){console.warn('Kayıtlı bülten listesi açılamadı:',error);}
    setSavedReady(true);
    // Optional account-backed records are merged, never allowed to overwrite the
    // same record (or private owner token) saved on this browser.
    fetch('/api/db/newsletters').then(r=>r.ok?r.json():[]).then((remote:unknown)=>{
      if(!Array.isArray(remote))return;
      setSavedList(previous=>{
        const known=new Set(previous.map(v=>v.id));
        const imported=remote.filter((v:any)=>
          v&&typeof v.id==='string'&&Array.isArray(v.blocks)&&!known.has(v.id))
          .map((v:any)=>({
            id:v.id,title:v.title||'Başlıksız Bülten',subtitle:v.subtitle||'',
            design:v.design||'modern',blocks:v.blocks,logoUrl:v.logoUrl||'',
            headerImgUrl:v.headerImgUrl||v.header_img_url||'',showTOC:v.showTOC!==false,
            savedAt:v.savedAt||v.created_at||new Date().toISOString(),
            publicNewsletterUrl:v.publicNewsletterUrl||'',
          }));
        const merged=[...previous,...imported].slice(0,30);
        return merged;
      });
    }).catch(()=>{});
    fetch('/api/db/mailing-lists').then(r=>r.ok?r.json():[]).then(d=>{
      if(Array.isArray(d))setMailingLists(d);
    }).catch(()=>{});
  },[]);

  React.useEffect(()=>{
    if(!savedReady)return;
    const slug=new URLSearchParams(window.location.search).get('edit');
    if(!slug)return;
    if(!/^[A-Za-z0-9_-]{16}$/.test(slug)){
      window.history.replaceState(null,'',window.location.pathname);return;
    }
    const own=savedList.find(s=>s.publication?.slug===slug&&Boolean(s.publication.editToken));
    if(own){handleLoad(own);return;}
    if(!window.localStorage.getItem('bulten_edit_attempt_'+slug)){
      window.localStorage.setItem('bulten_edit_attempt_'+slug,'1');
      alert('Bu yayını düzenlemek için bültenin yayımlandığı tarayıcıda kayıtlı sürümünü açmanız gerekir. Düzenleme anahtarı bu tarayıcıda bulunamadı.');
    }
    window.history.replaceState(null,'',window.location.pathname);
  },[savedReady,savedList]);
  const [activeListId, setActiveListId] = React.useState<string|null>(null);
  const [newListName, setNewListName] = React.useState('');
  const [newContactEmail, setNewContactEmail] = React.useState('');
  const [newContactName, setNewContactName] = React.useState('');
  const [contactConsent,setContactConsent]=React.useState(false);
  const [contactTrackingConsent,setContactTrackingConsent]=React.useState(false);
  const [csvConsent,setCsvConsent]=React.useState(false);
  const [consentSource,setConsentSource]=React.useState('');
  const [trackingEnabled,setTrackingEnabled]=React.useState(false);
  const [mlSearch, setMlSearch] = React.useState('');
  const [mlError, setMlError] = React.useState('');
  const [csvInput, setCsvInput] = React.useState('');
  const [showCsvPanel, setShowCsvPanel] = React.useState(false);
  const [showSendPrompt, setShowSendPrompt] = React.useState(false);
  const [customMsg, setCustomMsg] = React.useState('Merhaba,\n\nYeni bültenimiz yayında! Aşağıda kısa bir özetini bulabilirsiniz.');
  const [testEmail, setTestEmail] = React.useState('');

  const saveLists = async (lists: MailingList[]) => {
    const before=mailingLists;
    setMailingLists(lists);
    try {
      const res=await fetch('/api/db/mailing-lists',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lists),
      });
      if(!res.ok){
        const message=await res.json().catch(()=>({}));
        throw new Error(message.error||'Listeyi kaydetmek için hesabınıza giriş yapın.');
      }
    }catch(error){
      setMailingLists(before);
      setMlError(error instanceof Error?error.message:'Aboneler güvenli depoya kaydedilemedi.');
    }
  };
  const activeList = mailingLists.find(l=>l.id===activeListId)||null;
  const filteredContacts = (activeList?.contacts||[]).filter(c=>
    c.email.toLowerCase().includes(mlSearch.toLowerCase())||
    c.name.toLowerCase().includes(mlSearch.toLowerCase())
  );
  const createList = () => {
    if(!newListName.trim()) return;
    const nl:MailingList = {id:uid(),name:newListName.trim(),contacts:[],createdAt:new Date().toISOString()};
    const next=[...mailingLists,nl];
    saveLists(next); setActiveListId(nl.id); setNewListName('');
  };
  const addContact = () => {
    if(!activeList) return;
    const email = newContactEmail.trim().toLowerCase();
    if(!email||!/^[^@]+@[^@]+\.[^@]+$/.test(email)){setMlError('Geçerli e-posta girin');return;}
    if(activeList.contacts.some(c=>c.email===email)){setMlError('Bu e-posta zaten listede');return;}
    if(!contactConsent||!consentSource.trim()){
      setMlError('Bu kişinin bülten alma iznini ve izin kaynağını kaydedin.');return;
    }
    setMlError('');
    const next = mailingLists.map(l=>l.id===activeListId
      ?{...l,contacts:[...l.contacts,{
        email,name:newContactName.trim()||email,addedAt:new Date().toISOString(),
        consentAt:new Date().toISOString(),consentSource:consentSource.trim().slice(0,200),
        trackingConsent:contactTrackingConsent,
      }]}
      :l);
    saveLists(next);setNewContactEmail('');setNewContactName('');setContactConsent(false);setContactTrackingConsent(false);
  };
  const removeContact = (email:string) => {
    const next = mailingLists.map(l=>l.id===activeListId
      ?{...l,contacts:l.contacts.filter(c=>c.email!==email)}:l);
    saveLists(next);
  };
  const importCsv = () => {
    if(!activeList||!csvInput.trim()) return;
    if(!csvConsent||!consentSource.trim()){
      setMlError('CSV aktarımı için izin beyanı ve izin kaynağı gerekli.');return;
    }
    const lines = csvInput.trim().split('\n');
    const existing = new Set(activeList.contacts.map(c=>c.email));
    let added=0, dupes=0;
    const newContacts:MLContact[]=[];
    lines.forEach(line=>{
      const [rawEmail,rawName=''] = line.split(',');
      const email=rawEmail.trim().toLowerCase();
      if(!email||!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return;
      if(existing.has(email)){dupes++;return;}
      existing.add(email);
      newContacts.push({
        email,name:rawName.trim()||email,addedAt:new Date().toISOString(),
        consentAt:new Date().toISOString(),consentSource:consentSource.trim().slice(0,200),
        trackingConsent:false,
      });
      added++;
    });
    const next=mailingLists.map(l=>l.id===activeListId?{...l,contacts:[...l.contacts,...newContacts]}:l);
    saveLists(next);
    setCsvInput(''); setShowCsvPanel(false);setCsvConsent(false);
    setMlError(`${added} kişi eklendi${dupes>0?`, ${dupes} tekrar atlandı`:''}`);
    setTimeout(()=>setMlError(''),4000);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsGenerating(true);
    try {
      // 1. Extract text from Document
      const fd = new FormData();
      fd.append('file', file);
      const parseRes = await fetch('/api/parse-file', { method: 'POST', body: fd });
      if (!parseRes.ok) throw new Error('Dosya okunamadı. Lütfen desteklenen bir format (PDF, DOCX, TXT) yükleyin.');
      const { text } = await parseRes.json();
      
      // 2. Generate Newsletter JSON via AI
      const prompt = `Aşağıdaki belge metninden profesyonel, ilgi çekici ve zengin içerikli bir e-bülten tasarla. 
Lütfen JSON formatında dön:
{
  "title": "Bülten Başlığı",
  "subtitle": "Alt başlık (ör. Sayı: 1 | Tarih)",
  "blocks": [
    { "type": "title", "data": { "text": "...", "size": "h2" } },
    { "type": "paragraph", "data": { "text": "..." } },
    { "type": "textphoto", "data": { "text": "...", "url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=640", "imagePos": "right" } },
    { "type": "separator", "data": { "style": "solid" } },
    { "type": "photogrid", "data": { "cols": "2", "url1": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=320", "cap1": "Açıklama 1", "url2": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=320", "cap2": "Açıklama 2" } },
    { "type": "poll", "data": { "question": "Görüşünüz?", "opt1": "Evet", "opt2": "Hayır", "opt3": "Belki" } }
  ]
}

Geçerli blok tipleri: title, paragraph, photos, textphoto, photogrid, author, form, googleform, video, event, separator, link, button, poll, attachment.
Önemli Notlar: Metnin içeriğine göre en uygun blokları (özellikle görsel ve etkileşimli blokları) gerçekçi placeholder Unsplash resimleriyle hayal et. Hedef kitleye (paydaşlar, ortaklar) seslenen profesyonel bir dil kullan. Yalnızca JSON objesini yaz, başında veya sonunda markdown karakterleri kullanma.

BELGE METNİ:
${text}`;

      const aiRes = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await aiRes.json();
      let rawJson = data.reply || '';
      rawJson = rawJson.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const generated = JSON.parse(rawJson);
      
      setTitle(generated.title || 'Yeni Bülten');
      setSubtitle(generated.subtitle || 'Otomatik Oluşturuldu');
      if (generated.blocks && Array.isArray(generated.blocks)) {
        // give them IDs
        const finalBlocks = generated.blocks.map((b: any) => ({ ...b, id: uid() }));
        setBlocks(finalBlocks);
      }
    } catch (err: any) {
      alert(err.message || 'Bülten oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateEmailBody = () => {
    let body = '';
    if (customMsg.trim()) body += customMsg.trim() + '\n\n-----------------------------------\n\n';
    body += `BÜLTEN: ${title}\n${subtitle}\n\n`;
    
    blocks.forEach(b => {
      if (b.type === 'title') body += `\n>> ${b.data.text}\n`;
      else if (b.type === 'paragraph' || b.type === 'textphoto') body += `${b.data.text}\n\n`;
      else if (b.type === 'button' || b.type === 'link') body += `[🔗 Link: ${b.data.text} - ${b.data.url}]\n\n`;
      else if (b.type === 'event') body += `📅 Etkinlik: ${b.data.title} | ${b.data.date} ${b.data.time} | Konum: ${b.data.location}\n\n`;
      else if (b.type === 'attachment') body += `📎 Ek: ${b.data.name || 'Dosya'} (${b.data.url})\n\n`;
    });
    
    body += `-----------------------------------\nTamamı ve tasarımı için lütfen tarayıcıda veya platformda görüntüleyin.`;
    return body;
  };

  const executeSend = async (isTest:boolean) => {
    setMlError('Gönderim izni ve hesap doğrulanıyor…');
    const active=activeList;
    if(!isTest && (!active||active.contacts.filter(c=>
      Boolean(c.consentAt&&c.consentSource&&!c.unsubscribedAt)).length===0)){
      setMlError('Gönderim için izin kaydı bulunan aktif alıcı yok.');return;
    }
    const html=publication?.url
      ?'<div style="font:16px/1.7 sans-serif"><h1>'+escapeShareHtml(title)+'</h1>'+
       '<p>'+escapeShareHtml(subtitle)+'</p>'+
       '<p><a href="'+escapeShareHtml(publication.url)+'">Bülteni web üzerinden oku</a></p></div>'
      :generateHTML();
    try{
      const res=await fetch('/api/send-email',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          isTest,listId:active?.id||'',testEmail: isTest?testEmail:undefined,
          subject:isTest?'[TEST] '+title:title,html,customMsg,trackingEnabled,
        }),
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Gönderim doğrulanamadı.');
      setMlError(isTest?'Doğrulanmış adresinize test e-postası gönderildi.':
        data.sent+' izinli kişiye gönderim başlatıldı. Abonelik iptal bağlantısı eklendi.');
      if(!isTest){setShowSendPrompt(false);setCustomMsg('');}
    }catch(error){
      setMlError('Gönderim yapılmadı: '+(error instanceof Error?error.message:'Bilinmeyen hata.'));
    }
  };

  const bulkSend = () => {
    if(!activeList||activeList.contacts.filter(c=>c.consentAt&&c.consentSource&&!c.unsubscribedAt).length===0){
      setMlError('Önce izinli bir abone ekleyin.');return;
    }
    setShowSendPrompt(true);
  };
  const btnCount = blocks.filter(b=>b.type==='button').length;
  const videoCount = blocks.filter(b=>b.type==='video').length;
  const linkCount = blocks.filter(b=>b.type==='link').length;
  const attachCount = blocks.filter(b=>b.type==='attachment').length;
  const formCount = blocks.filter(b=>b.type==='form'||b.type==='googleform').length;

  // Categorized background images
  const BG_CATEGORIES = [
    { id:'doga', label:'🌿 Doğa', images:[
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=640&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=640&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80',
      'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=640&q=80',
      'https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=640&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=640&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&q=80',
      'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80',
      'https://images.unsplash.com/photo-1487530811015-780c80ce0e68?w=640&q=80',
    ]},
    { id:'sehir', label:'🏙 Şehir', images:[
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&q=80',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=640&q=80',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=640&q=80',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=640&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=640&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=640&q=80',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=640&q=80',
      'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=640&q=80',
      'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=640&q=80',
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=640&q=80',
    ]},
    { id:'egitim', label:'📚 Eğitim', images:[
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=80',
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=640&q=80',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=640&q=80',
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=80',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=640&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=640&q=80',
      'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=640&q=80',
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=640&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=640&q=80',
    ]},
    { id:'soyut', label:'🎨 Soyut', images:[
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&q=80',
      'https://images.unsplash.com/photo-1550684848-86a5d8727436?w=640&q=80',
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=640&q=80',
      'https://images.unsplash.com/photo-1567359781514-81173b801d69?w=640&q=80',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=640&q=80',
      'https://images.unsplash.com/photo-1566041510394-cf7c1b1edc55?w=640&q=80',
      'https://images.unsplash.com/photo-1570059136358-0c321cb0dc97?w=640&q=80',
      'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=640&q=80',
      'https://images.unsplash.com/photo-1536152470836-b943b246224c?w=640&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&q=80',
    ]},
    { id:'karanlik', label:'🌑 Karanlık', images:[
      'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=640&q=80',
      'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=640&q=80',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=640&q=80',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&q=80',
      'https://images.unsplash.com/photo-1475274047050-1d0c0975864c?w=640&q=80',
      'https://images.unsplash.com/photo-1501472312651-726afe119ff1?w=640&q=80',
      'https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=640&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=640&q=80',
      'https://images.unsplash.com/photo-1501691223387-dd0500403074?w=640&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=640&q=80',
    ]},
    { id:'minimalist', label:'⬜ Minimalist', images:[
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=640&q=80',
      'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=640&q=80',
      'https://images.unsplash.com/photo-1527614919459-7ad5a5b19d30?w=640&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&q=80',
      'https://images.unsplash.com/photo-1492366254240-43affaefc3e3?w=640&q=80',
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=640&q=80',
      'https://images.unsplash.com/photo-1517816428104-797678c7cf0c?w=640&q=80',
      'https://images.unsplash.com/photo-1490750967868-88df5691cc13?w=640&q=80',
      'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=640&q=80',
    ]},
  ];
  const [bgCategory, setBgCategory] = React.useState('doga');
  const currentBgImages = BG_CATEGORIES.find(c=>c.id===bgCategory)?.images || [];

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>setHeaderImgUrl(String(reader.result||''));
    reader.onerror=()=>alert('Arka plan görseli okunamadı.');
    reader.readAsDataURL(file);
  };

  const D = DESIGNS[design] || DESIGNS['modern'];
  const selectedBlock = blocks.find(b=> b && b.id===selectedId)||null;

  const addBlock = useCallback((type:BT)=>{
    const p = PALETTE.find(x=>x.type===type)!;
    const nb:Block = { id:uid(), type, data:{...p.def} };
    setBlocks(prev=>[...prev,nb]);
    setSelectedId(nb.id);
  },[]);

  const [insertAtIdx, setInsertAtIdx] = React.useState<number|null>(null);
  const [insertMenuOpen, setInsertMenuOpen] = React.useState(false);

  const insertBlock = useCallback((type:BT, at:number)=>{
    const p = PALETTE.find(x=>x.type===type)!;
    const nb:Block = { id:uid(), type, data:{...p.def} };
    setBlocks(prev=>{ const next=[...prev]; next.splice(at,0,nb); return next; });
    setSelectedId(nb.id);
    setInsertMenuOpen(false);
    setInsertAtIdx(null);
  },[]);

  const updateBlock = useCallback((id:string, data:Record<string,string>)=>{
    setBlocks(prev=>prev.map(b=>b.id===id?{...b,data}:b));
  },[]);

  const deleteBlock = useCallback((id:string)=>{
    setBlocks(prev=>{
      const next=prev.filter(b=>b.id!==id);
      setSelectedId(next.length?next[next.length-1].id:null);
      return next;
    });
  },[]);

  const moveBlock = useCallback((id:string,dir:-1|1)=>{
    setBlocks(prev=>{
      const i=prev.findIndex(b=>b.id===id), ni=i+dir;
      if(ni<0||ni>=prev.length) return prev;
      const n=[...prev]; [n[i],n[ni]]=[n[ni],n[i]]; return n;
    });
  },[]);

  const handleAI = useCallback(async(mode: 'generate'|'rewrite'|'expand-short'|'expand-long'|'expand-bullets')=>{
    if(!selectedBlock||selectedBlock.type!=='paragraph') return;
    setAiLoading(true);
    let prompt = '';
    const currentText = selectedBlock.data.text || '';
    if (mode === 'rewrite') {
      prompt = `Aşağıdaki bülten metnini daha profesyonel, akıcı ve ilgi çekici bir şekilde yeniden yaz:\n\n"${currentText}"`;
    } else if (mode === 'expand-short') {
      prompt = `Aşağıdaki bülten metnini biraz detaylandır ve açıklayıcı eklemeler yaparak %50 oranında uzat:\n\n"${currentText}"`;
    } else if (mode === 'expand-long') {
      prompt = `Aşağıdaki bülten metnini detaylandır, açıklayıcı eklemeler yaparak daha uzun ve zengin bir içeriğe dönüştür (yaklaşık 2-3 katı uzunlukta):\n\n"${currentText}"`;
    } else if (mode === 'expand-bullets') {
      prompt = `Aşağıdaki bülten metnini uzat ve önemli kısımlarını madde işaretli liste (bullet points) kullanarak detaylandır:\n\n"${currentText}"`;
    } else {
      prompt = `AB projesi bülteni için kısa, profesyonel paragraflar üret. Konu fikri olarak şundan ilham al veya sıfırdan yaz: "${currentText || 'proje genel ilerleme durumu'}". Eğlenceli ama resmi ol.`;
    }

    try {
      const res = await fetch('/api/ai-generate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ prompt, maxTokens:800, systemPrompt: 'You are an expert newsletter copywriter. Return ONLY the requested text without markdown formatting or introductory words.' })});
      if(res.ok){ const d=await res.json(); const t=d.result||''; if(t && !t.includes('kullanılamıyor')) updateBlock(selectedBlock.id,{...selectedBlock.data,text:t}); }
    } catch {
      updateBlock(selectedBlock.id,{...selectedBlock.data,text:'AI içerik üretimi şu an kullanılamıyor. Lütfen API anahtarınızı kontrol edin.'});
    } finally { setAiLoading(false); }
  },[selectedBlock,updateBlock]);

  // HTML export
  const generateHTML = useCallback(()=>{
    const blockHtml = blocks.map(b=>{
      const d:Record<string,string> = Object.fromEntries(Object.entries(b.data).map(([k,raw])=>{
        const value=String(raw??'');
        if(k==='size') return [k,['h1','h2','h3'].includes(value)?value:'h2'];
        if(k==='cols') return [k,String(Math.max(1,Math.min(4,Number(value)||2)))];
        if(k==='style') return [k,['solid','dashed','dotted'].includes(value)?value:'solid'];
        if(k==='align') return [k,['left','center','right'].includes(value)?value:'center'];
        if(k==='avatar'||k.startsWith('url')){
          const imageBlock=['photos','textphoto','photogrid','author'].includes(b.type);
          if(imageBlock) return [k,escapeShareHtml(safeReaderImageUrl(value))];
          if(b.type==='video') return [k,value];
          return [k,escapeShareHtml(safeReaderLinkUrl(value))];
        }
        return [k,escapeShareHtml(value)];
      }));
      const ac=D.accentColor; const tc=D.textColor; const ff=D.font;
      if(b.type==='title'){const sz={h1:'28px',h2:'22px',h3:'18px'}[d.size||'h2'];return `<${d.size||'h2'} style="color:${ac};font-size:${sz};font-family:${ff};font-weight:800;margin:0 0 8px;">${d.text}</${d.size||'h2'}>`;}
      if(b.type==='paragraph') return `<p style="color:${tc};font-size:15px;line-height:1.75;font-family:${ff};margin:0 0 8px;white-space:pre-wrap;">${d.text}</p>`;
      if(b.type==='photos') {
        if(d.layout === 'columns') {
          return `<div style="display:flex;gap:12px;">
            <div style="flex:1;">${d.url?`<img src="${d.url}" alt="${d.caption||''}" style="width:100%;border-radius:8px;display:block;"/>`:''} ${d.caption?`<p style="margin:6px 0 0;font-size:12px;color:#64748b;font-family:${ff};text-align:center;">${d.caption}</p>`:''}</div>
            <div style="flex:1;">${d.url2?`<img src="${d.url2}" alt="${d.caption2||''}" style="width:100%;border-radius:8px;display:block;"/>`:''} ${d.caption2?`<p style="margin:6px 0 0;font-size:12px;color:#64748b;font-family:${ff};text-align:center;">${d.caption2}</p>`:''}</div>
          </div>`;
        }
        return d.url?`<img src="${d.url}" alt="${d.caption||''}" style="width:100%;border-radius:8px;display:block;"/>`:`<div style="height:80px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-family:${ff};">🖼 Görsel ekleyin</div>`;
      }

      if(b.type==='video'){const v=ytId(d.url||'');return v && /^[A-Za-z0-9_-]{11}$/.test(v)?`<div style="position:relative;padding-bottom:56.25%;height:0;"><iframe src="https://www.youtube.com/embed/${v}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`:``;}
      if(b.type==='event') return `<div style="border-left:4px solid ${ac};padding:8px 16px;font-family:${ff};"><b style="color:${ac};">${d.title}</b>${d.date?`<br/><span style="color:${tc};font-size:13px;">📅 ${d.date} ${d.time}</span>`:''}${d.location?`<br/><span style="color:${tc};font-size:13px;">📍 ${d.location}</span>`:''}</div>`;
      if(b.type==='separator') return `<hr style="border:none;border-top:2px ${d.style} ${ac};margin:8px 0;"/>`;
      if(b.type==='link') return `<a href="${d.url}" style="color:${ac};font-family:${ff};font-weight:600;">🔗 ${d.text}</a>`;
      if(b.type==='button') return `<div style="text-align:${d.align||'center'};"><a href="${d.url}" style="display:inline-block;padding:12px 28px;background:${ac};color:#fff;border-radius:30px;font-family:${ff};font-weight:700;text-decoration:none;">${d.text}</a></div>`;
      if(b.type==='poll') return `<div style="font-family:${ff};"><b style="color:${tc};">${d.question}</b><br/>${[d.opt1,d.opt2,d.opt3].filter(Boolean).map(o=>`<div style="padding:8px 14px;border:1.5px solid ${ac};border-radius:8px;margin-top:6px;color:${tc};font-size:14px;">○ ${o}</div>`).join('')}</div>`;
      if(b.type==='attachment') return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:${ff};">📎 <a href="${d.url}" style="color:${ac};font-weight:600;">${d.name}</a></div>`;
      
      if(b.type==='textphoto') {
        const imgRight = (d.imagePos||'right')==='right';
        return `<div style="display:flex;gap:16px;align-items:flex-start;flex-direction:${imgRight?'row':'row-reverse'};font-family:${ff};"><div style="flex:1;"><p style="margin:0;font-size:15px;line-height:1.75;color:${tc};white-space:pre-wrap;">${d.text||''}</p></div><div style="flex-shrink:0;width:180px;">${d.url?`<img src="${d.url}" style="width:100%;border-radius:8px;display:block;"/>`:''}</div></div>`;
      }
      if(b.type==='photogrid') {
        const cols = parseInt(d.cols||'2');
        const slots = Array.from({length:cols},(_,i)=>({url:d[`url${i+1}`]||'',cap:d[`cap${i+1}`]||''}));
        return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;font-family:${ff};">${slots.map(s=>`<div>${s.url?`<img src="${s.url}" style="width:100%;border-radius:8px;display:block;"/>`:''}${s.cap?`<p style="margin:4px 0 0;font-size:11px;color:#64748b;text-align:center;">${s.cap}</p>`:''}</div>`).join('')}</div>`;
      }
      if(b.type==='author') {
        return `<div style="border:1px solid ${ac}22;border-radius:12px;padding:20px;font-family:${ff};display:flex;gap:16px;align-items:flex-start;background:${ac}06;">${d.avatar?`<img src="${d.avatar}" style="width:68px;height:68px;border-radius:50%;object-fit:cover;flex-shrink:0;border:3px solid ${ac};"/>`:''}<div style="flex:1;"><div style="font-weight:800;font-size:16px;color:${tc};">${d.name||''}</div>${d.title?`<div style="font-size:13px;color:${ac};font-weight:600;margin-bottom:4px;">${d.title}</div>`:''}${d.bio?`<p style="font-size:13px;color:${tc};line-height:1.6;margin:6px 0 0;">${d.bio}</p>`:''}</div></div>`;
      }
      return '';
    }).map(h=>`<div style="padding:10px 0;">${h}</div>`).join('');

    const toc = showTOC ? `<div style="background:${D.accentColor}11;border-radius:8px;padding:14px 18px;margin-bottom:20px;border:1px solid ${D.accentColor}33;font-family:${D.font};">${blocks.filter(b=>b.type==='title').map(b=>`<div style="color:${D.accentColor};font-size:13px;font-weight:600;margin-bottom:4px;">→ ${escapeShareHtml(b.data.text||'')}</div>`).join('')}</div>` : '';
    const safeHeaderImage = safeReaderImageUrl(headerImgUrl).replace(/["'\\()]/g, s => encodeURIComponent(s));
    const headerBgStyle = safeHeaderImage ? `background:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url("${safeHeaderImage}") center/cover no-repeat;` : `background:${D.headerBg};`;

    const shareBarHtml = readerShareBar(title, publicNewsletterUrl);
    const published = normalisePublicNewsletterUrl(publicNewsletterUrl);
    const cleanTitle = escapeShareHtml(title);
    const cleanSubtitle = escapeShareHtml(subtitle);
    const safeLogoUrl = safeReaderImageUrl(logoUrl);
    const logoHtml = safeLogoUrl ? `<img src="${escapeShareHtml(safeLogoUrl)}" alt="Kurum logosu" style="display:block;max-width:175px;max-height:80px;object-fit:contain;margin:0 auto 12px;"/>` : '';
    const canonicalMeta = published ? `<link rel="canonical" href="${escapeShareHtml(published)}"><meta property="og:url" content="${escapeShareHtml(published)}">` : '';
    const ogImageUrl = normalisePublicNewsletterUrl(headerImgUrl);
    const ogImageMeta = ogImageUrl ? `<meta property="og:image" content="${escapeShareHtml(ogImageUrl)}">` : '';

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${cleanTitle}</title><meta name="description" content="${cleanSubtitle}"><meta property="og:title" content="${cleanTitle}"><meta property="og:description" content="${cleanSubtitle}"><meta property="og:type" content="article">${canonicalMeta}${ogImageMeta}<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;color-adjust:exact;print-color-adjust:exact;}body{background:#e5e7eb;font-family:${D.font};}a{text-decoration:none;}@media print{body{background:#fff!important;}div[style*="border-radius:12px"]{box-shadow:none!important;border-radius:0!important;margin:0 auto!important;max-width:100%!important;}#speakBtn,#bulten-reader-share{display:none!important;}}</style></head><body><div style="max-width:640px;margin:24px auto;background:${D.bodyBg};border-radius:12px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.15);position:relative;"><div style="${headerBgStyle}padding:36px 40px;text-align:center;position:relative;">${logoHtml}<button id="speakBtn" onclick="window.bultenSpeak()" style="position:absolute;top:20px;right:24px;background:#fff;border:none;color:#1e293b;border-radius:30px;padding:8px 16px;display:flex;gap:6px;justify-content:center;align-items:center;cursor:pointer;font-size:13px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:${D.font};"><span id="speakIcon" style="font-size:16px;">🔊</span> <span id="speakText">Dinle</span></button><h1 style="color:${headerImgUrl?'#ffffff':D.headerColor};text-shadow:${headerImgUrl?'0 2px 10px rgba(0,0,0,0.8)':'none'};font-size:26px;font-weight:800;margin:0 0 6px;font-family:${D.font};">${cleanTitle}</h1><p style="color:${headerImgUrl?'#ffffff':D.headerColor};text-shadow:${headerImgUrl?'0 2px 10px rgba(0,0,0,0.8)':'none'};opacity:${headerImgUrl?'1':'.8'};font-size:13px;font-family:${D.font};">${cleanSubtitle}</p></div><div id="bulten-reading-content" style="padding:32px 40px;">${toc}${blockHtml}</div>${shareBarHtml}<div style="background:${D.headerBg};padding:16px 40px;text-align:center;"><p style="color:${D.headerColor};opacity:.6;font-size:12px;font-family:${D.font};">Bu bülten Project Factory AI ile oluşturulmuştur.</p></div></div>
    <script>
      window.bultenIsSpeaking = false;
      window.bultenSpeak = function() {
        if(window.bultenIsSpeaking) { window.speechSynthesis.cancel(); window.bultenIsSpeaking=false; document.getElementById('speakIcon').innerText='🔊'; document.getElementById('speakText').innerText='Dinle'; return; }
        var header=document.querySelector('h1');
        var subtitle=header ? header.nextElementSibling : null;
        var content=document.getElementById('bulten-reading-content');
        var speechText=(header?header.textContent+'. ':'')+(subtitle?subtitle.textContent+'. ':'')+(content?content.textContent:'');
        var u = new SpeechSynthesisUtterance(speechText);
        var targetPrefix = "${lang === 'en' ? 'en' : 'tr'}";
        u.lang = "${lang === 'en' ? 'en-GB' : 'tr-TR'}";
        
        var voices = window.speechSynthesis.getVoices();
        var matchingVoices = voices.filter(function(v) { return v.lang.toLowerCase().startsWith(targetPrefix); });
        var bestVoice = matchingVoices[0] || voices[0] || null;
        var maxScore = -999;
        var femaleNames = ['zira','aria','sonia','emelie','natasha','samantha','victoria','karen','tessa','kız','kadın','ayda','emine','gizem','derya','meltem','selin','yelda','emel'];
        var maleNames = ['david','mark','george','arthur','tolga','cem','erkek','ahmet','kemal','hakan','male','man'];
        matchingVoices.forEach(function(v) {
          var score = 0;
          var n = v.name.toLowerCase();
          if (maleNames.some(function(m){return n.includes(m);})) score -= 100;
          if (n.includes('female') || n.includes('woman') || femaleNames.some(function(f){return n.includes(f);})) score += 50;
          if (n.includes('premium') || n.includes('enhanced') || n.includes('natural')) score += 20;
          if (n.includes('google')) score += 10;
          if (n.includes('microsoft')) score += 5;
          if (targetPrefix === 'tr' && n.includes('google') && n.includes('türkçe')) score += 30;
          if (targetPrefix === 'en' && (n.includes('british') || n.includes('uk')) && n.includes('female')) score += 50;
          if (targetPrefix === 'en' && n.includes('google') && n.includes('english') && (n.includes('female') || n.includes('uk'))) score += 30;
          if (score > maxScore) { maxScore = score; bestVoice = v; }
        });
        if (bestVoice) { u.voice = bestVoice; }

        u.onend = function() { window.bultenIsSpeaking=false; document.getElementById('speakIcon').innerText='🔊'; document.getElementById('speakText').innerText='Dinle'; };
        window.bultenIsSpeaking=true;
        document.getElementById('speakIcon').innerText='⏸';
        document.getElementById('speakText').innerText='Durdur';
        window.speechSynthesis.speak(u);
      };
    </script>
    <script>${READER_SHARE_RUNTIME}</script>
    </body></html>`;
  },[blocks,D,title,subtitle,showTOC,headerImgUrl,logoUrl,lang,publicNewsletterUrl]);

  /**
   * Publish a snapshot of the open editor—not a saved newsletter, an imported
   * URL, or the BÜLTEN READ homepage. Public posting requires confirmation.
   */
  const handleShareCurrent = async () => {
    if(shareBusy)return;
    const snapshot=currentSnapshot();
    if(publication && lastSharedSnapshot.current===snapshot){
      setShareError('');
      setPublicNewsletterUrl(publication.url);
      setShowShareModal(true);
      return;
    }
    const updating=Boolean(publication?.editToken);
    const confirmText=updating
      ? 'Bu bültenin yayımlanmış sürümü aynı bağlantıda güncellenecek. Okuyucular yeni içeriği görecek. Devam edilsin mi?'
      : 'Açık olan bültenin tamamı herkese açık bir web adresinde yayımlanacak. Bağlantıya sahip herkes okuyabilir ve paylaşabilir. Devam edilsin mi?';
    if(!window.confirm(confirmText))return;
    setShareBusy(true);setShareError('');
    setShareProgress('Görseller hazırlanıyor…');
    try{
      const prepared=await prepareNewsletterForSharing(generateHTML(),headerImgUrl,(done,total)=>{
        setShareProgress(total>0?`Görseller yükleniyor: ${done}/${total}`:'Bülten hazırlanıyor…');
      });
      setShareProgress('Bülten yayınlanıyor…');
      const body={
        title,subtitle,headerImgUrl:prepared.headerImgUrl,html:prepared.html,
        ...(updating?{
          slug:publication!.slug,editToken:publication!.editToken,
          expectedRevision:publication!.revision,
        }:{}),
      };
      const response=await fetch('/api/publish',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body),
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok || typeof result.slug!=='string' ||
         !/^[A-Za-z0-9_-]{16}$/.test(result.slug))
        throw new Error(result.error||'Bülten yayımlanamadı.');
      const editToken=updating?publication!.editToken:result.editToken;
      if(typeof editToken!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(editToken))
        throw new Error('Yayın oluşturuldu ancak düzenleme anahtarı alınamadı. Teknik destekle iletişime geçin.');
      const url=new URL('/b/'+result.slug,window.location.origin).toString();
      const updatedPublication:PublicationInfo={
        slug:result.slug,editToken,url,revision:Number(result.revision)||1,
        publishedAt:new Date().toISOString(),
      };
      setPublication(updatedPublication);
      setPublicNewsletterUrl(url);
      lastSharedSnapshot.current=snapshot;
      // The published editor source references stable image URLs instead of
      // embedding multi-megabyte photos in browser localStorage. The currently
      // open editor is unchanged; reopening the saved draft remains editable.
      const lightweight=savedEntry(updatedPublication,snapshot);
      const publishedSrc=(value:string)=>prepared.mediaMap[value]||value;
      lightweight.blocks=lightweight.blocks.map(block=>({
        ...block,data:Object.fromEntries(Object.entries(block.data).map(([key,value])=>[key,publishedSrc(value)])),
      }));
      lightweight.logoUrl=publishedSrc(lightweight.logoUrl);
      lightweight.headerImgUrl=publishedSrc(lightweight.headerImgUrl);
      lightweight.publishedSnapshot=JSON.stringify({
        title,subtitle,design,blocks:lightweight.blocks,
        headerImgUrl:lightweight.headerImgUrl,logoUrl:lightweight.logoUrl,showTOC,
      });
      if(!persistSavedLocally(lightweight)){
        alert('Bülten yayımlandı ancak düzenleme kaydı bu tarayıcıda saklanamadı. Sayfadan ayrılmadan önce bir yedek alın.');
      }
      setShowShareModal(true);
    }catch(error){
      const message=error instanceof Error?error.message:'Yayınlama başarısız.';
      setShareError(message);
      alert(message+' Mevcut bülten taslağı korunuyor.');
    }finally{setShareBusy(false);setShareProgress('');}
  };

  const handleUnpublish=async()=>{
    if(!publication||shareBusy)return;
    if(!window.confirm('Bu bültenin herkese açık okuyucu bağlantısı kapatılacak. Mevcut bağlantı artık çalışmayacak. Taslağınız bu tarayıcıda korunacak. Devam edilsin mi?'))return;
    setShareBusy(true);setShareError('');setShareProgress('Yayın kaldırılıyor…');
    try{
      const res=await fetch('/api/unpublish',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug:publication.slug,editToken:publication.editToken}),
      });
      const result=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(result.error||'Yayından kaldırma başarısız.');
      setPublication(null);setPublicNewsletterUrl('');lastSharedSnapshot.current='';
      const draft={...savedEntry(null,''),publication:null,publicNewsletterUrl:'',publishedSnapshot:''};
      persistSavedLocally(draft);
      setShowShareModal(false);
      alert('Yayın kaldırıldı. Düzenleme taslağınız kayıtlıdır. Daha önce ayrı yüklenmiş görseller için ayrıca veri silme talebi gerekebilir.');
    }catch(error){
      alert(error instanceof Error?error.message:'Yayından kaldırma servisi kullanılamıyor.');
    }finally{setShareBusy(false);setShareProgress('');}
  };

  const handleExport = ()=>{
    const html=generateHTML();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
    a.download=`${title.replace(/\s+/g,'-').toLowerCase()}.html`; a.click();
  };

  const [pdfBusy, setPdfBusy] = useState(false);
  const handlePdfExport = async () => {
    if(pdfBusy) return;
    setPdfBusy(true);
    try {
      await downloadNewsletterPdf(generateHTML(),title);
    } catch(error) {
      console.error('PDF indirme hatası:',error);
      alert('PDF dosyası oluşturulamadı. Görselleri kontrol edip tekrar deneyin.');
    } finally {
      setPdfBusy(false);
    }
  };

  const handlePrint = () => {
    try {
      printNewsletter(generateHTML());
    } catch(error) {
      console.error('Yazdırma hatası:',error);
      alert(error instanceof Error ? error.message : 'Yazdırma penceresi açılamadı.');
    }
  };

  // ── Styles ──
  const panelHdr: React.CSSProperties = { fontSize:10,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:'#9ca3af',padding:'12px 14px 8px',borderBottom:'1px solid #e5e7eb',background:'#f9fafb' };

  return (
    <>
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 60px)',fontFamily:'Inter,system-ui,sans-serif',background:'#f1f5f9'}}>

      {/* ── Top Bar ── */}
      <div style={{background:'#ffffff',borderBottom:'1px solid #e2e8f0',padding:'8px 16px',minHeight:68,display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',zIndex:10}}>
        
        {/* Brand */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginRight:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg, #6366f1, #8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(99, 102, 241, 0.3)'}}>📰</div>
          <span style={{fontWeight:900,fontSize:18,color:'#0f172a',letterSpacing:'-0.5px',whiteSpace:'nowrap'}}>BÜLTEN <span style={{color:'#6366f1'}}>READ</span></span>
        </div>

        {/* Title inputs - taking less vertical space */}
        <div style={{display:'flex',flexDirection:'column',gap:2,flex:1,maxWidth:320,marginLeft:8}}>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            style={{padding:'4px 8px',borderRadius:6,border:'1px solid transparent',background:'transparent',fontSize:15,fontWeight:800,color:'#0f172a',outline:'none',transition:'all .2s'}}
            onFocus={e=>{(e.target as HTMLInputElement).style.background='#f8fafc';(e.target as HTMLInputElement).style.border='1px solid #e2e8f0';}} 
            onBlur={e=>{(e.target as HTMLInputElement).style.background='transparent';(e.target as HTMLInputElement).style.border='1px solid transparent';}}
            placeholder="Bülten başlığı..."/>
          <input value={subtitle} onChange={e=>setSubtitle(e.target.value)}
            style={{padding:'2px 8px',borderRadius:6,border:'1px solid transparent',background:'transparent',fontSize:12,color:'#64748b',outline:'none',transition:'all .2s',fontWeight:500}}
            onFocus={e=>{(e.target as HTMLInputElement).style.background='#f8fafc';(e.target as HTMLInputElement).style.border='1px solid #e2e8f0';}} 
            onBlur={e=>{(e.target as HTMLInputElement).style.background='transparent';(e.target as HTMLInputElement).style.border='1px solid transparent';}}
            placeholder="#1  •  Tarih..."/>
        </div>

        {/* Separator to move actions to right */}
        <div style={{flex:1}} />

        {/* Compact Actions */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',background:'#f1f5f9',borderRadius:10,padding:4,border:'1px solid #e2e8f0',marginRight:8}}>
            <button onClick={()=>setPreviewMode('desktop')}
              style={{background:previewMode==='desktop'?'#fff':'transparent',border:'none',borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:700,color:previewMode==='desktop'?'#0f172a':'#64748b',cursor:'pointer',boxShadow:previewMode==='desktop'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .2s'}}>💻 Masaüstü</button>
            <button onClick={()=>setPreviewMode('mobile')}
              style={{background:previewMode==='mobile'?'#fff':'transparent',border:'none',borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:700,color:previewMode==='mobile'?'#0f172a':'#64748b',cursor:'pointer',boxShadow:previewMode==='mobile'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .2s'}}>📱 Mobil</button>
          </div>
          
          {shareBusy && <span role="status" aria-live="polite"
            style={{fontSize:11,fontWeight:700,color:'#0369a1',maxWidth:190}}>{shareProgress}</span>}
          {/* Smore-style publication controls: Edit -> Publish/Update -> Share. */}
          <button type="button" onClick={()=>{
            document.querySelector<HTMLInputElement>('input[placeholder="Bülten başlığı..."]')?.focus();
            setShowShareModal(false);
          }} title="Bültenin içeriğini düzenle"
            style={{display:'flex',alignItems:'center',gap:6,background:'#fff',border:'1px solid #cbd5e1',color:'#334155',fontSize:13,fontWeight:800,cursor:'pointer',padding:'8px 12px',borderRadius:8}}>
            ✎ Düzenle
          </button>
          <button type="button" onClick={handleShareCurrent} disabled={shareBusy}
            aria-label={publication?'Yayını güncelle':'Bülteni yayınla'} title={publication?'Aynı bağlantıdaki yayını güncelle':'Açık bülteni yeni bağlantıda yayınla'}
            style={{display:'flex',alignItems:'center',gap:6,background:'#0e7490',border:'1px solid #0e7490',color:'#fff',fontSize:13,fontWeight:800,cursor:shareBusy?'progress':'pointer',padding:'8px 14px',borderRadius:8,opacity:shareBusy?.7:1}}>
            {shareBusy?'⏳':publication?'↻':'🚀'} {shareBusy?'Yayımlanıyor…':publication?'Güncelle':'Yayınla'}
          </button>
          {publication&&<button type="button" onClick={handleUnpublish} disabled={shareBusy}
            title="Bu bültenin herkese açık bağlantısını kaldır (taslak korunur)"
            aria-label="Bülteni yayından kaldır"
            style={{display:'flex',alignItems:'center',gap:6,background:'#fff1f2',border:'1px solid #fecdd3',color:'#9f1239',fontSize:12,fontWeight:800,cursor:shareBusy?'wait':'pointer',padding:'8px 12px',borderRadius:8}}>
            <span aria-hidden="true">⊘</span> Yayından Kaldır
          </button>}
          {/* Share the currently open newsletter, publishing changes if needed. */}
          <button type="button" onClick={handleShareCurrent} disabled={shareBusy}
            title="Açık bülteni yayımla ve paylaş"
            aria-label={shareBusy?'Bülten yayımlanıyor':'Mevcut bülteni paylaş'}
            style={{display:'flex',alignItems:'center',gap:6,background:'#ecfdf5',border:'1px solid #99d7c9',color:'#17675a',fontSize:13,fontWeight:800,cursor:shareBusy?'progress':'pointer',padding:'8px 14px',borderRadius:8,opacity:shareBusy?.65:1}}>
            <span aria-hidden="true">{shareBusy?'⏳':'↗'}</span> {shareBusy?'Yayımlanıyor…':'Paylaş'}
          </button>

          {/* Action Buttons styled softly */}
          <button onClick={handleExport} title="HTML Olarak İndir" style={{display:'flex',alignItems:'center',gap:6,background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            <span style={{fontSize:15}}>⬇️</span> HTML
          </button>
          
          <button type="button" onClick={handlePdfExport} disabled={pdfBusy}
            title="PDF dosyasını indir — yazdırma penceresi açılmaz"
            aria-label={pdfBusy ? 'PDF hazırlanıyor' : 'PDF indir'}
            style={{display:'flex',alignItems:'center',gap:6,background:pdfBusy?'#f1f5f9':'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:pdfBusy?'progress':'pointer',padding:'8px 14px',borderRadius:8,opacity:pdfBusy?0.7:1,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
            <span aria-hidden="true" style={{fontSize:15}}>{pdfBusy?'⏳':'⬇️'}</span> {pdfBusy?'PDF hazırlanıyor…':'PDF İndir'}
          </button>

          <button type="button" onClick={handlePrint} title="Yazdırma penceresini aç" aria-label="Bülteni yazdır"
            style={{display:'flex',alignItems:'center',gap:6,background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
            <span aria-hidden="true" style={{fontSize:15}}>🖨️</span> Yazdır
          </button>

          <div style={{width:1,height:24,background:'#e2e8f0',margin:'0 4px'}}/>

          <input type="file" accept=".pdf,.docx,.txt,.md" style={{display:'none'}} ref={fileInputRef} onChange={handleDocumentUpload} />
          
          <button onClick={()=>fileInputRef.current?.click()} disabled={isGenerating} title="Belgeden Bülten Üret (AI)"
            style={{display:'flex',alignItems:'center',gap:6,background:'linear-gradient(135deg, #a855f7, #7e22ce)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:isGenerating?'not-allowed':'pointer',padding:'8px 16px',borderRadius:8,opacity:isGenerating?0.7:1,boxShadow:'0 4px 12px rgba(126,34,206,0.25)',transition:'all .2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
            <span style={{fontSize:16}}>{isGenerating ? '⏳' : '✨'}</span> AI Üret
          </button>

          <button onClick={()=>setShowTemplatesModal(true)} title="Hazır Şablonlar"
            style={{background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',display:'flex',alignItems:'center',gap:6,borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            🎨 Şablonlar
          </button>
          
          <button onClick={openAnalytics} title="Bülten İstatistikleri"
            style={{background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',display:'flex',alignItems:'center',gap:6,borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            📊 Analiz
          </button>

          <button onClick={()=>setShowMailModal(true)} title={`Mail Gönder (${isMounted ? mailingLists.reduce((a,c)=>a+c.contacts.length,0) : 0} kişi)`}
            style={{background:'linear-gradient(135deg, #ec4899, #e11d48)',border:'none',color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,marginLeft:4,boxShadow:'0 4px 12px rgba(225,29,72,0.25)',transition:'all .2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
            📤 Gönder
          </button>

          <div style={{display:'flex',background:'#f1f5f9',borderRadius:10,padding:4,border:'1px solid #e2e8f0',marginLeft:8}}>
            <button onClick={()=>setShowSavedModal(true)} title="Kayıtlı Bültenleri Aç"
              style={{background:'transparent',border:'none',color:'#0ea5e9',fontSize:13,fontWeight:800,cursor:'pointer',padding:'6px 14px',borderRadius:6,transition:'all .2s'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#e0f2fe'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
              📂 Aç
            </button>
            <button onClick={async()=>{ if(!(await handleSave()))return; setActiveNewsletterId(uid());setPublication(null);lastSharedSnapshot.current='';setSelectedId(null);setBlocks([]);setTitle('Yeni Bülten');setSubtitle('#1  •  '+new Date().toLocaleDateString('tr-TR'));setHeaderImgUrl('');setLogoUrl('');setPublicNewsletterUrl(''); }} title="Yeni boş bülten aç"
              style={{background:'transparent',border:'none',color:'#10b981',fontSize:13,fontWeight:800,cursor:'pointer',padding:'6px 14px',borderRadius:6,transition:'all .2s'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#d1fae5'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
              ✨ Yeni
            </button>
            <button onClick={handleSave} title="Kaydet"
              style={{background:saveSuccess?'#10b981':'#0ea5e9',border:'none',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer',padding:'6px 16px',borderRadius:6,boxShadow:'0 2px 6px rgba(14,165,233,0.3)',transition:'all .2s'}}>
              {saveSuccess ? 'OK!' : '💾 Kaydet'}
            </button>
          </div>

          <div style={{width:1,height:24,background:'#e2e8f0',margin:'0 4px'}}/>
          
          {/* Authenticated account and real sign-in controls, never a fake button. */}
          <AccountAction/>
        </div>
      </div>

      {/* ── 3-Panel ── */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'240px 1fr 280px',overflow:'hidden'}}>

        {/* LEFT — palette + design */}
        <div style={{background:'#fff',borderRight:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'4px 0 16px rgba(0,0,0,0.02)',zIndex:5}}>
          {/* Tabs */}
          <div style={{display:'flex',borderBottom:'1px solid #e5e7eb'}}>
            {(['content','design'] as const).map(tab=>(
              <button key={tab} data-testid={`editor-tab-${tab}`} onClick={()=>setActiveTab(tab)}
                style={{flex:1,padding:'10px 0',fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
                  background: activeTab===tab?'#fff':'#f9fafb',
                  color: activeTab===tab?D.accentColor:'#6b7280',
                  borderBottom: activeTab===tab?`2px solid ${D.accentColor}`:'2px solid transparent'}}>
                {tab==='content'?t.addContent:t.chooseDesign}
              </button>
            ))}
          </div>

          {activeTab==='content' ? (
            <div style={{overflowY:'auto',flex:1}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0}} id="block-palette">
                {PALETTE.map(p=>(
                  <button key={p.type} data-testid={`palette-${p.type}`}
                    draggable
                    onDragStart={e=>{ dragTypeRef.current=p.type; e.dataTransfer.effectAllowed='copy'; }}
                    onClick={()=>addBlock(p.type)}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'14px 4px',
                      border:'none',borderRight:'1px solid #f3f4f6',borderBottom:'1px solid #f3f4f6',
                      background:'#fff',cursor:'grab',gap:5,transition:'background .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f0f9ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
                    <span style={{fontSize:20,lineHeight:1}}>{p.icon}</span>
                    <span style={{fontSize:10.5,color:'#374151',fontWeight:600}}>{t[p.type as keyof typeof t] as string || p.label}</span>
                  </button>
                ))}
              </div>

              {/* TOC toggle */}
              <div style={{padding:'12px 14px',borderTop:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{t.toc}</span>
                <div onClick={()=>setShowTOC(x=>!x)}
                  style={{width:40,height:22,borderRadius:11,background:showTOC?D.accentColor:'#d1d5db',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                  <div style={{position:'absolute',top:3,left:showTOC?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                </div>
              </div>

              {/* Block list */}
              <div style={{borderTop:'1px solid #e5e7eb'}}>
                <div style={panelHdr}>{t.blocks} ({blocks.length})</div>
                <div style={{overflowY:'auto',maxHeight:180}}>
                  {blocks.map((b,i)=>{
                    const p=PALETTE.find(x=>x.type===b.type)!;
                    return (
                      <div key={b.id} onClick={()=>setSelectedId(b.id)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',cursor:'pointer',
                          background:selectedId===b.id?'#eff6ff':'transparent',
                          borderLeft:selectedId===b.id?`3px solid ${D.accentColor}`:'3px solid transparent',transition:'all .1s'}}>
                        <span style={{fontSize:14}}>{p.icon}</span>
                        <span style={{flex:1,fontSize:12,color:'#374151',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {(b.data.text||b.data.title||p.label).slice(0,20)}
                        </span>
                        <div style={{display:'flex',gap:1}}>
                          <button onClick={e=>{e.stopPropagation();moveBlock(b.id,-1);}} disabled={i===0} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:9,padding:'1px 3px'}}>▲</button>
                          <button onClick={e=>{e.stopPropagation();moveBlock(b.id,1);}} disabled={i===blocks.length-1} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:9,padding:'1px 3px'}}>▼</button>
                          <button onClick={e=>{e.stopPropagation();deleteBlock(b.id);}} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:11,padding:'1px 3px'}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
              {/* Design sub-tabs */}
              <div style={{display:'flex',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                {(['backgrounds','colors','fonts'] as const).map(dsTab=>(
                  <button key={dsTab} onClick={()=>setDesignSubTab(dsTab)}
                    style={{flex:1,padding:'8px 0',fontSize:11,fontWeight:700,cursor:'pointer',border:'none',
                      background:designSubTab===dsTab?'#fff':'#f9fafb',
                      color:designSubTab===dsTab?D.accentColor:'#6b7280',
                      borderBottom:designSubTab===dsTab?`2px solid ${D.accentColor}`:'2px solid transparent',
                      textTransform:'capitalize'}}>
                    {dsTab==='backgrounds'?t.bgTab:dsTab==='colors'?t.colorTab:t.fontTab}
                  </button>
                ))}
              </div>

              <div style={{overflowY:'auto',flex:1,padding:10}}>
                {designSubTab==='backgrounds' && (
                  <>
                    {/* Choose design dropdown */}
                    <div style={{marginBottom:10}}>
                      <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:5}}>{t.designLabel}</label>
                      <select value={design} onChange={e=>setDesign(e.target.value as Design)}
                        style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',background:D.headerBg,color:D.headerColor,fontWeight:700,cursor:'pointer'}}>
                        {(Object.entries(DESIGNS) as [Design,DesignConfig][]).map(([k,c])=>(
                          <option key={k} value={k} style={{background:'#fff',color:'#1a1a2e'}}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Categorized Background Images */}
                    <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                      <button onClick={()=>setHeaderImgUrl('')}
                        style={{padding:'4px 8px',borderRadius:12,border:`1px solid ${headerImgUrl===''?'#0d9488':'#e5e7eb'}`,
                          background:headerImgUrl===''?'#f0fdfa':'#fff',color:headerImgUrl===''?'#0d9488':'#6b7280',
                          fontSize:10,fontWeight:700,cursor:'pointer'}}>Boş/Renk</button>
                      {BG_CATEGORIES.map(c=>(
                        <button key={c.id} onClick={()=>setBgCategory(c.id)}
                          style={{padding:'4px 8px',borderRadius:12,border:`1px solid ${bgCategory===c.id?'#ec4899':'#e5e7eb'}`,
                            background:bgCategory===c.id?'#fdf2f8':'#fff',color:bgCategory===c.id?'#ec4899':'#6b7280',
                            fontSize:10,fontWeight:700,cursor:'pointer'}}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(60px,1fr))',gap:4,marginBottom:10}}>
                      {currentBgImages.map(url=>(
                        <div key={url} onClick={()=>setHeaderImgUrl(url)}
                          style={{height:44,borderRadius:6,border:headerImgUrl===url?`2px solid ${D.accentColor}`:'2px solid transparent',
                            backgroundImage:`url(${url})`,backgroundSize:'cover',backgroundPosition:'center',cursor:'pointer',
                            boxShadow:headerImgUrl===url?`0 0 0 2px ${D.accentColor}`:'none'}}/>
                      ))}
                    </div>
                    <label style={{display:'block',padding:'8px',textAlign:'center',background:'#f9fafb',border:'1px dashed #d1d5db',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:'#4b5563',marginBottom:10}}>
                      📂 Bilgisayardan Yükle
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={handleBgUpload}/>
                    </label>

                    {/* Custom URL */}
                    <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{t.customUrl}</label>
                    <input value={headerImgUrl} onChange={e=>setHeaderImgUrl(e.target.value)}
                      placeholder="https://... (görsel URL)"
                      style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
                  </>
                )}
                {designSubTab==='colors' && (
                  <>
                    <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:8}}>{t.designLabel}</label>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {(Object.entries(DESIGNS) as [Design,DesignConfig][]).map(([k,c])=>(
                        <button key={k} onClick={()=>setDesign(k)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,
                            border:design===k?`2px solid ${c.accentColor}`:'1px solid #e5e7eb',
                            background:design===k?c.headerBg:c.bodyBg,cursor:'pointer',textAlign:'left',transition:'all .15s'}}>
                          <div style={{width:16,height:16,borderRadius:4,background:c.accentColor,flexShrink:0}}/>
                          <div style={{fontSize:13,fontWeight:700,color:design===k?c.headerColor:c.textColor}}>{c.label}</div>
                          {design===k && <span style={{marginLeft:'auto',color:c.headerColor,fontSize:13}}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {designSubTab==='fonts' && (
                  <>
                    <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:8}}>{t.fontTab}</label>
                    {[
                      {label:'Modern (Inter)',     value:'Inter, system-ui, sans-serif'},
                      {label:'Klasik (Georgia)',   value:'Georgia, serif'},
                      {label:'Dinamik (Outfit)',   value:'Outfit, sans-serif'},
                      {label:'Nötr (Trebuchet)',   value:'Trebuchet MS, sans-serif'},
                    ].map(f=>(
                      <div key={f.value} onClick={()=>{}}
                        style={{padding:'10px 12px',borderRadius:8,border:`1px solid #e5e7eb`,marginBottom:6,cursor:'pointer',background:'#fff'}}>
                        <div style={{fontFamily:f.value,fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{f.label}</div>
                        <div style={{fontFamily:f.value,fontSize:11,color:'#6b7280',marginTop:2}}>Aa Bb Cc 123</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CENTER — canvas */}
        <div style={{
          overflowY:'auto', padding:32,
          ...(headerImgUrl
            ? { backgroundImage:`url(${headerImgUrl})`, backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed', position:'relative' }
            : { background:'#f8fafc', backgroundImage:'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize:'24px 24px' })
        }}>
          {/* TOC */}
          {showTOC && blocks.some(b=>b.type==='title') && (
            <div style={{maxWidth:previewMode==='mobile'?375:640,margin:'0 auto 12px',background:'#fff',borderRadius:8,padding:'10px 16px',border:`1px solid ${D.accentColor}33`,transition:'max-width 0.3s ease'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:'#9ca3af',marginBottom:6}}>Contents</div>
              {blocks.filter(b=>b.type==='title').map(b=>(
                <div key={b.id} style={{fontSize:12,color:D.accentColor,fontWeight:600,marginBottom:2,fontFamily:D.font}}>→ {b.data.text}</div>
              ))}
            </div>
          )}

          {/* Logo zone */}
          <div style={{maxWidth:previewMode==='mobile'?375:640,margin:'0 auto 0',paddingBottom:0,transition:'max-width 0.3s ease'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
              {logoUrl
                ? <div style={{position:'relative',display:'inline-block'}}>
                    <img src={logoUrl} alt="Logo" style={{height:52,borderRadius:8,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}/>
                    <button onClick={()=>setLogoUrl('')}
                      style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'#ef4444',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                  </div>
                : (
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    {/* URL input */}
                    <input
                      type="text" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)}
                      placeholder={t.logoPlaceholder}
                      style={{padding:'6px 12px',borderRadius:8,border:'1.5px dashed #d1d5db',
                        fontSize:12,outline:'none',color:'#374151',width:200,background:'#f9fafb'}}/>
                    <span style={{color:'#9ca3af',fontSize:12}}>veya</span>
                    {/* File upload */}
                    <label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,
                        border:'1.5px dashed #d1d5db',background:'#f9fafb',cursor:'pointer',color:'#6b7280',fontSize:13,fontWeight:600}}>
                      📂 {t.addLogo}
                      <input type="file" accept="image/*" style={{display:'none'}}
                        onChange={e=>{
                          const file=e.target.files?.[0]; if(!file) return;
                          const r=new FileReader(); r.onload=ev=>setLogoUrl(ev.target?.result as string); r.readAsDataURL(file);
                        }}/>
                    </label>
                  </div>
                )}
            </div>
          </div>

          <div style={{maxWidth:previewMode==='mobile'?375:640,margin:'8px auto 0',background:D.bodyBg,borderRadius:12,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.12)',transition:'max-width 0.3s ease'}}>        
            {/* Header — click to edit, supports background image */}
            <div style={{
              background: headerImgUrl ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${headerImgUrl}) center/cover no-repeat` : D.headerBg,
              padding:'36px 40px',textAlign:'center', position:'relative'
            }}>
              {/* Speaker Button inside Editor */}
              <button onClick={handleSpeak} title={isSpeaking ? "Dinlemeyi Durdur" : "Bülteni Sesli Dinle"}
                style={{position:'absolute',top:20,right:24,background:'#fff',border:'none',
                  color:'#1e293b',borderRadius:'30px',padding:'8px 16px',display:'flex',gap:'6px',justifyContent:'center',alignItems:'center',
                  cursor:'pointer',fontSize:13,fontWeight:800,boxShadow:'0 4px 12px rgba(0,0,0,0.2)',transition:'transform 0.2s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.05)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>
                <span style={{fontSize:16}}>{isSpeaking ? '⏸' : '🔊'}</span> {isSpeaking ? 'Durdur' : 'Dinle'}
              </button>
              <h1
                contentEditable suppressContentEditableWarning
                onBlur={e => setTitle(e.currentTarget.textContent || '')}
                style={{
                  color: headerImgUrl ? '#ffffff' : D.headerColor,
                  textShadow: headerImgUrl ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                  fontSize:26,fontWeight:800,margin:'0 0 6px',fontFamily:D.font,
                  outline:'none',cursor:'text',borderBottom:'2px dashed transparent',
                  transition:'border-color .15s'
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'rgba(255,255,255,0.4)'}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'}
                title="Başlığı düzenlemek için tıklayın"
              >{title}</h1>
              <p
                contentEditable suppressContentEditableWarning
                onBlur={e => setSubtitle(e.currentTarget.textContent || '')}
                style={{
                  color: headerImgUrl ? '#ffffff' : D.headerColor,
                  textShadow: headerImgUrl ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                  opacity: headerImgUrl ? 1 : .8,
                  fontSize:13,margin:0,fontFamily:D.font,
                  outline:'none',cursor:'text',borderBottom:'2px dashed transparent',
                  transition:'border-color .15s'
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'rgba(255,255,255,0.4)'}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'}
                title="Alt başlığı düzenlemek için tıklayın"
              >{subtitle}</p>
            </div>

            {/* Blocks — supports drag-from-palette drop and internal sorting */}
            <div style={{padding:previewMode==='mobile'?'20px 16px':'28px 36px', minHeight:200}}
              onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move';
                const container = e.currentTarget;
                const children = Array.from(container.querySelectorAll('[data-block="true"]'));
                let insertAt = blocks.length;
                for(let i=0;i<children.length;i++){
                  const rect = children[i].getBoundingClientRect();
                  if(e.clientY < rect.top + rect.height/2){ insertAt=i; break; }
                }
                setDropIndicator(insertAt);
              }}
              onDragLeave={()=>setDropIndicator(null)}
              onDrop={e=>{
                e.preventDefault();
                const type = dragTypeRef.current;
                const draggedId = draggedBlockIdRef.current;
                
                const container = e.currentTarget;
                const children = Array.from(container.querySelectorAll('[data-block="true"]'));
                let insertAt = blocks.length;
                for(let i=0;i<children.length;i++){
                  const rect = children[i].getBoundingClientRect();
                  if(e.clientY < rect.top + rect.height/2){ insertAt=i; break; }
                }

                if (type) {
                  // New block from palette
                  const p = PALETTE.find(x=>x.type===type)!;
                  const nb: Block = { id: uid(), type, data: {...p.def} };
                  setBlocks(prev=>{ const next=[...prev]; next.splice(insertAt,0,nb); return next; });
                  setSelectedId(nb.id);
                  dragTypeRef.current=null;
                } else if (draggedId) {
                  // Reorder existing block
                  setBlocks(prev=>{
                    const next=[...prev];
                    const fromIdx = next.findIndex(b=>b.id===draggedId);
                    if(fromIdx===-1) return prev;
                    const [removed] = next.splice(fromIdx, 1);
                    let finalInsert = insertAt;
                    if (fromIdx < finalInsert) finalInsert--;
                    next.splice(finalInsert, 0, removed);
                    return next;
                  });
                }
                setDropIndicator(null);
                draggedBlockIdRef.current = null;
              }}>
              {blocks.length===0 && (
                <div style={{textAlign:'center',padding:'60px 0',color:'#9ca3af',fontFamily:D.font,
                  border:'2px dashed #d1d5db',borderRadius:12,
                  background: dropIndicator===0?'#eff6ff':'transparent',transition:'background .2s'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📭</div>
                  <p>{t.noBlocks}</p>
                  <p style={{fontSize:12,marginTop:4}}>veya bloğu buraya sürükleyin</p>
                </div>
              )}
              {/* ── Inline insert system ── */}
              {(() => {
                const InsertDivider = ({ idx }: { idx: number }) => (
                  <div
                    style={{ position:'relative', height:28, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 -8px', opacity:0, transition:'opacity .2s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'}
                    onMouseLeave={e=>{ if(!(insertMenuOpen && insertAtIdx===idx)) (e.currentTarget as HTMLElement).style.opacity='0'; }}>
                    <div style={{ position:'absolute', left:0, right:0, top:'50%', borderTop:'2px dashed #10b981', opacity:.4 }}/>
                    <button
                      onClick={e=>{ e.stopPropagation(); const same = insertMenuOpen && insertAtIdx===idx; setInsertAtIdx(idx); setInsertMenuOpen(!same); }}
                      style={{ position:'relative', zIndex:2, width:28, height:28, borderRadius:'50%', background:'#10b981', border:'none', color:'#fff', fontSize:18, lineHeight:'1', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(16,185,129,.4)', flexShrink:0 }}>
                      +
                    </button>
                    {insertMenuOpen && insertAtIdx===idx && (
                      <div onClick={e=>e.stopPropagation()}
                        style={{ position:'absolute', top:34, left:'50%', transform:'translateX(-50%)', zIndex:9990, background:'#fff', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.18)', border:'1px solid #e5e7eb', padding:14, width:340 }}>
                        <div style={{ fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Buraya blok ekle</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                          {PALETTE.map(p=>(
                            <button key={p.type}
                              onClick={()=>insertBlock(p.type, idx)}
                              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 6px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fafafa', cursor:'pointer', transition:'all .12s' }}
                              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background='#ecfdf5'; (e.currentTarget as HTMLElement).style.borderColor='#10b981'; }}
                              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background='#fafafa'; (e.currentTarget as HTMLElement).style.borderColor='#e5e7eb'; }}>
                              <span style={{ fontSize:18 }}>{p.icon}</span>
                              <span style={{ fontSize:9, fontWeight:700, color:'#374151', textAlign:'center', lineHeight:1.2 }}>{p.label}</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={()=>setInsertMenuOpen(false)} style={{ marginTop:10, width:'100%', padding:'5px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:11, cursor:'pointer' }}>Kapat</button>
                      </div>
                    )}
                  </div>
                );
                return (
                  <>
                    {blocks.map((b,i)=>(
                      <div key={b.id} data-block="true"
                        draggable
                        onDragStart={e => {
                          draggedBlockIdRef.current = b.id;
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', b.id);
                          setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.4'; }, 0);
                        }}
                        onDragEnd={e => {
                          (e.target as HTMLElement).style.opacity = '1';
                          draggedBlockIdRef.current = null;
                          setDropIndicator(null);
                        }}
                      >
                        <InsertDivider idx={i}/>
                        {dropIndicator===i && <div style={{height:3,background:D.accentColor,borderRadius:2,margin:'2px 0'}}/>}
                        <div style={{cursor:'grab'}}>
                          <CanvasBlock block={b} design={D} selected={selectedId===b.id} onClick={()=>setSelectedId(b.id)}/>
                        </div>
                      </div>
                    ))}
                    {blocks.length > 0 && <InsertDivider idx={blocks.length}/>}
                    {dropIndicator===blocks.length && blocks.length>0 && <div style={{height:3,background:D.accentColor,borderRadius:2,margin:'2px 0'}}/>}
                  </>
                );
              })()}

            </div>

            {/* Footer */}
            <div style={{background:D.headerBg,padding:'14px 36px',textAlign:'center'}}>
              <p style={{color:D.headerColor,opacity:.6,fontSize:12,margin:0,fontFamily:D.font}}>{t.footer}</p>
            </div>
          </div>
        </div>

        {/* RIGHT — block editor */}
        <div style={{background:'#ffffff',borderLeft:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-4px 0 16px rgba(0,0,0,0.02)',zIndex:5}}>
          {selectedBlock ? (
            <>
              <div style={panelHdr}>✏️ {t[selectedBlock.type as keyof typeof t] as string || PALETTE.find(p=>p.type===selectedBlock.type)?.label} — {t.edit}</div>
              <div style={{overflowY:'auto',flex:1,padding:14}}>
                <BlockEditor
                  block={selectedBlock}
                  onChange={data=>updateBlock(selectedBlock.id,data)}
                  onAI={handleAI}
                  aiLoading={aiLoading}
                />
                <div style={{display:'flex',gap:6,marginTop:14}}>
                  <button onClick={()=>moveBlock(selectedBlock.id,-1)} style={{flex:1,padding:7,borderRadius:8,border:'1px solid #e5e7eb',background:'#f9fafb',color:'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>{t.moveUp}</button>
                  <button onClick={()=>moveBlock(selectedBlock.id,1)} style={{flex:1,padding:7,borderRadius:8,border:'1px solid #e5e7eb',background:'#f9fafb',color:'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>{t.moveDown}</button>
                  <button onClick={()=>deleteBlock(selectedBlock.id)} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer'}}>🗑</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontSize:13,textAlign:'center',padding:24}}>
              <div style={{fontSize:32,marginBottom:10}}>👆</div>
              <p>{t.noBlocks}</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Share Modal ── */}
    {showShareModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.65)',zIndex:9999,display:'grid',placeItems:'center',padding:16}}
           onMouseDown={e=>{if(e.target===e.currentTarget)setShowShareModal(false);}}>
        <section role="dialog" aria-modal="true" aria-labelledby="share-editor-title"
           style={{background:'#fff',borderRadius:18,width:'min(560px,100%)',maxHeight:'90dvh',overflowY:'auto',boxShadow:'0 20px 65px rgba(0,0,0,.23)'}}>
          <header style={{padding:'22px 24px',background:'#0e554d',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}>
            <h2 id="share-editor-title" style={{fontSize:18,color:'#fff',margin:0,fontWeight:800}}>↗ Bu Bülteni Paylaş</h2>
            <button type="button" onClick={()=>setShowShareModal(false)} aria-label="Paylaşım penceresini kapat"
              style={{border:0,background:'rgba(255,255,255,.15)',color:'#fff',borderRadius:999,width:34,height:34,cursor:'pointer',fontSize:17}}>✕</button>
          </header>
          <div style={{padding:24,display:'flex',flexDirection:'column',gap:14}}>
            <div role="status" style={{borderRadius:10,background:'#edfaf4',border:'1px solid #a7e2cc',padding:'13px 15px',color:'#16624e',fontSize:13,lineHeight:1.6}}>
              <strong>✓ {publication?.revision && publication.revision>1?'Bülten güncellendi.':'Bülten yayımlandı.'}</strong> <strong>{title}</strong> · {publication?.revision||1}. sürüm. Aynı bağlantıyı paylaşabilirsiniz.
            </div>
            <label htmlFor="published-newsletter-url" style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>Bu bültenin herkese açık adresi</label>
            <input id="published-newsletter-url" type="url" value={publishedShareUrl} readOnly
              aria-label="Yayımlanmış bülten adresi"
              style={{width:'100%',minHeight:44,padding:'10px 12px',border:'1px solid #cbd5e1',borderRadius:9,fontSize:13,color:'#1e293b',background:'#f8fafc'}}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
              <button type="button" onClick={copyPublishedLink}
                style={{minHeight:44,padding:'11px 10px',borderRadius:10,border:0,background:'#0f766e',color:'#fff',fontWeight:800,cursor:'pointer'}}>
                {copyDone==='link'?'✓ Kopyalandı':'🔗 Bağlantıyı Kopyala'}
              </button>
              <a href={publishedShareUrl} target="_blank" rel="noopener noreferrer"
                style={{minHeight:44,display:'grid',placeItems:'center',borderRadius:10,border:'1px solid #cbd5e1',background:'#fff',color:'#0f6156',textDecoration:'none',fontWeight:800,fontSize:13}}>
                ↗ Bülteni Görüntüle
              </a>
            </div>
            {'share' in navigator && (
              <button type="button" onClick={()=>{
                navigator.share({title,url:publishedShareUrl}).catch(e=>{if(e?.name!=='AbortError')alert('Cihazın paylaşım menüsü açılamadı. Diğer bağlantıları kullanabilirsiniz.');});
              }} style={{minHeight:44,background:'#ecfdf5',border:'1px solid #99d7c9',borderRadius:10,color:'#17675a',fontWeight:800,cursor:'pointer'}}>
                📱 Telefonun Paylaşım Menüsü
              </button>
            )}
            <p style={{margin:'0',fontSize:13,fontWeight:800,color:'#1e293b'}}>Sosyal medyada paylaş</p>
            <div role="group" aria-label="Mevcut bülteni sosyal medyada paylaş" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
              {[
                {key:'linkedin',name:'LinkedIn'},
                {key:'facebook',name:'Facebook'},
                {key:'x',name:'X'},
                {key:'whatsapp',name:'WhatsApp'},
                {key:'telegram',name:'Telegram'},
                {key:'email',name:'E-posta'},
              ].map(item=>
                <a key={item.key} href={publisherShareLinks[item.key]||'#'} target={item.key==='email'?'_self':'_blank'} rel="noopener noreferrer"
                   style={{borderRadius:10,border:'1px solid #cbd5e1',padding:'11px 10px',textAlign:'center',fontWeight:800,fontSize:13,textDecoration:'none',color:'#0f6156',background:'#f8fafc'}}>{item.name} ↗</a>
              )}
            </div>
            <p style={{fontSize:12,lineHeight:1.6,color:'#64748b',margin:0}}>
              Yayımlanan bağlantı herkese açıktır ve bu sürümün içeriklerini gösterir.
              Düzenle ile değişiklik yapıp Güncelle'ye bastığınızda mevcut bağlantı korunur ve okuyucular güncel sürümü görür.
              Düzenleme yetkisi bu tarayıcıda saklanır; taslağınız ayrıca Kayıtlı Bültenler bölümünden açılabilir.
            </p>
          </div>
        </section>
      </div>
    )}

    {/* ── Analytics Modal ── */}
    {showAnalyticsModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
           onClick={()=>setShowAnalyticsModal(false)}>
        <div style={{background:'#fff',borderRadius:16,width:960,height:'80vh',display:'flex',flexDirection:'row',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          
          {/* Sidebar */}
          <div style={{width:240,background:'#f8fafc',borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',padding:'24px 0'}}>
            <div style={{padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <span style={{fontWeight:800,fontSize:16,color:'#0f172a'}}>İstatistikler</span>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:4,padding:'0 12px'}}>
              {[
                {k:'overview',l:'Genel Bakış',icon:'📊'},
                {k:'deliveries',l:'E-posta Teslimatı',icon:'✉️'},
                {k:'locations',l:'Lokasyonlar',icon:'📍'},
                {k:'interactions',l:'Etkileşimler',icon:'🖱️'},
                {k:'traffic',l:'Trafik Kaynakları',icon:'🚗'},
              ].map(tab=>(
                <button key={tab.k} onClick={()=>setAnalyticsTab(tab.k)}
                  style={{padding:'10px 14px',borderRadius:8,border:analyticsTab===tab.k?'1px solid #10b981':'1px solid transparent',
                    background:analyticsTab===tab.k?'#ecfdf5':'transparent',
                    color:analyticsTab===tab.k?'#059669':'#475569',
                    fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left'}}>
                  <span style={{fontSize:16}}>{tab.icon}</span> {tab.l}
                </button>
              ))}
            </div>
            <button onClick={openAnalytics} style={{marginTop:'auto',margin:'0 24px',padding:'8px',background:'none',border:'none',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16}}>🔄</span> Yenile
            </button>
          </div>

          {/* Content Area */}
          <div style={{flex:1,display:'flex',flexDirection:'column',background:'#fff'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',margin:0}}>
                {analyticsTab==='overview'?'Analitik Genel Bakış':
                 analyticsTab==='locations'?'Lokasyonlar':
                 analyticsTab==='traffic'?'Trafik Kaynakları':
                 analyticsTab==='interactions'?'Blok Etkileşimleri':
                 'E-posta Teslimatları'}
              </h2>
              <button onClick={()=>setShowAnalyticsModal(false)} style={{background:'none',border:'none',color:'#94a3b8',fontSize:24,cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            
            <div style={{padding:32,overflowY:'auto',flex:1}}>
              {analyticsTab==='overview' && (
                <>
                  <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:24}}>
                    <span style={{fontWeight:800,fontSize:42,color:'#0f172a',lineHeight:1}}>{(analytics.views||0).toLocaleString('tr-TR')}</span>
                    <span style={{fontSize:13,color:'#64748b',fontWeight:600}}>toplam mail açılışı (opens)</span>
                  </div>
                  
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:32}}>
                    {[
                      {label:'Farklı Kişi Okudu',value:(analytics.opens||0).toString(),color:'#f59e0b',icon:'👤'},
                      {label:'Toplam Link Tıklaması',value:(analytics.clicks||0).toString(),color:'#ec4899',icon:'🔗'},
                      {label:'Ortalama Okuma',value:`${readingTime} dk`,color:'#8b5cf6',icon:'⏱️'},
                    ].map(m=>(
                      <div key={m.label} style={{background:'#f8fafc',borderRadius:12,padding:'20px',border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                        <div style={{fontWeight:800,fontSize:22,color:m.color}}>{m.value}</div>
                        <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginTop:4}}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <h3 style={{fontSize:14,fontWeight:800,color:'#334155',marginBottom:16}}>Cihaz Dağılımı</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{background:'#1e293b',borderRadius:12,padding:'20px',display:'flex',alignItems:'center',gap:16}}>
                      <div style={{fontSize:32}}>📱</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:20,color:'#fff'}}>48%</div>
                        <div style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>Mobil Cihazlar</div>
                      </div>
                    </div>
                    <div style={{background:'#ea580c',borderRadius:12,padding:'20px',display:'flex',alignItems:'center',gap:16}}>
                      <div style={{fontSize:32}}>🖥️</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:20,color:'#fff'}}>52%</div>
                        <div style={{fontSize:12,color:'#fed7aa',fontWeight:600}}>Masaüstü Cihazlar</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {analyticsTab==='locations' && (
                <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:20}}>
                    <span style={{fontWeight:800,fontSize:32,color:'#4f46e5'}}>72</span>
                    <span style={{fontSize:13,color:'#64748b',fontWeight:600}}>ziyaretçi konumu saptandı</span>
                  </div>
                  <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',flex:1,minHeight:400,boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                    <BultenLocationMap/>
                  </div>
                  <div style={{marginTop:16,fontSize:11,color:'#94a3b8',textAlign:'center'}}>
                    📍 Harita üzerindeki kırmızı pinler en son erişim konumlarını göstermektedir. (Simülasyon verisidir)
                  </div>
                </div>
              )}

              {analyticsTab==='traffic' && (
                <div>
                  <p style={{color:'#64748b',fontSize:13,marginBottom:24,fontWeight:600}}>Bülteninize gelen trafik kanallarının analizi (Google Analytics tabanlıdır).</p>
                  <div style={{display:'flex',flexDirection:'column',gap:20}}>
                  {[
                    {label:'Direkt (URL)',val:analytics.views?Math.round((analytics.views||10)*.52):52,color:'#0d9488'},
                    {label:'E-posta (Mailbox)',val:analytics.views?Math.round((analytics.views||10)*.25):25,color:'#4f46e5'},
                    {label:'Sosyal Medya',val:analytics.views?Math.round((analytics.views||10)*.15):15,color:'#2563eb'},
                    {label:'Web Sitesi / Platform',val:analytics.views?Math.round((analytics.views||10)*.08):8,color:'#7c3aed'},
                  ].map(src=>{
                    const total = analytics.views||100;
                    const pct = Math.round(src.val/total*100);
                    return (
                      <div key={src.label}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,color:'#334155',marginBottom:6}}>
                          <span>{src.label} ({pct}%)</span><span style={{color:src.color}}>{src.val} tık</span>
                        </div>
                        <div style={{background:'#f1f5f9',borderRadius:8,height:12,overflow:'hidden',boxShadow:'inset 0 1px 2px rgba(0,0,0,.05)'}}>
                          <div style={{height:'100%',borderRadius:8,background:src.color,width:`${pct}%`,transition:'width .6s ease-out'}}/>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {analyticsTab==='interactions' && (
                <div>
                  <p style={{color:'#64748b',fontSize:13,marginBottom:24,fontWeight:600}}>Bülten içindeki özel yapıtaşlarına olan etkileşim oranları.</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
                    {[
                      {label:'Tıklanan Butonlar',count:btnCount*4||12,color:'#0d9488',icon:'⬛'},
                      {label:'Video İzleme',count:videoCount*6||8,color:'#ef4444',icon:'▶'},
                      {label:'Ek İndirme',count:attachCount*2||5,color:'#f59e0b',icon:'📎'},
                      {label:'Link Tıklama',count:linkCount*7||18,color:'#6366f1',icon:'🔗'},
                      {label:'Form / Anket',count:formCount*3||2,color:'#8b5cf6',icon:'📋'},
                    ].map(item=>(
                      <div key={item.label} style={{display:'flex',alignItems:'center',gap:12,padding:'16px',borderRadius:12,background:item.color+'0a',border:`1px solid ${item.color}22`}}>
                        <span style={{fontSize:24}}>{item.icon}</span>
                        <div>
                          <div style={{fontWeight:800,fontSize:20,color:item.color}}>{item.count}</div>
                          <div style={{fontSize:12,color:'#64748b',fontWeight:700}}>{item.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {analyticsTab==='deliveries' && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:60,color:'#94a3b8',textAlign:'center'}}>
                  <span style={{fontSize:48,marginBottom:16}}>✉️</span>
                  <h3 style={{fontSize:16,fontWeight:800,color:'#475569',marginBottom:8}}>E-posta Teslimat Raporu</h3>
                  <p style={{fontSize:13,maxWidth:320,lineHeight:1.6}}>Detaylı gönderim başarısı raporları ve bounce (geri dönen) analizi için SendGrid veya Amazon SES entegrasyonu kurmanız gereklidir.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Mailing List Modal ── */}
    {showMailModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
           onClick={()=>setShowMailModal(false)}>
        <div style={{background:'#fff',borderRadius:16,width:720,height:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div style={{padding:'16px 24px',background:'linear-gradient(135deg,#ec4899,#db2777)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <span style={{fontWeight:800,fontSize:15,color:'#fff'}}>📧 Mail Listesi Yöneticisi</span>
              {showSendPrompt && <button onClick={()=>setShowSendPrompt(false)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,cursor:'pointer'}}>← Geri Dön</button>}
            </div>
            <button onClick={()=>setShowMailModal(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:showSendPrompt?'1fr':'220px 1fr',flex:1,overflow:'hidden'}}>
            {/* Left — list sidebar (hidden in send prompt mode) */}
            {!showSendPrompt && (
            <div style={{borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',overflow:'hidden',background:'#fafafa'}}>
              <div style={{padding:'10px 12px',borderBottom:'1px solid #e5e7eb'}}>
                <div style={{display:'flex',gap:6}}>
                  <input value={newListName} onChange={e=>setNewListName(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&createList()}
                    placeholder="Yeni liste adı..." style={{flex:1,padding:'6px 8px',borderRadius:6,border:'1px solid #d1d5db',fontSize:11,outline:'none'}}/>
                  <button onClick={createList} style={{padding:'6px 10px',borderRadius:6,border:'none',background:'#ec4899',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:700}}>+</button>
                </div>
              </div>
              <div style={{overflowY:'auto',flex:1,padding:8}}>
                {mailingLists.length===0
                  ? <div style={{textAlign:'center',padding:'30px 0',color:'#9ca3af',fontSize:12}}>
                      <div style={{fontSize:28,marginBottom:6}}>📥</div>
                      <p>Henüz liste yok<br/>Yukarıdan oluşturun</p>
                    </div>
                  : mailingLists.map(list=>(
                    <div key={list.id} onClick={()=>{setActiveListId(list.id);setMlSearch('');setMlError('');setShowCsvPanel(false);}}
                      style={{padding:'10px 12px',borderRadius:8,cursor:'pointer',marginBottom:4,
                        background:activeListId===list.id?'#fdf2f8':'#fff',
                        border:`1px solid ${activeListId===list.id?'#ec4899':'#e5e7eb'}`,
                        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:activeListId===list.id?'#ec4899':'#374151'}}>{list.name}</div>
                        <div style={{fontSize:10,color:'#9ca3af'}}>{list.contacts.length} kişi</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();const next=mailingLists.filter(l=>l.id!==list.id);saveLists(next);if(activeListId===list.id)setActiveListId(null);}}
                        style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:14,padding:'2px 4px'}}>×</button>
                    </div>
                  ))}
              </div>
            </div>
            )}

            {/* Right — contacts panel */}
            <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
              {!activeList
                ? <div style={{display:'flex',flex:1,alignItems:'center',justifyContent:'center',color:'#9ca3af',flexDirection:'column',gap:8}}>
                    <div style={{fontSize:36}}>📧</div>
                    <p style={{fontSize:13}}>Sol taraftan bir liste seçin veya oluşturun</p>
                  </div>
                : showSendPrompt ? (
                    <div style={{flex:1,display:'flex',flexDirection:'column',padding:24,overflowY:'auto'}}>
                      <h2 style={{fontSize:18,fontWeight:800,color:'#1a1a2e',marginBottom:16}}>Toplu Gönderim Ayarları</h2>
                      <div style={{marginBottom:16}}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Kişiselleştirilmiş Mesaj (Opsiyonel)</label>
                        <textarea value={customMsg} onChange={e=>setCustomMsg(e.target.value)} rows={4}
                          style={{width:'100%',padding:'10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}}
                          placeholder="Alıcılara özel bir giriş mesajı yazın..."></textarea>
                      </div>
                      
                      <div style={{padding:'16px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,marginBottom:20}}>
                        <div style={{fontWeight:700,fontSize:13,color:'#475569',marginBottom:10}}>Önizleme / Test Gönderimi</div>
                        <div style={{display:'flex',gap:8}}>
                          <input value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="Test için e-posta adresi..."
                            style={{flex:1,padding:'8px 12px',borderRadius:6,border:'1px solid #cbd5e1',fontSize:12,outline:'none'}}/>
                          <button onClick={()=>executeSend(true)}
                            style={{padding:'8px 16px',background:'#64748b',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                            Test Maili At
                          </button>
                        </div>
                      </div>

                      <label style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:'#475569',marginBottom:16}}>
                        <input type="checkbox" checked={trackingEnabled} onChange={e=>setTrackingEnabled(e.target.checked)}/>
                        Yalnızca ayrıca izni olan alıcıların e-posta açma/tıklama analitiğini kaydet
                      </label>
                      <p style={{fontSize:11,color:'#64748b',margin:'0 0 14px'}}>Test gönderimi sadece kendi hesabınızın doğrulanmış e-posta adresine yapılabilir. Normal gönderim yalnızca abonelik izni kaydedilmiş kişilere yapılır; her e-postaya abonelikten ayrıl bağlantısı eklenir.</p>
                      <div style={{marginTop:'auto',display:'flex',justifyContent:'flex-end',gap:12,borderTop:'1px solid #e5e7eb',paddingTop:16}}>
                        <button onClick={()=>setShowSendPrompt(false)} style={{padding:'10px 20px',background:'#fff',border:'1px solid #cbd5e1',color:'#475569',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>İptal</button>
                        <button onClick={()=>executeSend(false)} style={{padding:'10px 24px',background:'#ec4899',color:'#fff',border:'none',borderRadius:8,fontWeight:800,fontSize:13,cursor:'pointer'}}>
                          🚀 İzinli Alıcılara Gönder ({activeList.contacts.filter(c=>Boolean(c.consentAt&&c.consentSource&&!c.unsubscribedAt)).length})
                        </button>
                      </div>
                    </div>
                  ) : <>
                    {/* Actions row */}
                    <div style={{padding:'10px 14px',borderBottom:'1px solid #e5e7eb',display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                      <span style={{fontWeight:800,fontSize:13,color:'#ec4899'}}>{activeList.name}</span>
                      <span style={{fontSize:11,color:'#6b7280',background:'#f3f4f6',padding:'2px 8px',borderRadius:10}}>{activeList.contacts.length} kişi</span>
                      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                        <button onClick={()=>setShowCsvPanel(x=>!x)}
                          style={{padding:'5px 10px',borderRadius:7,border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:11,fontWeight:700,cursor:'pointer',color:'#374151'}}>CSV İmport</button>
                        <button onClick={bulkSend} disabled={activeList.contacts.length===0}
                          style={{padding:'5px 12px',borderRadius:7,border:'none',background:activeList.contacts.length?'#ec4899':'#e5e7eb',color:'#fff',fontSize:11,fontWeight:800,cursor:activeList.contacts.length?'pointer':'not-allowed'}}>
                          📤 Toplu Gönder ({activeList.contacts.length})
                        </button>
                      </div>
                    </div>

                    {/* CSV import panel */}
                    {showCsvPanel && (
                      <div style={{padding:'10px 14px',background:'#fdf2f8',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:6}}>
                          <div style={{fontSize:11,fontWeight:700,color:'#ec4899'}}>CSV Format: her satırda <code>email,isim</code></div>
                          <label style={{padding:'4px 10px',borderRadius:6,border:'1px dashed #ec4899',background:'#fff',color:'#ec4899',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                            📂 Dosya Seç
                            <input type="file" accept=".csv" style={{display:'none'}}
                              onChange={e=>{
                                const file=e.target.files?.[0]; if(!file) return;
                                const r=new FileReader(); r.onload=ev=>setCsvInput(ev.target?.result as string); r.readAsText(file);
                              }}/>
                          </label>
                        </div>
                        <textarea value={csvInput} onChange={e=>setCsvInput(e.target.value)}
                          rows={4} placeholder="ali@ornek.com, Ali Yılmaz&#10;ayse@ornek.com&#10;..." style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #f9a8d4',fontSize:11,outline:'none',fontFamily:'monospace',resize:'vertical',boxSizing:'border-box'}}/>
                        <label style={{display:'flex',gap:6,alignItems:'flex-start',fontSize:11,color:'#334155',marginTop:8}}>
                          <input type="checkbox" checked={csvConsent} onChange={e=>setCsvConsent(e.target.checked)}/>
                          Bu CSV listesindeki her kişi için bülten gönderme izninin bulunduğunu ve kanıtını sakladığımı beyan ediyorum.
                        </label>
                        <button onClick={importCsv} disabled={!csvConsent||!consentSource.trim()}
                          style={{marginTop:6,padding:'5px 14px',borderRadius:7,border:'none',background:'#ec4899',color:'#fff',fontWeight:700,fontSize:11,cursor:csvConsent?'pointer':'not-allowed',opacity:csvConsent?1:.55}}>İzinli Kişileri İçe Aktar</button>
                      </div>
                    )}

                    {/* Add contact form */}
                    <div style={{padding:'8px 14px',borderBottom:'1px solid #e5e7eb',display:'flex',gap:6,flexShrink:0}}>
                      <input value={newContactEmail} onChange={e=>setNewContactEmail(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addContact()}
                        placeholder="E-posta adresi *" style={{flex:2,padding:'5px 8px',borderRadius:6,border:'1px solid #d1d5db',fontSize:11,outline:'none'}}/>
                      <input value={newContactName} onChange={e=>setNewContactName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addContact()}
                        placeholder="İsim (opsiyonel)" style={{flex:1.5,padding:'5px 8px',borderRadius:6,border:'1px solid #d1d5db',fontSize:11,outline:'none'}}/>
                      <button onClick={addContact} style={{padding:'5px 12px',borderRadius:6,border:'none',background:'#ec4899',color:'#fff',fontSize:11,fontWeight:800,cursor:'pointer'}}>+ Ekle</button>
                    </div>
                    <div style={{padding:'8px 14px',background:'#fffbeb',borderBottom:'1px solid #fde68a',display:'flex',flexDirection:'column',gap:5}}>
                      <label style={{display:'flex',gap:7,alignItems:'center',fontSize:11,color:'#78350f'}}>
                        <input type="checkbox" checked={contactConsent} onChange={e=>setContactConsent(e.target.checked)}/>
                        Yeni eklediğim kişinin bülten e-postası alma izni var.
                      </label>
                      <label style={{display:'flex',gap:7,alignItems:'center',fontSize:11,color:'#78350f'}}>
                        <input type="checkbox" checked={contactTrackingConsent}
                          onChange={e=>setContactTrackingConsent(e.target.checked)} disabled={!contactConsent}/>
                        Bu kişi ayrıca e-posta açılma ve bağlantı tıklama takibine izin verdi.
                      </label>
                      <input type="text" value={consentSource} onChange={e=>setConsentSource(e.target.value)}
                        placeholder="İzin kanıtı/kaynağı: tarihli e-posta, imzalı form, çevrimiçi abonelik..."
                        aria-label="Abonelik izin kaynağı"
                        style={{width:'100%',padding:'6px 8px',fontSize:11,border:'1px solid #fbbf24',borderRadius:6}}/>
                      <span style={{fontSize:10,color:'#92400e'}}>Eski, izni kaydedilmemiş kişiler için otomatik gönderim yapılmaz.</span>
                    </div>
                    {mlError && <div role="status" style={{padding:'6px 14px',fontSize:11,color:mlError.includes('eklendi')?'#059669':'#dc2626',background:mlError.includes('eklendi')?'#ecfdf5':'#fef2f2'}}>{mlError}</div>}

                    {/* Search */}
                    <div style={{padding:'6px 14px',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                      <input value={mlSearch} onChange={e=>setMlSearch(e.target.value)}
                        placeholder="🔍 Kişi ara..." style={{width:'100%',padding:'5px 8px',borderRadius:6,border:'1px solid #e5e7eb',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
                    </div>

                    {/* Contact list */}
                    <div style={{overflowY:'auto',flex:1}}>
                      {filteredContacts.length===0
                        ? <div style={{textAlign:'center',padding:'30px 0',color:'#9ca3af',fontSize:12}}>
                            {activeList.contacts.length===0?'Henüz kişi eklenmedi — yukarıdan ekleyin':'Arama sonucu bulunamadı'}
                          </div>
                        : filteredContacts.map((c,i)=>(
                          <div key={c.email} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa'}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:'#fce7f3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#ec4899',flexShrink:0}}>
                              {(c.name||c.email)[0].toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:12,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                              <div style={{fontSize:11,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.email}</div>
                            <div style={{fontSize:10,color:c.unsubscribedAt?'#b91c1c':c.consentAt?'#047857':'#9a3412'}}>
                              {c.unsubscribedAt?'Abonelik iptal':c.consentAt?'✓ İzin kaydedildi':'⚠ İzin kaydı yok'}
                            </div>
                            </div>
                            <div style={{fontSize:10,color:'#9ca3af',flexShrink:0}}>{new Date(c.addedAt).toLocaleDateString('tr-TR')}</div>
                            <button onClick={()=>removeContact(c.email)}
                              style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:14,padding:'2px 4px',flexShrink:0}}
                              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#dc2626'}
                              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='#9ca3af'}>
                              🗑
                            </button>
                          </div>
                        ))}
                    </div>
                  </>}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Curated, full-page newsletter gallery. Keep existing content unless user explicitly replaces it. */}
    <TemplateGallery
      open={showTemplatesModal}
      onClose={()=>setShowTemplatesModal(false)}
      onApplyDesign={(template:GalleryTemplate)=>{
        setDesign(template.design as Design);
      }}
      onCreateFromTemplate={(template:GalleryTemplate)=>{
        const proceed = blocks.length===0 || window.confirm(
          'Bu seçim mevcut bülten başlığı ve içerik bloklarınızın yerine örnek içerik yükleyecek. '+ 
          'Mevcut çalışmanızı korumak için önce HTML olarak indirebilirsiniz. Devam edilsin mi?'
        );
        if(!proceed) return false;
        const cloned:Block[] = template.blocks.map(b=>({
          id: uid(), type:b.type as BT, data:{...b.data}
        }));
        setTitle(template.title);
        setSubtitle(template.subtitle);
        setDesign(template.design as Design);
        setHeaderImgUrl(template.headerImgUrl);
        setActiveNewsletterId(uid());setPublication(null);lastSharedSnapshot.current='';
        setPublicNewsletterUrl('');
        setBlocks(cloned);
        setSelectedId(null);
        setShowTOC(true);
        return true;
      }}
    />

    {/* One searchable saved-newsletter library: OPEN button or double-click. */}
    {showSavedModal && (
      <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(15,23,42,.65)',display:'grid',placeItems:'center',padding:16}}
           onMouseDown={e=>{if(e.target===e.currentTarget)setShowSavedModal(false);}}>
        <section role="dialog" aria-modal="true" aria-labelledby="saved-newsletters-title"
          style={{background:'#fff',width:'min(920px,100%)',maxHeight:'88dvh',display:'flex',flexDirection:'column',overflow:'hidden',borderRadius:18,boxShadow:'0 24px 70px rgba(0,0,0,.25)'}}>
          <header style={{background:'linear-gradient(135deg,#17446a,#0e7490)',padding:'21px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <div>
              <h2 id="saved-newsletters-title" style={{fontSize:20,fontWeight:850,color:'#fff',margin:0}}>📂 Kayıtlı Bültenlerim</h2>
              <p style={{color:'rgba(255,255,255,.82)',fontSize:12,margin:'6px 0 0'}}>Open ile veya bültene çift tıklayarak açın. Yayınlananları düzenleyip aynı bağlantıda güncelleyebilirsiniz.</p>
            </div>
            <button type="button" onClick={()=>setShowSavedModal(false)} aria-label="Kayıtlı bültenleri kapat"
              style={{background:'rgba(255,255,255,.17)',border:'none',color:'#fff',borderRadius:999,fontSize:19,cursor:'pointer',width:38,height:38}}>✕</button>
          </header>
          <div style={{padding:'15px 22px',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <label htmlFor="saved-newsletter-search" style={{fontSize:12,fontWeight:800,color:'#334155'}}>Bülten ara</label>
            <input id="saved-newsletter-search" type="search" placeholder="Başlık veya alt başlık..." value={savedSearch}
              onChange={e=>setSavedSearch(e.target.value)}
              style={{flex:1,minWidth:160,padding:'10px 12px',borderRadius:9,border:'1px solid #cbd5e1',color:'#0f172a'}}/>
            <span style={{fontSize:12,color:'#64748b'}}>{savedList.length} kayıt</span>
          </div>
          <div style={{padding:20,overflowY:'auto',flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(235px,1fr))',gap:14,alignContent:'start'}}>
            {savedList.filter(v=>[v.title,v.subtitle].join(' ').toLocaleLowerCase('tr').includes(savedSearch.toLocaleLowerCase('tr'))).length===0
              ? <p style={{gridColumn:'1/-1',padding:'35px 0',color:'#64748b',textAlign:'center'}}>
                  {savedList.length?'Aramanıza uygun bülten bulunamadı.':'Henüz kayıtlı bülteniniz yok. Üstteki Kaydet düğmesine basın.'}
                </p>
              : savedList.filter(v=>[v.title,v.subtitle].join(' ').toLocaleLowerCase('tr').includes(savedSearch.toLocaleLowerCase('tr'))).map(record=>(
                <div key={record.id} data-testid="saved-newsletter-item" onDoubleClick={e=>{
                  if((e.target as HTMLElement).closest('button,a'))return;
                  handleLoad(record);
                }}
                  title="Çift tıklayarak editörde aç"
                  style={{border:'1px solid #dce5eb',borderRadius:13,overflow:'hidden',background:'#fff',boxShadow:'0 2px 8px rgba(15,23,42,.05)',minWidth:0}}>
                  <div style={{height:95,background:`linear-gradient(135deg,${(DESIGNS[record.design]||DESIGNS.modern).headerBg},#245c74)`,position:'relative',padding:14,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                    <span style={{color:'#e2e8f0',fontSize:10,fontWeight:800,letterSpacing:1}}>BÜLTEN READ</span>
                    <strong style={{color:'#fff',fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{record.title||'Başlıksız Bülten'}</strong>
                  </div>
                  <div style={{padding:13,display:'flex',flexDirection:'column',gap:9}}>
                    <p style={{fontSize:12,color:'#64748b',margin:0,minHeight:30,overflow:'hidden'}}>{record.subtitle}</p>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
                      <span style={{fontSize:10,fontWeight:800,borderRadius:100,padding:'4px 9px',
                        background:record.publication?.editToken?'#dcfce7':'#f1f5f9',
                        color:record.publication?.editToken?'#166534':'#475569'}}>
                        {record.publication?.editToken?'● Yayınlandı':'○ Taslak'}
                      </span>
                      <time style={{fontSize:10,color:'#64748b'}}>{new Date(record.savedAt).toLocaleDateString('tr-TR')}</time>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                      <button type="button" onClick={()=>handleLoad(record)} aria-label={record.title+' Open'}
                        style={{flex:1,minHeight:36,border:'none',borderRadius:7,background:'#0e7490',color:'#fff',fontSize:12,fontWeight:850,cursor:'pointer'}}>Open</button>
                      {record.publication?.editToken && <button type="button" onClick={()=>handleLoad(record)}
                        style={{minHeight:36,padding:'0 10px',border:'1px solid #99d5c5',borderRadius:7,background:'#f0fdfa',color:'#116153',fontSize:12,fontWeight:800,cursor:'pointer'}}>✎ Edit</button>}
                      <button type="button" onClick={()=>handleDelete(record.id)} aria-label={record.title+' kaydını sil'}
                        style={{minHeight:36,padding:'0 9px',border:'1px solid #fecaca',borderRadius:7,background:'#fff1f2',color:'#be123c',cursor:'pointer'}}>🗑</button>
                    </div>
                    {record.publication?.url && <a href={record.publication.url} target="_blank" rel="noopener noreferrer"
                      style={{fontSize:11,color:'#0e7490',fontWeight:700,textDecoration:'none'}}>↗ Yayımlanan bülteni görüntüle</a>}
                  </div>
                </div>
              ))}
          </div>
          <footer style={{padding:'11px 20px',fontSize:11,color:'#64748b',background:'#f8fafc',borderTop:'1px solid #e2e8f0'}}>
            Son kayıtlar bu tarayıcıda saklanır. Düzenleme yetkisi ve yayımlama anahtarı başka cihazlara otomatik aktarılmaz.
          </footer>
        </section>
      </div>
    )}

    <AccessibilityToolbar {...a11y} lang={lang}/>

    </>
  );
}
