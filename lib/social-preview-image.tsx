import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import characters from '../assets/BultenPreview.characters.json';
import {ImageResponse} from 'next/og';
import type {PublishedNewsletter} from './newsletter-publication-store';
import {SOCIAL_IMAGE_WIDTH,SOCIAL_IMAGE_HEIGHT,socialPreviewExcerpt} from './social-preview';

const font=readFileSync(join(process.cwd(),'assets/BultenPreview.woff'));
const supported=new Set<number>(characters);
// Keep preview rendering entirely local, including when a title contains emoji.
function previewText(text:string):string{
  return Array.from(text.normalize('NFC')).filter(c=>supported.has(c.codePointAt(0)!)).join('').replace(/\s+/g,' ').trim();
}

/** A public raster cover; no editor code, scripts, credentials or remote HTML. */
export function renderSocialPreview(record:PublishedNewsletter,cover?:string):ImageResponse {
  const title=previewText(record.title).slice(0,160)||'Bülten',subtitle=previewText(record.subtitle||'Haberler, projeler ve yeni fikirler').slice(0,180);
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',background:'#ecf5f2',padding:42,fontFamily:'Bulten',color:'#123d39'}}>
      <div style={{display:'flex',flexDirection:'column',width:640,paddingRight:36,justifyContent:'space-between'}}>
        <div style={{display:'flex',fontSize:25,fontWeight:700,letterSpacing:2,color:'#11786e'}}>BÜLTEN READ</div>
        <div style={{display:'flex',flexDirection:'column'}}>
          <div style={{display:'flex',fontSize:title.length>95?43:54,fontWeight:700,lineHeight:1.14,letterSpacing:-1}}>{title}</div>
          <div style={{display:'flex',fontSize:25,lineHeight:1.4,color:'#47645f',marginTop:22}}>{subtitle}</div>
        </div>
        <div style={{display:'flex',fontSize:20,color:'#11786e'}}>Bülteni keşfet  ·  bultenoku.netlify.app</div>
      </div>
      <div style={{display:'flex',width:476,background:'white',borderRadius:20,overflow:'hidden',flexDirection:'column',border:'1px solid #d1e4df'}}>
        <div style={{display:'flex',height:12,background:'#11786e'}} />
        {cover?<img src={cover} width={476} height={270} style={{objectFit:'cover'}} alt=""/>:
          <div style={{display:'flex',height:240,background:'#163f4b',padding:30,flexDirection:'column',justifyContent:'space-between',color:'white'}}>
            <div style={{display:'flex',fontSize:16,letterSpacing:3}}>PROJELER · İNSANLAR · FİKİRLER</div>
            <div style={{display:'flex',fontSize:42,fontWeight:700,lineHeight:1.15}}>Birlikte daha fazlası.</div>
          </div>}
        <div style={{display:'flex',flexDirection:'column',padding:28,flexGrow:1,overflow:'hidden'}}>
          <div style={{display:'flex',fontSize:24,fontWeight:700,lineHeight:1.3}}>{title.slice(0,75)}</div>
          <div style={{display:'flex',fontSize:19,lineHeight:1.5,color:'#64746e',marginTop:14}}>{previewText(socialPreviewExcerpt(record)).slice(0,155)}</div>
        </div>
      </div>
    </div>,
    {width:SOCIAL_IMAGE_WIDTH,height:SOCIAL_IMAGE_HEIGHT,fonts:[{name:'Bulten',data:font,weight:400,style:'normal'}],headers:{'Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'}},
  );
}
