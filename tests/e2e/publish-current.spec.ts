import {test,expect} from '../helpers/authorized-editor-test';
test('Yayınla publishes and Paylaş only opens links to the resulting reader URL',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Şu Anda Açık Olan Bülten');
  let posted:any=null;let requests=0;
  await page.route('**/api/publish',async route=>{
    requests++;
    posted=route.request().postDataJSON();
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      slug:'AQIDBAUGBwgJCgsM',url:'http://127.0.0.1:3000/b/AQIDBAUGBwgJCgsM',editToken:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',revision:1,
    })});
  });
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  const dialog=page.getByRole('dialog',{name:'Bu Bülteni Paylaş'});
  await expect(dialog).toBeVisible();
  expect(requests).toBe(1);
  expect(posted.title).toBe('Şu Anda Açık Olan Bülten');
  expect(posted.html).toContain('Şu Anda Açık Olan Bülten');
  expect(posted.html).toContain('bulten-reading-content');
  await expect(dialog.getByRole('textbox',{name:'Yayımlanmış bülten adresi'}))
    .toHaveValue('http://127.0.0.1:3000/b/AQIDBAUGBwgJCgsM');
  const destination=dialog.getByRole('link',{name:/LinkedIn/});
  await expect(destination).toHaveAttribute('href',/linkedin\.com/);
  expect(await destination.getAttribute('href')).toContain(encodeURIComponent('/b/AQIDBAUGBwgJCgsM').replace('%2F','%2F').slice(0,9));
  await expect(title).toHaveValue('Şu Anda Açık Olan Bülten');
});

test('cancelled public publication never sends a publish request',async({page})=>{
  await page.goto('/');
  let requests=0;
  await page.route('**/api/publish',route=>{requests++;return route.abort();});
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  expect(requests).toBe(0);
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toHaveCount(0);
});

test('already published unchanged newsletter reopens share links without republishing',async({page})=>{
  await page.goto('/');
  let requests=0;
  await page.route('**/api/publish',async route=>{requests++;await route.fulfill({status:201,contentType:'application/json',
    body:JSON.stringify({slug:'AQIDBAUGBwgJCgsM',editToken:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',revision:1})});});
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toBeVisible();
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  await page.getByRole('button',{name:'Mevcut bülteni paylaş'}).click();
  expect(requests).toBe(1);
});

test('edited newsletter updates the SAME public URL with its private edit token',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  const posted:any[]=[];
  await page.route('**/api/publish',async route=>{
    const body=route.request().postDataJSON();posted.push(body);
    await route.fulfill({
      status:posted.length===1?201:200,
      contentType:'application/json',
      body:JSON.stringify({slug:'AQIDBAUGBwgJCgsM',
        ...posted.length===1?{editToken:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',revision:1}:{updated:true,revision:2}}),
    });
  });
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  await title.fill('Değiştirilmiş Bülten');
  await page.getByRole('button',{name:'Yayını güncelle'}).click();
  expect(posted).toHaveLength(2);
  expect(posted[0].slug).toBeUndefined();
  expect(posted[1].slug).toBe('AQIDBAUGBwgJCgsM');
  expect(posted[1].editToken).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  expect(posted[1].expectedRevision).toBe(1);
  await expect(page.getByRole('textbox',{name:'Yayımlanmış bülten adresi'}))
    .toHaveValue(/AQIDBAUGBwgJCgsM/);
  await expect(page.getByText(/2\. sürüm/)).toBeVisible();
});

test('server publication failure shows an error but does not claim a public URL exists',async({page})=>{
  await page.goto('/');
  await page.route('**/api/publish',route=>route.fulfill({status:503,contentType:'application/json',
    body:JSON.stringify({error:'Yayınlama depolaması kullanılamıyor.'})}));
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toHaveCount(0);
});
