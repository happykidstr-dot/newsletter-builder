# BÜLTEN READ — Güvenlik Faz 1 Uygulama / Kabul Notları

**Tarih:** 6 Kasım 2026

## Neler uygulanmıştır?
1. Next.js 16 Clerk oturum denetimi (`proxy.ts`), gerçek Giriş Yap / Kayıt Ol, Hesabım; kimliği sunucuda doğrulama. Supabase URL ve publishable key olmadan AI, e-posta ve özel analitik servisleri güvenli şekilde 503 döndürür.
2. OpenAI API istekleri boyut sınırı, origin kontrolü, kullanıcı oturumu ve hesap başına süreli kota gerektirir. OpenAI anahtarı yalnızca sunucudadır. Kota Netlify Blobs tabanlı **best effort**; eşzamanlı çok yüksek trafikte atomik garanti vermez.
3. Toplu e-posta yalnızca oturum sahibinin Supabase listesindeki açık izin kaydı (`consentAt`, `consentSource`) bulunan aktif alıcılara yapılır; istemciden gelen keyfî `contacts` listesi gönderimi başlatamaz. Test e-postası yalnızca kullanıcının Supabase tarafından doğrulanmış hesap adresine gönderilebilir.
4. Abonelikten ayrılma e-postaya eklenen şifreli, zaman sınırlı bağlantıyla açılır. Önce görüntülenen onay sayfası daha sonra POST işlemi alır; yanlışlıkla GET görüntülemesi abonelik iptal etmez. Aynı adrese diğer listelerden yeniden mail gönderilmemesi için hesap kapsamlı HMAC tabanlı `email_suppressions` kullanılır.
5. E-posta tıklama ve açılma takibi yalnızca ayrıca açık izinli kişiler için çalışır, token şifreli olduğu için e-posta adresi URL'de görünmez. Takip varsayılan olarak kapalıdır. Eski şifresiz `?e=...` parametreleri artık kabul edilmez.
6. Analitik API kullanıcıya özel sunucu sorgusu yapar ve ham e-posta kayıtlarını istemciye döndürmez. Geçmişte kullanıcı kimliği taşımayan analitik kayıtları otomatik bir hesaba atanmaz.
7. Yayımlanmış bülten özel düzenleme anahtarıyla yayından kaldırılabilir. Public `/b/<id>` bağlantısı artık 404 döndürür; yerel taslak kalır. Ayrı yayımlanmış fotoğraf URL'leri, başka bültenlerde de kullanılabileceği için **otomatik silinmez**.
8. Hesap sahibi kişisel kayıtlarını JSON olarak indirebilir, açık onayla Supabase kayıtlarını ve yerel saklanan verileri silebilir. Public yayınlar ayrıca yayından kaldırılmalıdır.

## Üretim aktivasyonunda gereken adımlar
Netlify Site configuration > Environment variables üzerinden gerçek değerleri girin:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CAMPAIGN_SECURITY_SECRET`, `NEXT_PUBLIC_APP_URL`. 
`OPENAI_API_KEY` sadece AI kullanılacaksa gerekir. Ücretsiz Supabase Auth/Google OAuth kurulumu için [SUPABASE_AUTH_FREE_SETUP.md](./SUPABASE_AUTH_FREE_SETUP.md) yönergesini izleyin. Clerk artık kullanılmıyor; alan adı satın alma zorunluluğu yoktur.

**Güvenlik:** Anahtarları GitHub'a, kullanıcı mesajına veya istemci bundle'ına yazmayın. `SUPABASE_SERVICE_ROLE_KEY` kesinlikle `NEXT_PUBLIC_` ile başlamamalıdır.

Supabase SQL Editor'de [migrations/20261106_security_phase1.sql](../migrations/20261106_security_phase1.sql) dosyasını bir kez çalıştırın. Mevcut dünya-okunabilir analitik politikalarını kaldırır, kullanıcı kimliği alanı ve abonelikten ayrılma engelleme tablosunu ekler.

Yalnızca ortam ayarları + SQL geçişi tamamlandıktan sonra test e-postası gönderin. Bu eksikse sistem işlemi reddeder; güvenli olmayan anonim moda düşmez.

## Kabul ve üretim kontrol matrisi
| Senaryo | Beklenen sonuç |
| --- | --- |
| Clerk anahtarı yokken /api/chat, /api/ai-generate, /api/send-email, /api/db/analytics | 503; OpenAI/Resend'e çağrı yapılmaz |
| Giriş yapmamış kullanıcı | 401/403; özel listeler/analitikler görünmez |
| Sahte contacts listesi | Gönderim yok; sunucu yalnızca liste ID üzerinden kendi DB'sini sorgular |
| İzin kaydı olmayan veya abonelik iptal eden alıcı | Gönderim yok |
| CSV içe aktarımı | Açık izin beyanı ve izin kaynağı gerekiyor |
| Test e-postası başka birinin adresine | 403 |
| Kısa sürede aşırı AI/e-posta isteği | 429; kota altyapısı çökerse 503 |
| Eski base64 mail takibi ile açık yönlendirme | İstek reddedilir |
| Şifreli opt-in takip | Hesap sahibine ait istatistikte sayılır |
| Analitik talebi başka hesaptan | 401/403 veya yalnızca o hesabın toplamları |
| Yayın sahibinin özel tokenıyla /api/unpublish | 200 ve okuyucu URL'si 404 |
| Yanlış yayından kaldırma tokenı | 403, okuyucu içeriği korunur |
| Hesap veri silme isteği yanlış doğrulamayla | 400; silme yapılmaz |
| Gizli içeriğin erişilebilirlik testi, klavye/dar ekran | Ayrı görsel/erişilebilirlik denetiminde doğrulanmalı |

## Kalan operasyonel sınırlar / geliştirmeler
- Canlı Supabase Auth, Supabase veri servisi ve Resend anahtarları bağlantı yetkisi gerektirir; yalnızca GitHub kodu üzerinden yapılandırılamaz.
- Blobs tabanlı kota **atomik değil**: büyük ölçekli açık kullanıcı sistemine geçilirse Postgres transactional sayaç veya Redis rate limiter kurulmalı.
- Medya dosyaları bağımsız saklandığı için yayından kaldırılmış sayfanın geçmişte paylaşılan doğrudan medya URL'leri çalışmaya devam edebilir. Medya erişim revokasyonu ve referans sayımı ek çalışma gerektirir.
- E-posta açılması görüntüleyici engellemeleri nedeniyle yaklaşık ölçümdür. Kullanıcıya gerçek olmayan örnek analitik değerleri gösterilmemeli.
- Gerçek veri silme yükümlülükleri bakımından yedekleme, saklama süresi ve veri işleyen sözleşmeleri ayrıca değerlendirilmelidir.
