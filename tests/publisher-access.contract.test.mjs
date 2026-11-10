import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('only the two explicitly approved, verified mailboxes can use protected cloud publisher APIs',()=>{
  const allowed=read('lib/security/publisher-allowlist.ts');
  assert.deepEqual([...allowed.matchAll(/'[a-z0-9._%+-]+@[a-z0-9.-]+'+/g)].map(m=>m[0].replaceAll("'","")).sort(),
    ['happykidstr@gmail.com','projefabrikasitr@gmail.com']);
  assert.match(allowed,/verified===true/);
  assert.match(allowed,/trim\(\)\.toLowerCase\(\)/);
});
test('default editor is passwordless, while optional private mode retains its access gate',()=>{
  const page=read('app/page.tsx');
  const gate=read('components/EditorAccessGate.tsx');
  const access=read('app/api/editor-access/route.ts');
  const account=read('components/AccountAction.tsx');
  assert.match(page,/NEXT_PUBLIC_REQUIRE_EDITOR_LOGIN==='true'/);
  assert.match(page,/return <BultenReadEditor\/>/);
  assert.match(page,/<EditorAccessGate><BultenReadEditor\/><\/EditorAccessGate>/);
  assert.match(page,/Bülten bu cihazda kaydedildi/);
  assert.match(account,/NEXT_PUBLIC_REQUIRE_EDITOR_LOGIN!=='true'/);
  assert.match(gate,/status==='allowed'/);
  assert.match(gate,/fetch\('\/api\/editor-access'/);
  assert.match(access,/requireAuthorizedPublisher\(\)/);
});
test('all billable and owner-only API routes require the publisher allowlist',()=>{
  for(const path of [
    'app/api/ai-generate/route.ts','app/api/chat/route.ts',
    'app/api/send-email/route.ts','app/api/parse-file/route.ts',
    'app/api/db/analytics/route.ts','app/api/db/newsletters/route.ts',
    'app/api/db/mailing-lists/route.ts',
  ]){
    assert.match(read(path),/requireAuthorizedPublisher\(\)/,path);
  }
  const access=read('lib/security/access.ts');
  assert.match(access,/isApprovedPublisher\(identity\.email,identity\.emailVerified\)/);
  assert.match(access,/status:403/);
  assert.match(access,/status:503/);
});
test('Netlify function routes also independently reject anonymous and nonallowlisted writes',()=>{
  const functionAuth=read('lib/security/netlify-publisher.ts');
  const publication=read('netlify/functions/newsletter-publication.ts');
  const media=read('netlify/functions/newsletter-media.ts');
  assert.match(functionAuth,/client\.auth\.getUser\(match\[1\]\)/);
  assert.match(functionAuth,/isApprovedPublisher\(user\.email,Boolean\(user\.email_confirmed_at\)\)/);
  assert.match(functionAuth,/status:503/);
  assert.match(functionAuth,/status:403/);
  assert.match(publication,/const decision=await verifyNetlifyPublisher\(req\);/);
  assert.match(publication,/if\(decision\.error\)return reply/);
  assert.match(media,/verifyAnonymousWrite\(req\)/);
  assert.doesNotMatch(publication,/publisherAuthEnabled\(\)&&!owner/);
  assert.doesNotMatch(publication,/let verifiedPublisher:string\|undefined/);
});
test('media upload browser forwards Supabase token and anonymous readers remain public',()=>{
  const media=read('lib/publish-newsletter-media.ts');
  assert.match(media,/anonymousWriteHeaders\(\)/);
  assert.match(read('netlify/functions/newsletter-media.ts'),/req\.method==='GET'/);
  assert.match(read('netlify/functions/newsletter-publication.ts'),/req\.method==='GET'/);
  assert.match(read('app/api/account/privacy/route.ts'),/requireSignedInUser\(\)/);
});
