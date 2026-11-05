import { test } from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const share=readFileSync(new URL('../lib/reader-social-share.ts',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
test('all reader share platforms and public URL guard exist',()=>{
 for(const x of ['linkedin','facebook','x','whatsapp','telegram','email']){
   assert.ok(share.includes("id:'"+x+"'"),x);
 }
 assert.match(share,/normalisePublicNewsletterUrl/);
 assert.match(share,/window\.location\.href/);
 assert.match(share,/navigator\.share/);
 assert.match(share,/navigator\.clipboard/);
});
test('exported newsletters include the reader share bar',()=>{
 assert.match(page,/readerShareBar\(title, publicNewsletterUrl\)/);
 assert.match(page,/READER_SHARE_RUNTIME/);
 assert.match(page,/meta property="og:title"/);
 assert.match(page,/setPublicNewsletterUrl\(''\)/);
});
test('editor no longer shares the private editor homepage',()=>{
 const section=page.slice(page.indexOf('{/* ── Share Modal'),page.indexOf('{/* ── Analytics Modal'));
 assert.doesNotMatch(section,/window\.location\.href/);
 assert.match(section,/publisherShareLinks/);
 assert.match(section,/Bu bültenin herkese açık adresi/);
});
