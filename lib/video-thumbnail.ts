/**
 * Safe YouTube URLs and still-image poster addresses.
 * The image is a YouTube-provided frame/thumbnail, not a browser screenshot
 * of a cross-origin video (which browsers intentionally prohibit).
 */
const YOUTUBE_HOSTS=new Set([
  'youtube.com','www.youtube.com','m.youtube.com','music.youtube.com',
  'youtube-nocookie.com','www.youtube-nocookie.com',
]);
export const validYoutubeId=(id:unknown):id is string=>
  typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);

export function youtubeVideoId(raw:unknown):string|null{
  if(typeof raw!=='string'||raw.length>2048)return null;
  try{
    const url=new URL(raw.trim());
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;
    const host=url.hostname.toLowerCase();
    const segments=url.pathname.split('/').filter(Boolean);
    let id:string|null=null;
    if(host==='youtu.be')id=segments[0]||null;
    else if(YOUTUBE_HOSTS.has(host)){
      if(segments[0]==='watch')id=url.searchParams.get('v');
      else if(['shorts','embed','live','v'].includes(segments[0]))id=segments[1]||null;
    }
    return validYoutubeId(id)?id:null;
  }catch{return null;}
}
export function youtubeWatchUrl(id:string):string{
  return `https://www.youtube.com/watch?v=${id}`;
}
export function youtubePosterUrl(id:string):string{
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
export function youtubePosterProxyPath(id:string):string{
  return `/api/video-thumbnail?id=${encodeURIComponent(id)}`;
}
