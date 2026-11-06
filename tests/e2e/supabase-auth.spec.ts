import {test,expect} from '@playwright/test';

test('editor stays public when Supabase Auth is not configured, without exposing private APIs',async({page,request})=>{
  await page.goto('/');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toBeVisible();
  // GitHub CI builds without production credentials. Preview builds may configure
  // Supabase in the future; both states must remain meaningful and safe.
  const status=page.getByText('Hesap ayarı gerekli');
  const login=page.getByRole('button',{name:'Hesaba giriş yap'});
  await expect(status.or(login)).toBeVisible();
  for(const route of ['/api/db/newsletters','/api/db/mailing-lists','/api/account/privacy']){
    const response=await request.get(route);
    expect([401,503]).toContain(response.status());
  }
});

test('signed-out account modal is accessible and offers Google and email/password flows when configured',async({page})=>{
  await page.goto('/');
  const login=page.getByRole('button',{name:'Hesaba giriş yap'});
  if(!(await login.count()))return; // No public Supabase key in GitHub CI.
  await login.click();
  const modal=page.getByRole('dialog',{name:/BÜLTEN READ · Giriş/});
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('button',{name:/Google ile Giriş Yap/})).toBeVisible();
  await expect(modal.getByLabel('E-posta adresi')).toBeVisible();
  await expect(modal.getByLabel('Şifre',{exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});
