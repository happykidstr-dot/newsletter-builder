import {test,expect} from '../helpers/authorized-editor-test';
import {readFileSync} from 'node:fs';

const VIDEO_ID='dQw4w9WgXcQ';
const SAMPLE_JPEG=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAcFBQYFBAcGBgYIBwcICxILCwoKCxYPEA0SGhYbGhkWGRgcICgiHB4mHhgZIzAkJiorLS4tGyIyNTEsNSgsLSz/2wBDAQcICAsJCxULCxUsHRkdLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCz/wAARCABkALQDASIAAhEBAxEB/8QAGgABAQEBAQEBAAAAAAAAAAAAAAUHCAYCA//EADYQAAIBAgIIAwYEBwAAAAAAAAABAgMRBAUGBxIWIWSj4RMiMQgUFTdBUTJ1kbMzNEJDRGHR/8QAGQEBAAMBAQAAAAAAAAAAAAAAAAEDBAIF/8QAIREBAAICAgIDAQEAAAAAAAAAAAECAxETUSExBBIyIlL/2gAMAwEAAhEDEQA/AMlAB6byQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2bVVq+yDTbV3i5Zph5xxVLMJwp4qhLYqwjsUna/FNevCSdtp2s3ci1orG5d1rNp1DGQe40v1S6S6J+LiPd/iWXQvL3rCpy2Yrad5w9YWjG7fGKultM8OImJ9Ims18SAAlyAAAAAAAAAAAAAAAAAAAAAAAAHRvs9fL7HfmVT9qkc5HRvs9fL7HfmVT9qkVZvyvwftqpn+m2qDItL6rxlB/Ccxd9qvQpRcKrctpyqQ4bUvxcU0+PFuyRoAMkTMeYbJrFo1LkfSvVvpLodtVcwwXi4Nf5mGbqUf6fV2Tjxkl5kru9rnlTt6vQpYrD1KFelCtRqxcJ05xUozi1Zpp8GmvoZdpfqJyXOPFxeQ1PhGMleXhWcsPN+Z2t6wu2l5eCS4RNNc3+ma+CfdXOQLGk2imcaJZpPBZthJ0WpONOsk3SrJW80JWtJWa/2r2aT4Ecvids0xrxIAAgAAAAAAAABa3e5rp9xu9zXT7nWpVc1O0UFrd7mun3G73NdPuNSc1O0UFrd7mun3G73NdPuNSc1O0UFrd7mun3G73NdPuNSc1O0U6N9nr5fY78yqftUjDN3ua6fc33UVgvcdBsZS8TxL5hOV7W/t0/+FOaP5aPj5K2vqJaWASdINJcr0ZwccRmWI8PbuqdOK2p1GleyX6cXZK6u1cxxEz4h6NrRWNyrHitNdaeQaFzqYStOeNzSMVJYOh6xum47cnwinZfeVpJ7LTM5001l53pBP3bJcZVyTApNN0/41XzXUnNWcOCXCL+sruSfDMt3ua6fc00wT7sw3+bT1WVTTLWVn+meIrQxOKnhstlJuGBoytTUbppSas6jvFO8vrdpL0PIlrd7mun3G73NdPuaIrrxDLOeszuZRQWt3ua6fcbvc10+5OpRzU7RQWt3ua6fcbvc10+41JzU7RQWt3ua6fcbvc10+41JzU7RQWt3ua6fcDUnNTtaAB288AAAAAAAANl1UY/C5Xq+zDG42vGhh6OMnKc5eiXh0/1f0SXFvgY0fbq1HRjRdSTpQk5Rg35U3ZNpfd7K/RfY4vT7xpdhy8VvtpqOlGt+VSE8Lo7TlTal/OVYq7SbvswafB8OMuNm/KnxMxxWLxGOxMsRi69XEV522qlWbnKVlZXb4+iR+IFaRT0jLmvlndpAAdqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//2Q==','base64');

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
  test.setTimeout(120000);
  let posterRequests=0;
  await page.route('**/api/video-thumbnail?id='+VIDEO_ID,async route=>{
    posterRequests++;
    await route.fulfill({status:200,contentType:'image/jpeg',body:SAMPLE_JPEG});
  });
  await addYoutubeVideo(page);
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:100000}),
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
  test.setTimeout(120000);
  let posterRequests=0;
  await page.route('**/api/video-thumbnail?id='+VIDEO_ID,async route=>{
    posterRequests++;
    await route.fulfill({status:200,contentType:'image/jpeg',body:SAMPLE_JPEG});
  });
  await addYoutubeVideo(page);
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:100000}),
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
  for(const id of ['https://example.org/a','../../secrets','short','dQw4w9WgXcQextra']){
    const response=await request.get('/api/video-thumbnail?id='+encodeURIComponent(id));
    expect(response.status()).toBe(400);
  }
});
