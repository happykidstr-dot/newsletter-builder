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
    // Only browser regression tests fake the third-party challenge. No server
    // route accepts a bypass token, and CI's public key is confined to its build.
    await page.addInitScript(()=>{
      let options:Record<string,any>={};
      (window as any).turnstile={render:(_el:HTMLElement,value:Record<string,any>)=>{options=value;return 'test-widget';},execute:()=>options.callback?.('E2E_CHALLENGE_TOKEN_NEVER_VALID_ON_SERVER'),remove:()=>{}};
    });
    await use(page);
  },
});
export {expect};
