import {test,expect} from '../helpers/authorized-editor-test';

test('failed public publishing reports the error and preserves the draft without a false URL',async({page})=>{
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('Korunan Taslak');
  let calls=0,downloads=0;
  await page.route('**/api/publish',async route=>{
    calls++;
    await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Anonim yayınlama henüz etkinleştirilmedi.'})});
  });
  const prompts:string[]=[];
  page.on('download',()=>downloads++);
  page.on('dialog',dialog=>{prompts.push(dialog.message());void dialog.accept();});
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect.poll(()=>prompts.length).toBe(2);
  expect(prompts[1]).toContain('Anonim yayınlama henüz etkinleştirilmedi');
  expect(calls).toBe(1);expect(downloads).toBe(0);
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toHaveCount(0);
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Korunan Taslak');
});

test('cancelling publication preserves the draft without sending a request',async({page})=>{
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('Önce Taslak');
  let calls=0;
  await page.route('**/api/publish',route=>{calls++;return route.abort();});
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  expect(calls).toBe(0);
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Önce Taslak');
});

test('server rejects publishing without a real Turnstile challenge',async({request})=>{
  const response=await request.post('/api/publish',{
    headers:{Origin:'http://127.0.0.1:3000','Content-Type':'application/json'},
    data:{title:'Güvenli Bülten',subtitle:'',headerImgUrl:'',html:'<html><body><div id="bulten-reading-content">Test</div></body></html>'},
  });
  expect([401,403,503]).toContain(response.status());
});
