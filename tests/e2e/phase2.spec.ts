import {test,expect} from '../helpers/authorized-editor-test';
import {readFile} from 'node:fs/promises';

test('mobile editor has working content, preview and properties panels',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto('/');
  await expect(page.locator('.bulten-canvas')).toBeVisible();
  await expect(page.locator('.bulten-palette')).toBeHidden();
  await page.getByRole('navigation',{name:'Mobil editör panelleri'}).getByRole('button',{name:/İçerik/}).click();
  await expect(page.locator('.bulten-palette')).toBeVisible();
  await page.getByRole('group',{name:'İçerik blokları seviyesi'}).getByRole('button',{name:'Gelişmiş'}).click();
  await page.getByTestId('palette-googleform').click();
  await page.getByRole('navigation',{name:'Mobil editör panelleri'}).getByRole('button',{name:/Düzenle/}).click();
  await expect(page.locator('.bulten-properties')).toBeVisible();
  await expect(page.getByPlaceholder(/https:\/\/forms\.gle/)).toBeVisible();
  await page.getByRole('navigation',{name:'Mobil editör panelleri'}).getByRole('button',{name:/Bülten/}).click();
  await expect(page.locator('.bulten-canvas')).toBeVisible();
  const wider=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  expect(wider).toBe(false);
});

test('Google Form and external response links survive HTML export',async({page})=>{
  await page.goto('/');
  await page.getByRole('group',{name:'İçerik blokları seviyesi'}).getByRole('button',{name:'Gelişmiş'}).click();
  await page.getByTestId('palette-googleform').click();
  await page.getByPlaceholder(/https:\/\/forms\.gle/).fill('https://docs.google.com/forms/d/e/demo/viewform');
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:/HTML/}).click(),
  ]);
  const html=await readFile(await download.path() as string,'utf8');
  expect(html).toContain('Google Form’u Aç ve Yanıtla');
  expect(html).toContain('https://docs.google.com/forms/d/e/demo/viewform');
});

test('migrates legacy browser draft to IndexedDB without losing content',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('bulten_draft_v1',JSON.stringify({
      title:'Eski Taslak Korunuyor',subtitle:'',
      design:'modern',blocks:[{id:'legacy-1',type:'paragraph',data:{text:'Taşınan içerik'}}],
    }));
  });
  await page.goto('/');
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Eski Taslak Korunuyor');
  await expect.poll(async()=>page.evaluate(async()=>{
    return new Promise<boolean>((resolve,reject)=>{
      const request=indexedDB.open('bulten-read-offline-v1');
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        const db=request.result;
        const read=db.transaction('drafts','readonly').objectStore('drafts').get('active');
        read.onsuccess=()=>{resolve(read.result?.content?.title==='Eski Taslak Korunuyor');db.close();};
        read.onerror=()=>{reject(read.error);db.close();};
      };
    });
  })).toBe(true);
});
