import {validYoutubeId,youtubePosterProxyPath} from './video-thumbnail';
/**
 * Separate real PDF download from the browser print dialog.
 * Rendering takes place in the browser and does not use OpenAI tokens.
 *
 * PDF is a high-resolution visual capture of the newsletter. It preserves the
 * visible layout, but text is not guaranteed to be selectable/searchable.
 */
export function newsletterFileBase(title: string): string {
  const cleaned=title.normalize('NFKC')
    .replace(/[^\p{L}\p{N}-]+/gu,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,80);
  return cleaned || 'BULTEN-READ';
}

export function pdfFilename(title: string): string {
  return newsletterFileBase(title)+'.pdf';
}

export function printableNewsletterNode(html: string): HTMLElement {
  const parsed=new DOMParser().parseFromString(html,'text/html');
  const root=parsed.body.querySelector<HTMLElement>('div[style*="max-width:640px"]')
    || parsed.body.firstElementChild as HTMLElement | null;
  if(!root) throw new Error('Bültenin PDF olarak aktarılacak içeriği bulunamadı.');

  // DOMParser is inert. Use a clone of the newsletter body, not HTML scripts or
  // the app's editing interface. html2pdf.js later clones this element itself.
  const node=root.cloneNode(true) as HTMLElement;
  node.querySelectorAll('#speakBtn,#bulten-reader-share,script,button').forEach(el=>el.remove());

  // A video poster is already visible in the exported HTML; remove its
  // optional YouTube player to avoid duplicate links or blank PDF frames.
  node.querySelectorAll('.bulten-video-player').forEach(el=>el.remove());

  // Cross-origin frames cannot be rasterised reliably: link to the video instead.
  node.querySelectorAll('iframe').forEach(frame=>{
    const replacement=parsed.createElement('p');
    replacement.textContent='Video: '+(frame.getAttribute('src')||'Bağlantı mevcut değil');
    replacement.style.cssText='font:14px system-ui,sans-serif;padding:18px;background:#f1f5f9;color:#334155;overflow-wrap:anywhere;';
    frame.replaceWith(replacement);
  });
  node.querySelectorAll('img').forEach(image=>{
    const img=image as HTMLImageElement;
    img.loading='eager';
    img.decoding='sync';
    // html2canvas uses CORS when the image server supports it.
    if(/^https?:\/\//i.test(img.getAttribute('src')||''))img.crossOrigin='anonymous';
    img.style.maxWidth='100%';
    img.style.pageBreakInside='avoid';
  });
  node.style.width='640px';
  node.style.maxWidth='640px';
  node.style.margin='0';
  node.style.borderRadius='0';
  node.style.boxShadow='none';
  node.style.breakInside='auto';
  return node;
}


/**
 * PDF screenshots cannot safely canvas-capture images from third-party origins.
 * Convert only our marked YouTube thumbnails to same-origin JPEG data URIs.
 * If the thumbnail host is unavailable, leave the normal web image URL as a
 * best-effort fallback; PDF export still works for all other content.
 */
export async function fetchVideoPosterDataUri(id:string):Promise<string>{
  if(!validYoutubeId(id))throw new Error('YouTube video bağlantısı geçersiz.');
  const response=await fetch(youtubePosterProxyPath(id),{
    signal:AbortSignal.timeout(9000),cache:'force-cache',
  });
  if(!response.ok||!/^image\/jpe?g(?:;|$)/i.test(response.headers.get('content-type')||''))
    throw new Error('Video görseli getirilemedi.');
  const blob=await response.blob();
  if(blob.size>1_500_000||blob.size<100)throw new Error('Video görseli geçersiz.');
  const dataUri=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Video görseli okunamadı.'));
    reader.readAsDataURL(blob);
  });
  if(!dataUri.startsWith('data:image/jpeg;base64,'))throw new Error('Geçersiz video resmi.');
  return dataUri;
}

export async function inlineVideoPosterImages(node:HTMLElement):Promise<number>{
  const posters=Array.from(node.querySelectorAll<HTMLImageElement>('img[data-bulten-video-id]'));
  let prepared=0;
  await Promise.all(posters.map(async image=>{
    const id=image.getAttribute('data-bulten-video-id');
    if(!validYoutubeId(id))return;
    try{
      const dataUri=await fetchVideoPosterDataUri(id);
      image.removeAttribute('crossorigin');
      image.src=dataUri;
      prepared++;
    }catch(error){
      console.warn('YouTube video kapak görseli PDF içinde yüklenemedi.',error);
    }
  }));
  return prepared;
}

export async function downloadNewsletterPdf(html:string,title:string):Promise<void> {
  if(typeof document==='undefined') throw new Error('PDF yalnızca tarayıcıda oluşturulabilir.');
  const node=printableNewsletterNode(html);
  await inlineVideoPosterImages(node);
  const module=await import('html2pdf.js');
  const html2pdf=module.default;
  // A4 PDF with generous margins, multi-page handling and colour images.
  // html2pdf.js supports pagebreak at runtime but its built-in TS options omit it.
  const pagebreakConfig = { pagebreak: {mode:['css','legacy'],avoid:['img','h1','h2','h3','figure']} };
  // This creates an application/pdf download without invoking a print dialog.
  await html2pdf()
    .set({
      margin: [9,8,9,8],
      filename: pdfFilename(title),
      image: {type:'jpeg',quality:0.95},
      html2canvas: {
        scale:2,
        useCORS:true,
        allowTaint:false,
        backgroundColor:'#ffffff',
        imageTimeout:12000,
        logging:false,
      },
      jsPDF: {unit:'mm',format:'a4',orientation:'portrait'},
      ...pagebreakConfig,
    })
    .from(node)
    .save();
}

/** Explicit print action: never call this from the PDF-download handler. */
export function printNewsletter(html:string):void {
  const win=window.open('','_blank');
  if(!win) throw new Error('Yazdırma penceresi engellendi. Tarayıcıda açılır pencerelere izin verin.');
  let printed=false;
  const printOnce=()=>{
    if(printed || win.closed)return;
    printed=true;
    try {win.focus();win.print();}catch(error){console.error('Yazdırma başarısız',error);}
  };
  win.addEventListener('load',printOnce,{once:true});
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Some browsers do not fire load after document.write; do not print twice.
  window.setTimeout(printOnce,1800);
}
