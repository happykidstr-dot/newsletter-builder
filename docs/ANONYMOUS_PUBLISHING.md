# Şifresiz çevrimiçi yayınlama — üretim ayarları

Bu dal herkese açık **bülten oluşturma, yayımlama ve görsel yükleme** akışını Cloudflare Turnstile doğrulamasına bağlar. Kullanıcı hesabı gerekmez.

## Üretimden önce zorunlu
1. Cloudflare Turnstile üzerinde `bultenoku.netlify.app` alan adını tanımlayın. Test/staging alan adlarını ayrı doğrulayın.
2. Netlify ortam değişkenleri: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public), `TURNSTILE_SECRET_KEY` (secret), `ENABLE_ANONYMOUS_PUBLISHING=true`.
3. Netlify Blobs kalıcı üretim depolamasının çalıştığını doğrulayın. Secret anahtarı istemciye veya GitHub'a yazmayın.
4. Yeni yayın, görsel yükleme, aynı URL'yi düzenleme, yanlış edit anahtarı, farklı tarayıcı, spam/rate limit, XSS ve mobil testleri tamamlayın.
5. Turnstile hatası veya secret eksikliği halinde API **kapalı** kalır (403/503).

## Güvenlik ve kısıtlar
- Her yazma isteği için **yeni** Turnstile token gerekir; doğrulama sunucuda Cloudflare Siteverify ile yapılır.
- Yayın düzenleme anahtarı yalnızca bülteni oluşturan tarayıcıda tutulur; sunucuda SHA-256 hash saklanır. Okuyucu URL'sinde bulunmaz.
- Önceden bir kullanıcı hesabına ait yayınlar anonim düzenlemeye açılmaz.
- Sunucudaki mevcut HTML sanitizasyonu, dosya boyutu ve IP bazlı hız/kota kontrolleri korunur. IP kotası best-effort'tur ve dağıtık yarış koşullarına karşı kesin garanti vermez.
- Açık yayın hizmeti moderasyon, şikâyet/kaldırma prosedürü, toplam depolama kotası ve kötüye kullanım izleme olmadan sınırsız ölçekli bir platform olarak değerlendirilmemelidir.
- Turnstile yalnızca otomatik kötüye kullanımı azaltır; zararlı içeriği veya insan kaynaklı spam'i tamamen engellemez.

## Yayına alma kararı
Kodun GitHub'a gönderilmesi tek başına Netlify production deploy değildir. CI, Netlify değişkenleri ve canlı testler tamamlanmadan `ENABLE_ANONYMOUS_PUBLISHING` etkinleştirilmemelidir.
