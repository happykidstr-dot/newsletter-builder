# BÜLTEN READ — Şifresiz Yerel Editör ve Özel Sunucu Yayıncıları

Karar: Şimdilik bülten editörü **hesap veya şifre olmadan açılır**. Bülten
hazırlama, yerel Kaydet / Aç, şablonlar ve HTML / PDF indirme herkese
açıktır; kayıtlar aynı tarayıcının IndexedDB alanında tutulur.
Farklı bir cihazda aynı kişiye otomatik aktarılmaz.

**İki yetkili yayıncı** sunucu işlemleri için geçerlidir:
- `happykidstr@gmail.com`
- `projefabrikasitr@gmail.com`

Supabase Auth, bu e-postaların doğrulanmış olduğunu kanıtlamadan bulut
kaydı, bülten yayımlama, medya yükleme, AI, analitik veya gönderim yapılamaz.
Giriş olmadan editör herkese açıktır; yalnızca iki kişinin editöre
girmesini engellemek şifresiz ortamda teknik olarak mümkün değildir.

## İşlem ve yetki tablosu

| İşlem | Erişim |
|---|---|
| `/` ana sayfasını açmak | Herkes, girişsiz |
| Taslak hazırlama, yerel Kaydet/Aç ve HTML/PDF indirme | Herkes, kendi tarayıcısında |
| Mevcut `/b/<slug>` bültenini okumak | Herkes |
| Sunucuya bülten yayımlamak, yayımlananı değiştirmek, yayından kaldırmak | İki doğrulanmış yetkili hesap |
| Sunucuya görüntü/ses dosyası yüklemek | İki doğrulanmış yetkili hesap |
| Bulut taslağı, liste, AI, e-posta, analitik | İki doğrulanmış yetkili hesap |

## İleride şifreli editör açmak

Netlify → **Environment variables** alanında
`NEXT_PUBLIC_REQUIRE_EDITOR_LOGIN=true` tanımlanır ve yeni deploy yapılır.
Bu durumda `EditorAccessGate` yeniden etkinleşir; Supabase Auth ile doğrulanmış
onaylı kullanıcılar editöre girebilir. Şifreli kullanım için ilgili
Supabase ve Google OAuth ayarları da tamamlanmalıdır.

`NEXT_PUBLIC_REQUIRE_EDITOR_LOGIN` değeri yoksa veya `false` ise
editör **doğrudan açılır**, `Hesap ayarı gerekli` ekranı görünmez.

## Supabase / Netlify bağlantısını tamamlamak için

Kullanıcı Supabase panelinde `happykidstr-dot’s Org` Free Plan kuruluşunu açtı (ekranda **iki proje** görünüyor). Önce bu iki projenin adlarını inceleyin; uygun mevcut projede BÜLTEN READ şeması varsa yeniden proje açmayın.

1. Supabase → Project → **Authentication → Providers → Google**. Google OAuth kurulumunu [SUPABASE_AUTH_FREE_SETUP.md](./SUPABASE_AUTH_FREE_SETUP.md) yönergesindeki gibi etkinleştirin. Her iki onaylı Gmail hesabıyla giriş yapılabilir.
2. Supabase → **Authentication → URL Configuration**. Site URL: `https://bultenoku.netlify.app`, Redirect URLs: `https://bultenoku.netlify.app/auth/callback`.
3. Netlify → `https://app.netlify.com/projects/bultenoku/overview` → Project configuration → Environment variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
4. Supabase SQL Editor → şema bulunmuyorsa `supabase_schema.sql`, sonra `migrations/20261106_security_phase1.sql`, ardından `migrations/20261106_phase2_reliability.sql`. Uygulanmış SQL'i tekrar çalıştırmadan önce kontrol edin.
5. Netlify'de yeniden deploy edin. Alan adı satın almanız gerekmiyor.
6. İki onaylı adresle Google girişi test edin. Başka bir doğrulanmış Gmail hesabıyla sunucu işlemi denendiğinde **403** dönmeli. Şifresiz editör modu açıksa bu kişiler yerel taslaklarını hazırlayabilir, ancak sunucuya yayımlayamaz veya görsel yükleyemez.
7. Dilerseniz bu iki kullanıcı Supabase Auth → Users bölümünde oluştuktan sonra yeni kullanıcı kaydını Supabase Auth ayarlarından kapatın. **Dikkat:** İlk kez Google ile giriş yapacak onaylı hesapları oluşturmadan önce kaydı kapatırsanız onlar da giriş yapamayabilir.

### Mevcut verilerin korunması

İki yayıncının farklı Supabase Auth kullanıcı UUID'leri vardır. Biri diğerinin kişisel taslaklarını/listelerini otomatik görmez; aynı yayının düzenlenebilmesi için orijinal edit anahtarı ve kayıtlı yayın sahibi de gereklidir. Eskiden anonim yayımlanmış bültenler herkese açık okunabilir ama otomatik olarak bir hesaba sahip atanmaz.

### Önemli güvenlik kuralı

Supabase URL veya publishable key eksikken **yalnızca sunucu işlemleri kapalı** kalır: 503 güvenli hata durumu. Yerel editör herkese açıktır; sunucuda anonim yayımlama açılmaz. Hizmetin etkinleşmesi için Netlify/Supabase panellerinde gerçek anahtarların girilmesi gerekir. Gizli anahtarları sohbet içinde paylaşmayın.

## Test stratejisi

- Yerel editör Playwright ile Supabase ayarları olmadan açılarak Kaydet/HTML indirme bakımından test edilir. Sunucuda test moduyla auth bypass bulunmaz.
- Güvenlik testleri gerçek anonim URL isteklerini, sahte Supabase belirtecini, Netlify medya ve yayın reddini denetler.
- Onaylı iki gerçek kullanıcının canlı hesap testleri, Supabase Google OAuth etkinleştirilince ayrı yapılmalıdır.
