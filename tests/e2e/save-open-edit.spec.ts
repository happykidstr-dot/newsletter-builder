import {test,expect} from '@playwright/test';

const openSaved=async (page:import('@playwright/test').Page) => {
  await page.locator('button[title="Kayıtlı Bültenleri Aç"]').click();
  await expect(page.getByRole('dialog',{name:'Kayıtlı Bültenlerim'})).toBeVisible();
};

test('Kaydet saves one editable record and Open loads it after another newsletter',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Sosyal Hizmet Bültenim');
  await page.locator('button[title="Kaydet"]').click();
  await openSaved(page);
  await expect(page.getByTestId('saved-newsletter-item')).toHaveCount(1);
  await expect(page.getByTestId('saved-newsletter-item')).toContainText('Sosyal Hizmet Bültenim');
  await page.getByRole('button',{name:'Kayıtlı bültenleri kapat'}).click();
  await title.fill('Başlık Güncellendi');
  await page.locator('button[title="Kaydet"]').click();
  await openSaved(page);
  await expect(page.getByTestId('saved-newsletter-item')).toHaveCount(1);
  await expect(page.getByTestId('saved-newsletter-item')).toContainText('Başlık Güncellendi');
  await page.getByTestId('saved-newsletter-item').getByRole('button',{name:/Open/}).click();
  await expect(title).toHaveValue('Başlık Güncellendi');
});

test('double-click opens a saved newsletter and survives a browser reload',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Çift Tıklama Bülteni');
  await page.locator('button[title="Kaydet"]').click();
  await page.reload();
  await openSaved(page);
  await page.getByTestId('saved-newsletter-item').first().dblclick();
  await expect(page.getByRole('dialog',{name:'Kayıtlı Bültenlerim'})).toHaveCount(0);
  await expect(title).toHaveValue('Çift Tıklama Bülteni');
});

test('a saved published newsletter can be edited and updated at its original URL',async({page})=>{
  await page.goto('/');
  const token='A'.repeat(43), slug='AQIDBAUGBwgJCgsM';
  const calls:any[]=[];
  await page.route('**/api/publish',async route=>{
    const data=route.request().postDataJSON(); calls.push(data);
    const result=calls.length===1?{slug,editToken:token,revision:1}:{slug,updated:true,revision:2};
    await route.fulfill({status:calls.length===1?201:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('Yayımlanan Bülten');
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toBeVisible();
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  await openSaved(page);
  await expect(page.getByTestId('saved-newsletter-item')).toContainText('Yayınlandı');
  await page.getByTestId('saved-newsletter-item').getByRole('button',{name:/Edit/}).click();
  await title.fill('Yayımlanan Bülten – Güncel');
  await page.getByRole('button',{name:'Yayını güncelle'}).click();
  expect(calls).toHaveLength(2);
  expect(calls[1].slug).toBe(slug);
  expect(calls[1].editToken).toBe(token);
  await expect(page.getByRole('textbox',{name:'Yayımlanmış bülten adresi'})).toHaveValue(new RegExp(slug));
});

test('new newsletter does not overwrite the previous publication or edit credentials',async({page})=>{
  await page.goto('/');
  const title=page.getByPlaceholder('Bülten başlığı...');
  await title.fill('İlk Çalışma');
  await page.locator('button[title="Kaydet"]').click();
  await page.locator('button[title="Yeni boş bülten aç"]').click();
  await expect(title).toHaveValue('Yeni Bülten');
  await page.locator('button[title="Kaydet"]').click();
  await openSaved(page);
  await expect(page.getByTestId('saved-newsletter-item')).toHaveCount(2);
});
