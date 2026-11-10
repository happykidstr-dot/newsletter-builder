import {sanitiseHtmlBlock} from './safe-html-block';
import { escapeShareHtml, normalisePublicNewsletterUrl, readerShareBar, READER_SHARE_RUNTIME, safeReaderImageUrl, safeReaderLinkUrl } from './reader-social-share';
import {youtubeVideoId,youtubePosterUrl,youtubeWatchUrl} from './video-thumbnail';

/** The same HTML renderer powers published exports and the template's real preview. */
export type NewsletterRenderBlock = {type:string; data:Record<string,string>};
export type NewsletterRenderDesign = {
  headerBg:string;headerColor:string;accentColor:string;bodyBg:string;textColor:string;font:string;
};
export type NewsletterRenderOptions = {
  blocks:NewsletterRenderBlock[];D:NewsletterRenderDesign;title:string;subtitle:string;
  showTOC:boolean;headerImgUrl:string;logoUrl:string;lang:'tr'|'en';publicNewsletterUrl:string;
};
export function renderNewsletterHTML({blocks,D,title,subtitle,showTOC,headerImgUrl,logoUrl,lang,publicNewsletterUrl}:NewsletterRenderOptions):string {
    const blockHtml = blocks.map(b=>{
      if(b.type==='html')return `<section class="bulten-html-block">${sanitiseHtmlBlock(b.data.html||'')}</section>`;
      const d:Record<string,string> = Object.fromEntries(Object.entries(b.data).map(([k,raw])=>{
        const value=String(raw??'');
        if(k==='size') return [k,['h1','h2','h3'].includes(value)?value:'h2'];
        if(k==='cols') return [k,String(Math.max(1,Math.min(4,Number(value)||2)))];
        if(k==='style') return [k,['solid','dashed','dotted'].includes(value)?value:'solid'];
        if(k==='align') return [k,['left','center','right'].includes(value)?value:'center'];
        if(k==='actionUrl')return [k,escapeShareHtml(safeReaderLinkUrl(value))];
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

      if(b.type==='video'){
        const id=youtubeVideoId(d.url||'');
        if(!id)return `<p style="font-size:13px;color:#a16207;font-family:${ff};">Video önizlemesi için geçerli bir YouTube bağlantısı ekleyin.</p>`;
        const label=d.caption?.trim()||'YouTube videosu';
        const watch=youtubeWatchUrl(id);
        // YouTube provides a real video-frame poster. The still image remains
        // visible in downloaded HTML and PDF, while <details> keeps an optional
        // embedded player available in HTML and hosted newsletters.
        return `<figure class="bulten-video-poster" style="margin:0 0 12px;break-inside:avoid;page-break-inside:avoid;font-family:${ff};">
          <a href="${watch}" target="_blank" rel="noopener noreferrer" aria-label="${label} — YouTube'da videoyu izle"
             style="position:relative;display:block;text-decoration:none;color:inherit;overflow:hidden;border-radius:12px;background:#0f172a;">
            <img data-bulten-video-id="${id}" src="${youtubePosterUrl(id)}" alt="Video kapak görseli: ${label}"
                 loading="eager" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#172033;"/>
            <span aria-hidden="true" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:14px;
               background:#dc2626;color:white;padding:10px 23px;font-size:27px;line-height:1;box-shadow:0 3px 16px #0008;">▶</span>
          </a>
          <figcaption style="color:${tc};font-size:13px;margin:8px 0;line-height:1.5;">
            ▶ ${label} · <a href="${watch}" target="_blank" rel="noopener noreferrer"
                style="font-weight:700;color:${ac};">Videoyu izle</a>
          </figcaption>
        </figure>
        <details class="bulten-video-player" style="margin:0 0 10px;font-family:${ff};">
          <summary style="cursor:pointer;color:${ac};font-size:13px;font-weight:700;padding:8px 0;">▶ Videoyu bu sayfada oynat</summary>
          <div style="position:relative;padding-bottom:56.25%;height:0;">
            <iframe loading="lazy" title="${label}" src="https://www.youtube-nocookie.com/embed/${id}"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>
          </div>
        </details>`;
      }
      if(b.type==='audio'){
        const source=safeReaderLinkUrl(d.url||'');
        const label=d.caption||d.name||'Ses Kaydı';
        if(!source||source==='#')
          return `<div class="bulten-audio-block" style="padding:18px;border:1px solid #cbd5e1;border-radius:12px;color:${tc};font-family:${ff};">
            🔊 ${label} — Ses dosyası henüz yüklenmedi.</div>`;
        const playable=d.playback!=='false';
        return `<section class="bulten-audio-block" aria-label="Ses kaydı: ${label}" style="padding:18px;border:1px solid ${ac}66;border-radius:12px;margin:8px 0 14px;background:${D.bodyBg};font-family:${ff};break-inside:avoid;">
          <p style="font-size:16px;font-weight:800;color:${tc};margin:0 0 10px;">🔊 ${label}</p>
          ${playable?`<audio controls preload="metadata" src="${source}" aria-label="${label}" style="display:block;width:100%;max-width:100%;margin:8px 0 10px;">
            Tarayıcınız ses dosyasını oynatamıyor. Aşağıdaki indirme bağlantısını kullanın.
          </audio>`:''}
          <p style="margin:4px 0 0;font-size:13px;">
            <a href="${source}" target="_blank" rel="noopener noreferrer"
               style="font-weight:700;color:${ac};text-decoration:underline;">Ses dosyasını dinle / indir</a>
          </p>
          ${!playable?`<p style="font-size:11px;margin:8px 0 0;color:${tc};">Bu ses biçimi her tarayıcıda oynatılamayabilir; dosyayı indirip uygun bir oynatıcıyla açın.</p>`:''}
        </section>`;
      }
      if(b.type==='event') return `<div style="border-left:4px solid ${ac};padding:8px 16px;font-family:${ff};"><b style="color:${ac};">${d.title}</b>${d.date?`<br/><span style="color:${tc};font-size:13px;">📅 ${d.date} ${d.time}</span>`:''}${d.location?`<br/><span style="color:${tc};font-size:13px;">📍 ${d.location}</span>`:''}</div>`;
      if(b.type==='separator') return `<hr style="border:none;border-top:2px ${d.style} ${ac};margin:8px 0;"/>`;
      if(b.type==='link') return `<a href="${d.url}" style="color:${ac};font-family:${ff};font-weight:600;">🔗 ${d.text}</a>`;
      if(b.type==='button') return `<div style="text-align:${d.align||'center'};"><a href="${d.url}" style="display:inline-block;padding:12px 28px;background:${ac};color:#fff;border-radius:30px;font-family:${ff};font-weight:700;text-decoration:none;">${d.text}</a></div>`;
      if(b.type==='poll') return `<div style="font-family:${ff};"><b style="color:${tc};">${d.question}</b><br/>${[d.opt1,d.opt2,d.opt3].filter(Boolean).map(o=>`<div style="padding:8px 14px;border:1.5px solid ${ac};border-radius:8px;margin-top:6px;color:${tc};font-size:14px;">○ ${o}</div>`).join('')}</div>`;
      if(b.type==='form') {
        const fields=[d.field1,d.field2,d.field3].filter(Boolean);
        const link=d.actionUrl&&d.actionUrl!=='#'?d.actionUrl:'';
        return `<section aria-label="Harici geri bildirim formu" style="border:1px solid ${ac}44;border-radius:12px;padding:18px;font-family:${ff};"><h3 style="color:${tc};margin:0 0 12px;">${d.title||'Geri Bildirim Formu'}</h3><p style="color:${tc};font-size:13px;">İstenen bilgiler: ${fields.join(', ')||'Geri bildirim'}.</p>${link?`<a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${ac};color:white;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;">${d.submit||'Formu Aç'}</a>`:`<p style="font-size:12px;color:#b45309;">Form bağlantısı eklenmedi; yanıt alınmıyor.</p>`}</section>`;
      }
      if(b.type==='googleform') {
        const link=d.url&&d.url!=='#'?d.url:'';
        return `<section aria-label="Google Form" style="border:1px solid #4285f4;border-radius:12px;padding:18px;font-family:${ff};"><h3 style="margin:0 0 12px;color:${tc};">${d.title||'Google Form'}</h3>${link?`<a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Google Form’u Aç ve Yanıtla</a>`:`<p style="font-size:12px;color:#b45309;">Google Form bağlantısı eklenmedi.</p>`}</section>`;
      }
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

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${cleanTitle}</title><meta name="description" content="${cleanSubtitle}"><meta property="og:title" content="${cleanTitle}"><meta property="og:description" content="${cleanSubtitle}"><meta property="og:type" content="article">${canonicalMeta}${ogImageMeta}<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;color-adjust:exact;print-color-adjust:exact;}body{background:#e5e7eb;font-family:${D.font};}a{text-decoration:none;}@media print{body{background:#fff!important;}div[style*="border-radius:12px"]{box-shadow:none!important;border-radius:0!important;margin:0 auto!important;max-width:100%!important;}#speakBtn,#bulten-reader-share,.bulten-video-player,.bulten-audio-block audio{display:none!important;}}</style></head><body><div style="max-width:640px;margin:24px auto;background:${D.bodyBg};border-radius:12px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.15);position:relative;"><div style="${headerBgStyle}padding:36px 40px;text-align:center;position:relative;">${logoHtml}<button id="speakBtn" onclick="window.bultenSpeak()" style="position:absolute;top:20px;right:24px;background:#fff;border:none;color:#1e293b;border-radius:30px;padding:8px 16px;display:flex;gap:6px;justify-content:center;align-items:center;cursor:pointer;font-size:13px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:${D.font};"><span id="speakIcon" style="font-size:16px;">🔊</span> <span id="speakText">Dinle</span></button><h1 style="color:${headerImgUrl?'#ffffff':D.headerColor};text-shadow:${headerImgUrl?'0 2px 10px rgba(0,0,0,0.8)':'none'};font-size:26px;font-weight:800;margin:0 0 6px;font-family:${D.font};">${cleanTitle}</h1><p style="color:${headerImgUrl?'#ffffff':D.headerColor};text-shadow:${headerImgUrl?'0 2px 10px rgba(0,0,0,0.8)':'none'};opacity:${headerImgUrl?'1':'.8'};font-size:13px;font-family:${D.font};">${cleanSubtitle}</p></div><div id="bulten-reading-content" style="padding:32px 40px;">${toc}${blockHtml}</div>${shareBarHtml}<div style="background:${D.headerBg};padding:16px 40px;text-align:center;"><p style="color:${D.headerColor};opacity:.6;font-size:12px;font-family:${D.font};">Bu bülten Project Factory AI ile oluşturulmuştur.</p></div></div>
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

}
