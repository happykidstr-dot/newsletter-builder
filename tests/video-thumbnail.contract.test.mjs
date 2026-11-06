import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('video links are parsed from approved YouTube hosts and every image comes from an ID',()=>{
  const video=read('lib/video-thumbnail.ts');
  assert.match(video,/YOUTUBE_HOSTS=new Set/);
  assert.match(video,/youtu\.be/);
  assert.match(video,/youtube-nocookie\.com/);
  assert.match(video,/\/\^\[A-Za-z0-9_-\]\{11\}\$/);
  assert.match(video,/new URL\(raw\.trim\(\)\)/);
  assert.match(video,/i\.ytimg\.com\/vi\//);
  assert.match(video,/youtubePosterProxyPath/);
});
test('HTML export includes a real video still, watch link, and optional inline player',()=>{
  const renderer=read('lib/newsletter-render.ts');
  assert.match(renderer,/youtubeVideoId\(d\.url/);
  assert.match(renderer,/class="bulten-video-poster"/);
  assert.match(renderer,/data-bulten-video-id="/);
  assert.match(renderer,/youtubePosterUrl\(id\)/);
  assert.match(renderer,/youtubeWatchUrl\(id\)/);
  assert.match(renderer,/class="bulten-video-player"/);
  assert.match(renderer,/youtube-nocookie\.com\/embed/);
  assert.match(read('lib/public-newsletter-render.ts'),/'details','summary'/);
});
test('both PDF types inline the trusted poster, not a missing iframe screenshot',()=>{
  const pdf=read('lib/newsletter-pdf.ts');
  const text=read('lib/newsletter-text-pdf.ts');
  assert.match(pdf,/inlineVideoPosterImages\(node\)/);
  assert.match(pdf,/fetchVideoPosterDataUri\(id\)/);
  assert.match(pdf,/querySelectorAll\('\.bulten-video-player'\)/);
  assert.match(pdf,/readAsDataURL\(blob\)/);
  assert.match(text,/image:'bulten-video-poster:'/);
  assert.match(text,/fetchVideoPosterDataUri\(id\)/);
  assert.match(text,/fit:\[440,248\]/);
});
test('thumbnail proxy blocks arbitrary addresses and caches only validated JPEG',()=>{
  const api=read('app/api/video-thumbnail/[id]/route.ts');
  assert.match(api,/validYoutubeId\(id\)/);
  assert.match(api,/youtubePosterUrl\(id\)/);
  assert.match(api,/byteLength>1_500_000/);
  assert.match(api,/image\/jpeg/);
  assert.match(api,/X-Content-Type-Options/);
  assert.doesNotMatch(api,/searchParams\.get\('url'\)/);
});
