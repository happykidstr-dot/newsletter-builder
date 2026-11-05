import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const pdf=readFileSync(new URL('../lib/newsletter-pdf.ts',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('PDF conversion is installed as a local, patched package',()=>{
  assert.equal(pkg.dependencies['html2pdf.js'],'0.14.0');
  assert.match(pdf,/import\('html2pdf\.js'\)/);
});
test('download creates PDF files independently of print',()=>{
  const start=pdf.indexOf('export async function downloadNewsletterPdf');
  const end=pdf.indexOf('export function printNewsletter',start);
  assert.ok(start>0&&end>start);
  const section=pdf.slice(start,end);
  assert.match(section,/pdfFilename\(title\)/);
  assert.match(section,/\.save\(\)/);
  assert.doesNotMatch(section,/\.print\(/);
  assert.doesNotMatch(section,/window\.open\(/);
  assert.match(page,/await downloadNewsletterPdf\(generateHTML\(\),title\)/);
});
test('printing is only triggered by the separate Yazdır action',()=>{
  assert.match(page,/onClick=\{handlePdfExport\}/);
  assert.match(page,/onClick=\{handlePrint\}/);
  assert.match(page,/PDF İndir/);
  assert.match(page,/Yazdır/);
  assert.match(pdf,/export function printNewsletter/);
});
test('speech and social UI are excluded from static printable PDF',()=>{
  assert.match(pdf,/#speakBtn,#bulten-reader-share/);
  assert.match(pdf,/html2canvas/);
  assert.match(pdf,/format:'a4'/);
});
