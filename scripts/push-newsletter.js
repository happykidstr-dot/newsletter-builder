const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] && process.argv[2].startsWith('http') 
  ? process.argv[2] 
  : 'http://localhost:3000/api/notebook-sync';

const filePath = process.argv[2] && !process.argv[2].startsWith('http') 
  ? process.argv[2] 
  : process.argv[3];

if (!filePath) {
  console.log('Kullanım: node push-newsletter.js [http://localhost:3000/api/notebook-sync] <hedef_json_dosyasi>');
  console.log('Örnek: node push-newsletter.js my-notebook-newsletter.json');
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), filePath);

if (!fs.existsSync(fullPath)) {
  console.error(`Hata: Dosya bulunamadı -> ${fullPath}`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(fullPath, 'utf8');
  const payload = JSON.parse(content);

  function encodeLocalImage(imagePath) {
    if (!imagePath || imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    try {
      const fullImgPath = path.resolve(process.cwd(), imagePath);
      if (fs.existsSync(fullImgPath)) {
        const ext = path.extname(fullImgPath).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
        const base64 = fs.readFileSync(fullImgPath).toString('base64');
        return `data:image/${mime};base64,${base64}`;
      }
    } catch(e) {}
    return imagePath;
  }

  if (payload.logoUrl) payload.logoUrl = encodeLocalImage(payload.logoUrl);
  if (payload.headerImgUrl) payload.headerImgUrl = encodeLocalImage(payload.headerImgUrl);
  if (payload.blocks) {
    payload.blocks.forEach(b => {
      if (!b.data) return;
      if (b.data.url) b.data.url = encodeLocalImage(b.data.url);
      if (b.data.avatar) b.data.avatar = encodeLocalImage(b.data.avatar);
      for (let i=1; i<=5; i++) { // grids up to 5
         if (b.data[`url${i}`]) b.data[`url${i}`] = encodeLocalImage(b.data[`url${i}`]);
      }
    });
  }

  console.log(`📤 Yükleniyor... Hedef: ${targetUrl}`);
  console.log(`Bülten Başlığı: "${payload.title || 'İsimsiz'}"`);
  console.log(`Blok Sayısı: ${payload.blocks?.length || 0}`);

  fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        console.log('✅ BAŞARILI: Bülten taslağı Bülten READ aracına gönderildi!');
        console.log('Hemen http://localhost:3000 adresini açarak bülteninizi görüntüleyebilirsiniz.');
      } else {
        console.error('❌ HATA:', data.error || data);
      }
    })
    .catch(err => {
      console.error('❌ SUNUCUYA BAĞLANILAMADI:', err.message);
      console.log('Node.js veya Next.js sunucusunun (npm run dev) çalıştığından emin olun.');
    });

} catch (err) {
  console.error('JSON okuma hatası:', err.message);
}
