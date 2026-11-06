# BÜLTEN READ · Ücretsiz Supabase Auth Kurulumu

Son güncelleme: 6 Kasım 2026

Bu kurulum **alan adı satın almayı gerektirmez**. BÜLTEN READ, `https://bultenoku.netlify.app` üzerinde çalışır. Clerk kullanılmaz.

## A. Supabase projesini açın

1. https://supabase.com/dashboard adresinde ücretsiz bir proje açın veya var olan BÜLTEN READ projesini seçin.
2. **Project Settings → API Keys** (ya da **Connect**) bölümünden şunları bulun:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Eski projelerde `anon` key de kullanılabilir.
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (**yalnızca Netlify sunucu ortamına**, asla GitHub'a/sohbete/yayımlanan JavaScript'e değil).
3. **Authentication → URL Configuration**:
   - Site URL: `https://bultenoku.netlify.app`
   - Redirect URLs: `https://bultenoku.netlify.app/auth/callback`
   - (Geliştirme için) `http://localhost:3000/auth/callback`.
4. **SQL Editor**: Önce `supabase_schema.sql` (tablolar daha önce açılmadıysa), ardından `migrations/20261106_security_phase1.sql`, sonra `migrations/20261106_phase2_reliability.sql` dosyalarını sırayla çalıştırın. Bu adım ayrıcalıklı servis anahtarına sahip koddan öncedir. Aynı alanları yeniden eklemek için rastgele SQL çalıştırmayın; şemayı kontrol edin.

## B. Ücretsiz Google ile giriş

Supabase'in varsayılan SMTP sistemi yalnızca önceden yetkilendirilmiş ekip e-posta adreslerine hizmet verir ve üretimde genel kayıt e-postaları için uygun değildir. Ücretsiz başlangıç için **Google OAuth** önerilir.

1. https://console.cloud.google.com/ üzerinde ücretsiz bir Google Cloud projesi oluşturun/seçin.
2. Google Auth Platform → Branding / Audience / Clients bölümünde uygulama adı **BÜLTEN READ**; erişim tipi genellikle **External**, yetki kapsamları sadece `openid`, `email`, `profile`.
3. Web application tipinde OAuth Client ID oluşturun.
4. Google **Authorized redirect URI** olarak Supabase **Authentication → Providers → Google** sayfasındaki geri dönüş URL'sini kopyalayın. Formatı `https://PROJECT_REF.supabase.co/auth/v1/callback` olacaktır. Bu **Netlify** adresi değildir.
5. Google OAuth Client ID ve Client Secret'ı **Supabase → Authentication → Providers → Google** alanlarına yalnızca orada girin. Google provider'ı etkinleştirin.
6. Supabase → Authentication → URL Configuration üzerindeki Netlify callback adresini tekrar kontrol edin.
7. Google OAuth test aşamasındaysa Google Cloud'da test kullanıcılarını ekleyin; herkese açma kararını kurum politikalarınız doğrultusunda verin.

Google hesabı ile girişte Supabase Auth'un kullanıcı doğrulama e-postası göndermesi gerekmez. Kullanıcı hesaplarını Supabase yönetir, API kimliği `auth.getUser()` ile sunucuda doğrulanır.

## C. E-posta/şifre sınırlaması

Arayüzde e-posta/şifre ve şifre sıfırlama da vardır. Ancak genel kullanıcıların e-posta doğrulaması ve sıfırlama mesajları için **özel SMTP** gerekir. Supabase'in ücretsiz varsayılan e-posta sağlayıcısı üretim için uygun değildir ve yalnızca belirli doğrulanmış ekip adreslerine gönderim yapabilir.

**Doğrulama zorunluluğunu sırf SMTP yok diye kapatmayın**; bu, başkasına ait e-posta adresleriyle hesap açılmasına yol açabilir. Gereken tüm kullanıcılar Google ile giriş yapıyorsa e-posta/şifre kaydını Supabase ayarlarında devre dışı bırakabilirsiniz.

## D. Netlify'de ortam değişkenleri

https://app.netlify.com/projects/bultenoku/overview
Project configuration → Environment variables alanına aşağıdaki **isimleri** ve Supabase'den kopyaladığınız değerleri girin:

| Name | Secret? | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Hayır | Builds |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Hayır | Builds |
| `SUPABASE_SERVICE_ROLE_KEY` | **Evet** | Functions / server runtime |
| `NEXT_PUBLIC_APP_URL` | Hayır | Builds / Functions |

**NEXT_PUBLIC_APP_URL = `https://bultenoku.netlify.app`**.

Aynı projede AI/e-posta toplu gönderimi açılacaksa, bağımsız `OPENAI_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` ve `CAMPAIGN_SECURITY_SECRET` gerekir. Bu servisler ve ücret/limitleri Supabase giriş sistemiyle aynı değildir.

Netlify üzerinden **Trigger deploy → Deploy site** seçeneğiyle yeni dağıtım başlatın. `NEXT_PUBLIC_` değişkenleri Next.js istemci derlemesinde gömüldüğünden anahtarlar eklendikten sonra **yeni build** gerekir.

Eski `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ve `CLERK_SECRET_KEY` değerlerini yeni sürüm kullanmaz. Geçiş tamamlanınca Netlify'den kaldırabilirsiniz.

## E. Kabul kontrolleri

- Site: `https://bultenoku.netlify.app`; editör anonim ziyaretçilerde de açılır.
- Giriş Yap → Google ile Giriş → Supabase OAuth → `/auth/callback` → editöre dönüş; oturum açıkken e-posta ve Çıkış görünür.
- Çıkış sonrası `/api/db/newsletters`, `/api/db/mailing-lists`, `/api/db/analytics`, `/api/account/privacy`, AI ve e-posta API'leri 401 döndürmeli.
- Supabase anahtarları ayarlanmamışsa kimliği doğrulayan API'ler 503 döndürmeli; anonim yazma veya gönderim **olmamalı**.
- Verilerim → JSON dışa aktarma, güncel hesapta yalnızca kendisine ait tüm sayfalı kayıtları ve web görüntülenme kayıtlarını içermeli.
- Verilerimi Sil → hem Supabase'deki hesap kapsamlı kayıtları hem tarayıcı IndexedDB'yi silmeli; **Public yayınlar** kendi edit token'larıyla ayrı yayından kaldırılmalı.

## Geçiş notları

Eski Clerk kullanıcı kimlikleri, Supabase'in UUID hesap kimlikleriyle eşleşmez. Clerk ile kullanılmış gerçek kullanıcı verileri varsa bunlar otomatik olarak yeni hesaplara bağlanmaz; veri sahipliği doğrulanmadan kayıt aktarmayın. Bu kurulum mevcut verileri herhangi bir kullanıcıya otomatik devretmez.

Sunucu secret/servis anahtarlarını, Supabase OAuth Google Client Secret değerini veya oturum çerezlerini ChatGPT'ye, ekran görüntüsüne, GitHub'a ya da herkese açık dosyalara yazmayın.
