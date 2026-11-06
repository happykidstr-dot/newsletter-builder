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
    await use(page);
  },
});
export {expect};
