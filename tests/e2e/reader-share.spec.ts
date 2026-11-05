import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

async function downloadNewsletter(page:import('@playwright/test').Page):Promise<string>{
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:/HTML/}).click(),
  ]);
  const saved=await download.path();
  if(!saved)throw new Error('HTML download path unavailable');
  return readFileSync(saved,'utf8');
}

test('reader sharing controls are embedded into exported HTML',async({page})=>{
  await page.goto('/');
  const html=await downloadNewsletter(page);
  expect(html).toContain('id="bulten-reader-share"');
  for(const platform of ['linkedin','facebook','x','whatsapp','telegram','email']){
    expect(html).toContain('data-share-network="'+platform+'"');
  }
  expect(html).toContain('id="bulten-copy-share"');
  expect(html).toContain('og:title');
  expect(html).toContain('SpeechSynthesisUtterance');
});

test('hosted reader page shares its actual newsletter URL and not the editor homepage',async({page})=>{
  await page.goto('/');
  const html=await downloadNewsletter(page);
  const newsletterUrl='http://127.0.0.1:3000/newsletters/pf-november.html';
  await page.route('**/newsletters/pf-november.html',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto(newsletterUrl);
  const share=page.locator('#bulten-reader-share');
  await expect(share).toBeVisible();
  const linkedin=share.locator('[data-share-network="linkedin"]');
  await expect(linkedin).toHaveAttribute('href',/linkedin\.com/);
  expect(await linkedin.getAttribute('href')).toContain(encodeURIComponent(newsletterUrl));
  await expect(share.locator('[data-share-network="whatsapp"]')).toHaveAttribute('href',/wa\.me/);
  await expect(share.locator('[data-share-network="telegram"]')).toHaveAttribute('href',/t\.me/);
  await expect(share.locator('#bulten-copy-share')).toBeVisible();
});

test('publisher receives a URL for the current newsletter without manual entry',async({page})=>{
  await page.goto('/');
  await page.route('**/api/publish',route=>route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({slug:'AQIDBAUGBwgJCgsM'})}));
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Mevcut bülteni paylaş'}).click();
  const dialog=page.getByRole('dialog',{name:'Bu Bülteni Paylaş'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox',{name:'Yayımlanmış bülten adresi'}))
    .toHaveValue(/\/b\/AQIDBAUGBwgJCgsM$/);
  await expect(dialog.getByRole('textbox',{name:'Yayımlanmış bülten adresi'})).toHaveAttribute('readonly','');
});

test('newly published URL becomes static social links in HTML export for email readers',async({page})=>{
  await page.goto('/');
  await page.route('**/api/publish',route=>route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({slug:'AQIDBAUGBwgJCgsM'})}));
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Mevcut bülteni paylaş'}).click();
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  const html=await downloadNewsletter(page);
  expect(html).toContain('https://www.linkedin.com/sharing/share-offsite/?url=');
  expect(html).toContain('data-public-url="http://127.0.0.1:3000/b/AQIDBAUGBwgJCgsM"');
  expect(html).toContain('property="og:url" content="http://127.0.0.1:3000/b/AQIDBAUGBwgJCgsM"');
});
