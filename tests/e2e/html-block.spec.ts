import {test,expect} from '../helpers/authorized-editor-test';
import {readFileSync} from 'node:fs';
for(const [name,width,height] of [['desktop',1366,900],['tablet',820,1180],['mobile',390,844]] as const){
  test(`safe HTML content edits, persists and exports on ${name}`,async({page})=>{
    await page.setViewportSize({width,height});
    await page.goto('/');
    await page.getByRole('button',{name:'Gelişmiş',exact:true}).click();
    await page.getByRole('button',{name:'</> HTML',exact:true}).click();
    const field=page.getByLabel('HTML içeriği',{exact:true});
    await field.fill('<p>Denetim <strong>HTML içeriği</strong></p><script>window.htmlInjected=true</script><img src="x" onerror="window.htmlInjected=true">');
    await expect(page.getByText('Denetim HTML içeriği',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>Boolean((window as any).htmlInjected))).toBe(false);
    await page.getByRole('button',{name:'💾 Kaydet',exact:true}).click();
    await page.reload();
    await expect(page.getByText('Denetim HTML içeriği',{exact:true})).toBeVisible();
    await page.getByTestId('advanced-tools-toggle').click();
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/⬇️ HTML/}).click()]);
    const html=readFileSync((await download.path())!,'utf8');
    expect(html).toContain('<strong>HTML içeriği</strong>');expect(html).not.toContain('window.htmlInjected');
  });
}
