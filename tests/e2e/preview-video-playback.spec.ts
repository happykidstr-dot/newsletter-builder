import {test,expect} from '../helpers/authorized-editor-test';

const id='dQw4w9WgXcQ';
async function insertVideo(page:import('@playwright/test').Page){
  await page.goto('/');
  await page.getByRole('group',{name:'İçerik blokları seviyesi'}).getByRole('button',{name:'Gelişmiş'}).click();
  await page.getByTestId('palette-video').click();
  await page.getByPlaceholder('https://youtu.be/...').fill('https://youtu.be/'+id);
  await page.getByPlaceholder('Video açıklaması...').fill('Örnek video');
  await page.getByRole('button',{name:'Yayın önizlemesi'}).click();
}

test('newsletter preview does not show an unusable sandboxed YouTube player',async({page})=>{
  await insertVideo(page);
  const dialog=page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'});
  await expect(dialog).toBeVisible();
  const frame=dialog.locator('iframe[data-testid="editor-live-publication-preview"]');
  const sandbox=await frame.getAttribute('sandbox');
  expect(sandbox).toContain('allow-popups');
  expect(sandbox).not.toContain('allow-scripts');
  expect(sandbox).not.toContain('allow-same-origin');
  const preview=dialog.frameLocator('iframe[data-testid="editor-live-publication-preview"]');
  await expect(preview.locator('img[data-bulten-video-id="'+id+'"]')).toBeVisible();
  await expect(preview.locator('iframe[src*="youtube"]')).toHaveCount(0);
  await expect(preview.getByText('Bu güvenli önizlemede gömülü oynatıcı kapalıdır.',{exact:false})).toBeVisible();
  await expect(preview.locator('a[href="https://www.youtube.com/watch?v='+id+'"]')).toHaveCount(2);
});

test('trusted separate YouTube preview plays without allowing user HTML scripts',async({page})=>{
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><title>Sample YouTube player</title><p>Video is loaded</p>',
  }));
  await insertVideo(page);
  const button=page.getByTestId('preview-play-video');
  await expect(button).toHaveCount(1);
  await button.click();
  const playerDialog=page.getByRole('dialog',{name:'YouTube videosunu oynat'});
  await expect(playerDialog).toBeVisible();
  const videoFrame=page.getByTestId('preview-youtube-player');
  await expect(videoFrame).toHaveAttribute('src','https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1');
  await expect(videoFrame).not.toHaveAttribute('sandbox',/.+/);
  await expect(playerDialog.getByRole('link',{name:"Oynatılmazsa YouTube'da aç"})).toHaveAttribute('href','https://www.youtube.com/watch?v='+id);
  await page.getByRole('button',{name:'Video oynatıcıyı kapat'}).click();
  await expect(playerDialog).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'})).toBeVisible();
});

test('small-screen preview offers playback and returns safely to the newsletter',async({page})=>{
  await page.setViewportSize({width:375,height:730});
  await insertVideo(page);
  await page.getByTestId('preview-play-video').click();
  await expect(page.getByRole('dialog',{name:'YouTube videosunu oynat'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'YouTube videosunu oynat'})).toHaveCount(0);
  await page.getByRole('button',{name:'Yayın önizlemesini kapat'}).click();
  await expect(page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'})).toHaveCount(0);
  await expect(page.getByPlaceholder('Bülten başlığı...')).toBeVisible();
});
