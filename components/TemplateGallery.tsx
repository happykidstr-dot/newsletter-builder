'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryBlock, GalleryTemplate } from '@/lib/gallery-templates';
import { GALLERY_TEMPLATES } from '@/lib/gallery-templates';
import styles from './TemplateGallery.module.css';

type Category = 'Tümü' | GalleryTemplate['category'];
type Device = 'desktop' | 'mobile';
type Props = {
  open: boolean;
  onClose: () => void;
  onApplyDesign: (template: GalleryTemplate) => void;
  onCreateFromTemplate: (template: GalleryTemplate) => boolean;
  onPreviewHtml: (template: GalleryTemplate) => string;
};
const CATEGORIES: Category[] = ['Tümü', 'AB Projeleri', 'Etkinlikler', 'Kurumsal', 'Erişilebilirlik', 'Hikâyeler'];

function PreviewBlock({ block }: { block: GalleryBlock }) {
  const d = block.data;
  switch (block.type) {
    case 'title':
      return d.size === 'h1' ? <h2 className={styles.sectionTitle}>{d.text}</h2> :
        <h3 className={styles.subTitle}>{d.text}</h3>;
    case 'paragraph':
      return <p className={styles.paragraph}>{d.text}</p>;
    case 'photos':
      return d.url ? <figure className={styles.figure}><img src={d.url} alt={d.caption || 'Örnek bülten görseli'} loading="lazy" /><figcaption>{d.caption}</figcaption></figure> : null;
    case 'photogrid': {
      const slots = Array.from({length: Math.min(4, Math.max(2, Number(d.cols) || 2))}, (_, i) => ({
        url: d[`url${i + 1}`], caption: d[`cap${i + 1}`],
      })).filter(x => !!x.url);
      return <div className={styles.photoGrid}>{slots.map((x, i) => <figure key={i} className={styles.figure}><img src={x.url} alt={x.caption || 'Örnek görsel'} loading="lazy"/><figcaption>{x.caption}</figcaption></figure>)}</div>;
    }
    case 'textphoto':
      return <div className={styles.textPhoto} data-photo-pos={d.imagePos || 'right'}>
        {d.url && <img src={d.url} alt="Proje haberine ait örnek görsel" loading="lazy"/>}
        <p className={styles.paragraph}>{d.text}</p>
      </div>;
    case 'event':
      return <div className={styles.event}>
        <span className={styles.eventIcon} aria-hidden="true">▦</span>
        <div><strong>{d.title || 'Etkinlik'}</strong><span>{[d.date || 'Tarih belirlenecek', d.time, d.location].filter(Boolean).join(' · ')}</span></div>
      </div>;
    case 'separator': return <hr className={styles.separator}/>;
    case 'button': return <span className={styles.callToAction}>{d.text}</span>;
    case 'author':
      return <div className={styles.author}><strong>{d.name}</strong><span>{d.title}</span><p>{d.bio}</p></div>;
    case 'link': return <p className={styles.link}>{d.text}</p>;
    case 'poll': return <div className={styles.event}><div><strong>{d.question}</strong><span>{[d.opt1,d.opt2,d.opt3].filter(Boolean).join(' · ')}</span></div></div>;
    case 'video': return <div className={styles.mediaPlaceholder}>▶ Video · {d.caption || 'Örnek video'}</div>;
    case 'attachment': return <p className={styles.link}>↧ {d.fileName || 'Belge eki'}</p>;
    case 'form': return <div className={styles.event}><strong>{d.title || 'Form'}</strong></div>;
    case 'googleform': return <div className={styles.event}><strong>{d.title || 'Google Form'}</strong></div>;
    default: return null;
  }
}

