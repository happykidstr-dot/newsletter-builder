# BÜLTEN READ – Faz 3: Arayüz, Şablon Doğruluğu ve PDF

Tarih: 6 Kasım 2026.

## Yayıncı için değişiklikler

- **Yayınla / Güncelle:** yalnızca bu işlem, açık bülteni sunucuya kaydeder veya yayındaki aynı adresi günceller. Onay istenir.
- **Paylaş:** yalnızca mevcut yayımlanmış, değişmemiş sürümün sosyal bağlantılarını gösterir. Yayın yoksa veya güncellenmemiş düzenlemeler varsa durum bildirilir. Kendiliğinden e-posta göndermez veya yayınlama yapmaz.
- **Temel içerik blokları:** başlık, metin, fotoğraf, metin+fotoğraf, etkinlik, bağlantı, düğme ve ayırıcı.
- **Gelişmiş içerik blokları:** tüm 15 tip, özellikle form, Google Form, anket, video, yazar, fotoğraf galerisi ve ekler. Mod değiştirmek mevcut blokları silmez.
- **Gelişmiş Araçlar:** HTML, Metin PDF, Yazdır, AI Üret, Analiz ve Gönder kontrolleri isteğe bağlı açılır. PDF İndir, Şablonlar, Yayın Önizleme, Kaydet/Aç ve yayın işlemleri temel çubukta kalır.
- **Şablon galerisinin ayrıntılı görünümü:** ayrı bir tahmin çizimi yerine HTML dışa aktarma ve yayınlama için kullanılan ortak render işlevinin ürettiği gerçek sayfa, betik çalıştırmayan iframe ile gösterilir. Galeri kartlarındaki küçük resimler tasarım illüstrasyonudur.
- **Yayın Önizleme:** açık taslağın gerçekten yayımlanacak HTML görünümünü gösterir.

## PDF

- **PDF İndir:** mevcut görsel düzen korunur. Metin her zaman seçilebilir değildir.
- **Metin PDF (erişilebilir):** Roboto Unicode gömülü, seçilebilir metin, PDF başlıkları, bağlantılar, görsel alternatif açıklamaları, belge adı ve dil bilgisi. Yazdırma iletişim kutusu kullanılmaz; doğrudan dosya indirilir.
- Bu metin öncelikli PDF fotoğrafları birebir yeniden oluşturmaz; her görselin alt metnini aktarır. Alternatif açıklaması olmayan görseller açıkça işaretlenir.
- PDF üretiminde tagged PDF özelliği etkin olsa da **PDF/UA uyumluluğu bağımsız olarak doğrulanmamıştır**. Gerçek üretim dokümanlarında PAC/Acrobat gibi araçlarla denetim, ekran okuyucuyla manuel test ve alternatif metin kontrolü gerekir.

## Kabul testleri

| Senaryo | Kabul ölçütü |
|---|---|
| Yayınla / Paylaş | Paylaş'a basmak POST /api/publish göndermemeli; değişiklik yapıldıysa Güncelle gerekli |
| Modlar | Temel bloklar görünür, gelişmiş modda tüm 15 blok kullanılabilir, mevcut içerikler korunur |
| Şablon gerçek görünüm | Galerinin HTML önizlemesi ile örnekten oluşturulup dışa aktarılan HTML aynı başlık/metinleri taşır |
| PDF | Görsel PDF ve ayrı metin PDF geçerli PDF olarak iner, yazdırma penceresi açılmaz |
| Seçilebilir içerik | Metin PDF'den Türkçe başlık ve paragraf metni yazılımsal olarak çıkarılabilir |
| Mobil | 320px, 375px ve masaüstünde yatay üç panel zorunlu değildir, içerik ve özellik panelleri açılır |
| Güvenlik | Faz 1 yetkilendirme/kota testleri ve Faz 2 veri katmanı testleri regresyona uğramaz |

## Operasyonel sınırlar

Bu aşama Supabase SQL migrations, Clerk oturum anahtarları veya Netlify environment variables yapılandırması yapmaz. Faz 1 ve Faz 2 servisleri bu ayarlar eksikken güvenli kapalı durumda olabilir. Netlify production yayını ayrıca doğrulanmalıdır.
