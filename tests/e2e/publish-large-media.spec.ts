import {test,expect} from '@playwright/test';

test('large photo embedded in newsletter is uploaded separately before publish',async({page})=>{
  await page.goto('/');
  // Construct a real raster image whose data URL is much larger than a
  // lightweight social-share document. The user draft retains the original.
  const dataUrl=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=1650; canvas.height=1650;
    const ctx=canvas.getContext('2d')!;
    const row=ctx.createImageData(canvas.width,canvas.height);
    for(let i=0;i<row.data.length;i+=4){
      row.data[i]=Math.floor(Math.random()*256);
      row.data[i+1]=Math.floor(Math.random()*256);
      row.data[i+2]=Math.floor(Math.random()*256);
      row.data[i+3]=255;
    }
    ctx.putImageData(row,0,0);
    return canvas.toDataURL('image/png');
  });
  expect(dataUrl.length).toBeGreaterThan(5_500_000);
  await page.evaluate(src=>{
    window.localStorage.setItem('bulten_draft_v1',JSON.stringify({
      title:'Büyük Fotoğraflı Bülten',subtitle:'Yayın testi',design:'modern',
      blocks:[{id:'big-photo',type:'photos',data:{url:src,caption:'Kapsamlı etkinlik fotoğrafı'}}],
      logoUrl:'',headerImgUrl:'',showTOC:false,
    }));
  },dataUrl);
  await page.reload();
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Büyük Fotoğraflı Bülten');
  let uploads=0;let published:any=null;
  await page.route('**/api/media',async route=>{
    uploads++;const payload=route.request().postDataJSON();
    expect(payload.mime).toMatch(/^image\/(webp|png|jpeg)$/);
    expect(payload.base64.length).toBeLessThan(3_450_000);
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      url:'http://127.0.0.1:3000/media/AQIDBAUGBwgJCgsMDQ4PEA',
    })});
  });
  await page.route('**/api/publish',async route=>{
    published=route.request().postDataJSON();
    await route.fulfill({status:201,contentType:'application/json',
      body:JSON.stringify({slug:'AQIDBAUGBwgJCgsM',editToken:'A'.repeat(43),revision:1})});
  });
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bülteni yayınla'}).click();
  await expect(page.getByRole('dialog',{name:'Bu Bülteni Paylaş'})).toBeVisible({timeout:60000});
  expect(uploads).toBe(1);
  expect(published?.html).toContain('/media/AQIDBAUGBwgJCgsMDQ4PEA');
  expect(published?.html).not.toContain('data:image/png;base64');
  expect(JSON.stringify(published).length).toBeLessThan(150_000);
  await expect(page.getByPlaceholder('Bülten başlığı...')).toHaveValue('Büyük Fotoğraflı Bülten');
});
