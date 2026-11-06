# BÜLTEN READ — Özel Yayıncı Yönetimi (2 Hesap)

Yönetici onayı: 6 Kasım 2026. **Yalnızca aşağıdaki Supabase Auth hesapları** bülten oluşturabilir, kaydedebilir, görsel yükleyebilir, yayımlayabilir, güncelleyebilir ve yayından kaldırabilir:

- `happykidstr@gmail.com`
- `projefabrikasitr@gmail.com`

Yetki, yalnızca arayüzdeki gizleme mekanizmasına dayanmaz. Next.js ve Netlify sunucu uç noktaları her istekte **Supabase'in doğruladığı oturum kimliğini** ve **email_confirmed_at** bilgisini denetler. E-posta adresi doğrulanmamışsa, listedeki bir adres bile yayın yapamaz.

## Okuyucu / yayıncı ayrımı

| İşlem | Kim yapabilir? |
|---|---|
| Mevcut `/b/<slug>` bağlantısını okumak | Herkes |
| Yayımlanmış görseli görüntülemek | Herkes |
| Ana sayfada editörü açmak | Yalnızca yukarıdaki iki doğrulanmış hesap |
| Taslak hazırlamak / yerel kaydetmek / PDF veya HTML dışa aktarmak | Yalnızca yetkililer |
| Bulut taslağı, liste, AI, mail, analitik yönetimi | Yalnızca yetkililer |
| Yeni yayın, görsel yükleme, aynı URL güncelleme, yayından kaldırma | Yalnızca yetkililer; ayrıca eski edit anahtarı ve hesap sahipliği kuralları korunur |

## Supabase / Netlify bağlantısını tamamlamak için

Kullanıcı Supabase panelinde `happykidstr-dot’s Org` Free Plan kuruluşunu açtı (ekranda **iki proje** görünüyor). Önce bu iki projenin adlarını inceleyin; uygun mevcut projede BÜLTEN READ şeması varsa yeniden proje açmayın.

1. Supabase → Project → **Authentication → Providers → Google**. Google OAuth kurulumunu [SUPABASE_AUTH_FREE_SETUP.md](./SUPABASE_AUTH_FREE_SETUP.md) yönergesindeki gibi etkinleştirin. Her iki onaylı Gmail hesabıyla giriş yapılabilir.
2. Supabase → **Authentication → URL Configuration**. Site URL: `https://bultenoku.netlify.app`, Redirect URLs: `https://bultenoku.netlify.app/auth/callback`.
3. Netlify → `https://app.netlify.com/projects/bultenoku/overview` → Project configuration → Environment variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
4. Supabase SQL Editor → şema bulunmuyorsa `supabase_schema.sql`, sonra `migrations/20261106_security_phase1.sql`, ardından `migrations/20261106_phase2_reliability.sql`. Uygulanmış SQL'i tekrar çalıştırmadan önce kontrol edin.
5. Netlify'de yeniden deploy edin. Alan adı satın almanız gerekmiyor.
6. İki onaylı adresle Google girişi test edin. Başka bir doğrulanmış Gmail hesabıyla giriş denendiğinde **403** ve editör erişimi kapalı olmalı. Anonim yayınlama veya görsel yükleme her koşulda reddedilmeli.
7. Dilerseniz bu iki kullanıcı Supabase Auth → Users bölümünde oluştuktan sonra yeni kullanıcı kaydını Supabase Auth ayarlarından kapatın. **Dikkat:** İlk kez Google ile giriş yapacak onaylı hesapları oluşturmadan önce kaydı kapatırsanız onlar da giriş yapamayabilir.

### Mevcut verilerin korunması

İki yayıncının farklı Supabase Auth kullanıcı UUID'leri vardır. Biri diğerinin kişisel taslaklarını/listelerini otomatik görmez; aynı yayının düzenlenebilmesi için orijinal edit anahtarı ve kayıtlı yayın sahibi de gereklidir. Eskiden anonim yayımlanmış bültenler herkese açık okunabilir ama otomatik olarak bir hesaba sahip atanmaz.

### Önemli güvenlik kuralı

Supabase URL veya publishable key eksikken **editör ve yayınlama kapalı** kalır: 503 güvenli hata durumu. Asla anonime düşülmez. Hizmetin etkinleşmesi için Netlify/Supabase panellerinde gerçek anahtarların girilmesi gerekir. Gizli anahtarları sohbet içinde paylaşmayın.

## Test stratejisi

- UI Playwright testlerinde yalnızca `/api/editor-access` yanıtı taklit edilir; sunucuda test moduyla auth bypass bulunmaz.
- Güvenlik testleri gerçek anonim URL isteklerini, sahte Supabase belirtecini, Netlify medya ve yayın reddini denetler.
- Onaylı iki gerçek kullanıcının canlı hesap testleri, Supabase Google OAuth etkinleştirilince ayrı yapılmalıdır.
