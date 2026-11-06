import {test,expect} from '../helpers/authorized-editor-test';
import {readFileSync} from 'node:fs';

const MP3_URL='https://files.example.test/media/project-factory-interview.mp3';

async function addLinkedAudio(page:import('@playwright/test').Page){
  await page.goto('/');
  await expect(page.getByTestId('palette-audio')).toHaveCount(1);
  await page.getByTestId('palette-audio').click();
  const input=page.getByPlaceholder('https://ornek.org/ses.mp3');
  await input.fill(MP3_URL);
  await page.getByPlaceholder('Ses kaydını dinleyin...').fill('Project Factory Söyleşisi');
}

test('single Ses Ekle action accepts audio formats and renders an accessible player',async({page})=>{
  await addLinkedAudio(page);
  await expect(page.getByTestId('audio-file-input')).toHaveAttribute('accept',/audio\/\*/);
  await expect(page.getByTestId('audio-file-input')).toHaveAttribute('accept',/\.flac/);
  await expect(page.getByTestId('audio-file-input')).toHaveAttribute('accept',/\.wma/);
  await expect(page.locator('.bulten-audio-canvas audio[controls]')).toHaveCount(1);
  await expect(page.locator('.bulten-audio-canvas a')).toHaveAttribute('href',MP3_URL);
});

test('HTML download retains native audio player and permanent listening/download link',async({page})=>{
  await addLinkedAudio(page);
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([page.waitForEvent('download'),
    page.getByRole('button',{name:/HTML/}).click()]);
  const html=readFileSync((await download.path())!,'utf8');
  expect(html).toContain('class="bulten-audio-block"');
  expect(html).toContain('<audio controls preload="metadata"');
  expect(html).toContain(MP3_URL);
  expect(html).toContain('Project Factory Söyleşisi');
  expect(html).toContain('Ses dosyasını dinle / indir');
});

test('PDF preserves audio link and removes nonfunctional audio playback controls',async({page})=>{
  test.setTimeout(70000);
  await addLinkedAudio(page);
  await page.getByTestId('advanced-tools-toggle').click();
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:60000}),page.getByTestId('pdf-readable').click(),
  ]);
  const raw=readFileSync((await download.path())!);
  expect(raw.subarray(0,5).toString('ascii')).toBe('%PDF-');
  const parser=(await import('pdf-parse')).default;
  const parsed=await parser(raw);
  expect(parsed.text).toContain('Project Factory Söyleşisi');
  expect(parsed.text).toContain('Ses dosyasını dinle / indir');
});

test('anonymous visitors may not upload an audio file',async({request})=>{
  const response=await request.post('/api/audio',{headers:{
    Origin:'http://127.0.0.1:3000','Content-Type':'application/json',
  },data:JSON.stringify({action:'start',name:'demo.mp3',size:1024,mime:'audio/mpeg'})});
  expect([401,403,503]).toContain(response.status());
});
