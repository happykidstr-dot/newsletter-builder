# Newsletter Builder 📰

Profesyonel e-bültenler oluşturmak için bağımsız web uygulaması.  
**Project Factory AI** platformunun Bülten READ alt projesinden ayrıştırılmıştır.

## ✨ Özellikler

- **Sürükle & Bırak Editör** — 15+ blok tipi (başlık, metin, fotoğraf, video, etkinlik, anket, form, vb.)
- **8 Profesyonel Şablon** — AB proje dergisi, sosyal etki, ortaklık haberleri, etkinlik daveti, kurumsal özet, erişilebilir bülten, görsel hikâyeler ve sade editoryal tasarım.
- **4 Tasarım Teması** — Modern, Classic, Bold, Minimal
- **AI İçerik Üretimi** — OpenAI ile metin oluşturma, yeniden yazma, uzatma
- **Çeviri** — AI ile tek tıkla Türkçe/İngilizce çeviri
- **PDF İndir / Yazdır / HTML** — Bülteni doğrudan indirilebilir A4 PDF dosyası olarak oluşturma; ayrıca bağımsız Yazdır düğmesi ve HTML dışa aktarma. PDF işlemi tarayıcıda çalışır, OpenAI token harcamaz.
- **E-posta Gönderimi** — Mailing list yönetimi ve toplu gönderim
- **Erişilebilirlik** — Tam donanımlı a11y toolbar (font boyutu, kontrast, disleksi fontu, büyüteç, vb.)
- **Clerk Auth** — Güvenli oturum yönetimi

## 🎨 Yeni Şablon Galerisi

Üst menüdeki **Şablonlar** bölümünde 8 ayrı bülten tasarımını gerçek içerik bloklarıyla inceleyebilirsiniz. Her tasarım için masaüstü ve mobil önizleme bulunur.

- **Tasarımı uygula:** İçeriğiniz, başlıklarınız, fotoğraflarınız ve logonuz korunarak görsel tema değiştirilir.
- **Örnek içerikle yeni bülten oluştur:** Mevcut çalışmanızın üzerine yazılmadan önce onay sorulur.
- **Ara ve filtrele:** AB Projeleri, Etkinlikler, Kurumsal, Erişilebilirlik ve Hikâyeler kategorileri bulunur.

## 🔗 Okuyucu Sosyal Medya Paylaşımı

HTML dışa aktarılan bültenlere LinkedIn, Facebook, X, WhatsApp, Telegram ve e-posta bağlantılarının bulunduğu **Bu bülteni paylaş** alanı eklenir. Destekleyen mobil tarayıcılarda işletim sisteminin paylaşım menüsü de açılır. Okuyucu herkese açık bülten URL'sini kopyalayabilir.

**Tek tıkla güncel bülten paylaşımı:** Artık editörde açık olan bülteni yayımlamak için üstteki **Paylaş** düğmesine basmanız yeterlidir. Uygulama, bültenin kamuya açılmasını onaylamanızı ister; onaydan sonra mevcut başlık, metinler, görseller, logo ve tasarım kalıcı olarak Netlify Blobs üzerinde depolanır. `/b/<benzersiz-kimlik>` bağlantısı oluşur. Facebook, LinkedIn, X, WhatsApp, Telegram ve e-posta düğmeleri **o bültenin** adresini paylaşır.

- Aynı bülteni değiştirmeden tekrar Paylaş'a basarsanız mevcut paylaşım bağlantısı tekrar açılır. Bülteni düzenleyip **Güncelle**'ye bastığınızda aynı URL yenilenir; eski bağlantıyı alan okuyucular güncel sürümü görür.
- Yayınlamadan önce kamuya açık bağlantının herkes tarafından görülebileceğini açıkça onaylamanız gerekir. Özel bilgi içeren bültenleri yayımlamayın.
- Paylaşım editörünüzdeki taslağı veya kayıtlı bültenleri değiştirmez. Yayımlanan bir bültenin bağlantısı, sonraki site güncellemelerinde korunur.
- Netlify'nin **production** ortamında yayımlanan içerikler site-geneli Blob deposunda, **Deploy Preview** ortamında test edilenler ise ayrı ve geçici depoda tutulur.
- Sunucu HTML'yi temizler, gömülü kullanıcı betiklerini çalıştırmaz ve herkese açık sayfayı güvenlik kısıtlamalarıyla sunar.
- Paylaşım için OpenAI API veya token kullanılmaz. Sosyal medya önizleme davranışları platformların kendi kurallarına bağlıdır.

