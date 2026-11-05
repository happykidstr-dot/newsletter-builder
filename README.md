# Newsletter Builder 📰

Profesyonel e-bültenler oluşturmak için bağımsız web uygulaması.  
**Project Factory AI** platformunun Bülten READ alt projesinden ayrıştırılmıştır.

## ✨ Özellikler

- **Sürükle & Bırak Editör** — 15+ blok tipi (başlık, metin, fotoğraf, video, etkinlik, anket, form, vb.)
- **20+ Hazır Şablon** — Okul bülteni, proje haberleri, sivil toplum, teknoloji özeti, belediye bülteni...
- **4 Tasarım Teması** — Modern, Classic, Bold, Minimal
- **AI İçerik Üretimi** — OpenAI ile metin oluşturma, yeniden yazma, uzatma
- **Çeviri** — AI ile tek tıkla Türkçe/İngilizce çeviri
- **PDF & HTML Export** — Bülteni HTML olarak indirme
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
