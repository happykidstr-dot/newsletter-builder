import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('starts with Turkish newsletter defaults',async({page})=>{
  await page.goto('/');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Project Factory Bülteni');
  await expect(page.getByRole('heading',{name:'Bülteninizin ana başlığı'})).toBeVisible();
  await expect(page.getByRole('switch',{name:'İçindekiler'})).toHaveAttribute('aria-checked','true');
});
test('auto-saved local draft survives a reload',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Saklanan QA Başlığı');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('bulten_draft_v1'))).toContain('Saklanan QA Başlığı');
  await page.reload();
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Saklanan QA Başlığı');
});
test('contents switch responds to keyboard',async({page})=>{
  await page.goto('/');
  const toggle=page.getByRole('switch',{name:'İçindekiler'});
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked','false');
});
test('HTML export escapes editor text',async({page})=>{
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('<script>alert(1)</script>');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:/HTML/}).click();
  const download=await downloadPromise;
  const html=readFileSync(await download.path()!,'utf8');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(html).not.toContain('<title><script>alert(1)</script></title>');
});
test('mobile editor uses a single-column grid',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto('/');
  const count=await page.locator('.br-editor-grid').evaluate(el=>
    getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
  );
  expect(count).toBe(1);
});
test('skip-link is keyboard accessible',async({page})=>{
  await page.goto('/');
  const skip=page.getByRole('link',{name:'Ana içeriğe geç'});
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
});
test('email API cannot send without login',async({request})=>{
  const response=await request.post('/api/send-email',{data:{
    subject:'Test',html:'<p>Test</p>',isTest:true,testEmail:'qa@example.invalid'
  }});
  expect([401,403,503]).toContain(response.status());
});
test('AI and private DB APIs are denied without login',async({request})=>{
  for(const [method,path,data] of [
    ['post','/api/ai-generate',{prompt:'test'}],
    ['get','/api/db/newsletters',null],
    ['get','/api/db/analytics',null]
  ] as const){
    const response=method==='get'?await request.get(path):await request.post(path,{data});
    expect([401,403,503]).toContain(response.status());
  }
});
test('notebook webhook rejects missing secret',async({request})=>{
  const response=await request.post('/api/notebook-sync',{data:{title:'Test',blocks:[]}});
  expect(response.status()).toBe(401);
});
