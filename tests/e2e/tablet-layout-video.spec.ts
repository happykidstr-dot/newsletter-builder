import {test,expect} from '../helpers/authorized-editor-test';
import type {Page} from '@playwright/test';

// Viewport-based tablet coverage with touch events. YouTube playback is mocked
// because third-party embed permissions vary and cannot be validated in CI.
test.use({hasTouch:true});
const videoId='dQw4w9WgXcQ';

async function expectNoHorizontalOverflow(page:Page){
  const layout=await page.evaluate(()=>({
    windowWidth:window.innerWidth,
    documentWidth:document.documentElement.scrollWidth,
    bodyWidth:document.body.scrollWidth,
  }));
  expect(layout.documentWidth,JSON.stringify(layout)).toBeLessThanOrEqual(layout.windowWidth+2);
  expect(layout.bodyWidth,JSON.stringify(layout)).toBeLessThanOrEqual(layout.windowWidth+2);
}

async function selectVideo(page:Page){
  const mobileNav=page.getByRole('navigation',{name:'Mobil editör panelleri'});
  if(await mobileNav.isVisible())
    await mobileNav.getByRole('button',{name:/İçerik/}).tap();
  const palette=page.getByRole('group',{name:'İçerik blokları seviyesi'});
  await expect(palette).toBeVisible();
  await palette.getByRole('button',{name:'Gelişmiş'}).tap();
  await page.getByTestId('palette-video').tap();
  await expect(page.getByPlaceholder('https://youtu.be/...')).toBeVisible();
  await page.getByPlaceholder('https://youtu.be/...').fill('https://youtu.be/'+videoId);
  await page.getByPlaceholder('Video açıklaması...').fill('Tablet video denemesi');
}

async function expectCanvasUsable(page:Page,minWidth:number){
  const canvas=page.locator('.bulten-canvas');
  await expect(canvas).toBeVisible();
  const bounds=await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width,'Tablet newsletter workspace should not be a cramped narrow column').toBeGreaterThanOrEqual(minWidth);
  expect(bounds!.height,'Tablet canvas must retain room for editing').toBeGreaterThanOrEqual(240);
}

