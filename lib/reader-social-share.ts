/**
 * Share links for a public, published newsletter (never for the private editor homepage).
 * A standalone HTML export can resolve its own HTTP(S) address at reader runtime.
 */
export function normalisePublicNewsletterUrl(input: string): string {
  try {
    const trimmed = input.trim();
    if (trimmed.length < 10 || trimmed.length > 2048) return '';
    const url = new URL(trimmed);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) return '';
    return url.toString();
  } catch { return ''; }
}
export function escapeShareHtml(input: string): string {
  return input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function makeShareLinks(title: string, url: string): Record<string,string> {
  const target = normalisePublicNewsletterUrl(url);
  if (!target) return {};
  const u = encodeURIComponent(target);
  const t = encodeURIComponent(title.slice(0,300));
  const message = encodeURIComponent(title.slice(0,300)+' '+target);
  return {
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url='+u,
    facebook: 'https://www.facebook.com/sharer/sharer.php?u='+u,
    x: 'https://twitter.com/intent/tweet?text='+t+'&url='+u,
    whatsapp: 'https://wa.me/?text='+message,
    telegram: 'https://t.me/share/url?url='+u+'&text='+t,
    email: 'mailto:?subject='+t+'&body='+encodeURIComponent(title+'\n\n'+target),
  };
}
const SHARE_ITEMS = [
  {id:'linkedin',name:'LinkedIn'},
  {id:'facebook',name:'Facebook'},
  {id:'x',name:'X'},
  {id:'whatsapp',name:'WhatsApp'},
  {id:'telegram',name:'Telegram'},
  {id:'email',name:'E-posta'},
] as const;

export function readerShareBar(title: string, publicUrl: string): string {
  const canonical = normalisePublicNewsletterUrl(publicUrl);
  const links = makeShareLinks(title,canonical);
  const href = (id:string) => links[id] || '';
  const publicByDefault = canonical ? 'block' : 'none';
  return `<section id="bulten-reader-share" data-public-url="${escapeShareHtml(canonical)}" aria-label="Bu bülteni paylaş" style="display:${publicByDefault};padding:20px 28px;border-top:1px solid #e5e7eb;background:#f8fafc;font:14px/1.5 system-ui,Arial,sans-serif;color:#1f2937;">
  <h2 style="font-size:17px;margin:0 0 4px;font-weight:800;color:#1f2937;">Bu bülteni paylaş</h2>
  <p style="font-size:12px;color:#64748b;margin:0 0 14px;">İçeriği yararlı bulduysanız sosyal medya hesaplarınızda paylaşabilirsiniz.</p>
  <nav aria-label="Sosyal medya paylaşımı" style="display:flex;gap:8px;flex-wrap:wrap">
    ${SHARE_ITEMS.map(item=>`<a data-share-network="${item.id}" href="${escapeShareHtml(href(item.id))}" target="${item.id==='email'?'_self':'_blank'}" rel="noopener noreferrer" aria-label="${item.name} üzerinde paylaş" style="display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 13px;color:#1e3a4d;font-size:12px;font-weight:700;text-decoration:none;border:1px solid #cbd5e1;border-radius:9px;background:white;">${item.name}</a>`).join('')}
    <button type="button" id="bulten-native-share" style="display:none;min-height:40px;padding:9px 13px;color:#fff;background:#126f65;border:0;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;">Paylaş</button>
    <button type="button" id="bulten-copy-share" style="display:none;min-height:40px;padding:9px 13px;color:#126f65;background:#e7f5f2;border:1px solid #a7d5cc;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;">Bağlantıyı kopyala</button>
  </nav>
  <p id="bulten-share-status" role="status" aria-live="polite" style="margin:10px 0 0;font-size:12px;color:#64748b;"></p>
  </section>`;
}

/** No user-supplied strings are interpolated into JavaScript source. */
export const READER_SHARE_RUNTIME = `
(function(){
  'use strict';
  var root=document.getElementById('bulten-reader-share');
  if(!root)return;
  var status=document.getElementById('bulten-share-status');
  var title=document.title||'Bülten';
  var configured=root.getAttribute('data-public-url')||'';
  var isWeb=function(v){
    try{
      var u=new URL(v);
      return (u.protocol==='https:'||u.protocol==='http:')&&!!u.hostname&&
        u.hostname!=='localhost'&&!u.hostname.endsWith('.localhost');
    }catch(e){return false;}
  };
  var link=isWeb(configured)?configured:(isWeb(window.location.href)?window.location.href:'');
  var items={
    linkedin:function(u,t){return 'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(u);},
    facebook:function(u,t){return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u);},
    x:function(u,t){return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(t)+'&url='+encodeURIComponent(u);},
    whatsapp:function(u,t){return 'https://wa.me/?text='+encodeURIComponent(t+' '+u);},
    telegram:function(u,t){return 'https://t.me/share/url?url='+encodeURIComponent(u)+'&text='+encodeURIComponent(t);},
    email:function(u,t){return 'mailto:?subject='+encodeURIComponent(t)+'&body='+encodeURIComponent(t+'\\n\\n'+u);}
  };
  var anchors=root.querySelectorAll('a[data-share-network]');
  Array.prototype.forEach.call(anchors,function(a){
    var type=a.getAttribute('data-share-network');
    if(link&&items[type]){a.href=items[type](link,title);a.removeAttribute('aria-disabled');}
    else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.style.opacity='.45';a.style.cursor='not-allowed';}
    a.addEventListener('click',function(e){if(!link){e.preventDefault();status.textContent='Paylaşmak için bültenin herkese açık bir web adresinde yayınlanması gerekiyor.';}});
  });
  var copy=document.getElementById('bulten-copy-share');
  var nativeBtn=document.getElementById('bulten-native-share');
  root.style.display='block';
  if(!link){
    status.textContent='Bu dosyayı paylaşmak için önce herkese açık bir web adresinde yayımlayın. Yerel dosya veya editör adresi paylaşılamaz.';
    return;
  }
  if(copy)copy.style.display='inline-flex';
  if(nativeBtn&&navigator.share){
    nativeBtn.style.display='inline-flex';
    nativeBtn.addEventListener('click',function(){
      navigator.share({title:title,url:link}).catch(function(e){if(e&&e.name!=='AbortError')status.textContent='Paylaşım başlatılamadı.';});
    });
  }
  if(copy)copy.addEventListener('click',function(){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(link).then(function(){status.textContent='Bağlantı kopyalandı.';})
        .catch(function(){status.textContent='Bağlantı: '+link;});
    }else{status.textContent='Bağlantı: '+link;}
  });
})();
`;
