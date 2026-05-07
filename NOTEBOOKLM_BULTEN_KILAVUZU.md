# NOTEBOOKLM'DEN BÜLTENE: KAPSAMLI UYGULAMA KILAVUZU

Bu kılavuz, Google NotebookLM (veya benzeri yapay zeka araçları) aracılığıyla elde ettiğiniz metin, özet veya notlarınızı, "Project Factory AI" ekosisteminde yer alan **Bülten READ (Newsletter Builder)** aracına *otomatik* olarak ve en zengin görsel formatlarla nasıl aktaracağınızı adım adım, en ince detayına kadar anlatan 3000 kelimelik başvuru kaynağınızdır.

Bu rehberin amacı, sıradan kelime işlemci dosyalarıyla veya klasik mail uygulamalarıyla (Outlook, Gmail vs.) manuel olarak bülten hazırlama derdine son vermek; bunun yerine yapay zekanın sağladığı yapısal (JSON) çıktıyı bir saniyede profesyonel tasarım şablonlarına dönüştürmenizi sağlamaktır. Üstelik bu süreç, yerel bilgisayarınızdaki (lokal) resimlerinizi dışarıya yüklemeye gerek kalmadan bülteninize gömebilmenizi (embed) sağlayan özel bir script (Node.js) altyapısı ile desteklenmektedir.

---

## 1. BÖLÜM: VİZYON VE SİSTEM MİMARİSİ (GENEL BAKIŞ)

### 1.1. Neden NotebookLM Kullanıyoruz?
Google NotebookLM, yüklediğiniz yüzlerce sayfalık PDF'leri, araştırma makalelerini veya uzun kurum içi raporlarını analiz etmekte şu an dünyadaki en güçlü araçlardan biridir. Ancak NotebookLM'in ürettiği çıktılar, düz metin (plain text) veya temel Markdown formatındadır. Bunları doğrudan paydaşlarınıza e-posta olarak gönderdiğinizde görsel cazibeden yoksundurlar ve okunma (read) oranları ciddi şekilde düşer. Bu noktada devreye Bülten READ aracımız giriyor.

### 1.2. Bülten READ Aracı Nedir?
Bülten READ, blok tabanlı (Smore veya Mailchimp benzeri) yeni nesil bir bülten oluşturma motorudur. Arka planda 15'ten fazla blok türü (Başlık, Video, Etkinlik, Resim Galerisi, Soru-Seçenek Anketleri, Butonlar) bulunur. Bülten READ, özel bir JSON alt yapısı kullanır. Eğer bir sistem bu araca beklediği JSON dilinde konuşursa, sayfa anında profesyonel bir tasarımla boyanır, görseller yerine oturur ve dışa aktarılmaya (HTML/PDF) hazır hale gelir.

### 1.3. İki Dünyanın Birleşimi: "push-newsletter.js" Scripti
Sürecin sihirli halkası, Project Factory AI çalışma alanınızdaki `scripts/push-newsletter.js` isimli Node.js scriptidir. Bu script iki çok önemli işi yapar:
1. NotebookLM'in ürettiği veriyi (JSON dosyasını) klasörden okur.
2. JSON'ın içerisinde yazdığınız `"C:/Resimler/fotograf1.jpg"` gibi yerel resim adreslerini tespit eder, resmin bilgisayardaki dosyasına gider, onu saniyeler içinde Base64 dediğimiz web standartlarındaki veri dizisine çevirir.
3. Arka planda çalışan API rotasına (`http://localhost:3000/api/notebook-sync`) bu zenginleştirilmiş veriyi fırlatır (POST eder).
4. Siz tarayıcıda `http://localhost:3000/tools/bulten-read` adresini açtığınız (ya da yenilediğiniz) anda bülteniniz muazzam bir şekilde karşınıza çıkar.

---

## 2. BÖLÜM: BÜLTEN READ SİSTEMİNİN ANLADIĞI DİL (JSON YAPISI)

Araçların birbiriyle konuşabilmesi için yapılandırılmış bir veri formatı olan JSON (JavaScript Object Notation) kullanılır. Bülten aracının kabul ettiği ana anahtarlar (keys) şunlardır:

### 2.1. Temel Gövde İskeleti (Root Element)
Bir bülten JSON'u her zaman aşağıdaki ana unsurlara sahip olmalıdır:

