/**
 * The preview iframe deliberately runs without JavaScript. YouTube players
 * cannot work in that sandbox, so replace only their expandable embed area
 * with a clear instruction. The trusted React parent opens the real player
 * outside the newsletter HTML when the user presses "Videoyu oynat".
 *
 * Published HTML and downloaded HTML are NOT changed by this function.
 */
export function safeNewsletterPreviewHtml(html:string):string{
  if(typeof DOMParser==='undefined')return html;
  const parsed=new DOMParser().parseFromString(html,'text/html');
  parsed.querySelectorAll('details.bulten-video-player').forEach(player=>{
    const hint=parsed.createElement('p');
    hint.className='bulten-safe-video-note';
    hint.textContent='Bu güvenli önizlemede gömülü oynatıcı kapalıdır. Videoyu izlemek için üstteki “▶ Videoyu oynat” düğmesini veya kapak görselinin altındaki “Videoyu izle” bağlantısını kullanın.';
    hint.style.cssText='font:13px/1.5 system-ui,sans-serif;padding:10px 13px;margin:6px 0 12px;border-radius:8px;background:#f0f9ff;color:#155e75;';
    player.replaceWith(hint);
  });
  return '<!DOCTYPE html>\n'+parsed.documentElement.outerHTML;
}
