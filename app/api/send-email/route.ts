import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { contacts, subject, html, customMsg } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY tanımlanmamış. Lütfen .env dosyanıza ekleyin.' },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'Gönderilecek kişi bulunamadı.' }, { status: 400 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Project Factory <onboarding@resend.dev>';

    // Generate a unique campaign ID for this batch
    const campaignId = Math.random().toString(36).substring(2, 15);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Change in production

    // Prepare batch requests
    const batchData = contacts.map((contact: { email: string, name?: string }) => {
      // Very simple merge tag replacement for {{isim}} or [Ad]
      const contactName = contact.name || 'Değerli Üyemiz';
      let personalizedHtml = html;
      let personalizedSubject = subject;
      
      // Replace basic tags if they exist
      personalizedHtml = personalizedHtml.replace(/\{\{isim\}\}/gi, contactName).replace(/\[Ad\]/gi, contactName);
      personalizedSubject = personalizedSubject.replace(/\{\{isim\}\}/gi, contactName).replace(/\[Ad\]/gi, contactName);

      if (customMsg) {
         // Insert custom message before the newsletter content, maybe inside the body
         const customHtml = `<div style="padding: 20px; font-family: sans-serif; font-size: 14px;">${customMsg.replace(/\\n/g, '<br/>').replace(/\{\{isim\}\}/gi, contactName)}</div>`;
         personalizedHtml = personalizedHtml.replace('<div id="bulten-body">', `<div id="bulten-body">${customHtml}`);
      }

      // ── Analytics Tracking (Open & Click) ──
      const trackingId = Buffer.from(contact.email).toString('base64');
      
      // 1. Replace all links with our click tracking endpoint
      // We use a regex to find <a href="..."> and replace the href
      personalizedHtml = personalizedHtml.replace(/(<a[^>]+)href="([^"]+)"([^>]*>)/gi, (match: string, before: string, url: string, after: string) => {
        // Skip mailto: or anchor links
        if (url.startsWith('mailto:') || url.startsWith('#')) return match;
        const encodedUrl = encodeURIComponent(url);
        const trackUrl = `${appUrl}/api/track/click?c=${campaignId}&e=${trackingId}&u=${encodedUrl}`;
        return `${before}href="${trackUrl}"${after}`;
      });

      // 2. Append a 1x1 invisible tracking pixel at the end of the body
      const trackingPixel = `<img src="${appUrl}/api/track/open?c=${campaignId}&e=${trackingId}" width="1" height="1" alt="" style="display:none; visibility:hidden; width:1px; height:1px;" />`;
      if (personalizedHtml.includes('</body>')) {
        personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`);
      } else {
        personalizedHtml += trackingPixel;
      }

      return {
        from: fromEmail,
        to: contact.email,
        subject: personalizedSubject,
        html: personalizedHtml,
      };
    });

    // Send via Resend Batch API
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend Error:', errText);
      return NextResponse.json({ error: `E-posta gönderim hatası: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Send Email Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