```json
{
  "title": "Bültenin En Üstündeki Ana Başlık",
  "subtitle": "Bültenin Alt Başlığı veya Tarihi (#Sayı 11 gibi)",
  "design": "modern", 
  "logoUrl": "C:/Resimler/kurum_logosu.png",
  "headerImgUrl": "C:/Resimler/kapak_fotografi.jpg",
  "blocks": [
    // Blok objeleri bu dizinin içine yerleşir
  ]
}
```

*Notlar:*
*   **`design`**: Seçebileceğiniz hazır tasarım şablonlarıdır. `modern` (Koyu Mavi), `classic` (Kurumsal Yeşil/Bej), `bold` (Keskin Kırmızı), ve `minimal` (Siyah/Beyaz/Gri) değerlerini alabilir.
*   **`logoUrl` ve `headerImgUrl`**: Daha önce internete yüklenmiş fotoğraf linkleri (http://...) olabileceği gibi, doğrudan masaüstünüzdeki fotoğrafların doya yolları da olabilir. Scriptiniz bilgisayarınızdaki resmi otomatik bulup sisteme gömecektir.

### 2.2. Desteklenen İçerik Blokları ve Yapıları
Her blok dizisi, en az üç parametreye sahip bir nesne (object) olmalıdır: `"id"`, `"type"` (blok türü) ve `"data"` (bloğun özellikleri). Aşağıda her bir tipin detaylı açıklaması ve NotebookLM'e vermeniz gereken spesifikasyonları mevcuttur.

**1. `title` (Başlık Bloğu)**
*Amaç*: Haber veya duyuru başlıklarını ayırmak içindir.
*Gereksinimler*: `text` (Başlığın kendisi), `size` (`h1` Büyük, `h2` Orta, `h3` Küçük).
*Örnek*: 
```json
{ "id": "t1", "type": "title", "data": { "text": "Proje Çıktılarımız Sunuldu", "size": "h1" } }
```

**2. `paragraph` (Metin/İçerik Bloğu)**
*Amaç*: Uzun yazılar, açıklamalar veya rapor özetleri içindir.
*Gereksinimler*: `text` (Paragraf metni). İçerikte "\n" kullanılarak alt satıra geçilebilir.
*Örnek*: 
```json
{ "id": "p1", "type": "paragraph", "data": { "text": "Saha ziyaretlerimiz kapsamında 120 öğrenci... \n\nEğitim materyalleri başarıyla teslim edildi." } }
```

**3. `photos` (Tekil Fotoğraf Bloğu)**
*Amaç*: Ekran genişiliğini kaplayacak büyük görseller sunmak.
*Gereksinimler*: `url` (Web linki veya yerel dosya yolu), `caption` (Alt yazı, isteğe bağlı).
*Örnek*: 
```json
{ "id": "ph1", "type": "photos", "data": { "url": "C:/Masaustu/etkinlik1.png", "caption": "Katılımcılarla birlikte çekilen anı karesi" } }
```

**4. `textphoto` (Yanyana Metin ve Görsel Bloğu)**
*Amaç*: Bültene dergi (magazine) havası katar. Yazı solda resim sağda (veya tam tersi) konumlanır.
*Gereksinimler*: `text` (Yazı), `url` (Resim adresi), `imagePos` (`left` veya `right`).
*Örnek*: 
```json
{ "id": "tp1", "type": "textphoto", "data": { "text": "Yeni açılan tesisimiz ilk ziyaretçilerini ağırladı.", "url": "https://unsplash.com/foto.jpg", "imagePos": "right" } }
```

**5. `photogrid` (Görsel Galerisi Bloğu)**
*Amaç*: Çok sayıda resmi yan yana kutucuklar halinde dizmek içindir.
*Gereksinimler*: `cols` (Sütun sayısı: "1", "2" veya "3"). Sütun sayısına bağlı olarak `url1`, `cap1`, `url2`, `cap2`, `url3`, `cap3`.
*Örnek*: 
```json
{ "id": "pg1", "type": "photogrid", "data": { "cols": "3", "url1": "C:/resimler/r1.jpg", "cap1": "Atölye", "url2": "C:/resimler/r2.jpg", "cap2": "Sunum", "url3": "C:/resimler/r3.jpg", "cap3": "Molalar" } }
```

**6. `event` (Etkinlik ve Takvim Bloğu)**
*Amaç*: Yaklaşan toplantıları, Zoom görüşmelerini veya fiziksel organizasyonları şık bir takvim formatında vurgulamak.
*Gereksinimler*: `title` (Etkinlik Adı), `date` (Tarih, YYYY-AA-GG), `time` (Saat: SS:DD), `location` (Konum/Link).
*Örnek*: 
```json
{ "id": "e1", "type": "event", "data": { "title": "Bahar Şenliği", "date": "2026-05-15", "time": "14:00", "location": "Merkez Kampüs" } }
```

**7. `button` (Hareket Çağrısı / Buton Bloğu)**
*Amaç*: Okuyucuyu bir web sitesine, form kayıt linkine veya indirme bağlantısına yönlendirmek (Call to Action).
*Gereksinimler*: `text` (Buton içi yazı), `url` (Yönlendirilecek link), `align` (Hizalama: `left`, `center`, `right`).
*Örnek*: 
```json
{ "id": "b1", "type": "button", "data": { "text": "Hemen Kayıt Ol", "url": "https://forms.google.com/...", "align": "center" } }
```

**8. `poll` (Mini Anket veya Etkileşim Bloğu)**
*Amaç*: Okuyucuya çoktan seçmeli bir soru sorarak vizyon belirlemek veya interaktif bir görünüm katmak.
*Gereksinimler*: `question` (Soru Cümlesi), `opt1`, `opt2`, `opt3` (Şıklar).
*Örnek*: 
```json
{ "id": "poll1", "type": "poll", "data": { "question": "Gelecek projede hangi hedef gruba odaklanalım?", "opt1": "Gençler", "opt2": "Kadınlar", "opt3": "Engelliler" } }
```

**9. `author` (Yazar, Konuşmacı, Kişi Tanıtım Bloğu)**
*Amaç*: Bültene yazan kişiyi, genel müdürü veya projede öne çıkan bir ismi avatarı ve özgeçmişiyle profesyonelce tanıtmak.
*Gereksinimler*: `name` (Ad Soyad), `title` (Ünvan), `bio` (Kısa Özgeçmiş), `avatar` (Profil resminin olduğu bağlantı veya lokal dosya yolu).
*Örnek*: 
```json
{ "id": "a1", "type": "author", "data": { "name": "Ahmet Yılmaz", "title": "Proje Koordinatörü", "bio": "Avrupa Birliği hibe fonlarında 10 yıllık deneyime sahiptir.", "avatar": "C:/fotolar/ahmet.jpg" } }
```

**10. `attachment` (Ek Dosya İndirme Bloğu)**
*Amaç*: PDF raporlarını veya Word belgelerini klasör simgesiyle birlikte şık bir ataş (attachment) kutusu halinde göstermek.
*Gereksinimler*: `name` (Dosyanın görünen adı, örn: "Rapor.pdf"), `url` (Dosya bağlantısı).
*Örnek*: 
```json
{ "id": "at1", "type": "attachment", "data": { "name": "2026_Faaliyet_Raporu.pdf", "url": "https://drive.google.com/..." } }
```

**11. Diğer Özel Bloklar**
*   `separator`: `data: { "style": "solid|dashed|dotted" }` (Metinleri birbirinden ayıran yatay çizgiler çeker.)
*   `video`: `data: { "url": "https://youtube.com/watch?v=...", "caption": "Videoyu izlemek için tıklayın" }` (Youtube linkini iframe tabanlı kutuya gömer.)
*   `link`: `data: { "text": "Okumak için tıklayın", "url": "..." }` (Renkli, altı çizili metin içi bağlantı yaratır.)


---

## 3. BÖLÜM: NOTEBOOKLM İÇİN MÜKEMMEL PROMPT SÜRECİ

NotebookLM (veya ChatGPT, Claude, Gemini), elinizdeki ham veriyi analiz edip az önce incelediğimiz JSON formatına uygun hale getirebilmesi için doğru bir şekilde yönlendirilmelidir (Prompt Engineering). 

### 3.1. Süreç Döngüsü (Workflow)

**Adım 1:** Veri Kaynağını Besleyin
Aylık ilerleme raporlarınızı, proje sunumlarınızı, PDF, metin belgesi veya Drive linki aracılığıyla NotebookLM'in kaynaklar kısmına (Sources) yükleyin.

**Adım 2:** Veriyi Okuması İçin Süre Tanıyın
NotebookLM veriyi okuyacak ve indeksleyecektir. Belgenizdeki temel anahtar kelimeleri kavramasını bekleyin.

**Adım 3:** Sihirli "Bülten JSON Promptu"nu Yazın
Aşağıdaki promptu tam olarak kopyalayarak NotebookLM'in sohbet kutusuna yapıştırın. Bu prompt, yapay zekayı bir içerik yazarından bir "sistem mimarına" dönüştürür.

### 3.2. Ana Kalıp Prompt (Kopyala-Yapıştır Formülü)

```text
Sen uzman bir içerik editörü ve iletişim uzmanısın, ancak aynı zamanda kusursuz JSON formatı yazabilen bir geliştiricisin. Yüklediğim dokümanları (raporlar/toplantı notları) analiz et ve bunlardan son derece etkileyici, profesyonel dili olan ve aşağıdaki JSON şemasına %100 sadık kalan devasa bir bülten oluştur.

Kurallar:
1. YALNIZCA ve YALNIZCA geçerli bir JSON objesi döndür. Yazıların başında "İşte JSON:" veya sonunda "Umarım beğenirsin" gibi markdown veya açıklama olmamalıdır. Doğrudan süslü parentez { ile başla ve } ile bitir.
2. JSON içinde "title", "subtitle", "design", "headerImgUrl" (gerçekçi bir fotoğraf linki veya hayali bir klasör yolu, örn: C:/resimler/kapak.png) olmalıdır.
3. İçerik için "blocks" isimli array objesini kullan. "b1", "b2" gibi benzersiz id'ler tanımla. 
4. Bülteni zenginleştirmek için en az 10 (on) blok kullan! Mutlaka "title", "paragraph", "textphoto", "photogrid", "event", "author" ve "button" blok tiplerinin hepsinden en az birer tane olsun.
5. Kullanacağın `photogrid` bloklarında en az 2 resim (url1, cap1, url2, cap2) kullan, gerekirse 3 (url3, cap3).
6. Resim linklerini (url) bilmediğin için uydurabilirsin veya stok fotoğraf url'si (https://images.unsplash.com/photo-...) kullanabilirsin. Eğer elinde yerel bir klasör adresi varsa, onu "C:/Resimler/ornek.jpg" şeklinde de yazabilirsin, sistemimiz bunu kendi okuyacaktır.
7. İçeriği çok uzun tut, bülten okuyucusuna doyurucu bir deneyim yaşat. Metinlerdeki dili ciddi ama ilgi çekici (engaging) kurgula.

Desteklenen JSON yapısı şöyledir:
{
  "title": "",
  "subtitle": "",
  ...
  "blocks": [
    { "id": "...", "type": "paragraph|title|photos|textphoto|event|button|photogrid|separator|author", "data": { ... } }
  ]
}
```

### 3.3 Çıktının İncelenmesi
NotebookLM, bir kaç saniyelik düşünenin ardından size devasa bir JSON dizesi verecektir. Eğer başında veya sonunda kod kutucuğu işareti (```json) kalmışsa bunu silebilirsiniz. Gerçi sistemimiz çoğu durumu idare edebilir ancak temiz bir JSON hayat kurtarır.

---

## 4. BÖLÜM: YEREL GÖRSELLERİ JSON'A GÖMMEK (LOCAL IMAGE EMBEDDING)

Eğitmenler ve danışmanlar için bülten hazırlamanın en sancılı süreci, görsellerin nereye web'e yükleneceğidir. (Bu resmi imgur'a yükleyeyim, linkini alayım, sisteme kopyalayayım derdi).

Bülten READ sisteminde devrimsel bir yenilik vardır:
Siz veya (siz prompt'unuzda yapay zekaya derseniz) JSON dosyasının içindeki URL bölümlerine doğrudan bilgisayarınızdaki yolunu (Path) yazabilirsiniz:

```json
{
  "id": "foto1",
  "type": "textphoto",
  "data": {
    "text": "Geçtiğimiz ay projenin saha ekibi yeni binamızda incelemelerde bulundu.",
    "url": "C:/Kullanicilar/Masaustu/Saha_Raporu/resimler/foto_grup.jpg",
    "imagePos": "left"
  }
}
```
Veya projenin kendi klasöründeyseniz (Relative Path):
```json
"url": "images/bizim_logo.png"
```

**Bu nasıl çalışıyor?**
Scriptimiz (`push-newsletter.js`), bu JSON verisini okuduğunda içindeki adresi tespit ediyor. Dosyanın gerçekten bilgisayarınızda C: diskinde olup olmadığını kontrol ediyor. Eğer varsa dosyayı baytlarına ayırıp saniyeler içinde Base64 formatına (`data:image/jpeg;base64,..../9j/4AAQSk...`) çeviriyor. Bu sayede bülteniniz API serverine ulaştığında veritabanı veya fotoğraf yükleyici (hosting) beklemiyor. Fotoğraf, sanki kelimeden yapılmış gibi metinsel koda dönüşüp bültenin gövdesinde ömür boyu kalıcı (embed) hale geliyor.

*Not:* Bilgisayar yolunu tanımlarken ters eğik çizgi `\` yerine normal eğik çizgi `/` kullanmanız (örn: `C:/Masaustu/...`) daha sağlıklı çalışmasına yardımcı olur.

---

## 5. BÖLÜM: SİSTEMİ ÇALIŞTIRMAK (PUSH SCRIPT)

### 5.1 JSON Dosyasının Kaydedilmesi
NotebookLM'in ürettiği veriyi (veyahut kendi elinizle oluşturduğunuz/düzenlediğiniz yerel görsellerle zenginleştirilmiş metni), bilgisayarınızda dilediğiniz bir yere, uzantısı `.json` olacak şekilde kaydedin.
Örneğin: `Masaustunuzdeki Klasor/kasim_bulteni.json`

### 5.2. Node.js Scriptini Ateşlemek
Bülten READ sisteminin arka planında bir veritabanı kuyruğu vardır. Terminal (Komut İstemi veya PowerShell) uygulamanızı açın ve uygulamanın, yani `pfai-workspace` ana dizininde olduğunuzdan emin olun. Terminale şu komutu yazarak (ve kaydedilen json yerini belirterek) enter'a basın:

```bash
node scripts/push-newsletter.js C:/Kullanicilar/DELL/Masaüstü/kasim_bulteni.json
```

**Sistemin Terminal Ekranındaki Tepkisi:**
1. Script anında dosyayı okur.
2. Konsol ekranında:
   ```
   📥 JSON başarıyla okundu. Base64 görüntü tarayıcısı devrede...
   🔄 "C:/Kullanicilar/DELL/Masaüstü/logo.png" bulundu. Base64'e çevrildi.
   🔄 "C:/Kullanicilar/DELL/Masaüstü/etkinlik.jpg" bulundu. Base64'e çevrildi.
   📤 Yükleniyor... Hedef: http://localhost:3000/api/notebook-sync
   Bülten Başlığı: "Aylık Gelişim Bülteni"
   Blok Sayısı: 14
   ✅ BAŞARILI: Bülten taslağı Bülten READ aracına gönderildi!
   ```
şeklinde mesajlarıyla size bilgi verecektir. Başarıyla sonuçlandını gördüğünüzde, tebrikler; çok zor ve saatler alan bir web-tasarım-içerik sürecini 3 saniyede tamamladınız.

---

## 6. BÖLÜM: ARAYÜZDE (BÜLTEN READ EKRANINDA) SON RÖTUŞLAR

### 6.1. Ekranı Yenilemek
Hemen tarayıcınıza dönün ve Bülten READ aracının olduğu sekmeyi (genelde `http://localhost:3000/tools/bulten-read`) açın veya zaten açıksa sayfayı **F5** ile yenileyin (Refresh).

### 6.2. Neler Olacak?
Sayfa yeniden yüklendiğinde, kendi mekanizması gereği arka planda `GET /api/notebook-sync` isteği atacaktır. Eğer bizim scriptimizin yolladığı kuyrukta bekleyen bir JSON paketi varsa, bunu fark eder. Ekrana "NotebookLM Yüklemesi Tamamlandı" mesajı (veya benzeri uyarı/loglar) çıkartarak veriyi ekrana işler ve anında o veriyi hafızasından siler (kuyruğu temizler ki sonraki sayfa yenilemede tekrar ezmesin).
Göreceksiniz ki:
*   Masaüstünüzden gönderdiğiniz/kodladığınız fotoğraflar mükemmel boyutlarda yerli yerinde.
*   Tasarımlar otomatik uygulanmış.
*   Uzun metinler paragraflara bölünmüş, butonlar yaratılmış...

### 6.3 Tasarımla Oynamak ve Canlı Revize Etmek
JSON'u yüklediniz ama bazı yerleri beğenmediniz. Hiç dert etmeyin. Bülten READ ekranındayken artık tüm bloklar (ögeler) sizin emrinizdedir:
*   **İleri Geri Taşıma**: Sol paneldeki blok listesinde blokların başındaki aşağı/yukarı oklara (▲ / ▼) basarak blokların yerini değiştirebillirsiniz. Örneğin fotoğraf grubunu etkinliğin üstüne alabilirsiniz.
*   **Düzenlemek (Edit)**: Ekranda (Kanvasta) herhangi bir bloğun üzerine tıkladığınızda sağ tarafta o bloğa ait ayarlar menüsü açılır. Metinlerde devasa AI araçları çıkacaktır.
*   **Tasarım Tema Değişikliği (Design)**: Sağ panelin "Tasarım/Design" sekmesinden (Eğer farklı tema denemek isterseniz) tek tıkla Klassik, Bold veya Minimal formatlara geçiş yapabilirsiniz. Renk paleti saniyeler içinde baştan aşağıya tekrar oluşturulacaktır. Renkleri, arka plan dokularını (patten) ve yazı tiplerini (font) tamamen keyfinize göre ayarlayabilirsiniz.

### 6.4 AI İle Bloğu Yeniden Yazdırmak
Sol-sağ paneller arasında çalışırken, paragrafları seçtiğinizde "**📝 Yeniden Yaz**", "**➕ Uzat (2-3 Katı)**", "**≡ Maddelerle Uzat**" gibi Yapay Zeka özelliklerini kullanabilirsiniz. Örneğin NotebookLM bülteni güzel kurguladı ama bir paragrafta çok akademik dil kullandı. Bloğu seçip, AI Asistan'dan o bloğu "Sıfırdan Üret" diyerek çok daha samimi bir dille, projenin heyecanını hissettirir bir şekilde tekrar yazdırabilirsiniz.

---

## 7. BÖLÜM: DIŞA AKTARIM (HTML YA DA PAYLAŞIM) VE SÜRECİN TAMAMLANMASI

Değerli projenizi/bülteninizi tamamladıktan sonra bunu paydaşlara uçurmanın vakti gelmiştir. Aracın üst panelinde işlemler çok sadedir:

**1. 📥 HTML İndir (Download HTML)**
Bülten READ sisteminin ana vaadi budur. Tek tıkla bülteniniz, masaüstünüze devasa ve eksiksiz bir `index.html` dosyası olarak iner. Bu dosyanın içi satır içi stillerle (inline-css) bezenmiştir. Bu dosyayı dilerseniz kurumanızın sunucusuna yükleyebilir, dilerseniz MailChimp, Brevo (SendinBlue) ya da Constant Contact gibi global mailing sunucularının içine "HTML İçeri Aktar" (Import HTML/Code) özelliği ile olduğu gibi yapıştırabilirsiniz. Görüntüsü, renkleri, fontları tüm telefonlarda, tabletlerde ve Outlook gibi gıcık mail istemcilerinde bozulamayacak kadar sağlamlaştırılmıştır. İçindeki Base64 çevirilmiş yerel fotoğraflarınız dahi bu HTML dosyasının içinde byte olarak yaşar. HTML kodunu attığınız herkes resmi ekstra indirmeye gerek kalmadan görecektir.

**2. 💾 Otomatik Kaydetme ve "Kayıtlı Bültenlerim" Mimarisi**
Siz çalışırken, tarayıcı arka planda `localStorage` üzerinden bülteni sürekli belleğinde kayıtlı tutar. Sekmeyi yanlışlıkla kapatırsanız endişelenmeyin! Geri geldiğinizde her şey saniyesi saniyesine bıraktığınız gibi duracaktır. Araç çubuğundaki (Menu) Kaydet / Arşivle seçenekleri, sizin bu çalışmanızı çoklu kopyalar olarak arşivleyerek aylar sonra bile kopyasını çoğaltabilmenizi sağlar.

**3. "Toplu Mail Gönder" (Bulk Send BCC)** (Deneysel)
Arayüzden hızlıca belli bir kitleye duyuru çıkmak isterseniz "Listeden Gönder" / Toplu Mail Gönder (BCC) mekanizmasını kullanabilirsiniz. Ancak büyük kitleler veya ölçümleme (kimler açtı, kimler videoya tıkladı vb.) için bir önceki maddedeki HTML İndirme ve profesyonel sistemlerde (Mailchimp vb.) oynatma tavsiye edilir. Sistemin kendi sunduğu ölçümleme araçları, "Açılış Analytics" simgesinden, eklentinin içine yerleşik olan analiz bölümünden takip edilebilir.

---

## 8. BÖLÜM: SIKÇA KARŞILAŞILAN SORULAR VE HATA ÇÖZÜMLERİ (TROUBLESHOOTING)

**Soru 1: "node scripts/push-newsletter.js bulten.json" komutunu verdim ancak "Sunucuya bağlanılamadı" veya "ECONNREFUSED" hatası alıyorum. Neden?**
*Cevap:* Yazdığınız JSON belgesinin itilebileceği bir API havuzu bulunmamaktadır. Bunun Türkçe karşılığı: Next.js yerel (lokal) sunucunuzu çalıştırmayı unutmuşsunuz. Lütfen diğer bir terminalde `npm run dev` komutunu çalıştırıp `http://localhost:3000`'in yayında olduğundan emin olunuz ve komutu tekrar deneyiniz. Server olmadan script veri yollayamaz.

**Soru 2: Sayfayı yeniledim (F5), veri çekilmedi. Hala eski bültenimi veya boş sayfayı görüyorum.**
*Cevap:* Json dosyasının API'ye iletildiğinden emin olduktan sonra; ya API içinde bir çakışma (route conflict) yaşanmıştır, ya da `bulten.json` içine yazdığınız dosya geçersiz (invalid) bir JSON yapısına sahiptir. Kurguda, tırnak eksikliği veya fazla virgül (,) varsa script API'ye itmeye çalışırken çuvallamış olabilir. JSON dosyanızı bir JSON Validator aracına veya tekrar NotebookLM'ye atıp *"Bu json'da syntax hatası var mı kontrol et"* diyebilirsiniz.

**Soru 3: Görüntüm klasörde var ama script "base64 dönüştürdü" demedi, sitede fotoğraf patladı (açılmıyor). Neden?**
*Cevap:* JSON içindeki URL bölümüne girdiğiniz klasör isminde büyük/küçük harf duyarlılığı veya desteklenmeyen format durumu olabilir. Resmin izin verilen formatlarda (JPG, JPEG, PNG, SVG, WebP) olmasını tercih ediniz ve bilgisayar klasör yolundaki (path) klasör isimlerinin Türkçe karakter barındırmamasına, Slash ( / ) işaretlerinin ters veya düzgün konumlandığına özen gösteriniz. Sistemin root (ana) dizinine atılan ve sadece `"url": "kapak.jpg"` denilen dosyalar genellikle sıfır hata ile okunur.

**Soru 4: Hazırlanan HTML Dosyasını Word'e Çevirebilir Miyim?**
*Cevap:* Bülten READ salt web formatında tasarımlar için render edilir (kutu kutu modüler tasarım). Birebir aynı grafik yapısı MS Word için her daim geçerli olmayabilir, PDF çıktılarınıza (Tarayıcıdan Yazdır > PDF olarak kaydet) güvenmeniz en mantıklı (garantili) sonucu verecektir. Gelişmiş export Doc ayarları proje hazırlayıcı ekranlar için (Builder/Strengthener) kusursuz uygulanırken, Bülten'in kendi kimliği, Responsive "akışkan" (büyüyüp küçülen) mantığa daha stabildir.

---

## SON SÖZ

Project Factory AI ekosisteminin "Bülten READ - NotebookLM Senkronizasyonu" mimarisi, yapay zeka tarafından yaratılan kuru, şekilsiz metinleri canlandıran bir Köprü'dür. Bir yanda Avrupa Birliği kurullarını, ulusal hibe şartnamelerini harfi harfine bilen, kaynak tarayabilen NotebookLM... Diğer tarafta ise modern kod standartlarına (HTML/CSS Base64 Encoding) sahip modüler web-tasarım motoru. Aralarındaki bu JSON diyaloğu ve Push Scripti sağlandığında, aslında eskiden günlerce süren raporlamalar birkaç saniyelik komut satırı enter tuşuna indirgenmiş olmaktadır. Ekibinizin iletişim ve raporlama kapasitesinin bir üst lige evrilmesini sağlayacak bu aracı dilediğiniz gibi kullanmakta özgürsünüz.

*Elinize, Emeğinize ve Kodunuza Sağlık.*

---
*(Kılavuz Sonu - Sürüm Ekim-26)*
