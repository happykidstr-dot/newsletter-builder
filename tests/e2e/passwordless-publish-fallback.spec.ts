import {test,expect} from '../helpers/authorized-editor-test';
import {readFileSync} from 'node:fs';

test('unconfigured public publish offers a real downloadable HTML instead of claiming a public URL',async({page})=>{
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('Sadece Bu Cihazdaki Bülten');
  let apiCalls=0;
  await page.route('**/api/publish',async route=>{
    apiCalls++;
    await route.fulfill({
      status:503,contentType:'application/json',
      body:JSON.stringify({error:'Yayıncı girişi henüz yapılandırılmadı.'}),
    });
  });
  const prompts:string[]=[];
  page.on('dialog',dialog=>{
    prompts.push(dialog.message());
    void dialog.accept();
  });
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:30000}),
    page.getByRole('button',{name:'Bülteni yayınla'}).click(),
  ]);
  const contents=readFileSync((await download.path())!,'utf8');
  expect(download.suggestedFilename()).toMatch(/\.html$/);
  expect(contents).toContain('Sadece Bu Cihazdaki Bülten');
  expect(prompts.length).toBeGreaterThanOrEqual(2);
  expect(prompts[0]).toContain('hesap bağlantısı henüz kurulmadı');
  expect(prompts[1]).toContain('HTML dosyasını indirmek');
  expect(apiCalls).toBe(1);
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toHaveCount(0);
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Sadece Bu Cihazdaki Bülten');
});

test('declining offline fallback never creates a false public link or deletes the draft',async({page})=>{
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('Önce Taslak');
  await page.route('**/api/publish',route=>route.fulfill({
    status:503,contentType:'application/json',
    body:JSON.stringify({error:'Yayıncı girişi henüz yapılandırılmadı.'}),
  }));
  let index=0;
  page.on('dialog',dialog=>{
    index++;
    void (index===1?dialog.accept():dialog.dismiss());
  });
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect.poll(()=>index).toBe(2);
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toHaveCount(0);
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Önce Taslak');
});

test('server never accepts an anonymous publication, even when editor is passwordless',async({request})=>{
  const response=await request.post('/api/publish',{
    headers:{Origin:'http://127.0.0.1:3000','Content-Type':'application/json'},
    data:JSON.stringify({
      title:'Güvenli Bülten',subtitle:'',
      headerImgUrl:'',html:'<!DOCTYPE html><html><body><h1>Test</h1></body></html>',
    }),
  });
  expect([401,403,503]).toContain(response.status());
});
