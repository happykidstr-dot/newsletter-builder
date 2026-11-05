import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const templates = readFileSync(new URL('../lib/gallery-templates.ts',import.meta.url),'utf8');
const page = readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const gallery = readFileSync(new URL('../components/TemplateGallery.tsx',import.meta.url),'utf8');

test('eight distinct full newsletter designs are defined',()=>{
  const ids=['european','impact','partnership','evently','corporate','inclusive','stories','editorial'];
  for(const id of ids){
    assert.match(templates,new RegExp('"id": "'+id+'"'));
    assert.match(page,new RegExp('\\b'+id+'\\b'));
  }
  assert.equal((templates.match(/"id": "/g)||[]).length,8);
});
test('preserve-content mode does not touch the newsletter blocks',()=>{
  const start=page.indexOf('onApplyDesign={(template:GalleryTemplate)=>');
  const end=page.indexOf('onCreateFromTemplate=',start);
  assert.ok(start>0 && end>start);
  const apply=page.slice(start,end);
  assert.match(apply,/setDesign\(template\.design/);
  assert.doesNotMatch(apply,/setBlocks|setTitle|setSubtitle|setHeaderImgUrl/);
});
test('replacing content requires explicit user confirmation',()=>{
  assert.match(page,/window\.confirm\(/);
  assert.match(page,/if\(!proceed\) return false/);
  assert.match(gallery,/onCreateFromTemplate\(template\)/);
});
test('old image-only gallery and 27 templates no longer render',()=>{
  assert.doesNotMatch(page,/NEWSLETTER_TEMPLATES/);
  assert.match(gallery,/DocumentPreview template=\{template\} compact/);
});
