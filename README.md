# Newsletter Builder 📰

Profesyonel e-bültenler oluşturmak için bağımsız web uygulaması.  
**Project Factory AI** platformunun Bülten READ alt projesinden ayrıştırılmıştır.

## ✨ Özellikler

- **Sürükle & Bırak Editör** — 15+ blok tipi (başlık, metin, fotoğraf, video, etkinlik, anket, form, vb.)
- **20+ Hazır Şablon** — Okul bülteni, proje haberleri, sivil toplum, teknoloji özeti, belediye bülteni...
- **4 Tasarım Teması** — Modern, Classic, Bold, Minimal
- **AI İçerik Üretimi** — OpenAI ile metin oluşturma, yeniden yazma, uzatma
- **Çeviri** — AI ile tek tıkla Türkçe/İngilizce çeviri
- **HTML / PDF** — HTML dosyası indirme, tarayıcı üzerinden PDF olarak yazdırma
- **E-posta Gönderimi** — Mailing list yönetimi ve toplu gönderim
- **Erişilebilirlik** — Tam donanımlı a11y toolbar (font boyutu, kontrast, disleksi fontu, büyüteç, vb.)
- **Clerk Auth** — Güvenli oturum yönetimi

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
│       ├── ai-generate/      # OpenAI içerik üretim API
│       └── db/               # Bülten ve liste kayıt API'leri
├── components/
│   ├── AccessibilityToolbar.tsx  # Erişilebilirlik araç çubuğu
│   └── BultenLocationMap.tsx     # Leaflet harita (analytics)
├── hooks/
│   └── useAccessibility.ts      # Erişilebilirlik hook
├── middleware.ts                 # Clerk auth middleware
├── public/bulten_resimler/      # Örnek görseller
└── ornek_bulten.json            # Örnek bülten JSON
```

## 🔒 Auth

Clerk, özel bülten ve iletişim listesi API'lerine erişimde kullanılır. Eksik güvenlik yapılandırmasında sunucu tarafı işlemler kapalıdır.

## 📋 Gereksinimler

- Node.js 18+
- npm 9+
- Clerk hesabı (auth için)
- OpenAI API anahtarı (AI içerik üretimi için, isteğe bağlı)

## 🔐 Kasım 2026 güvenlik ve veri bütünlüğü güncellemesi

Kapsamlı güvenlik, kayıt ve alıcı listesi düzeltmeleri `fix/bulten-read-security-data-20261105` dalında hazırlanmıştır. **Canlıya almak için önce [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) içindeki migration/ortam değişkenleri adımlarını uygulayın.**

- Özel API'lerde sunucu tarafı oturum; AI ve toplu e-posta kotası
- Sunucu veritabanında bülten, logo ve içindekiler saklama
- Doğrulanmış gönderici ve izinli alıcı listesi; abonelikten ayrılma
- HTML güvenliği ve gerçek mobil editör için uyarlanabilir düzen
- `npm test` kaynak sözleşmesi testleri, GitHub Actions TypeScript + Next.js derlemesi

PDF butonu henüz doğrudan PDF üretmez: tarayıcının **PDF olarak kaydet/yazdır** akışını kullanır. E-posta ve AI entegrasyonları gerekli gizli anahtarlar olmadan güvenlik nedeniyle devre dışı kalır.