for(const viewport of [
  {width:768,height:1024},
  {width:820,height:1180},
  {width:834,height:1112},
  {width:900,height:1200},
]){
  test('tablet portrait '+viewport.width+'x'+viewport.height+' navigation, editor and preview',async({page})=>{
    await page.setViewportSize(viewport);
    await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({
      status:200,contentType:'text/html',body:'<!doctype html><title>Mock video player</title>',
    }));
    await page.goto('/');
    const nav=page.getByRole('navigation',{name:'Mobil editör panelleri'});
    await expect(nav).toBeVisible();
    await expectCanvasUsable(page,viewport.width-4);
    await expectNoHorizontalOverflow(page);

    await selectVideo(page);
    await expect(nav.getByRole('button',{name:/Düzenle/})).toHaveAttribute('aria-pressed','true');
    await nav.getByRole('button',{name:/Bülten/}).tap();
    await expectCanvasUsable(page,viewport.width-4);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({path:'test-results/tablet-'+viewport.width+'x'+viewport.height+'-editor.png'});

    await page.getByRole('button',{name:'Yayın önizlemesi'}).tap();
    const preview=page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'});
    await expect(preview).toBeVisible();
    const safeIframe=preview.getByTestId('editor-live-publication-preview');
    await expect(safeIframe).toHaveAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');
    const safeDoc=preview.frameLocator('[data-testid="editor-live-publication-preview"]');
    await expect(safeDoc.locator('img[data-bulten-video-id="'+videoId+'"]')).toBeVisible();
    await expect(safeDoc.locator('iframe[src*="youtube"]')).toHaveCount(0);
    const geometry=await preview.evaluate(el=>{
      const box=el.getBoundingClientRect();
      return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height};
    });
    expect(geometry.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.right).toBeLessThanOrEqual(viewport.width+1);
    expect(geometry.top).toBeGreaterThanOrEqual(-1);
    expect(geometry.bottom).toBeLessThanOrEqual(viewport.height+1);
    expect(await safeIframe.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(180);
    await page.screenshot({path:'test-results/tablet-'+viewport.width+'x'+viewport.height+'-preview.png'});

    await preview.getByTestId('preview-play-video').tap();
    const player=page.getByRole('dialog',{name:'YouTube videosunu oynat'});
    await expect(player).toBeVisible();
    await expect(player.getByTestId('preview-youtube-player')).toHaveAttribute(
      'src','https://www.youtube-nocookie.com/embed/'+videoId+'?autoplay=1',
    );
    const videoBounds=await player.boundingBox();
    expect(videoBounds).not.toBeNull();
    expect(videoBounds!.x).toBeGreaterThanOrEqual(-1);
    expect(videoBounds!.x+videoBounds!.width).toBeLessThanOrEqual(viewport.width+1);
    await page.screenshot({path:'test-results/tablet-'+viewport.width+'x'+viewport.height+'-player.png'});
    await player.getByRole('button',{name:'Video oynatıcıyı kapat'}).tap();
    await expect(player).toHaveCount(0);
    await preview.getByRole('button',{name:'Yayın önizlemesini kapat'}).tap();
    await expect(preview).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
}

for(const viewport of [
  {width:1024,height:768},
  {width:1180,height:820},
]){
  test('tablet landscape '+viewport.width+'x'+viewport.height+' gives the canvas enough space',async({page})=>{
    await page.setViewportSize(viewport);
    await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({
      status:200,contentType:'text/html',body:'<!doctype html><title>Mock video player</title>',
    }));
    await page.goto('/');
    const nav=page.getByRole('navigation',{name:'Mobil editör panelleri'});
    if(viewport.width<=1100){
      await expect(nav).toBeVisible();
      await expectCanvasUsable(page,viewport.width-4);
    }else{
      await expect(nav).toBeHidden();
      await expectCanvasUsable(page,580);
    }
    await expectNoHorizontalOverflow(page);
    await selectVideo(page);
    if(await nav.isVisible())await nav.getByRole('button',{name:/Bülten/}).tap();
    await expectCanvasUsable(page,580);
    await page.screenshot({path:'test-results/tablet-'+viewport.width+'x'+viewport.height+'-editor.png'});
    await page.getByRole('button',{name:'Yayın önizlemesi'}).tap();
    const preview=page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'});
    await expect(preview).toBeVisible();
    await expect(preview.getByTestId('preview-play-video')).toBeVisible();
    await page.screenshot({path:'test-results/tablet-'+viewport.width+'x'+viewport.height+'-preview.png'});
    await preview.getByTestId('preview-play-video').tap();
    const player=page.getByRole('dialog',{name:'YouTube videosunu oynat'});
    await expect(player).toBeVisible();
    const box=await player.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(-1);
    expect(box!.y+box!.height).toBeLessThanOrEqual(viewport.height+1);
    await page.screenshot({path:'test-results/tablet-'+viewport.width+'x'+viewport.height+'-player.png'});
    await player.getByRole('button',{name:'Video oynatıcıyı kapat'}).tap();
    await preview.getByRole('button',{name:'Yayın önizlemesini kapat'}).tap();
    await expectNoHorizontalOverflow(page);
  });
}

test('tablet rotates without losing the newsletter or selected video',async({page})=>{
  await page.setViewportSize({width:820,height:1180});
  await page.goto('/');
  await selectVideo(page);
  await page.setViewportSize({width:1180,height:820});
  await expect(page.locator('.bulten-canvas')).toBeVisible();
  await expect(page.getByPlaceholder('Video açıklaması...')).toHaveValue('Tablet video denemesi');
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button',{name:'Yayın önizlemesi'}).tap();
  await expect(page.getByRole('dialog',{name:'Gerçek yayın önizlemesi'}).getByTestId('preview-play-video')).toHaveCount(1);
});