function DocumentPreview({ template, compact = false, device = 'desktop' }: {
  template: GalleryTemplate; compact?: boolean; device?: Device;
}) {
  const p = template.palette;
  const themeVars = {
    '--tg-head': p.header,
    '--tg-accent': p.accent,
    '--tg-surface': p.surface,
    '--tg-ink': p.ink,
    '--tg-font': p.font,
  } as React.CSSProperties;

  return <div className={[styles.document, compact ? styles.compact : styles.fullDocument, device === 'mobile' ? styles.mobile : ''].filter(Boolean).join(' ')}
    data-kind={template.kind} style={themeVars} aria-hidden={compact ? true : undefined}>
    <div className={styles.hero} style={template.headerImgUrl ? {backgroundImage:`linear-gradient(125deg, rgba(12,22,34,.77), rgba(12,22,34,.31)),url("${template.headerImgUrl}")`} : undefined}>
      <div className={styles.brand}><span className={styles.brandSymbol} aria-hidden="true">◆</span> PROJECT FACTORY <span className={styles.edition}>/ {template.tag}</span></div>
      <div className={styles.heroCopy}>
        <span className={styles.kicker}>BÜLTEN READ · ÖRNEK YAYIN</span>
        <h3>{template.title}</h3>
        <p>{template.subtitle}</p>
      </div>
      <div className={styles.heroFooter}><span>PROJECT FACTORY</span><span>01 / EDITION</span></div>
    </div>
    <div className={styles.documentBody}>
      {template.blocks.map((block, i) => <div key={i} className={styles.block}><PreviewBlock block={block}/></div>)}
      <footer className={styles.documentFooter}><strong>PROJECT FACTORY</strong><span>İletişim · Topluluk · Etki</span></footer>
    </div>
  </div>;
}

