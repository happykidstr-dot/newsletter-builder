import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ai=read('app/api/ai-generate/route.ts');
const chat=read('app/api/chat/route.ts');
const mail=read('app/api/send-email/route.ts');
const auth=read('lib/security/access.ts');
const quota=read('lib/security/quotas.ts');
const analytics=read('app/api/db/analytics/route.ts');
const track=read('app/api/track/click/route.ts');
const open=read('app/api/track/open/route.ts');
const unsub=read('app/api/unsubscribe/route.ts');
const suppress=read('lib/security/email-suppression.ts');
const netlify=read('netlify/functions/newsletter-publication.ts');
const page=read('app/page.tsx');
const schema=read('migrations/20261106_security_phase1.sql');

test('Supabase Auth validates owner identity server-side and Next 16 proxy refreshes PKCE cookies',()=>{
  const proxy=read('proxy.ts');
  const server=read('lib/supabase/server.ts');
  const client=read('lib/supabase/client.ts');
  const account=read('components/AccountAction.tsx');
  const callback=read('app/auth/callback/route.ts');
  assert.ok(!existsSync(new URL('../middleware.ts',import.meta.url)));
  assert.match(auth,/createServerSupabaseClient\(\)/);
  assert.match(auth,/client\.auth\.getUser\(\)/);
  assert.match(auth,/serverAuthConfigured\(\)/);
  assert.match(auth,/emailVerified:Boolean\(user\.email_confirmed_at\)/);
  assert.match(proxy,/createServerClient/);
  assert.match(proxy,/auth\.getClaims\(\)/);
  assert.match(proxy,/Cache-Control','private, no-store/);
  assert.match(server,/await cookies\(\)/);
  assert.match(client,/createBrowserClient/);
  assert.match(callback,/exchangeCodeForSession/);
  assert.match(callback,/!destination\.startsWith\('\/\/'\)/);
  assert.match(account,/signInWithOAuth\(\{provider:'google'/);
  assert.match(account,/signInWithPassword/);
  assert.match(account,/signUp/);
  assert.match(page,/<AccountAction\/>/);
  for(const source of [auth,account,proxy,read('app/layout.tsx'),read('app/api/send-email/route.ts')])
    assert.doesNotMatch(source,/@clerk\/nextjs|CLERK_SECRET_KEY/);
});
test('all billable endpoints validate session, origin, body and per-user quotas',()=>{
  for(const code of [ai,chat,mail]){
    assert.match(code,/requireAuthorizedPublisher\(\)/);
    assert.match(code,/checkSameOrigin\(req\)/);
    assert.match(code,/boundedJson\(req,/);
    assert.match(code,/reserveQuota\(identity\.userId|reserveQuota\(session\.userId/);
  }
  assert.match(quota,/getDeployStore/);
  assert.match(quota,/getStore\(\{name,consistency:'strong'\}\)/);
});
test('email sends only from owned DB list and explicitly consented recipients',()=>{
  assert.match(mail,/\.eq\('id',listId\)\.eq\('user_id',identity\.userId\)/);
  assert.match(mail,/c\.consentAt/);
  assert.match(mail,/c\.consentSource/);
  assert.match(mail,/\!c\.unsubscribedAt/);
  assert.match(mail,/identity\.emailVerified/);
  assert.match(mail,/identity\.email/);
  assert.doesNotMatch(mail,/const \{ contacts/);
  assert.match(mail,/suppressionHash\(c\.email\)/);
  assert.match(mail,/email_suppressions/);
  assert.match(page,/contactConsent/);
  assert.match(page,/csvConsent/);
});
test('analytics never returns raw address list or another owner events',()=>{
  assert.match(analytics,/requireAuthorizedPublisher\(\)/);
  assert.match(analytics,/\.eq\('user_id',identity\.userId\)/);
  assert.doesNotMatch(analytics,/rawEvents/);
  assert.match(schema,/DROP POLICY IF EXISTS "Users can read analytics"/);
  assert.match(schema,/REVOKE ALL ON TABLE public\.campaign_analytics/);
});
test('tracking and unsubscription use encrypted tokens instead of plaintext addresses and unsafe redirects',()=>{
  const token=read('lib/security/campaign-token.ts');
  assert.match(token,/createCipheriv\('aes-256-gcm'/);
  assert.match(token,/createDecipheriv\('aes-256-gcm'/);
  assert.match(mail,/makeCampaignToken/);
  assert.doesNotMatch(mail,/Buffer\.from\(contact\.email\)\.toString\('base64'\)/);
  assert.match(track,/readCampaignToken\(.*'click'\)/);
  assert.match(open,/readCampaignToken\(.*'open'\)/);
  assert.match(unsub,/readCampaignToken\(.*'unsubscribe'\)/);
  assert.match(unsub,/email_suppressions/);
  assert.match(suppress,/createHmac\('sha256'/);
});
test('unpublish is available only to the holder of a private edit token',()=>{
  assert.match(netlify,/path:\['\/api\/publish','\/api\/unpublish','\/b\/:slug'\]/);
  assert.match(netlify,/matchesEditToken\(body\.editToken,existing\.editTokenHash\)/);
  assert.match(netlify,/await store\.delete\(body\.slug\)/);
  assert.match(page,/const handleUnpublish=async/);
  assert.match(page,/Yayından Kaldır/);
});
test('owner can export or erase only their own records after explicit confirmation',()=>{
  const privacy=read('app/api/account/privacy/route.ts');
  assert.match(privacy,/requireSignedInUser\(\)/);
  assert.match(privacy,/confirmation.*DELETE-MY-DATA/);
  assert.match(privacy,/\.eq\('user_id',identity\.userId\)/);
  assert.match(privacy,/email_suppressions/);
  assert.match(privacy,/newsletter_web_events/);
  assert.match(privacy,/fetchOwnerRecords/);
  assert.match(read('lib/local-newsletter-db.ts'),/clearLocalNewsletterData/);
});
