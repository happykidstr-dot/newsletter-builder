# BÜLTEN READ — Tek Simgeyle Ses Ekleme

**Yeni içerik türü:** 🔊 Ses Ekle (Temel ve Gelişmiş modda tek simge).

## Desteklenen ses biçimleri

Tek dosya seçiminden MP3, MP2/MPEG, WAV, M4A/M4B, AAC, OGG/OGA, OPUS, FLAC,
WebM/WEBA, AIFF/AIF, CAF, WMA, AMR, 3GP, ALAC, APE, AU, RealAudio, DSF/DFF,
MIDI, MKA, AC3, DTS, PCM, WavPack, TTA, Musepack, MOD ve XM dahil çeşitli
ses dosyaları seçilebilir. Ayrıca audio/* olarak tanınan daha yeni biçimler de
indirme amaçlı saklanabilir.

**Önemli ayrım:** Dosyayı yükleyebilmek bütün tarayıcıların biçimi
oynatabileceği anlamına gelmez. MP3, WAV, M4A, OGG/OPUS, WebM, FLAC, AAC gibi
biçimler tarayıcı ve işletim sisteminin desteklediği kodeklerde oynatılabilir.
WMA, APE, AIFF, MIDI, DSD ve nadir biçimlerde oynatma yerine kalıcı indirme
bağlantısı gösterilir. Otomatik dönüştürme/transkodlama henüz yoktur.

## Kullanım

1. Yetkili hesapla BÜLTEN READ editöründe oturum açın.
2. **🔊 Ses Ekle** kutusuna tıklayın. Ayrıca MP3/WAV gibi ikinci simge yoktur.
3. **Ses dosyası seç** ile dosyayı yükleyin. En fazla **60 MB/dosya**.
   Yükleme, Netlify Functions istek sınırları için 1,5 MB parçalara bölünür.
4. Başlığı yazın ve isterseniz sesi yerleşik oynatıcıdan dinleyin.
   Alternatif olarak zaten yayımlanmış, HTTPS ile erişilen ses dosyasının
   URL'sini girebilirsiniz.
5. **HTML indir** çıktısı ses oynatıcısı ve tam ses URL'si içerir;
   **PDF indir / Metin PDF** içinde ses dosyasını dinleme/indirme bağlantısı
   gösterilir (PDF içinde ses oynatılamaz).
6. Yayımlanan bültenin okuyucuları ses dosyasına bülten bağlantısı üzerinden
   erişebilir. Dosyalar varsayılan olarak **herkese açık** olup yalnızca iki
   doğrulanmış yayıncı ses yükleyebilir.

## Sınırlamalar ve güvenlik

- Yükleme ve yayınlama için Supabase Auth ile yetkili
  happykidstr@gmail.com veya projefabrikasitr@gmail.com hesabı gerekir.
  Supabase/Netlify anahtarları henüz girilmediyse yükleme güvenli biçimde kapalıdır.
- Ses dosyası Netlify Blobs üzerinde paylaşılır; bağlantıyı bilen herkes
  dinleyebilir veya indirebilir. Özel/sesli kişisel verileri izin almadan yüklemeyin.
- HTML indir dosyası ses baytlarını içine gömmez; bir HTTPS medya adresi
  içerir. Dosyanın çevrimdışı oynatılması garanti edilmez.
- Yayımlanmış bülteni silmek ses blobunu otomatik silmez;
  kişisel veri silme/erişim yaşam döngüsü ileride ayrıca geliştirilmelidir.
- Ses çalar otomatik oynatma yapmaz. Web tarafında byte-range destekli dinleme bulunur.
- Tarayıcı bazı dosyalar için desteklenmeyen kodek uyarısı verebilir; dosya
  indirme bağlantısı aynı kalır.
