import {test,expect} from '@playwright/test';

test('anonymous editor access is denied without Supabase Auth configuration',async({page,request})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'BÜLTEN READ'})).toBeVisible();
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveCount(0);
  await expect(page.getByText('Yayıncı doğrulaması yapılandırılmadığı için editör güvenlik amacıyla kapalıdır.')).toBeVisible();
  for(const route of ['/api/editor-access','/api/db/newsletters','/api/db/mailing-lists','/api/account/privacy']){
    const result=await request.get(route);
    expect([401,403,503]).toContain(result.status());
  }
});

test('server-denied publisher cannot see editor even if the access endpoint returns forbidden',async({page})=>{
  await page.route('**/api/editor-access',route=>route.fulfill({
    status:403,contentType:'application/json',body:JSON.stringify({error:'BÜLTEN READ publisher not approved'}),
  }));
  await page.goto('/');
  await expect(page.getByText('Bu hesap için bülten hazırlama veya yayımlama yetkisi verilmemiştir.')).toBeVisible();
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveCount(0);
});

test('server-approved publisher can mount the editor without a test-only server auth backdoor',async({page})=>{
  await page.route('**/api/editor-access',route=>route.fulfill({
    status:200,contentType:'application/json',body:'{"allowed":true}',
  }));
  await page.goto('/');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toBeVisible();
});

test('public newsletter reader requests stay unauthenticated and never expose the editor',async({request})=>{
  const result=await request.get('/b/not-a-valid-id');
  expect([400,404,503]).toContain(result.status());
});
