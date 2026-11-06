/**
 * Alternative readable PDF. The visually faithful PDF remains separate.
 * Text is generated as actual PDF text, not a screenshot; images are represented
 * by their provided alternatives rather than silently disappearing.
 * PDF/UA conformance must still be verified with a specialist accessibility checker.
 */
import {newsletterFileBase} from './newsletter-pdf';

type Lang = 'tr'|'en';
type PdfNode = {text?:string;style?:string;link?:string;margin?:number[];headlineLevel?:number;keepWithNext?:boolean;italics?:boolean};
const compact=(value:string)=>value.replace(/\s+/g,' ').trim();
const safeExternalUrl=(value:string):string|undefined=>{
  try{
    const u=new URL(value);
    return ['https:','mailto:'].includes(u.protocol)?u.toString():undefined;
  }catch{return undefined;}
};

/** Parsed publication HTML is inert: scripts, form controls and reader chrome are excluded. */
export function readablePdfDefinition(html:string,title:string,lang:Lang='tr'):{
  pageSize:string;pageMargins:number[];version:string;tagged:boolean;displayTitle:boolean;language:string;
  info:{title:string;author:string;subject:string};content:PdfNode[];styles:Record<string,unknown>;defaultStyle:Record<string,unknown>;
}{
  if(typeof DOMParser==='undefined')throw new Error('PDF içeriği yalnızca tarayıcıda hazırlanabilir.');
  const page=new DOMParser().parseFromString(html,'text/html');
  const reader=page.querySelector('#bulten-reading-content');
  if(!reader)throw new Error('PDF için okuyucu içeriği bulunamadı.');
  const subtitle=compact(page.querySelector('h1 + p')?.textContent||'');
  const nodes:PdfNode[]=[
    {text:compact(title)||'BÜLTEN READ',style:'cover',headlineLevel:1,keepWithNext:true},
    ...(subtitle?[{text:subtitle,style:'subtitle',margin:[0,0,0,16]}]:[]),
  ];
  const visitedImages=new Set<HTMLImageElement>();
  for(const element of reader.querySelectorAll('h1,h2,h3,p,li,a,img,iframe')){
    if(element.closest('script,style,button,nav,#bulten-reader-share'))continue;
    const tag=element.tagName.toLowerCase();
    if(tag==='img'){
      const img=element as HTMLImageElement;
      if(visitedImages.has(img))continue;
      visitedImages.add(img);
      const alt=compact(img.getAttribute('alt')||'');
      nodes.push({text:alt? `Görsel: ${alt}`:'Görsel: alternatif açıklama eklenmemiş.',style:'caption',margin:[0,5,0,10]});
      continue;
    }
    if(tag==='iframe'){
      const src=safeExternalUrl(element.getAttribute('src')||'');
      nodes.push({text:src?'Video bağlantısı: '+src:'Video içeriği',link:src,style:'link',margin:[0,4,0,10]});
      continue;
    }
    const text=compact(element.textContent||'');
    if(!text)continue;
    if(tag==='a'){
      // Avoid duplicate text when an anchor is part of a paragraph/heading.
      if(element.closest('p,h1,h2,h3,li'))continue;
      nodes.push({text,link:safeExternalUrl(element.getAttribute('href')||''),style:'link',margin:[0,3,0,10]});
    }else if(tag==='h1'||tag==='h2'||tag==='h3'){
      const level=tag==='h1'?2:tag==='h2'?2:3;
      nodes.push({text,style:'heading'+level,headlineLevel:level,keepWithNext:true,margin:[0,16,0,7]});
    }else if(tag==='li'){
      nodes.push({text:'• '+text,style:'body',margin:[8,2,0,5]});
    }else if(tag==='p'&&!element.closest('li')){
      nodes.push({text,style:'body',margin:[0,3,0,10]});
    }
  }
  if(nodes.length===1)nodes.push({text:'Bu bültende henüz içerik bulunmuyor.',style:'body'});
  nodes.push({text:'BÜLTEN READ · Project Factory',style:'footer',margin:[0,18,0,0]});
  return {
    pageSize:'A4',pageMargins:[46,50,46,50],version:'1.7',tagged:true,displayTitle:true,
    language:lang==='en'?'en-GB':'tr-TR',
    info:{title:compact(title),author:'Project Factory',subject:'BÜLTEN READ metin tabanlı bülten'},
    content:nodes,
    defaultStyle:{font:'Roboto',fontSize:11,color:'#172334',lineHeight:1.38},
    styles:{
      cover:{fontSize:23,bold:true,color:'#173b54'},
      subtitle:{fontSize:12,color:'#405469'},
      heading2:{fontSize:17,bold:true,color:'#173b54'},
      heading3:{fontSize:13,bold:true,color:'#173b54'},
      body:{fontSize:11},caption:{fontSize:10,italics:true,color:'#455669'},
      link:{fontSize:11,color:'#185e85',decoration:'underline'},
      footer:{fontSize:9,color:'#64748b'},
    },
  };
}

export async function downloadReadableNewsletterPdf(html:string,title:string,lang:Lang='tr'):Promise<void>{
  const pdfMakeModule=await import('pdfmake/build/pdfmake');
  const fontModule=await import('pdfmake/build/vfs_fonts');
  const pdfMake=((pdfMakeModule as any).default||pdfMakeModule) as any;
  pdfMake.addVirtualFileSystem((fontModule as any).default||fontModule);
  const definition=readablePdfDefinition(html,title,lang);
  await pdfMake.createPdf(definition).download(newsletterFileBase(title)+'-metin.pdf');
}
