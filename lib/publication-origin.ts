import type {NextRequest} from 'next/server';

function parsed(value:string|undefined|null):URL|null{
  if(!value)return null;
  try {return new URL(value);} catch {return null;}
}

/** Recognise only this Netlify site's real domain or verified Deploy Previews. */
export function allowedSiteOrigin(value:string):boolean {
  const url=parsed(value);
  if(!url)return false;
  if(url.username||url.password)return false;
  if(url.hostname==='localhost'||url.hostname==='127.0.0.1')
    return process.env.PUBLISH_BUILD_CONTEXT==='local'||process.env.NODE_ENV==='development';
  if(url.protocol!=='https:')return false;
  const site=(process.env.SITE_NAME||'').toLowerCase();
  const canonical=parsed(process.env.URL)?.hostname.toLowerCase();
  const builtCanonical=parsed(process.env.PUBLISH_BUILD_PRIME_URL)?.hostname.toLowerCase();
  const name=(site||(canonical?.endsWith('.netlify.app')?canonical.split('.')[0]:''))||'';
  const host=url.hostname.toLowerCase();
  if(canonical&&host===canonical)return true;
  if(builtCanonical&&host===builtCanonical)return true;
  if(name){
    if(host===name+'.netlify.app')return true;
    if(host.endsWith('--'+name+'.netlify.app')&&
      /^(?:deploy-preview-\d+|[a-z0-9-]{2,70})--[a-z0-9-]+\.netlify\.app$/.test(host))return true;
  }
  return false;
}

/** The actual browser-facing URL is not necessarily equal to NextRequest.url. */
export function publicOriginForRequest(req:NextRequest):string {
  const clientOrigin=req.headers.get('origin');
  if(clientOrigin&&allowedSiteOrigin(clientOrigin))return new URL(clientOrigin).origin;
  const candidates=[
    req.headers.get('x-forwarded-host'),
    req.headers.get('host'),
  ];
  for(const raw of candidates){
    if(!raw)continue;
    const host=raw.split(',')[0].trim();
    const candidate='https://'+host;
    if(allowedSiteOrigin(candidate))return new URL(candidate).origin;
  }
  const build=process.env.PUBLISH_BUILD_PRIME_URL;
  if(build&&allowedSiteOrigin(build))return new URL(build).origin;
  const official=process.env.URL;
  if(official&&allowedSiteOrigin(official))return new URL(official).origin;
  const local=new URL(req.url).origin;
  if(allowedSiteOrigin(local))return local;
  throw new Error('Yayın adresi güvenilir biçimde belirlenemedi.');
}
