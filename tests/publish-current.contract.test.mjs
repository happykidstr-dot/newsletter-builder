import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('app/page.tsx');
const api=read('app/api/publish/route.ts');
const reader=read('app/b/[slug]/route.ts');
const render=read('lib/public-newsletter-render.ts');
const storage=read('lib/newsletter-publication-store.ts');
const pkg=JSON.parse(read('package.json'));

test('Share publishes the open unsaved editor document instead of asking for a URL',()=>{
  assert.match(page,/onClick=\{handleShareCurrent\}/);
  assert.match(page,/fetch\('\/api\/publish'/);
  assert.match(page,/html:prepared\.html/);
  assert.match(page,/JSON\.stringify\(\{title,subtitle,design,blocks,headerImgUrl,logoUrl,showTOC\}\)/);
  assert.doesNotMatch(page,/onChange=\{e=>setPublicNewsletterUrl\(e\.target\.value\)\}/);
});
test('publishing requires explicit confirmation and saves no changes to the editor blocks',()=>{
  const start=page.indexOf('const handleShareCurrent');
  const end=page.indexOf('const handleExport',start);
  const code=page.slice(start,end);
  assert.match(code,/window\.confirm/);
  assert.match(code,/setPublicNewsletterUrl\(url\)/);
  assert.doesNotMatch(code,/setBlocks\(|setTitle\(|setSubtitle\(/);
});
test('new publications create links and existing ones require a private edit token',()=>{
  assert.match(api,/randomBytes\(12\)\.toString\('base64url'\)/);
  assert.match(api,/store\.setJSON\(slug,record\)/);
  assert.match(api,/matchesEditToken\(body\.editToken,previous\?\.editTokenHash\)/);
  assert.match(api,/expectedRevision/);
  assert.match(reader,/publicationStore\(\)\.get\(slug/);
});
test('published HTML is sanitized and sandboxed',()=>{
  assert.equal(pkg.dependencies['@netlify/blobs'],'11.1.7');
  assert.equal(pkg.dependencies['sanitize-html'],'2.18.1');
  assert.match(render,/sanitizeHtml\(withoutShare/);
  assert.match(render,/disallowedTagsMode:'discard'/);
  assert.match(render,/sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox/);
  assert.match(render,/script-src 'nonce-/);
  assert.match(render,/allowedIframeHostnames/);
});
test('social network links and title metadata are based on this public newsletter address',()=>{
  assert.match(render,/readerShareBar\(record\.title,canonical\)/);
  assert.match(render,/property="og:url"/);
  assert.match(render,/meta property="og:title"/);
  assert.match(render,/READER_SHARE_RUNTIME/);
  assert.match(render,/READER_SPEECH_SCRIPT/);
});
test('production store persists across deploys while previews cannot modify it',()=>{
  assert.match(storage,/getStore\(\{name: STORE_NAME/);
  assert.match(storage,/getDeployStore\(\{name: STORE_NAME/);
  assert.match(storage,/process\.env\.CONTEXT === 'production'/);
});
test('API limits uploads and source origin and anonymous publishing frequency',()=>{
  assert.match(api,/MAX_BYTES/);
  assert.match(api,/allowedSiteOrigin\(origin\)/);
  assert.match(api,/checkPublishQuota/);
  assert.match(storage,/current\.count >= 12/);
});

test('Netlify public origins and preview domains are validated before publishing',()=>{
  const origins=read('lib/publication-origin.ts');
  assert.match(origins,/SITE_NAME/);
  assert.match(origins,/PUBLISH_BUILD_PRIME_URL/);
  assert.match(origins,/x-forwarded-host/);
  assert.match(read('app/b/[slug]/route.ts'),/publicOriginForRequest\(req\)/);
});

test('Netlify Functions serves both publish API and reader routes ahead of SSR',()=>{
  const fn=read('netlify/functions/newsletter-publication.ts');
  assert.match(fn,/path:\['\/api\/publish','\/api\/unpublish','\/b\/:slug'\]/);
  assert.match(fn,/publicationStore\(host\)/);
  assert.match(fn,/renderPublishedNewsletter\(record,url\)/);
});
