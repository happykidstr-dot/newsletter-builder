# BÜLTEN READ — Güvenli Dağıtım Rehberi

Bu değişikliklerde güvenlik ve veri bütünlüğü önceliklidir. **PR #2'yi, aşağıdaki dağıtım bağımlılıkları tamamlanmadan ana dala birleştirmeyin.** Canlı kullanıcı listeleriyle test yapmayın.

## 1. Veritabanı hazırlığı

1. Supabase veritabanı yedeğini alın.
2. Önce mevcut `supabase_schema.sql` kurulu olmalıdır.
3. SQL Editor'de `migrations/20261105_security_data.sql` dosyasını çalıştırın.
4. `newsletters` tablosunda `logo_url`, `show_toc`; `mailing_lists` tablosunda `updated_at`; ayrıca `notebook_payloads`, `campaign_recipients`, `suppressed_emails`, `action_quotas` ve kota fonksiyonunu doğrulayın.
5. RLS ve tabloların `anon`/`authenticated` izinleri, migration'daki gibi daraltılmış olmalıdır. Sunucu servis anahtarını asla tarayıcıya vermeyin.

Eski analitik olaylarda `user_id` boş olabilir; güvenlik için bunlar yanlış kullanıcıya atanmaz. Eski kayıtları aktarmak için kampanya sahipliğini ayrıca doğrulayın.

## 2. Netlify ortam değişkenleri

- `NEXT_PUBLIC_APP_URL`: Netlify sitesinin HTTPS kök adresi (örn. https://bultenoku.netlify.app).
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ve `CLERK_SECRET_KEY`: Clerk projesinden.
- `NEXT_PUBLIC_SUPABASE_URL` ve **sunucu tarafında** `SUPABASE_SERVICE_ROLE_KEY`.
- `OPENAI_API_KEY`: isteğe bağlı AI; yoksa AI özelliği kullanıcıya 503 döndürür.
- `RESEND_API_KEY` ve doğrulanmış alan adınızla `RESEND_FROM_EMAIL`.
- `TRACKING_SIGNING_SECRET`: rastgele, en az 24 karakter; imzalı takip ve abonelikten ayrılma için zorunludur.
- `NOTEBOOK_SYNC_SECRET`: ayrı rastgele gizli değer, en az 24 karakter.
- `NOTEBOOK_SYNC_USER_ID`: Notebook içeriklerinin gönderileceği **gerçek Clerk kullanıcı kimliği**.

**Güvenlik:** `NEXT_PUBLIC_` ile başlamayan gizli değerleri GitHub'a veya istemci koduna koymayın. Env değişikliklerinden sonra dağıtımı yenileyin.

## 3. Bağımlılıklar

- `next`: 16.4.5, `eslint-config-next`: 16.4.5
- `react`/`react-dom`: 19.3.1
- Netlify'nin otomatik OpenNext adapter'ı **en az 5.16.6** olmalı (pinlenmiş eski adapter kullanmayın). Deploy loglarında sürümü kontrol edin.

## 4. NotebookLM göndermek

Bilgisayarınızda `NOTEBOOK_SYNC_SECRET` tanımlayıp `node scripts/push-newsletter.js bulten.json` çalıştırın. Uzak hedef için:

```bash
NOTEBOOK_SYNC_SECRET="long-random-secret" node scripts/push-newsletter.js https://bultenoku.netlify.app/api/notebook-sync bulten.json
```

Bu örnek değeri gerçek gizli anahtar olarak kullanmayın. Bir hesabın üzerinde kaydedilmiş taslak varsa yeni içerik otomatik olarak üzerine yazılmaz; kullanıcıya onay sorulur.

## 5. Test matrisi (gerçek ortama ihtiyaç duyar)

1. Kimliksiz `POST /api/send-email` ve `POST /api/ai-generate` -> 401/503; gerçek gönderim olmamalı.
2. Anahtarsız `POST`/`DELETE /api/notebook-sync` -> 401.
3. Test kullanıcısı A, kullanıcı B'nin bülten ve alıcı listelerini okuyamamalı, değiştirememeli.
4. Kaydet / yeniden aç / sil: başlık, 15 blok türü, logo, kapak ve içindekiler kalmalı. Zorlanmış 500 yanıtında başarılı mesajı çıkmamalı.
5. Kayıtlı alıcı listesi ile **yalnızca size ait izinli test adreslerine** gönderim yapın; maksimum 50 alıcı, 429 kota, abonelikten ayrılma ve yeniden gönderimde engelleme doğrulansın.
6. Mobil: 320/375/768/1024 px, yakınlaştırma %200, klavyeyle ekleme ve düzenleme.
7. HTML dışa aktarmada `<script>`, `&`, `"`, güvenli URL ve Google Form örneklerini deneyin.
8. PDF: düğme yazdırma penceresini **bir kez** açar; otomatik PDF indirme henüz sunulmuyor.
9. Gerçek ekran okuyucu: NVDA/VoiceOver ile kontrol isimleri, etiketler ve odak sırası manuel olarak ayrıca kontrol edilmelidir.

## 6. Bilinen kapsam sınırları

Bu değişiklikler kaydedilmiş kod ve otomatik testlerden oluşur. Clerk/Supabase/Netlify/Resend yönetim konsollarında ortam değişkenlerini tanımlama, Supabase migration uygulama, gerçek e-posta gönderim testi ve gerçek cihaz/ekran okuyucu denetimi bu GitHub değişikliğiyle otomatik tamamlanmaz. Netlify ana sürümü, ayrı merge/deploy adımı gerektirir.
