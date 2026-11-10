import {test,expect} from '../helpers/authorized-editor-test';

test('anonymous requests cannot spend AI credits or send mail or read personal analytics',async({request})=>{
  const ai=await request.post('/api/ai-generate',{data:{prompt:'Bir haber yaz.'}});
  const chat=await request.post('/api/chat',{data:{messages:[{role:'user',content:'merhaba'}]}});
  const mail=await request.post('/api/send-email',{data:{subject:'Test',html:'Merhaba',contacts:[{email:'other@example.org'}]}});
  const analytics=await request.get('/api/db/analytics');
  for(const res of [ai,chat,mail,analytics]){
    expect([401,403,503]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  }
});

test('publish can be explicitly revoked only with its secret, preserving the editor draft',async({page})=>{
  await page.goto('/');
  const token='A'.repeat(43),slug='AQIDBAUGBwgJCgsM';
  const posted:any[]=[];
  await page.route('**/api/publish',route=>route.fulfill({status:201,contentType:'application/json',
    body:JSON.stringify({slug,editToken:token,revision:1})}));
  await page.route('**/api/unpublish',async route=>{
    posted.push(route.request().postDataJSON());
    return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({success:true,slug})});
  });
  page.on('dialog',dialog=>dialog.accept());
  await page.getByPlaceholder('Bülten başlığı...').fill('Yayından Kaldırma Denemesi');
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  await page.getByRole('button',{name:'Bülteni yayından kaldır'}).click();
  await expect.poll(()=>posted.length).toBe(1);
  expect(posted[0]).toEqual({slug,editToken:token});
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Yayından Kaldırma Denemesi');
  await expect(page.getByRole('button',{name:'Bülteni yayınla'})).toBeVisible();
});
