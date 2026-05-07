const fs = require('fs');

const content = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Bülten Read & NotebookLM Kullanma Kılavuzu</title>
<style>
body{font-family:Arial,sans-serif;max-width:820px;margin:30px auto;padding:20px 30px;line-height:1.8;color:#222}
h1{color:#1a237e;border-bottom:3px solid #3949ab;padding-bottom:10px;font-size:1.9em}
h2{color:#283593;border-left:4px solid #3949ab;padding-left:12px;margin-top:40px;font-size:1.3em}
h3{color:#3f51b5;margin-top:25px;font-size:1.1em}
table{width:100%;border-collapse:collapse;margin:18px 0;font-size:.95em}
th{background:#3949ab;color:white;padding:9px 12px;text-align:left}
td{padding:8px 12px;border:1px solid #ddd}
tr:nth-child(even){background:#f5f7ff}
code{background:#f0f4ff;border:1px solid #c5cae9;border-radius:3px;padding:2px 6px;font-size:.88em;font-family:monospace}
pre{background:#f0f4ff;border:1px solid #c5cae9;border-radius:5px;padding:15px;overflow-x:auto;font-size:.88em;line-height:1.6;font-family:monospace}
ul,ol{padding-left:22px}li{margin:6px 0}
hr{border:none;border-top:2px solid #e8eaf6;margin:35px 0}
.tip{background:#e8f5e9;border-left:4px solid #4caf50;padding:12px 16px;margin:15px 0;border-radius:0 4px 4px 0}
.warn{background:#fff3e0;border-left:4px solid #ff9800;padding:12px 16px;margin:12px 0;border-radius:0 4px 4px 0}
.header-box{background:linear-gradient(135deg,#1a237e,#3949ab);color:white;padding:28px;border-radius:10px;margin-bottom:35px}
.header-box h1{color:white;border-bottom:2px solid rgba(255,255,255,.3);font-size:1.7em}
.header-box p{color:rgba(255,255,255,.85);margin:5px 0}
.flow-box{text-align:center;background:#e8eaf6;border-radius:8px;padding:22px;margin:20px 0;font-family:monospace;line-height:2.2;font-size:1em}
.footer{color:#888;font-style:italic;text-align:center;margin-top:50px;padding-top:20px;border-top:1px solid #eee;font-size:.9em}
</style>
</head>
<body>

<div class="header-box">
  <h1>Bülten Read &amp; Google NotebookLM<br>Entegrasyonu &mdash; Kullanma Kılavuzu</h1>
  <p><strong>Project Factory AI | Bülten Read Platformu</strong></p>
  <p>Sürüm 1.0 | Mart 2026</p>
</div>

<h2>Önsöz</h2>
<p>Bu kılavuz, iki güçlü aracı bir araya getirerek bülten üretim sürecinizi nasıl dönüştürebileceğinizi adım adım açıklamaktadır: <strong>Bülten Read</strong> (Project Factory AI'nin bülten oluşturma platformu) ve <strong>Google NotebookLM</strong> (Google'ın yapay zeka destekli not ve içerik analiz aracı).</p>
<p>Her iki araç da tek başına güçlüdür. Ancak bir arada kullanıldığında, saatlerce süren içerik hazırlama sürecinizi dakikalara indirmenize, proje belgelerinizden otomatik bülten taslakları oluşturmanıza ve profesyonel görünümlü bültenleri tek tıkla yayımlamanıza olanak tanır.</p>
<p><strong>Bu kılavuzu okuduktan sonra şunları yapabileceksiniz:</strong></p>
<ul>
  <li>Google NotebookLM'deki proje belgelerinizden bülten içeriği üretmek</li>
  <li>Üretilen içeriği Bülten Read'e otomatik olarak aktarmak</li>
  <li>Bültenlerinizi HTML, PDF veya e-posta olarak paylaşmak</li>
  <li>Bülten arşivi oluşturmak ve içerik döngüsü kurmak</li>
  <li>Google Drive'daki medya dosyalarını bültenlerinize eklemek</li>
</ul>

<hr>

<h2>Bölüm 1: Araçlara Giriş</h2>

<h3>1.1 Bülten Read Nedir?</h3>
<p>Bülten Read, Project Factory AI platformunun bir parçası olarak geliştirilmiş, özellikle Erasmus+ ve diğer AB projeleri yürüten kuruluşlar için tasarlanmış bir dijital bülten oluşturma aracıdır.</p>
<ul>
  <li><strong>Blok editörü:</strong> Başlık, paragraf, fotoğraf, video, etkinlik, anket, bağlantı bloklarıyla içerik oluşturun.</li>
  <li><strong>Çoklu tema:</strong> modern, classic, bold ve minimal temalar.</li>
  <li><strong>İki dilli:</strong> TR/EN dil desteği.</li>
  <li><strong>AI ile üretim:</strong> "AI ile Üret" butonu ile bloklarınızı genişletin veya yeniden yazın.</li>
  <li><strong>Dışa aktarma:</strong> HTML, PDF veya e-posta ile paylaşım.</li>
  <li><strong>Otomatik kayıt:</strong> Tarayıcı localStorage'ına otomatik taslak kaydı.</li>
  <li><strong>Text-to-Speech:</strong> "Dinle" butonu ile bülteninizi sesli okutun.</li>
  <li><strong>NotebookLM entegrasyonu:</strong> JSON verilerini bülten kanvasına otomatik yükleyin.</li>
</ul>

<h3>1.2 Google NotebookLM Nedir?</h3>
<p>Google NotebookLM (notebooklm.google.com), yüklediğiniz belgeleri analiz eden ve bu belgeler üzerinden sorularınıza yanıt veren yapay zeka destekli bir araştırma platformudur.</p>
<ul>
  <li><strong>Belge yükleme:</strong> PDF, Word, Google Doc, web sayfası, YouTube videosu</li>
  <li><strong>Yapay zeka sohbeti:</strong> Belgeler üzerinden soru-cevap, özetleme, içerik üretimi</li>
  <li><strong>Podcast oluşturma:</strong> Belgelerinizden otomatik sesli özet</li>
  <li><strong>Ekip paylaşımı:</strong> Not defterlerini ekibinizle paylaşın</li>
</ul>

<h3>1.3 Neden Birlikte Kullanılmalı?</h3>
<table>
  <tr><th>Eski Yöntem</th><th>Yeni Yöntem</th></tr>
  <tr><td>Belgeleri tek tek okuyun (30 dk)</td><td>NotebookLM'e yükleyin &rarr; AI özetlesin (5 dk)</td></tr>
  <tr><td>İçeriği elle yazın (45 dk)</td><td>JSON formatında içerik üretin (2 dk)</td></tr>
  <tr><td>Bülten tasarımını elle oluşturun (20 dk)</td><td>send-notebook.js &rarr; otomatik yükleme (30 sn)</td></tr>
  <tr><td>PDF/HTML dışa aktarın (5 dk)</td><td>Bülten Read'de tek tıkla (1 dk)</td></tr>
  <tr><td><strong>Toplam: ~100 dakika</strong></td><td><strong>Toplam: ~10 dakika</strong></td></tr>
</table>

<hr>

<h2>Bölüm 2: Teknik Altyapı</h2>

<h3>2.1 Entegrasyon Nasıl Çalışır?</h3>
<p>Sistem üç bileşenden oluşur:</p>
<ol>
  <li><strong>API Endpoint (<code>/api/notebook-sync</code>):</strong> JSON verilerini geçici bellekte saklayan veri alım noktası. Her yeni POST isteğiyle eski veri güncellenir.</li>
  <li><strong><code>send-notebook.js</code> Scripti:</strong> NotebookLM JSON içeriğini API endpoint'e ileten köprü. İçindeki <code>payload</code> nesnesini değiştirmeniz yeterlidir.</li>
  <li><strong>Bülten Read Ön Yüzü:</strong> Sayfa yüklenirken API'den veriyi otomatik alır ve bülten kanvasına uygular.</li>
</ol>

<div class="flow-box">
  Google NotebookLM &rarr; JSON İçerik Üretimi<br>
  &darr;<br>
  <code>send-notebook.js</code> (node send-notebook.js)<br>
  &darr;<br>
  POST &rarr; /api/notebook-sync<br>
  &darr;<br>
  Bülten Read sayfasını Ctrl+F5 ile yenile<br>
  &darr;<br>
  &#9989; Bülten otomatik yüklenir!
</div>

<h3>2.2 Sistem Gereksinimleri</h3>
<ul>
  <li><strong>Node.js:</strong> Versiyon 18 veya üzeri (yerleşik fetch API desteği)</li>
  <li><strong>npm run dev:</strong> Next.js geliştirme sunucusu çalışır durumda</li>
  <li><strong>Tarayıcı:</strong> Chrome, Edge veya Firefox</li>
  <li><strong>Google Hesabı:</strong> NotebookLM erişimi için</li>
</ul>

<hr>

<h2>Bölüm 3: Adım Adım Kullanım Kılavuzu</h2>

<h3>3.1 Yönerge A: NotebookLM'den Bülten Oluşturma (Ana İş Akışı)</h3>

<p><strong>Adım 1: NotebookLM'de not defteri hazırlama</strong></p>
<ol>
  <li><a href="https://notebooklm.google.com">https://notebooklm.google.com</a> adresine gidin.</li>
  <li><strong>"+ Yeni Not Defteri"</strong> butonuna tıklayın.</li>
  <li>Not defterine anlamlı bir ad verin (örn: "Erasmus+ DigiLearn - Mayıs Bülteni").</li>
  <li><strong>"Kaynak ekle"</strong> ile proje belgelerinizi yükleyin: PDF raporu, toplantı notları, proje URL'si.</li>
</ol>

<p><strong>Adım 2: Bülten içeriği üretme — Sohbet kutusuna şu prompt şablonunu yapıştırın:</strong></p>
<pre>Bu not defterindeki belgelerden yola çıkarak,
aşağıdaki JSON formatında bir Türkçe proje bülteni içeriği oluştur.
Sadece JSON döndür, başka açıklama ekleme:

{
  "title": "...",
  "subtitle": "...",
  "design": "modern",
  "logoUrl": "",
  "headerImgUrl": "",
  "blocks": [
    { "id":"b1", "type":"title", "data": {"text":"...","size":"h1"} },
    { "id":"b2", "type":"paragraph", "data": {"text":"..."} },
    { "id":"b3", "type":"title", "data": {"text":"...","size":"h2"} },
    { "id":"b4", "type":"paragraph", "data": {"text":"..."} },
    { "id":"b5", "type":"event", "data": {"title":"...","date":"2026-05-01","time":"10:00","location":"..."} },
    { "id":"b6", "type":"paragraph", "data": {"text":"..."} }
  ]
}

Konu: [bülten konunuzu buraya yazın]
Dil: Türkçe, Ton: Resmi ama sıcak</pre>

<p><strong>Adım 3:</strong> NotebookLM yanıt ürettikten sonra JSON bloğunu tümüyle kopyalayın (Ctrl+C).</p>

<p><strong>Adım 4:</strong> <code>send-notebook.js</code> dosyasındaki <code>const payload = { ... }</code> bölümünü kopyaladığınız JSON ile değiştirin.</p>

<p><strong>Adım 5: Scripti çalıştırın:</strong></p>
<pre>node send-notebook.js</pre>
<p>Çıktıda <code>✅ Bülten başarıyla gönderildi! (HTTP 200)</code> mesajını görmelisiniz.</p>

<p><strong>Adım 6:</strong> <a href="http://localhost:3000/tools/bulten-read">http://localhost:3000/tools/bulten-read</a> adresini açıp <strong>Ctrl+F5</strong> ile yenileyin. Bülteniniz otomatik yüklenir!</p>

<hr>

<h3>3.2 Yönerge B: Bülten'den NotebookLM'e İçerik Aktarma</h3>
<p>Hazırladığınız bülteni NotebookLM'e kaynak olarak ekleyerek AI'nın analiz etmesini sağlayabilirsiniz.</p>
<ol>
  <li>Bülten Read'de üst araç çubuğundaki <strong>"PDF"</strong> butonuyla bülteninizi indirin.</li>
  <li>NotebookLM'de <strong>"Kaynak ekle"</strong> &rarr; <strong>"Dosya yükle"</strong> ile PDF'i yükleyin.</li>
  <li>Şu tür sorular sorun:
    <ul>
      <li>"Bu bültenden bir podcast özeti oluştur"</li>
      <li>"Bir sonraki bülten için içerik önerileri sun"</li>
      <li>"Sonraki ayın bültenini aynı tonda oluştur"</li>
      <li>"Bu bültende eksik olan konular neler?"</li>
    </ul>
  </li>
</ol>

<hr>

<h3>3.3 Yönerge C: Google Drive Medyalarını Bültene Ekleme</h3>
<ol>
  <li>Drive'da görseli sağ tıklayın &rarr; <strong>"Paylaş"</strong> &rarr; <strong>"Bağlantıyı kopyala"</strong>. "Bağlantıya sahip herkes görüntüleyebilir" seçeneğini etkinleştirin.</li>
  <li>Kopyalanan linkten <code>FILE_ID</code>'yi not edin:<br>
    <code>https://drive.google.com/file/d/<strong>FILE_ID</strong>/view?usp=sharing</code>
  </li>
  <li>Görsel URL'ini şu formata çevirin:<br>
    <code>https://drive.google.com/uc?export=view&amp;id=FILE_ID</code>
  </li>
  <li>send-notebook.js payload'una şu bloğu ekleyin:</li>
</ol>
<pre>{ "id":"img1", "type":"photos", "data": {
  "url": "https://drive.google.com/uc?export=view&id=FILE_ID",
  "caption": "Proje toplantısı fotoğrafı"
} }</pre>

<hr>

<h2>Bölüm 4: Blok Türleri Referans Kılavuzu</h2>
<table>
  <tr><th>Blok Türü</th><th>type değeri</th><th>Açıklama</th></tr>
  <tr><td>Başlık</td><td><code>title</code></td><td>Ana başlık, bölüm başlığı — size: h1/h2/h3</td></tr>
  <tr><td>Paragraf</td><td><code>paragraph</code></td><td>Metin içeriği; \\n\\n ile satır atlanır</td></tr>
  <tr><td>Fotoğraf</td><td><code>photos</code></td><td>Görsel URL + açıklama metni</td></tr>
  <tr><td>Etkinlik</td><td><code>event</code></td><td>Tarih, saat ve yer bilgili etkinlik kartı</td></tr>
  <tr><td>Video</td><td><code>video</code></td><td>YouTube/Vimeo gömme</td></tr>
  <tr><td>Ayırıcı</td><td><code>separator</code></td><td>Bölümler arası yatay çizgi</td></tr>
  <tr><td>Bağlantı</td><td><code>link</code></td><td>Tıklanabilir URL butonu</td></tr>
</table>

<p><strong>Tasarım Seçenekleri (<code>"design"</code> alanı):</strong></p>
<ul>
  <li><code>"modern"</code> &mdash; Temiz ve minimal</li>
  <li><code>"classic"</code> &mdash; Geleneksel bülten görünümü</li>
  <li><code>"bold"</code> &mdash; Güçlü tipografi, canlı renkler</li>
  <li><code>"minimal"</code> &mdash; Sade, içerik odaklı</li>
</ul>

<hr>

<h2>Bölüm 5: İleri Düzey Kullanım Senaryoları</h2>

<h3>5.1 Aylık Bülten Serisi</h3>
<ol>
  <li>Her proje için ayrı bir NotebookLM not defteri açın; içine proje planını ve raporları yükleyin.</li>
  <li>Her ay yeni belgeler ekleyip ilgili prompt'u çalıştırın.</li>
  <li>Her bülteni PDF olarak Drive'da "Bülten Arşivi" klasöründe saklayın.</li>
  <li>Bülten Read'in Analiz bölümünden açılma oranlarını takip edin.</li>
</ol>

<h3>5.2 Çok Ortaklı Projeler için Bülten</h3>
<ol>
  <li>Her ortaktan aylık güncelleme raporu talep edin (Word veya PDF).</li>
  <li>Tüm raporları <strong>tek bir</strong> NotebookLM not defterine yükleyin.</li>
  <li>Prompt: <em>"Her ortağın katkısını özetleyerek çok ortaklı bir bülten oluştur. Her ortak için ayrı paragraf bloğu kullan."</em></li>
  <li>JSON'u send-notebook.js'e yapıştırıp bülteni otomatik oluşturun.</li>
</ol>

<h3>5.3 NotebookLM Podcast'ini Bültene Ekleme</h3>
<ol>
  <li>Not Defterinde <strong>"Ses Genel Bakışı"</strong> ile podcast üretin; indirin.</li>
  <li>Drive'a yükleyin ve paylaşılabilir link alın.</li>
  <li>Bülten Read'de <strong>Video bloğu</strong> ekleyin ve Drive linkini yapıştırın.</li>
</ol>

<h3>5.4 Haber Bülteni / Basın Açıklaması Formatı</h3>
<pre>Bu belgelerden yola çıkarak, AB projesi basın bülteni formatında JSON oluştur.
Şu yapıyı kullan:
- b1: Haber başlığı (h1)
- b2: Haber girişi (5W1H: kim, ne, nerede, ne zaman, neden, nasıl)
- b3: "Proje Koordinatörünün Görüşü" (h2)
- b4: Koordinatörün sözleri (paragraf)
- b5: "Proje Hakkında" (h2)
- b6: Projeyi tanıtan 2 paragraflık metin
- b7: İletişim bilgileri
Dil: Türkçe, ton: resmi basın bülteni</pre>

<hr>

<h2>Bölüm 6: Sık Sorulan Sorular (SSS)</h2>

<div class="warn"><strong>S: "Connection refused" hatası alıyorum?</strong><br>
C: <code>npm run dev</code> ile sunucunun çalıştığından emin olun. <code>http://localhost:3000</code> adresi açılıyorsa hazır demektir.</div>

<div class="warn"><strong>S: NotebookLM JSON üretmiyor, düz metin veriyor?</strong><br>
C: Promptunuza şunu ekleyin: <em>"Yanıtını yalnızca JSON formatında ver. Başında veya sonunda herhangi bir açıklama, başlık veya kod bloğu işaretleyicisi ekleme."</em></div>

<div class="warn"><strong>S: Türkçe karakterler (ş, ğ, ü vb.) bozuk görünüyor?</strong><br>
C: <code>send-notebook.ps1</code> yerine <code>send-notebook.js</code> kullanın. Node.js UTF-8'i varsayılan olarak doğru işler.</div>

<div class="warn"><strong>S: Bülten yenilediğimde eski içerik gelmeye devam ediyor?</strong><br>
C: Tarayıcı konsolunda (F12 &rarr; Console) şunu çalıştırın:<br>
<code>localStorage.removeItem('bulten_draft_v1'); location.reload();</code></div>

<div class="warn"><strong>S: Drive'dan görsel ekleyince yüklenmiyor?</strong><br>
C: Görsel "Herkese açık" paylaşılmış olmalı. URL formatı doğrudan görsel linki olmalı: <code>https://drive.google.com/uc?export=view&amp;id=FILE_ID</code></div>

<div class="warn"><strong>S: Her bülten için farklı tema kullanabilir miyim?</strong><br>
C: Evet! payload'daki <code>"design"</code> alanını değiştirin: modern, classic, bold veya minimal.</div>

<hr>

<h2>Bölüm 7: İpuçları ve En İyi Uygulamalar</h2>

<h3>NotebookLM'de Daha İyi Sonuç Almak</h3>
<ul>
  <li>Dijital (taranmış değil) PDF'ler kullanın; AI daha doğru sonuç üretir.</li>
  <li>Farklı kaynak türlerini bir arada kullanın: rapor + toplantı notu + sunum.</li>
  <li>Spesifik promptlar yazın; "bülten oluştur" yerine dönem ve konuyu belirtin.</li>
  <li>Kaç blok istediğinizi promptta net olarak belirtin.</li>
</ul>

<h3>Bülten Read'de Daha İyi Görünüm</h3>
<ul>
  <li>Her bültene en az bir görsel ekleyin. Ücretsiz kaynak: <a href="https://unsplash.com">unsplash.com</a></li>
  <li>H1 &rarr; Ana başlık, H2 &rarr; Alt bölüm, H3 &rarr; Detay başlığı hiyerarşisini koruyun.</li>
  <li>Tarih ve yer içeren bilgiler için Etkinlik bloğu kullanın; çok daha etkileyici görünür.</li>
  <li>Uzun bültenlerde bölümler arasına Separator bloğu ekleyin.</li>
</ul>

<h3>Güvenlik ve Gizlilik</h3>
<div class="tip">
  <code>send-notebook.js</code> yalnızca yerel ağınızda (localhost) çalışır; internete açık sunucuda kullanmadan önce kimlik doğrulama ekleyin. API endpoint, in-memory veri saklar; sunucu yeniden başlatıldığında veriler sıfırlanır. Üretim ortamında veritabanı kullanın. Drive'daki belgeleri "Herkese açık" yapmadan önce hassas bilgiler içerip içermediğini kontrol edin.
</div>

<hr>

<h2>Bölüm 8: Hızlı Başvuru Kartı</h2>
<table>
  <tr><th>İşlem</th><th>Komut / Yöntem</th></tr>
  <tr><td>Sunucuyu başlat</td><td><code>npm run dev</code></td></tr>
  <tr><td>Payload gönder</td><td><code>node send-notebook.js</code></td></tr>
  <tr><td>Önbellek temizle</td><td><code>localStorage.removeItem('bulten_draft_v1'); location.reload();</code></td></tr>
  <tr><td>HTML dışa aktar</td><td>Bülten Read &rarr; Üst araç &rarr; HTML</td></tr>
  <tr><td>PDF dışa aktar</td><td>Bülten Read &rarr; Üst araç &rarr; PDF</td></tr>
  <tr><td>Drive görsel URL</td><td><code>https://drive.google.com/uc?export=view&amp;id=FILE_ID</code></td></tr>
  <tr><td>Tema değiştir</td><td>payload'da <code>"design": "modern|classic|bold|minimal"</code></td></tr>
  <tr><td>Yeni not defteri aç</td><td><a href="https://notebooklm.google.com">notebooklm.google.com</a> &rarr; + Yeni Not Defteri</td></tr>
</table>

<hr>

<h2>Sonuç</h2>
<p>Bülten Read ve Google NotebookLM entegrasyonu, proje iletişimini bir iş yükünden akıcı bir iş akışına dönüştürür. Proje belgeleriniz artık yalnızca birer arşiv belgesi değil; birer içerik kaynağıdır. NotebookLM bu kaynakları analiz eder ve yapılandırılmış içerik üretir; Bülten Read ise bu içeriği güzel, profesyonel ve paylaşılabilir bir bültene dönüştürür.</p>
<p>Bu iş akışını bir kez kurduğunuzda, her yeni proje güncellemesi için hatırlatmanız gereken yalnızca iki komut vardır:</p>
<pre>node send-notebook.js          # İçeriği gönder
Ctrl+F5                        # Bülteni yenile</pre>
<p>Sorularınız ve geri bildirimleriniz için Project Factory AI destek ekibine ulaşabilirsiniz.</p>

<div class="footer">
  Bu kılavuz Project Factory AI tarafından hazırlanmıştır &bull; Bülten Read v1.0 &bull; Mart 2026
</div>
</body>
</html>`;

fs.writeFileSync(
  'C:/Users/DELL/Desktop/Project Factory AI Workspace/pfai-workspace/public/Bulten_NotebookLM_Kilavuzu.html',
  content,
  'utf8'
);
console.log('HTML kilavuz hazir!');
