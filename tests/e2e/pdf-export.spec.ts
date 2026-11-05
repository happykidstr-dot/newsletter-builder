import { test, expect } from '@playwright/test';
import {readFileSync} from 'node:fs';

test('PDF İndir creates a real downloadable PDF without opening the print window', async ({page})=>{
  await page.goto('/');
  const popups: unknown[] = [];
  page.on('popup', popup => popups.push(popup));
  const [download] = await Promise.all([
    page.waitForEvent('download',{timeout:90000}),
    page.getByRole('button',{name:'PDF indir'}).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const path = await download.path();
  expect(path).toBeTruthy();
  const buffer = readFileSync(path!);
  expect(buffer.subarray(0,5).toString('ascii')).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(4000);
  expect(popups).toHaveLength(0);
  await expect(page.getByRole('button',{name:'PDF indir'})).toBeEnabled();
});

test('Yazdır is a separate toolbar action and opens a printable page', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'PDF indir'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Bülteni yazdır'})).toBeVisible();
  const popup = page.waitForEvent('popup',{timeout:15000});
  await page.getByRole('button',{name:'Bülteni yazdır'}).click();
  const printable = await popup;
  await expect(printable.locator('h1')).toBeVisible();
  await printable.close();
});
