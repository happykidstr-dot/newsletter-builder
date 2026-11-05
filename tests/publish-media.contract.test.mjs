import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const editor=read('app/page.tsx');
const client=read('lib/publish-newsletter-media.ts');
const image=read('lib/public-newsletter-media.ts');
const fn=read('netlify/functions/newsletter-media.ts');
const storage=read('lib/newsletter-publication-store.ts');
test('sharing strips embedded raster data from exported HTML via independent asset uploads',()=>{
 assert.match(client,/prepareNewsletterForSharing/);
 assert.match(client,/exportedHtml\.match\(DATA_IMAGE\)/);
 assert.match(client,/html=html\.split\(source\)\.join\(hosted\)/);
 assert.match(client,/fetch\('\/api\/media'/);
 assert.match(client,/set.*Cache/);
 assert.match(editor,/prepareNewsletterForSharing\(generateHTML\(\),headerImgUrl/);
 assert.match(editor,/headerImgUrl:prepared\.headerImgUrl,html:prepared\.html/);
});
test('public media has separate upload and view endpoints with rate limits',()=>{
 assert.match(fn,/path:\['\/api\/media','\/media\/:asset'\]/);
 assert.match(fn,/allowedSiteOrigin/);
 assert.match(image,/MAX_IMAGE_BYTES=2_500_000/);
 assert.match(image,/realImageType/);
 assert.match(image,/checkMediaUploadQuota/);
 assert.match(image,/getWithMetadata\(id,\{type:'blob'\}\)/);
 assert.match(storage,/mediaQuotaStore/);
 assert.match(storage,/getDeployStore/);
});
test('existing newsletter layout and edit URL are preserved',()=>{
 assert.match(editor,/setPublicNewsletterUrl\(url\)/);
 assert.match(editor,/expectedRevision:publication!\.revision/);
 assert.match(editor,/lastSharedSnapshot\.current=snapshot/);
 assert.match(editor,/shareProgress/);
 assert.match(editor,/reader\.readAsDataURL\(file\)/);
});
test('client scales only oversized imagery, not the local editor source',()=>{
 assert.match(client,/MAX_TRANSFER_BYTES=2_400_000/);
 assert.match(client,/canvas\.toBlob/);
 assert.match(client,/createImageBitmap/);
 assert.match(client,/const imageUrls=\[\.\.\.new Set/);
 assert.doesNotMatch(client,/setBlocks\(/);
});