export function TemplateGallery({ open, onClose, onApplyDesign, onCreateFromTemplate, onPreviewHtml }: Props) {
  const [category, setCategory] = useState<Category>('Tümü');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GalleryTemplate | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const dialogRef = useRef<HTMLElement>(null);

  const matches = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return GALLERY_TEMPLATES.filter(t =>
      (category === 'Tümü' || t.category === category) &&
      (!q || [t.title,t.subtitle,t.description,t.category].join(' ').toLocaleLowerCase('tr').includes(q))
    );
  }, [category,search]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLButtonElement>('[data-gallery-close]')?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open]);

  // Focus must remain inside the dialog when swapping the gallery and full-preview views.
  useEffect(() => {
    if (!open) { setSelected(null); return; }
    const id = requestAnimationFrame(() => {
      const target = selected ? '[data-gallery-back]' : '[data-gallery-close]';
      dialogRef.current?.querySelector<HTMLButtonElement>(target)?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, selected]);

  // Catch Escape at document level: selecting a preview unmounts its focused card,
  // and focus can momentarily return to <body> before the next frame.
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (selected) setSelected(null);
      else onClose();
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [open, selected, onClose]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if(event.key !== 'Tab' || !dialogRef.current) return;
    const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
      .filter(el => el.getClientRects().length > 0);
    if(!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if(event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  };

  const chooseDesign = (template:GalleryTemplate) => {
    onApplyDesign(template);
    setSelected(null);
    onClose();
  };
  const chooseExample = (template:GalleryTemplate) => {
    if (onCreateFromTemplate(template)) {
      setSelected(null);
      onClose();
    }
  };

  return <div className={styles.backdrop} onMouseDown={e => {if(e.target === e.currentTarget) onClose();}}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="template-gallery-heading"
      aria-describedby="template-gallery-summary" onKeyDown={handleKeyDown} className={styles.modal} data-testid="template-gallery-modal">
      <div className={styles.modalHeader}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>PROJECT FACTORY / DESIGN STUDIO</span>
          <h2 id="template-gallery-heading">Şablon Galerisi <span className={styles.count}>{GALLERY_TEMPLATES.length} tasarım</span></h2>
          <p id="template-gallery-summary">Gerçek bülten sayfalarını inceleyin. Mevcut içeriğinizi koruyarak yalnızca tasarımı değiştirebilirsiniz.</p>
        </div>
        <button type="button" className={styles.iconButton} aria-label="Şablon galerisini kapat" data-gallery-close
          onClick={() => {setSelected(null);onClose();}}>✕</button>
      </div>
      {!selected ? <>
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="Şablon kategorileri">
            {CATEGORIES.map(c => <button key={c} type="button" onClick={()=>setCategory(c)}
              aria-pressed={category===c} className={category===c ? styles.filterActive : styles.filter}>{c}</button>)}
          </div>
          <label className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Şablonlarda ara" placeholder="Şablon ara..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </label>
        </div>
        <div className={styles.galleryScroll}>
          {matches.length ? <div className={styles.galleryGrid} data-testid="template-gallery-grid">
            {matches.map(template=><button key={template.id} type="button" className={styles.card} data-testid="template-gallery-card"
              onClick={() => {setSelected(template);setDevice('desktop');}}>
              <div className={styles.cardCanvas}><DocumentPreview template={template} compact /></div>
              <div className={styles.cardFooter}>
                <div className={styles.cardCategory}>{template.category}</div>
                <div className={styles.cardTitle}>{template.title}</div>
                <p>{template.subtitle}</p>
                <span className={styles.previewLink}>Tam önizleme <span aria-hidden="true">↗</span></span>
              </div>
            </button>)}
          </div> : <div className={styles.empty}><strong>Bu aramayla eşleşen şablon yok.</strong><span>Farklı bir sözcük veya kategori deneyin.</span>
            <button onClick={()=>{setSearch('');setCategory('Tümü');}}>Filtreleri temizle</button></div>}
        </div>
      </> : <>
        <div className={styles.previewTop}>
          <button type="button" data-gallery-back className={styles.backButton} onClick={()=>setSelected(null)}>← Tüm şablonlar</button>
          <div className={styles.deviceControl} role="group" aria-label="Önizleme ekranı">
            <button type="button" aria-pressed={device==='desktop'} className={device==='desktop'?styles.deviceActive:''} onClick={()=>setDevice('desktop')}>▣ Masaüstü</button>
            <button type="button" aria-pressed={device==='mobile'} className={device==='mobile'?styles.deviceActive:''} onClick={()=>setDevice('mobile')}>▯ Mobil</button>
          </div>
        </div>
        <div className={styles.previewLayout}>
          <div className={styles.previewStage} data-testid="template-gallery-preview">
            <iframe
              key={selected.id+'-'+device}
              title={'Gerçek HTML yayın önizlemesi: '+selected.title}
              data-testid="template-gallery-live-preview"
              className={[styles.publicationIframe,device==='mobile'?styles.publicationIframeMobile:''].join(' ')}
              srcDoc={onPreviewHtml(selected)}
              sandbox=""
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
          <aside className={styles.previewDetails}>
            <span className={styles.detailCategory}>{selected.category}</span>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <div className={styles.detailSeparator}/>
            <p className={styles.detailLabel}>İki farklı kullanım şekli</p>
            <button type="button" className={styles.primaryButton} onClick={()=>chooseDesign(selected)}>
              Tasarımı uygula <span aria-hidden="true">↗</span>
            </button>
            <p className={styles.hint}>Başlığınız, yazılarınız, görselleriniz, logonuz ve içerik bloklarınız korunur. Yalnızca renk ve tipografi değişir.</p>
            <button type="button" className={styles.secondaryButton} onClick={()=>chooseExample(selected)}>
              Örnek içerikle yeni bülten oluştur
            </button>
            <p className={styles.hint}>Önizlemede HTML dışa aktarma ve yayımlama için kullanılan gerçek sayfa oluşturucu gösterilir. Örnek içerik üzerinde değişiklik yapabilirsiniz.</p>
            <div className={styles.detailMeta}>İçerik blokları: {selected.blocks.length} · Türkçe örnek içerik</div>
          </aside>
        </div>
      </>}
    </section>
  </div>;
}
