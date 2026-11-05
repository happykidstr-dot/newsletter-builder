# Newsletter Builder 📰

Profesyonel e-bültenler oluşturmak için bağımsız web uygulaması.  
**Project Factory AI** platformunun Bülten READ alt projesinden ayrıştırılmıştır.

## ✨ Özellikler

- **Sürükle & Bırak Editör** — 15+ blok tipi (başlık, metin, fotoğraf, video, etkinlik, anket, form, vb.)
- **8 Profesyonel Şablon** — AB proje dergisi, sosyal etki, ortaklık haberleri, etkinlik daveti, kurumsal özet, erişilebilir bülten, görsel hikâyeler ve sade editoryal tasarım.
- **4 Tasarım Teması** — Modern, Classic, Bold, Minimal
- **AI İçerik Üretimi** — OpenAI ile metin oluşturma, yeniden yazma, uzatma
- **Çeviri** — AI ile tek tıkla Türkçe/İngilizce çeviri
- **PDF & HTML Export** — Bülteni HTML olarak indirme
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

**Önemli:** Bültenin sosyal medyada gerçekten açılabilmesi için HTML dosyasının herkese açık bir HTTP(S) adresinde yayımlanması gerekir. Sadece bilgisayarda duran bir dosyanın veya BÜLTEN READ editör ana sayfasının bağlantısı bültenin kendisi değildir.

- HTML dosyasını bir web sitesine yükleyin. Okuyucu sayfayı web adresinden açınca paylaşım düğmeleri o adresi kullanır.
- E-posta bülteninde de sosyal bağlantıların çalışmasını istiyorsanız, **Bülteni Paylaş** ekranındaki **Yayımlanmış bültenin bağlantısı** alanına o sayfanın adresini girip HTML'yi yeniden dışa aktarın. E-posta istemcileri genellikle JavaScript çalıştırmaz; bağlantı bu nedenle önceden belirlenmelidir.
- Yayımlanmış URL, bu bültenin yerel taslağında korunur; dış sunucuya otomatik bir bülten yayımlama servisi henüz sunulmaz.
- Açık sosyal paylaşım bağlantıları erişilebilirlik için metin etiketlidir. Sosyal platformların gerçek paylaşım ve önizleme davranışı kendi kurallarına bağlıdır.

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
