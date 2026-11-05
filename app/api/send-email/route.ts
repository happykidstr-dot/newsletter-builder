import { createHmac, randomBytes, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, escapeHtml, limitAction, requireUser, tooLarge, unavailableDb, validWebUrl } from '@/lib/server-security';

type Contact = { email:string; name?:string };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function signed(token:string,url:string,secret:string):string{
  return createHmac('sha256',secret).update(token+'|'+url).digest('hex');
}
export async function POST(req:NextRequest){
  const session=await requireUser();if('error'in session)return session.error;
  const db=adminDb();if(!db)return unavailableDb();
  if(tooLarge(req,256*1024))return NextResponse.json({error:'Bülten gönderimi çok büyük.'},{status:413});
  const apiKey=process.env.RESEND_API_KEY;
  const sender=process.env.RESEND_FROM_EMAIL;
  if(!apiKey||!sender)return NextResponse.json({error:'E-posta servisi veya doğrulanmış gönderici eksik.'},{status:503});
  try{
    const body=await req.json();
    const {subject,html,customMsg='',isTest=false,listId,testEmail}=body;
    if(typeof subject!=='string'||!subject.trim()||subject.length>200||
      typeof html!=='string'||!html.trim()||html.length>200000||
      typeof customMsg!=='string'||customMsg.length>3000){
      return NextResponse.json({error:'Gönderim içeriği geçersiz.'},{status:400});
    }
    let contacts:Contact[]=[];
    if(isTest===true){
      if(typeof testEmail!=='string'||!emailPattern.test(testEmail)||testEmail.length>254)return NextResponse.json({error:'Test adresi geçersiz.'},{status:400});
      contacts=[{email:testEmail,name:'Test kullanıcısı'}];
    }else{
      if(typeof listId!=='string'||listId.length>90)return NextResponse.json({error:'Geçerli iletişim listesi seçilmedi.'},{status:400});
      const {data:list,error:listError}=await db.from('mailing_lists').select('contacts').eq('id',listId).eq('user_id',session.userId).maybeSingle();
      if(listError)return NextResponse.json({error:'Alıcı listesi doğrulanamadı.'},{status:503});
      if(!list)return NextResponse.json({error:'Alıcı listesi bulunamadı.'},{status:404});
      if(!Array.isArray(list.contacts))return NextResponse.json({error:'Alıcı listesi hatalı.'},{status:400});
      contacts=list.contacts;
    }
    if(contacts.length<1||contacts.length>50||
      contacts.some(c=>!c||typeof c.email!=='string'||!emailPattern.test(c.email)||c.email.length>254||
        (c.name!==undefined&&(typeof c.name!=='string'||c.name.length>200)))){
      return NextResponse.json({error:'Bir gönderimde en fazla 50 geçerli alıcı olabilir.'},{status:400});
    }
    const normalized=new Set(contacts.map(c=>c.email.toLowerCase().trim()));
    if(normalized.size!==contacts.length)return NextResponse.json({error:'Alıcı listesinde tekrar eden adresler var.'},{status:400});
    const {data:blocked,error:blockError}=await db.from('suppressed_emails').select('email').eq('user_id',session.userId)
      .in('email',Array.from(normalized));
    if(blockError)return NextResponse.json({error:'Abonelik tercihleri okunamadı.'},{status:503});
    const excluded=new Set((blocked||[]).map((c:any)=>c.email));
    const actual=contacts.filter(c=>!excluded.has(c.email.toLowerCase().trim()));
    if(!actual.length)return NextResponse.json({error:'Gönderilebilecek etkin alıcı bulunamadı.'},{status:400});
    const rate=await limitAction(db,session.userId,'send',20,86400);if(rate)return rate;
    const campaignId=randomUUID();
    const appUrl=validWebUrl(process.env.NEXT_PUBLIC_APP_URL)||'';
    const signingSecret=process.env.TRACKING_SIGNING_SECRET||'';
    const trackingEnabled=Boolean(appUrl&&signingSecret.length>=24);
    const recipients=actual.map(c=>({token:randomBytes(18).toString('hex'),user_id:session.userId,campaign_id:campaignId,
      email:c.email.toLowerCase().trim()}));
    if(trackingEnabled){
      const {error:recipientError}=await db.from('campaign_recipients').insert(recipients);
      if(recipientError)return NextResponse.json({error:'Kampanya güvenlik kayıtları oluşturulamadı.'},{status:503});
    }
    const messages=actual.map((contact,i)=>{
      const token=recipients[i].token;
      const name=escapeHtml(contact.name||'Değerli üyemiz');
      const replace=(value:string)=>value.replace(/\{\{isim\}\}|\[Ad\]/gi,name);
      let personalised=replace(html);
      const personalizedSubject=subject.replace(/\{\{isim\}\}|\[Ad\]/gi,contact.name||'Değerli üyemiz');
      if(customMsg){
        const msg=replace(escapeHtml(customMsg)).replace(/\r?\n/g,'<br>');
        personalised=personalised.replace('<div id="bulten-body">',`<div id="bulten-body"><div style="padding:20px;font-family:sans-serif;font-size:14px">${msg}</div>`);
      }
      if(trackingEnabled){
        personalised=personalised.replace(/(<a\b[^>]*?)href="([^"]+)"([^>]*>)/gi,(match:string,before:string,url:string,after:string)=>{
          const safe=validWebUrl(url);
          if(!safe)return match;
          const dest=`${appUrl}/api/track/click?t=${token}&u=${encodeURIComponent(safe)}&s=${signed(token,safe,signingSecret)}`;
          return `${before}href="${escapeHtml(dest)}"${after}`;
        });
        const pixel=`<img src="${appUrl}/api/track/open?t=${token}&s=${signed(token,'open',signingSecret)}" width="1" height="1" alt="" style="display:none" />`;
        personalised=personalised.includes('</body>')?personalised.replace('</body>',pixel+'</body>'):personalised+pixel;
        const unsubscribe=`${appUrl}/api/track/unsubscribe?t=${token}`;
        personalised=personalised.includes('</body>')
          ?personalised.replace('</body>',`<p style="text-align:center;font-size:12px"><a href="${unsubscribe}">Abonelikten ayrıl</a></p></body>`)
          :personalised+`<p><a href="${unsubscribe}">Abonelikten ayrıl</a></p>`;
      }
      return {from:sender,to:contact.email,subject:personalizedSubject,html:personalised,
        ...(trackingEnabled?{headers:{'List-Unsubscribe':`<${appUrl}/api/track/unsubscribe?t=${token}>`}}:{})};
    });
    const res=await fetch('https://api.resend.com/emails/batch',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify(messages),
    });
    if(!res.ok)return NextResponse.json({error:'E-posta sağlayıcısı gönderimi reddetti.'},{status:502});
    const result=await res.json();
    return NextResponse.json({success:true,count:actual.length,excluded:contacts.length-actual.length,
      trackingEnabled,providerResult:result});
  }catch{return NextResponse.json({error:'Gönderim işlemi gerçekleştirilemedi.'},{status:500});}
}
