import {test,expect} from '../helpers/authorized-editor-test';
import {readFileSync} from 'node:fs';

test('Temel and Gelişmiş expose the appropriate blocks without removing existing work',async({page})=>{
  await page.goto('/');
  await expect(page.getByTestId('palette-title')).toBeVisible();
  await expect(page.getByTestId('palette-googleform')).toHaveCount(0);
  const modes=page.getByRole('group',{name:'İçerik blokları seviyesi'});
  await modes.getByRole('button',{name:'Gelişmiş'}).click();
  await expect(page.getByTestId('palette-googleform')).toBeVisible();
  await page.getByTestId('palette-googleform').click();
  await modes.getByRole('button',{name:'Temel'}).click();
  await expect(page.getByTestId('palette-googleform')).toHaveCount(0);
  // Hiding a creation tool cannot remove the block previously inserted.
  await expect(page.locator('iframe[src*="forms"]')).toHaveCount(0);
  await expect(page.locator('.bulten-canvas')).toBeVisible();
});

test('Share never publishes in place of Publish and does not silently update edited content',async({page})=>{
  await page.goto('/');
  let requests=0;
  page.on('dialog',dialog=>dialog.accept());
  await page.route('**/api/publish',async route=>{
    requests++;
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      slug:'AQIDBAUGBwgJCgsM',editToken:'A'.repeat(43),revision:1,
    })});
  });
  await page.getByRole('button',{name:'Mevcut bülteni paylaş'}).click();
  expect(requests).toBe(0);
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toBeVisible();
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  await page.getByRole('button',{name:'Mevcut bülteni paylaş'}).click();
  expect(requests).toBe(1);
  await page.getByRole('button',{name:'Paylaşım penceresini kapat'}).click();
  await page.getByPlaceholder('Bülten başlığı...').fill('Henüz güncellenmedi');
  await page.getByRole('button',{name:'Mevcut bülteni paylaş'}).click();
  expect(requests).toBe(1);
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toHaveCount(0);
});

test('text based PDF downloads without a print popup and retains searchable Turkish text',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('Erişilebilir Türkçe Bülten');
  await page.getByTestId('advanced-tools-toggle').click();
  const popups:unknown[]=[];
  page.on('popup',popup=>popups.push(popup));
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:75000}),
    page.getByTestId('pdf-readable').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/-metin\.pdf$/i);
  const file=await download.path();
  expect(file).toBeTruthy();
  const raw=readFileSync(file!);
  expect(raw.subarray(0,5).toString('ascii')).toBe('%PDF-');
  expect(popups).toHaveLength(0);
  const parser=(await import('pdf-parse')).default;
  const parsed=await parser(raw);
  expect(parsed.text).toContain('Erişilebilir Türkçe Bülten');
  expect(parsed.text).toContain('Bültenimize Hoş Geldiniz');
});

test('actual template HTML preview and exported newsletter use the same content renderer',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Şablonlar'}).click();
  await page.getByTestId('template-gallery-card').first().click();
  const frame=page.frameLocator('[data-testid="template-gallery-live-preview"]');
  const previewTitle=await frame.locator('h1').first().innerText();
  const paragraph=await frame.locator('#bulten-reading-content').innerText();
  expect(paragraph).toContain('Birlikte Daha Güçlü Bir Avrupa');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:/Örnek içerikle yeni bülten oluştur/}).click();
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/HTML/}).click()]);
  const html=readFileSync((await download.path())!,'utf8');
  expect(html).toContain('<h1 style=');
  expect(html).toContain(previewTitle);
  expect(html).toContain('Birlikte Daha Güçlü Bir Avrupa');
});

test('editor stays usable at 320px width without a forced three-panel horizontal layout',async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto('/');
  await expect(page.getByRole('navigation',{name:'Mobil editör panelleri'})).toBeVisible();
  await page.getByRole('navigation',{name:'Mobil editör panelleri'}).getByRole('button',{name:/İçerik/}).click();
  await expect(page.locator('.bulten-palette')).toBeVisible();
  await page.getByRole('navigation',{name:'Mobil editör panelleri'}).getByRole('button',{name:/Bülten/}).click();
  await expect(page.locator('.bulten-canvas')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});


test('Yayın Önizleme opens the actual export HTML without enabling its scripts',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Yayın önizlemesi'}).click();
  const dialog=page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'});
  await expect(dialog).toBeVisible();
  const iframe=dialog.locator('iframe[data-testid="editor-live-publication-preview"]');
  await expect(iframe).toHaveAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');
  const sandbox=await iframe.getAttribute('sandbox');
  expect(sandbox).not.toContain('allow-scripts');
  expect(sandbox).not.toContain('allow-same-origin');
  await expect(dialog.frameLocator('iframe').locator('h1').first()).toHaveText('Proje ve Toplum Bülteni');
  await page.getByRole('button',{name:'Yayın önizlemesini kapat'}).click();
  await expect(dialog).toHaveCount(0);
});
