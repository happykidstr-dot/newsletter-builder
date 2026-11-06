import {test,expect} from '../helpers/authorized-editor-test';
import {readFileSync} from 'node:fs';

const VIDEO_ID='dQw4w9WgXcQ';
async function createTestJpeg(page:import('@playwright/test').Page):Promise<Buffer>{
  // Produce a valid, deterministic JPEG in Chromium; avoid fragile copied
  // base64 fixtures that can lose bytes during source editing.
  const dataUrl=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=180;canvas.height=100;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Test canvas unavailable');
    ctx.fillStyle='#164e63';ctx.fillRect(0,0,180,100);
    ctx.fillStyle='#f8fafc';ctx.beginPath();
    ctx.moveTo(75,25);ctx.lineTo(75,75);ctx.lineTo(116,50);ctx.closePath();ctx.fill();
    return canvas.toDataURL('image/jpeg',0.82);
  });
  const sample=Buffer.from(dataUrl.split(',')[1],'base64');
  if(sample.length<100||sample[0]!==0xff||sample[1]!==0xd8)
    throw new Error('Invalid generated JPEG fixture.');
  return sample;
}

async function addYoutubeVideo(page:import('@playwright/test').Page){
  await page.goto('/');
  await page.getByRole('group',{name:'İçerik blokları seviyesi'}).getByRole('button',{name:'Gelişmiş'}).click();
  await page.getByTestId('palette-video').click();
  await page.getByPlaceholder('https://youtu.be/...').fill('https://www.youtube.com/shorts/'+VIDEO_ID);
  await page.getByPlaceholder('Video açıklaması...').fill('Eğitim videosu');
}

test('downloaded HTML shows a true YouTube still image, watch link and on-page playback',async({page})=>{
  await addYoutubeVideo(page);
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:/HTML/}).click(),
  ]);
  const file=await download.path();
  const html=readFileSync(file!,'utf8');
  expect(html).toContain('https://i.ytimg.com/vi/'+VIDEO_ID+'/hqdefault.jpg');
  expect(html).toContain('data-bulten-video-id="'+VIDEO_ID+'"');
  expect(html).toContain('https://www.youtube.com/watch?v='+VIDEO_ID);
  expect(html).toContain('class="bulten-video-player"');
  expect(html).toContain('https://www.youtube-nocookie.com/embed/'+VIDEO_ID);
  expect(html).toContain('Eğitim videosu');
});

test('visual PDF fetches and embeds a video frame thumbnail instead of printing iframe URL',async({page})=>{
  test.setTimeout(60000);
  const sampleJpeg=await createTestJpeg(page);
  let posterRequests=0;
  await page.route('**/api/video-thumbnail/'+VIDEO_ID,async route=>{
    posterRequests++;
    await route.fulfill({status:200,contentType:'image/jpeg',body:sampleJpeg});
  });
  await addYoutubeVideo(page);
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:45000}),
    page.getByRole('button',{name:'PDF indir'}).click(),
  ]);
  const saved=await download.path();
  const binary=readFileSync(saved!);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  expect(binary.subarray(0,5).toString('ascii')).toBe('%PDF-');
  expect(posterRequests).toBeGreaterThan(0);
  expect(binary.length).toBeGreaterThan(8000);
});

test('text PDF also embeds a real video still and a readable watch link',async({page})=>{
  test.setTimeout(60000);
  const sampleJpeg=await createTestJpeg(page);
  let posterRequests=0;
  await page.route('**/api/video-thumbnail/'+VIDEO_ID,async route=>{
    posterRequests++;
    await route.fulfill({status:200,contentType:'image/jpeg',body:sampleJpeg});
  });
  await addYoutubeVideo(page);
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:45000}),
    page.getByTestId('pdf-readable').click(),
  ]);
  const raw=readFileSync((await download.path())!);
  expect(raw.subarray(0,5).toString('ascii')).toBe('%PDF-');
  expect(download.suggestedFilename()).toMatch(/-metin\.pdf$/);
  expect(posterRequests).toBeGreaterThan(0);
  expect(raw.length).toBeGreaterThan(6000);
  const parse=(await import('pdf-parse')).default;
  const extracted=await parse(raw);
  expect(extracted.text).toContain('Eğitim videosu');
  expect(extracted.text).toContain('Videoyu izle');
});

test('thumbnail proxy does not permit arbitrary URL fetching',async({request})=>{
  for(const id of ['invalid','evil.example','short','dQw4w9WgXcQextra']){
    const response=await request.get('/api/video-thumbnail/'+encodeURIComponent(id));
    expect(response.status()).toBe(400);
  }
});
