import {test as base,expect} from '@playwright/test';

/**
 * Browser UI regression tests exercise editor features with a stubbed access
 * decision. The server itself never has a test-mode auth bypass; dedicated
 * security tests use unmocked API requests and validate denial.
 */
export const test=base.extend({
  page:async({page},use)=>{
    await page.route('**/api/editor-access',route=>route.fulfill({
      status:200,contentType:'application/json',body:JSON.stringify({allowed:true}),
      headers:{'Cache-Control':'no-store'},
    }));
    // Only this test build stubs native proof generation; server APIs have no bypass.
    await page.route('**/api/publish-challenge',async route=>{
      const ticket='e2e-only-ticket';
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ticket,bits:18})});
    });
    await use(page);
  },
});
export {expect};
