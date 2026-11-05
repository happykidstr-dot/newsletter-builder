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

test('publisher must enter published URL before editor social buttons become active',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/Paylaş/}).first().click();
  const dialog=page.getByRole('dialog',{name:'Okuyucu Paylaşımı'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Henüz yayımlanmış bülten bağlantısı belirtilmedi/)).toBeVisible();
  const url=dialog.getByRole('textbox',{name:/Yayımlanmış bültenin bağlantısı/});
  await url.fill('javascript:alert(1)');
  await expect(dialog.getByRole('link',{name:/LinkedIn/})).toHaveCount(0);
  await url.fill('https://example.org/newsletter/may-2027.html');
  await expect(dialog.getByRole('link',{name:/LinkedIn/})).toHaveAttribute('href',/example\.org/);
  await expect(dialog.getByRole('link',{name:/WhatsApp/})).toHaveAttribute('href',/wa\.me/);
});

test('known published URL is written as static share links for email clients without JavaScript',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/Paylaş/}).first().click();
  await page.getByRole('textbox',{name:/Yayımlanmış bültenin bağlantısı/})
    .fill('https://example.org/newsletters/impact.html');
  await page.getByRole('button',{name:/Paylaşım penceresini kapat/}).click();
  const html=await downloadNewsletter(page);
  expect(html).toContain('https://www.linkedin.com/sharing/share-offsite/?url=');
  expect(html).toContain('data-public-url="https://example.org/newsletters/impact.html"');
  expect(html).toContain('property="og:url" content="https://example.org/newsletters/impact.html"');
});
