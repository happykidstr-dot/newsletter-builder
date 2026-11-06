import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json'));
const access=read('lib/security/access.ts');
const email=read('app/api/send-email/route.ts');
const layout=read('app/layout.tsx');
const callback=read('app/auth/callback/route.ts');
const ui=read('components/AccountAction.tsx');
const proxy=read('proxy.ts');
const privacy=read('app/api/account/privacy/route.ts');

test('free Supabase Auth is the only login provider; no Clerk runtime dependency',()=>{
  assert.equal(pkg.dependencies['@supabase/ssr'],'0.12.7');
  assert.equal(pkg.dependencies['@clerk/nextjs'],undefined);
  assert.equal(pkg.dependencies['@clerk/backend'],undefined);
  for(const source of [access,email,layout,ui,proxy,callback])
    assert.doesNotMatch(source,/@clerk\/|CLERK_/);
});
test('client and service-role keys are separated, and private APIs fail closed',()=>{
  assert.match(read('lib/supabase/client.ts'),/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(read('lib/supabase/client.ts'),/SERVICE_ROLE/);
  assert.match(access,/serverAuthConfigured\(\)/);
  assert.match(access,/client\.auth\.getUser\(\)/);
  assert.match(access,/status:503/);
  assert.match(access,/status:401/);
  assert.match(read('app/api/db/newsletters/route.ts'),/eq\('user_id',identity\.userId\)/);
});
test('email test recipient is the verified Supabase owner and not an arbitrary email',()=>{
  assert.match(email,/identity\.emailVerified/);
  assert.match(email,/identity\.email!==String\(body\.testEmail\)/);
  assert.doesNotMatch(email,/currentUser\(\)/);
  assert.match(email,/suppressionHash/);
});
test('Google and email login use PKCE and same-origin callback only',()=>{
  assert.match(ui,/signInWithOAuth\(\{provider:'google'/);
  assert.match(ui,/signInWithPassword/);
  assert.match(ui,/resetPasswordForEmail/);
  assert.match(callback,/exchangeCodeForSession\(code\)/);
  assert.match(callback,/!destination\.startsWith\('\/\/'\)/);
  assert.match(proxy,/getClaims\(\)/);
  assert.match(proxy,/response\.cookies\.set/);
});
test('privacy deletion clears both stored browser data and owner web events',()=>{
  assert.match(ui,/await clearLocalNewsletterData\(\)/);
  assert.match(read('lib/local-newsletter-db.ts'),/objectStore\(DOCUMENTS\)\.clear\(\)/);
  assert.match(read('lib/local-newsletter-db.ts'),/objectStore\(DRAFTS\)\.clear\(\)/);
  assert.match(privacy,/newsletter_web_events/);
  assert.match(privacy,/range\(page\*pageSize/);
});

test('Netlify publication independently verifies Supabase bearer tokens and preserves existing edit-token checks',()=>{
  const native=read('netlify/functions/newsletter-publication.ts');
  const client=read('lib/supabase/client.ts');
  const page=read('app/page.tsx');
  const api=read('app/api/publish/route.ts');
  assert.match(read('lib/security/netlify-publisher.ts'),/client\.auth\.getUser\(match\[1\]\)/);
  assert.match(native,/verifyNetlifyPublisher\(req\)/);
  assert.match(native,/matchesEditToken\(body\.editToken,previous\?\.editTokenHash\)/);
  assert.match(native,/existing\.ownerUserId!==decision\.userId/);
  assert.match(client,/publisherAuthorizationHeaders/);
  assert.match(page,/\.\.\.\(await publisherAuthorizationHeaders\(\)\)/);
  assert.match(api,/requireAuthorizedPublisher\(\)/);
  assert.doesNotMatch(native,/@clerk\/|CLERK_/);
});
