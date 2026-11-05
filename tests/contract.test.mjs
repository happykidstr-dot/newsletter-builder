import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('sensitive routes check authenticated session', () => {
  for (const path of ['app/api/send-email/route.ts','app/api/ai-generate/route.ts',
    'app/api/chat/route.ts','app/api/db/newsletters/route.ts','app/api/db/mailing-lists/route.ts',
    'app/api/db/analytics/route.ts','app/api/parse-file/route.ts']) {
    assert.match(read(path), /requireUser\(/, path);
  }
});
test('removed Notebook integration has no runtime entry points', () => {
  assert.equal(existsSync(new URL('../app/api/notebook-sync/route.ts',import.meta.url)),false);
  assert.doesNotMatch(read('app/page.tsx'),/notebook/i);
  assert.doesNotMatch(read('middleware.ts'),/notebook/i);
  assert.doesNotMatch(read('migrations/20261105_security_data.sql'),/notebook/i);
});
test('unsafe public analytics policy and raw events are gone', () => {
  assert.doesNotMatch(read('app/api/db/analytics/route.ts'),/rawEvents:/);
  const sql=read('migrations/20261105_security_data.sql');
  assert.match(sql,/DROP POLICY IF EXISTS "Users can read analytics"/);
  assert.match(sql,/REVOKE ALL ON TABLE/);
});
test('mail requires ownership, rate limits, suppression and opt-out', () => {
  const s=read('app/api/send-email/route.ts');
  for(const needle of ['requireUser(','limitAction(','suppressed_emails','user_id','listId','Abonelikten ayrıl','trackingEnabled'])
    assert.ok(s.includes(needle),needle);
  assert.match(read('app/api/track/click/route.ts'),/timingSafeEqual/);
  assert.match(read('app/api/track/unsubscribe/route.ts'),/suppressed_emails/);
});
test('newsletter save errors do not lose locally stored drafts', () => {
  const s=read('app/page.tsx');
  assert.match(s,/if \(!draftReady\) return/);
  assert.match(s,/if \(!response\.ok \|\| !body\.success\)/);
  assert.match(s,/await handleSave\(\)/);
});
test('all exported HTML text has an escape path and no embedded user JS', () => {
  const s=read('app/page.tsx');
  assert.match(s,/function exportEscape/);
  assert.match(s,/function exportWebUrl/);
  assert.match(s,/function exportImageUrl/);
  assert.doesNotMatch(s,/fullEmbeddedText/);
  assert.match(s,/id="bulten-body"/);
});
test('editor has responsive layout and accessible block selection', () => {
  assert.match(read('app/globals.css'),/@media\(max-width:960px\)/);
  assert.match(read('app/page.tsx'),/className="br-editor-grid"/);
  assert.match(read('app/page.tsx'),/aria-pressed=\{selected\}/);
});
test('the migration includes atomic action quotas', () => {
  const s=read('migrations/20261105_security_data.sql');
  assert.match(s,/consume_action_quota/);
  assert.match(s,/ON CONFLICT\(user_id,action,window_start\)/);
});