**Yerel geliştirme notu:** Kalıcı yayınlama işlemi Netlify Blobs ortamını gerektirir. Yerel geliştirmede tam depolama entegrasyonunu doğrulamak için `netlify dev` kullanılmalıdır. Standart `npm run dev` ortamında Netlify Blobs kimlik bilgileri yoksa yayınlama 503 ile başarısız olur; editördeki taslak korunur.

## 🚀 Kurulum

### 1. Projeyi yerel diske kopyalayın

```bash
# Google Drive'dan yerel diske kopyalamak ÖNEMLİ!
# node_modules Google Drive üzerinde düzgün çalışmaz.
cp -r newsletter-builder C:\projeler\newsletter-builder
cd C:\projeler\newsletter-builder
```

### 2. Bağımlılıkları kurun

```bash
npm install
```

### 3. Environment değişkenlerini ayarlayın

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyip Clerk ve OpenAI anahtarlarınızı girin:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
```

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## 📁 Proje Yapısı

```
newsletter-builder/
├── app/
│   ├── page.tsx              # Ana bülten editör sayfası
│   ├── layout.tsx            # Root layout (Clerk auth, fonts)
│   ├── globals.css           # Global stiller
│   └── api/
│       └── ai-generate/      # OpenAI içerik üretim API
├── components/
│   ├── AccessibilityToolbar.tsx  # Erişilebilirlik araç çubuğu
│   └── BultenLocationMap.tsx     # Leaflet harita (analytics)
├── hooks/
│   └── useAccessibility.ts      # Erişilebilirlik hook
├── middleware.ts                 # Clerk auth middleware
├── data/                        # Geçici veri depolama
├── public/bulten_resimler/      # Örnek görseller
└── ornek_bulten.json            # Örnek bülten JSON
```

## 🔒 Auth

Clerk oturum açma desteği sağlanmaktadır.

## 📋 Gereksinimler

- Node.js 18+
- npm 9+
- Clerk hesabı (auth için)
- OpenAI API anahtarı (AI içerik üretimi için, isteğe bağlı)


## 📄 PDF İndirme ve Yazdırma (Kasım 2026)

Üst araç çubuğunda iki ayrı işlem bulunmaktadır:

- **⬇️ PDF İndir:** Bültenin A4 biçiminde, gerekirse birden çok sayfadan oluşan `.pdf` dosyasını bilgisayara indirir. Yazıcıya göndermez ve yazdırma penceresi açmaz.
- **🖨️ Yazdır:** Bültenin yazdırılabilir görünümünü ayrı pencerede açıp tarayıcının yazdırma iletişim kutusunu gösterir.

PDF üretimi yalnızca tarayıcıda, `html2pdf.js` 0.14.0 kullanılarak yapılır. OpenAI API çağrısı veya token kullanımı yoktur. Bültenin görsel düzeni ve fotoğrafları yüksek çözünürlüklü görüntü olarak aktarılır; dolayısıyla PDF metni her zaman seçilebilir/aranabilir olmayabilir. Harici görsellerin yüklenebilmesi, görsel sunucusunun CORS izinlerine bağlıdır. Video çerçeveleri ise PDF içinde bağlantı metni olarak gösterilir.

## 🗂️ Kayıtlı Bültenler, Open ve Yayını Düzenleme

Editörün üst bölümünde **Düzenle**, **Yayınla / Güncelle** ve **Paylaş** kontrolleri bulunur. İlk yayınlama için yayınlama onayı gerekir; sonraki değişiklikler yayıncıya ait düzenleme anahtarıyla **aynı `/b/<id>` adresini koruyarak** güncellenir.

**Kaydet**, mevcut bülteni her seferinde çoğaltmak yerine aynı kayıt kimliğiyle günceller. **Aç** menüsünde kayıtlı bülten kartları, arama kutusu, `Taslak` / `Yayınlandı` durumu ve **Open** düğmesi vardır. Kartın üzerine çift tıklamak da bülteni editöre açar. Yayımlanmış bir kaydın **Edit** seçeneğiyle değişiklik yapıp **Güncelle**'ye basabilirsiniz.

Yayımlanmış okuyucu sayfasındaki **Düzenle / Edit** bağlantısı da editöre döner. Güvenlik nedeniyle herkes bağlantıyı görebilir ancak yalnızca orijinal yayınlama anahtarı bu tarayıcıda kayıtlı olan kullanıcı **aynı yayını güncelleyebilir**. Edit anahtarı sosyal medya bağlantısında ya da herkese açık sayfada bulunmaz. Farklı tarayıcı veya cihazda giriş yapıldığında bu yerel anahtar otomatik taşınmaz.

**Veri korunması:** Kayıtlı bültenler bu tarayıcının yerel depolama alanında saklanır. Bulut bülten kaydı yapılandırılmışsa bunlar listeye ayrıca eklenebilir, fakat gizli edit anahtarı buluta yüklenmez. Tarayıcı verileri silinirse yalnızca yerel saklanan kayıtlar ve düzenleme anahtarı kaybolabilir. Eski sistemde düzenleme anahtarı olmadan yayımlanmış bültenler güvenli olarak aynı URL'de değiştirilemez; bunları tekrar yayımlamak yeni bir bağlantı oluşturur.


## 📸 Büyük bültenleri sosyal medyada paylaşma

**Paylaş** ve **Yayınla** düğmeleri bültenin bağlantısını paylaşır; yüzlerce fotoğrafın bulunduğu bülteni bir sosyal medya gönderisine dosya olarak yüklemek gerekmez.

- PNG/JPEG/WebP/GIF biçimindeki gömülü fotoğraflar, yalnızca **yayınlanan kopya için**, gerekiyorsa yüksek kaliteli WebP biçiminde küçültülür ve ayrı bir Netlify Blobs medya deposuna yüklenir.
- Her fotoğraf kendi `/media/<id>` adresinden görüntülenir. Bültenin `/b/<id>` HTML sayfası yalnızca bağlantıları içerir; fotoğrafların toplam boyutu artık tek yayınlama isteğine eklenmez.
- **Görseller yükleniyor (n/N)** ilerleme göstergesi vardır. Fotoğrafların indirilmesini tarayıcı yönetir. Düzenlediğiniz özgün görsellerin boyutları ve içeriği değiştirilmez.
- Aynı fotoğrafı yeniden yayınladığınızda tarayıcı daha önce yüklenen medya URL'sini yeniden kullanabilir; yayınlanmış kopyanın düzenlenebilir kaydı küçük medya URL'leriyle saklanır.
- İndirme/yazdırma işlemleri bundan bağımsızdır ve OpenAI token tüketilmez.

**Teknik sınırlar:** Sosyal medya platformları kısa bülten bağlantısını paylaşır; buna ilişkin bir bülten dosyası boyut limiti yoktur. Ancak Netlify Functions'ın istek boyutu, tek fotoğraf yüklemeleri için yaklaşık 2,5 MB'lik aktarım sınırı ve kötüye kullanımı önlemek için yükleme kotası bulunur. Büyük fotoğraflar tarayıcıda otomatik olarak uygun aktarım boyutuna küçültülür. Desteklenmeyen görsel dosyaları veya sistem kapasitesini aşan yayınlar sınırsız garanti edilmez.
