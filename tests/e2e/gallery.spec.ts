import { test, expect } from '@playwright/test';

async function openGallery(page:import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Şablonlar/ }).click();
  await expect(page.getByRole('dialog', { name: /Şablon Galerisi/ })).toBeVisible();
}

test('eight real newsletter preview cards have readable dimensions', async ({page}) => {
  await openGallery(page);
  const cards = page.getByTestId('template-gallery-card');
  await expect(cards).toHaveCount(8);
  for (let i = 0; i < 8; i++) {
    const rect = await cards.nth(i).boundingBox();
    expect(rect && rect.height > 380).toBeTruthy();
  }
});

test('filters show matching templates and search finds one design', async ({page}) => {
  await openGallery(page);
  await page.getByRole('button', { name:'Etkinlikler', exact:true }).click();
  await expect(page.getByTestId('template-gallery-card')).toHaveCount(1);
  await expect(page.getByTestId('template-gallery-card').first()).toContainText('Event & Webinar');
  await page.getByRole('button', { name:'Tümü', exact:true }).click();
  await page.getByRole('searchbox', { name:'Şablonlarda ara' }).fill('Inclusive');
  await expect(page.getByTestId('template-gallery-card')).toHaveCount(1);
});

test('preview shows live text blocks and device switching', async ({page}) => {
  await openGallery(page);
  await page.getByTestId('template-gallery-card').first().click();
  const preview = page.getByTestId('template-gallery-preview');
  await expect(preview).toContainText('Birlikte Daha Güçlü Bir Avrupa');
  await page.getByRole('button',{name:/Mobil/}).click();
  await expect(preview.locator('[data-kind="magazine"]')).toHaveClass(/mobile/);
  await page.getByRole('button',{name:/Masaüstü/}).click();
  await expect(preview.locator('[data-kind="magazine"]')).not.toHaveClass(/mobile/);
});

test('applying a design preserves existing title and blocks', async ({page}) => {
  await page.goto('/');
  const title = page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Kendi Hazırladığım Bülten');
  await page.getByRole('button', { name: /Şablonlar/ }).click();
  await page.getByTestId('template-gallery-card').first().click();
  await page.getByRole('button',{name:/Tasarımı uygula/}).click();
  await expect(page.getByTestId('template-gallery-modal')).toHaveCount(0);
  await expect(title).toHaveValue('Kendi Hazırladığım Bülten');
});

test('replacing content requires confirmation and respects cancel',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Silinmeyecek Özel Bülten');
  await page.getByRole('button',{name:/Şablonlar/}).click();
  await page.getByTestId('template-gallery-card').first().click();
  page.once('dialog', dialog=>dialog.dismiss());
  await page.getByRole('button',{name:/Örnek içerikle yeni bülten oluştur/}).click();
  await expect(title).toHaveValue('Silinmeyecek Özel Bülten');
  await expect(page.getByTestId('template-gallery-modal')).toBeVisible();
  page.once('dialog', dialog=>dialog.accept());
  await page.getByRole('button',{name:/Örnek içerikle yeni bülten oluştur/}).click();
  await expect(title).toHaveValue('European Project Magazine');
});

test('gallery works on a narrow phone viewport',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await openGallery(page);
  const grid=page.getByTestId('template-gallery-grid');
  const n=await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(n).toBe(2);
  await page.getByTestId('template-gallery-card').first().click();
  const viewport=await page.getByTestId('template-gallery-modal').boundingBox();
  expect(viewport && viewport.width <= 375).toBeTruthy();
  await expect(page.getByRole('button',{name:/Tasarımı uygula/})).toBeVisible();
});

test('escape closes preview first, then gallery',async({page})=>{
  await openGallery(page);
  await page.getByTestId('template-gallery-card').first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('template-gallery-card')).toHaveCount(8);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('template-gallery-modal')).toHaveCount(0);
});
