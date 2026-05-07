// send-notebook.js — Notebook LM çıktısı (Writing Kit: Modül 1)
const payload = {
  "title": "Writing Kit: Modül 1",
  "subtitle": "Kutucuk Doldurma Alışkanlığından Çıkıp Omurga Kurmak",
  "design": "modern",
  "logoUrl": "",
  "headerImgUrl": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=640&q=80",
  "blocks": [
    { "id":"b1", "type":"title", "data": {"text":"Projenin İlk Paragrafı Nasıl Kurulur?","size":"h1"} },
    { "id":"b2", "type":"paragraph", "data": {"text":"Birçok başvuru kötü yazıldığı için değil, 'mantık zinciri kurulmadığı' için zayıf kalır. Hedef, ilk paragrafta 'biz iyi bir şey yapacağız' demek değil; hangi boşluğu, kimde, hangi gerekçeyle ve hangi değişim iddiasıyla kapattığını gösterebilmektir."} },
    { "id":"b3", "type":"title", "data": {"text":"4 Temel İşaret: İkna Sırası","size":"h2"} },
    { "id":"b4", "type":"paragraph", "data": {"text":"Değerlendirici için ilk paragrafta şu dört işaret üretilmelidir: problem, hedef grup, aciliyet (neden şimdi) ve değişim. Bunlar bir araya gelmeden yazılan her cümle doğru ama genel kalır."} },
    { "id":"b5", "type":"event", "data": {"title":"Modül 1: Dönüşüm Odaklı Giriş Taslağı Uygulaması","date":"2026-05-01","time":"10:00","location":"Online / Template Lab"} },
    { "id":"b6", "type":"paragraph", "data": {"text":"Şablondaki dört satırı doldur ve tek paragrafta birleştir. İlk paragrafın görevi 'giriş yapmak' değil; metnin geri kalanını taşıyacak bir omurga kurmaktır."} }
  ]
};

const API_URL = "http://localhost:3000/api/notebook-sync";

async function sendPayload() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log("✅ Bülten başarıyla gönderildi! (HTTP", res.status + ")");
      console.log("   → http://localhost:3000/tools/bulten-read sayfasını yenileyin.");
    } else {
      console.error("❌ Hata: HTTP", res.status, await res.text());
    }
  } catch (err) {
    console.error("❌ Bağlantı hatası:", err.message);
  }
}

sendPayload();
