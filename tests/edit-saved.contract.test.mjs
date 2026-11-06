import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('app/page.tsx');
const native=read('netlify/functions/newsletter-publication.ts');
const api=read('app/api/publish/route.ts');
const credential=read('lib/publication-edit-credentials.ts');

test('saved records use stable id, IndexedDB and preserve owner publication data',()=>{
  assert.match(app,/bulten_saved_newsletters_v2/);
  assert.match(app,/saveLocalNewsletter\(entry\)/);
  assert.match(app,/previous\.filter\(x=>x\.id!==entry\.id\)/);
  assert.match(app,/setPublication\(record\.publication\?\.editToken/);
  assert.match(app,/setActiveNewsletterId\(record\.id\)/);
  assert.match(app,/if\(!draftReady\)return/);
  assert.match(app,/publishedSnapshot/);
  assert.match(app,/loadLocalDraft/);
  assert.match(app,/listLocalNewsletters/);
});
test('there is exactly one saved gallery with OPEN and double click',()=>{
  assert.equal((app.match(/\{showSavedModal &&/g)||[]).length,1);
  assert.match(app,/data-testid="saved-newsletter-item"/);
  assert.match(app,/onDoubleClick=\{e=>\{/);
  assert.match(app,/handleLoad\(record\)/);
  assert.match(app,/>Open<\/button>/);
  assert.match(app,/>✎ Edit<\/button>/);
});
test('new newsletter and template copy do not inherit old publication permission',()=>{
  assert.match(app,/setActiveNewsletterId\(uid\(\)\);setPublication\(null\)/);
  assert.match(app,/lastSharedSnapshot\.current=''/);
});
test('same URL update requires a private edit credential and revision check',()=>{
  assert.match(native,/matchesEditToken\(body\.editToken,previous\?\.editTokenHash\)/);
  assert.match(api,/matchesEditToken\(body\.editToken,previous\?\.editTokenHash\)/);
  assert.match(native,/store\.setJSON\(slug,record\)/);
  assert.match(api,/store\.setJSON\(slug,record\)/);
  assert.match(native,/expectedRevision/);
  assert.match(credential,/timingSafeEqual/);
  assert.match(credential,/randomBytes\(32\)/);
});
test('app has separately visible Edit, Publish/Update and Share actions',()=>{
  assert.match(app,/✎ Düzenle/);
  assert.match(app,/Yayınla/);
  assert.match(app,/Güncelle/);
  assert.match(app,/onClick=\{handleShareCurrent\}/);
});

test('empty newly created newsletters must not crash the editor',()=>{
  assert.match(app,/blocks\[0\]\?\.id \?\? null/);
});
