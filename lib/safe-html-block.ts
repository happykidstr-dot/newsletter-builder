import sanitizeHtml from 'sanitize-html';

export const MAX_HTML_BLOCK_CHARS=100_000;
/** Small, static HTML fragments only; never trust scripts, styles, forms or frames. */
export function sanitiseHtmlBlock(value:string):string {
  return sanitizeHtml(String(value||'').slice(0,MAX_HTML_BLOCK_CHARS),{
    allowedTags:['div','span','p','br','hr','h1','h2','h3','h4','strong','b','em','i','u','s','ul','ol','li','blockquote','a','img','table','thead','tbody','tr','th','td','caption','figure','figcaption'],
    allowedAttributes:{a:['href','title','target','rel'],img:['src','alt','width','height'],th:['colspan','rowspan'],td:['colspan','rowspan']},
    allowedSchemes:['https','http','mailto'],allowProtocolRelative:false,
    transformTags:{a:(_tag,attrs)=>({tagName:'a',attribs:{...attrs,target:'_blank',rel:'noopener noreferrer'}})},
  });
}
