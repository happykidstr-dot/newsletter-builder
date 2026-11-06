import {test,expect} from '@playwright/test';

test('BÜLTEN READ opens its newsletter editor directly without sign-in or Supabase setup',async({page,request})=>{
  await page.goto('/');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toBeVisible();
  await expect(page.getByText('Şifresiz · Yerel düzenleme')).toBeVisible();
  await expect(page.getByText('Yayıncı doğrulaması yapılandırılmadığı için editör güvenlik amacıyla kapalıdır.')).toHaveCount(0);
  await expect(page.getByText('Hesap ayarı gerekli')).toHaveCount(0);
  for(const route of ['/api/editor-access','/api/db/newsletters','/api/db/mailing-lists','/api/account/privacy']){
    const response=await request.get(route);
    expect([401,403,503]).toContain(response.status());
  }
});

test('server API denial must not block passwordless local newsletter editing',async({page})=>{
  await page.route('**/api/editor-access',route=>route.fulfill({
    status:403,contentType:'application/json',
    body:JSON.stringify({error:'Publisher not on allowlist'}),
  }));
  await page.goto('/');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toBeVisible();
  await page.getByPlaceholder('Bülten başlığı...').fill('Şifresiz Örnek Bülten');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Şifresiz Örnek Bülten');
});

test('passwordless mode saves drafts locally and downloads standalone HTML without server credentials',async({page})=>{
  await page.goto('/');
  await page.getByPlaceholder('Bülten başlığı...').fill('Kendi Bültenim');
  await page.getByRole('button',{name:/Kaydet/}).click();
  await expect(page.getByText(/Bülten bu cihazda kaydedildi/)).toBeVisible();
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:/HTML/}).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.html$/);
  const {readFileSync}=await import('node:fs');
  const html=readFileSync((await download.path())!,'utf8');
  expect(html).toContain('Kendi Bültenim');
});

test('public newsletter reader URLs remain independently accessible',async({request})=>{
  const result=await request.get('/b/not-a-valid-id');
  expect([400,404,503]).toContain(result.status());
});
