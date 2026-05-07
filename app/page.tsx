'use client';
import React, { useState, useCallback } from 'react';
// Note: Clerk auth is handled in layout.tsx - these are placeholder no-ops for SSR safety
const SignInButton = null as any;
const UserButton = null as any;
import dynamic from 'next/dynamic';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
const BultenLocationMap = dynamic(() => import('@/components/BultenLocationMap'), { ssr: false, loading: () => <div style={{height:340,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8'}}>Harita yükleniyor...</div> });

// ── i18n ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'tr';
const T = {
  en: {
    addContent:'Add content', chooseDesign:'Choose design', publish:'☁ Publish', published:'✓ Published',
    download:'📥 Download HTML', addLogo:'📷 Add your logo', logoPlaceholder:'Logo URL...',
    toc:'Table of Contents', blocks:'Blocks', edit:'Edit', moveUp:'▲ Up', moveDown:'▼ Down',
    bgTab:'🖼 BG', colorTab:'🎨 Colors', fontTab:'✏ Fonts',
    designLabel:'Design', allBg:'All Backgrounds', customUrl:'Custom URL',
    noBlocks:'Add content from the left panel',
    // block types
    title:'Title', paragraph:'Paragraph', photos:'Photos', video:'Video',
    event:'Event', separator:'Separator', link:'Link', button:'Button', poll:'Poll', attachment:'Attachment',
    // editors
    titleText:'Title Text', size:'Size', h1:'H1 — Large', h2:'H2 — Medium', h3:'H3 — Small',
    text:'Text', chars:'characters', imageUrl:'Image URL', caption:'Caption',
    youtubeUrl:'YouTube URL', eventName:'Event Name', date:'Date', time:'Time', location:'Location',
    lineStyle:'Line Style', solid:'Solid', dashed:'Dashed', dotted:'Dotted',
    linkText:'Link Text', url:'URL', buttonText:'Button Text', align:'Alignment',
    left:'Left', center:'Center', right:'Right',
    question:'Question', option:'Option', fileName:'File Name',
    aiBtn:'✨ Generate with AI', aiLoading:'⏳ Generating...',
    footer:'This newsletter was created with Project Factory AI.',
  },
  tr: {
    addContent:'İçerik Ekle', chooseDesign:'Tasarım Seç', publish:'☁ Yayınla', published:'✓ Yayında',
    download:'📥 HTML İndir', addLogo:'📷 Logo Ekle', logoPlaceholder:'Logo URL giriniz...',
    toc:'İçindekiler', blocks:'Bloklar', edit:'Düzenle', moveUp:'▲ Yukarı', moveDown:'▼ Aşağı',
    bgTab:'🖼 Arka Plan', colorTab:'🎨 Renk', fontTab:'✏ Yazı',
    designLabel:'Tasarım', allBg:'Tüm Arka Planlar', customUrl:'Özel URL',
    noBlocks:'Sol panelden içerik ekleyin',
    // block types
    title:'Başlık', paragraph:'Metin', photos:'Görsel', video:'Video',
    event:'Etkinlik', separator:'Ayırıcı', link:'Bağlantı', button:'Buton', poll:'Anket', attachment:'Ek Dosya',
    // editors
    titleText:'Başlık Metni', size:'Boyut', h1:'H1 — Büyük', h2:'H2 — Orta', h3:'H3 — Küçük',
    text:'Metin', chars:'karakter', imageUrl:'Görsel URL', caption:'Alt Yazı',
    youtubeUrl:'YouTube URL', eventName:'Etkinlik Adı', date:'Tarih', time:'Saat', location:'Yer',
    lineStyle:'Çizgi Stili', solid:'Düz', dashed:'Kesik', dotted:'Noktalı',
    linkText:'Bağlantı Metni', url:'URL', buttonText:'Buton Metni', align:'Hizalama',
    left:'Sol', center:'Orta', right:'Sağ',
    question:'Soru', option:'Seçenek', fileName:'Dosya Adı',
    aiBtn:'✨ AI ile İçerik Üret', aiLoading:'⏳ Üretiliyor...',
    footer:'Bu bülten Project Factory AI ile oluşturulmuştur.',
  },
};

// ── Types ──────────────────────────────────────────────────────────────
type BT = 'title'|'paragraph'|'photos'|'video'|'event'|'separator'|'link'|'button'|'poll'|'attachment'|'textphoto'|'photogrid'|'author'|'form'|'googleform';

interface Block { id: string; type: BT; data: Record<string,string> }

type Design = 'modern'|'classic'|'bold'|'minimal';

interface DesignConfig {
  label: string;
  headerBg: string; headerColor: string;
  accentColor: string; bodyBg: string; textColor: string;
  font: string;
}

// ── 10 Pre-designed Templates ──────────────────────────────────────────
const NEWSLETTER_TEMPLATES = [
  {
    id: 'tpl_school', title: 'Okul Haftalık Bülteni', subtitle: 'Mart Ayı 3. Hafta Gelişmeleri', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Bu Hafta Okulumuzda Neler Oldu?',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Değerli velilerimiz ve öğrencilerimiz,\n\nBu hafta bilim fuarımızda öğrencilerimizin ürettiği harika projeleri inceleme fırsatı bulduk...'} },
      { id:'b3', type:'photos' as BT, data:{url:'https://images.unsplash.com/photo-1511629091441-ee46146481b6?w=640&q=80',caption:'Bilim fuarından kareler'} },
      { id:'b4', type:'event' as BT, data:{title:'Veli Toplantısı',date:'2026-03-28',time:'13:00',location:'Konferans Salonu'} },
      { id:'b5', type:'button' as BT, data:{text:'Not Çizelgesini İndir',url:'#'} }
    ]
  },
  {
    id: 'tpl_event', title: 'Bahar Şenliği Davetiyesi', subtitle: 'Hepinizi bekliyoruz!', design: 'bold' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1487530811015-780c80ce0e68?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Geleneksel Bahar Şenliği',size:'h1'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Müzik, dans, yemek ve eğlenceye hazır mısınız? Bu yıl baharı harika bir festivalle karşılıyoruz.'} },
      { id:'b3', type:'event' as BT, data:{title:'Bahar Festivali 2026',date:'2026-05-15',time:'10:00 - 22:00',location:'Merkez Kampüs Etkinlik Alanı'} },
      { id:'b4', type:'googleform' as BT, data:{url:'',height:'400'} },
      { id:'b5', type:'button' as BT, data:{text:'LCV Lütfen (Buraya Tıklayın)',url:'#'} }
    ]
  },
  {
    id: 'tpl_hr', title: 'İnsan Kaynakları Duyurusu', subtitle: 'Yeni Ekip Arkadaşları ve Güncellemeler', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Aramıza Hoş Geldiniz!',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Bu ay pazarlama ekibimize katılan yeni çalışma arkadaşlarımızı tebrik ederiz.'} },
      { id:'b3', type:'separator' as BT, data:{style:'dashed'} },
      { id:'b4', type:'title' as BT, data:{text:'Yeni Yemek Kartı Sistemi',size:'h3'} },
      { id:'b5', type:'paragraph' as BT, data:{text:'Önümüzdeki aydan itibaren yemek kartı alt yapımız değişiyor. Detaylı bilgi ekte yer almaktadır.'} },
      { id:'b6', type:'attachment' as BT, data:{fileName:'Yemek_Sistemi_Rehberi.pdf',url:'#'} }
    ]
  },
  {
    id: 'tpl_launch', title: 'Yeni Ürün Lansmanı', subtitle: 'Project Factory v2.0 Yayında', design: 'minimal' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Geleceğin Platformuyla Tanışın',size:'h1'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Aylardır üzerinde çalıştığımız yeni özellikler ve tamamen yenilenen arayüzümüzle kullanıma hazırız.'} },
      { id:'b3', type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} },
      { id:'b4', type:'title' as BT, data:{text:'Neler Yeni?',size:'h3'} },
      { id:'b5', type:'paragraph' as BT, data:{text:'• Gelişmiş AI Asistanı\n• Toplu PDF dışa aktarımı\n• Yenilenmiş Analitik Paneli'} },
      { id:'b6', type:'button' as BT, data:{text:'Hemen Deneyin',url:'#'} }
    ]
  },
  {
    id: 'tpl_monthly', title: 'Aylık Şirket Özeti', subtitle: 'Nisan 2026 Performansımız', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1554200876-56c2f25224fa?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Finansal Hedeflere Ulaştık!',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Bu ay %15 büyüme kaydederek çeyrek hedeflerimizi aştık. Tüm ekibe teşekkürler!'} },
      { id:'b3', type:'photos' as BT, data:{url:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&q=80',caption:'Büyüme Grafiğimiz'} },
      { id:'b4', type:'poll' as BT, data:{question:'Gelecek ayki ofis partisi nerede olsun?',opt1:'Teras Kat',opt2:'Bahçe',opt3:'Dışarıda Bir Mekan'} }
    ]
  },
  {
    id: 'tpl_parents', title: 'Veli Bilgilendirme', subtitle: 'Dönem Sonu Notları ve Uyarılar', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Dönem Sonu Yaklaşıyor',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Öğrencilerimizin sınav haftası önümüzdeki pazartesi başlıyor. Velilerimizin bu zorlu haftada onlara destek olmasını rica ediyoruz.'} },
      { id:'b3', type:'separator' as BT, data:{style:'solid'} },
      { id:'b4', type:'title' as BT, data:{text:'Beslenme Listesi',size:'h3'} },
      { id:'b5', type:'attachment' as BT, data:{fileName:'Mayis_Ay_Beslenme.pdf',url:'#'} }
    ]
  },
  {
    id: 'tpl_workshop', title: 'Eğitim & Atölye', subtitle: 'AB Proje Yazımı Eğitimi', design: 'bold' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Erasmus+ KA2 Proje Yazım Atölyesi',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Kendi projenizi yazmak hiç bu kadar kolay olmamıştı. 2 günlük yoğun uygulamalı eğitimimize davetlisiniz.'} },
      { id:'b3', type:'event' as BT, data:{title:'Proje Atölyesi',date:'2026-06-10',time:'09:00',location:'Zoom (Online)'} },
      { id:'b4', type:'button' as BT, data:{text:'Kayıt Ol',url:'#'} }
    ]
  },
  {
    id: 'tpl_club', title: 'Kitap Kulübü Bülteni', subtitle: 'Bu Ay Ne Okuyoruz?', design: 'minimal' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Ayın Kitabı: 1984',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'George Orwell\'in başyapıtı olan 1984\'ü distopya ayı kapsamında inceliyoruz.'} },
      { id:'b3', type:'photos' as BT, data:{url:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=640&q=80',caption:'Kitap Kapağı'} },
      { id:'b4', type:'poll' as BT, data:{question:'Önümüzdeki ay hangi tür okuyalım?',opt1:'Bilim Kurgu',opt2:'Polisiye',opt3:'Tarih'} }
    ]
  },
  {
    id: 'tpl_ngo', title: 'Bağış Kampanyası', subtitle: 'Her Damla Bir Umut', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'Su Kuyusu Projemiz Başladı',size:'h1'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Afrika\'da temiz suya erişimi olmayan köyler için başlattığımız projeye desteklerinizi bekliyoruz.'} },
      { id:'b3', type:'button' as BT, data:{text:'Hemen Bağış Yap',url:'#'} },
      { id:'b4', type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} }
    ]
  },
  {
    id: 'tpl_assignment', title: 'Ödev Duyurusu', subtitle: 'Matematik Süreç Değerlendirmesi', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1509869175650-a1d97972541a?w=640&q=80',
    blocks: [
      { id:'b1', type:'title' as BT, data:{text:'2. Ünite Değerlendirme Ödevi',size:'h2'} },
      { id:'b2', type:'paragraph' as BT, data:{text:'Öğrencilerimizin üslü sayılar konusunu pekiştirmesi için hazırlanan föyleri perşembe gününe kadar tamamlamaları gerekmektedir.'} },
      { id:'b3', type:'attachment' as BT, data:{fileName:'Uslu_Sayilar_Foy_3.pdf',url:'#'} },
      { id:'b4', type:'event' as BT, data:{title:'Ödev Son Teslim Tarihi',date:'2026-03-26',time:'08:30',location:'Matematik Sınıfı'} }
    ]
  },
  {
    id: 'tpl_proj_kickoff', title: 'Proje Haberleri: Kick-off', subtitle: 'Avrupa Eğitim Ağı Projemiz Başlıyor!', design: 'bold' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Projemizin İlk Adımını Attık',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Avrupa Birliği tarafından desteklenen projemizin açılış toplantısını (Kick-off) büyük bir heyecanla gerçekleştirdik. 5 farklı ülkeden gelen stratejik ortaklarımızla hedeflerimizi belirledik.'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Koordinatör olarak sorumluluğumuz büyük. İlk gün boyunca fikri çıktıların taslak planlarını ve yaygınlaştırma stratejilerini tartıştık.', url:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Proje Hedeflerimiz Neler?',size:'h2'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'1. Yenilikçi müfredat oluşturmak\n2. Dijital platform entegrasyonu sağlamak\n3. Ulusötesi eğitim hareketliliklerini artırmak'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'3', url1:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=320', cap1:'İspanya Ekibi', url2:'https://images.unsplash.com/photo-1558403194-611308249d50?w=320', cap2:'İtalya Ekibi', url3:'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=320', cap3:'Türkiye Ekibi'} },
      { id:uid(), type:'event' as BT, data:{title:'Sıradaki Çevrimiçi Toplantı',date:'2026-10-15',time:'14:00',location:'Zoom / Teams'} },
      { id:uid(), type:'poll' as BT, data:{question:'Sizce en kritik proje hedefimiz hangisi?',opt1:'Dijitalleşme',opt2:'Kapsayıcılık',opt3:'Yeşil Beceriler'} },
      { id:uid(), type:'button' as BT, data:{text:'Proje Web Sitesini Ziyaret Et',url:'#'} }
    ]
  },
  {
    id: 'tpl_proj_tpm', title: 'Proje Haberleri: TPM Özeti', subtitle: '2. Ulusötesi Ortaklık Toplantısı Gerçekleşti', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Roma\'da Bir Araya Geldik',size:'h1'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'İtalya ortağımızın ev sahipliğinde gerçekleşen 2. Ulusötesi Toplantı (TPM) başarıyla tamamlandı. Gündemimizde pilot uygulamalar ve modül içeriklerinin son revizyonları vardı.', url:'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Katılımcılar, bölgesel farklılıklara uygun esnek bir müfredat üzerinde mutabık kalarak bir sonraki aşama için görev paylaşımı yaptılar.'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Alınan Temel Kararlar',size:'h2'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'• Eğitim içerikleri 3 farklı dile çevrilecek.\n• Platform testleri gelecek ay başlayacak.\n• Yaygınlaştırma raporları her ay düzenli olarak toplanacak.'} },
      { id:uid(), type:'attachment' as BT, data:{name:'TPM_2_Toplanti_Tutanaklari.pdf',url:'#'} },
      { id:uid(), type:'author' as BT, data:{name:'Luigi Feretti',title:'Ev Sahibi Kurum Koordinatörü',bio:'Verimli ve sonuç odaklı bir toplantı oldu. Tüm ortaklarımıza katkılarından dolayı teşekkür ederiz.',avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128'} },
      { id:uid(), type:'photos' as BT, data:{url:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=640', caption:'Tüm ortakların katılımıyla çekilen aile fotoğrafımız'} },
      { id:uid(), type:'button' as BT, data:{text:'Detaylı Toplantı Raporunu İncele',url:'#'} }
    ]
  },
  {
    id: 'tpl_proj_pr', title: 'Proje Haberleri: PR Lansmanı', subtitle: 'E-Öğrenme Platformumuz Yayında!', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Aylardır Beklenen An Geldi',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Konsorsiyum olarak üzerinde titizlikle çalıştığımız Fikri Çıktımız (PR1) olan yenilikçi e-öğrenme platformumuzu sonunda kullanıcılarla buluşturuyoruz.'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Platform, hem öğretmenlerin hem de öğrencilerin etkileşimli olarak içerik üretebileceği, akran değerlendirmesi yapabileceği bir modüler yapıya sahip.', url:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Kimler Kullanabilir?',size:'h2'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'• Mesleki ve teknik anadolu lisesi öğretmenleri\n• Yetiştirme kurslarındaki eğitmenler\n• Kendi kendine öğrenme sürecindeki öğrenciler'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Platform Tanıtım Videomuz'} },
      { id:uid(), type:'attachment' as BT, data:{name:'Kullanici_Kilavuzu_V1.pdf',url:'#'} },
      { id:uid(), type:'poll' as BT, data:{question:'Platform arayüzünü nasıl buldunuz?',opt1:'Çok modern ve kullanışlı',opt2:'Geliştirilmesi gerekiyor',opt3:'Henüz test etmedim'} },
      { id:uid(), type:'button' as BT, data:{text:'Platforma Ücretsiz Kayıt Ol',url:'#'} }
    ]
  },
  {
    id: 'tpl_proj_ltt', title: 'Proje Haberleri: LTT Hareketliliği', subtitle: '5 Günlük Eğitim Etkinliğimizi Tamamladık', design: 'minimal' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Öğrenme, Öğretme ve Eğitim Zamanı!',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Ortak ülkelerden gelen öğretmenlerin katılımıyla gerçekleştirdiğimiz "Kapsayıcı Eğitim Metotları" (C1) faaliyetimiz başarıyla sonuçlandı.'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'2', url1:'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=320', cap1:'Atölye Çalışmaları', url2:'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=320', cap2:'Sertifika Töreni'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Katılımcı Deneyimleri',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'"Farklı kültürlerden gelen meslektaşlarımla çalışmak, kendi eğitim vizyonuma yepyeni bir boyut kattı." — Maria (İspanya)', url:'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Eğitim programı boyunca non-formal eğitim teknikleri, grup dinamikleri ve dijital araçların sınıf içi kullanımı uygulamalı olarak test edildi.'} },
      { id:uid(), type:'googleform' as BT, data:{url:'https://docs.google.com/forms/d/e/1FAIpQLSf.../viewform', title:'Hareketlilik Değerlendirme Anketi'} },
      { id:uid(), type:'photos' as BT, data:{url:'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=640', caption:'Proje sonrası kültürel gezi anılarımız'} },
      { id:uid(), type:'button' as BT, data:{text:'Eğitim Materyallerine Göz At',url:'#'} }
    ]
  },
  {
    id: 'tpl_proj_final', title: 'Proje Haberleri: Final Konferansı', subtitle: '2 Yıllık Serüvenin Ardından...', design: 'bold' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Kapanış Konferansımız ve Çıktılarımız',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Acısıyla tatlısıyla iki yıllık AB Erasmus+ projemizi noktalarken, elde ettiğimiz çıktıları yerel paydaşlarımızla görkemli bir final konferansında paylaştık.'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Proje Özeti ve Kapanış Videosu'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Proje Sonuçları & İstatistikler',size:'h2'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'3', url1:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=320', cap1:'15+ Etkinlik', url2:'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?w=320', cap2:'500+ Katılımcı', url3:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=320', cap3:'3 Fikri Çıktı'} },
      { id:uid(), type:'attachment' as BT, data:{name:'Politika_Onerileri_Raporu_TR.pdf',url:'#'} },
      { id:uid(), type:'author' as BT, data:{name:'Dr. Ayşe Yılmaz',title:'Baş Koordinatör',bio:'Bu bir son değil, yarattığımız sürdürülebilir ağı genişleteceğimiz yeni bir başlangıçtır. Tüm ekibe minnettarım.',avatar:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Sürdürülebilirlik planlarımız kapsamında e-platformumuz en az 5 yıl daha ücretsiz olarak kullanıma açık kalacaktır.', url:'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'button' as BT, data:{text:'Sürdürülebilirlik Platformuna Git',url:'#'} }
    ]
  },
  {
    id: 'tpl_municipal', title: 'Aylık Kent Bülteni', subtitle: 'Ekim 2026 Değerlendirmesi', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Kıymetli Hemşehrilerimiz',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Bu ay şehrimizde hayata geçirdiğimiz projeleri ve önümüzdeki dönem planlarımızı sizlerle paylaşmaktan mutluluk duyuyoruz.'} },
      { id:uid(), type:'author' as BT, data:{name:'Ahmet Yılmaz',title:'Belediye Başkanı',bio:'Daha yeşil ve yaşanabilir bir şehir için çalışmaya devam ediyoruz.',avatar:'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Yeni Şehir Parkı Açılışı',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Merkez mahallemize kazandırdığımız 50.000 metrekarelik yeni şehir parkımız, çocuklarımız için geniş oyun alanları ve yürüyüş yolları içeriyor.', url:'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'3', url1:'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=320', cap1:'Peyzaj Çalışmaları', url2:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=320', cap2:'Çocuk Oyun Alanı', url3:'https://images.unsplash.com/photo-1510006851064-e6056cd0e3a8?w=320', cap3:'Yürüyüş Parkuru'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Parkımızın drone çekimi görüntüleri'} },
      { id:uid(), type:'separator' as BT, data:{style:'dashed'} },
      { id:uid(), type:'title' as BT, data:{text:'Ulaşımda Yeni Dönem',size:'h2'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Elektrikli otobüs filomuz bugün itibariyle seferlere başladı. Yeni hat güzergah haritasını aşağıdan indirebilirsiniz.'} },
      { id:uid(), type:'attachment' as BT, data:{name:'Yeni_Otobus_Hatlari_2026.pdf',url:'#'} },
      { id:uid(), type:'event' as BT, data:{title:'Halk Buluşması',date:'2026-10-15',time:'19:00',location:'Belediye Kültür Merkezi'} },
      { id:uid(), type:'poll' as BT, data:{question:'Sıradaki projemiz ne olmalı?',opt1:'Yeni Kütüphane',opt2:'Spor Kompleksi',opt3:'Gençlik Merkezi'} },
      { id:uid(), type:'button' as BT, data:{text:'Tüm Projeleri İncele',url:'#'} }
    ]
  },
  {
    id: 'tpl_tech_digest', title: 'Haftalık Teknoloji Özeti', subtitle: 'Sayı: 42 | AI ve Gelecek', design: 'minimal' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Yapay Zeka Dünyayı Değiştiriyor',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Bu haftaki bültenimizde, üretken yapay zeka modellerinin son güncellemelerini ve sektörel etkilerini inceliyoruz.'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Yeni çıkan GPT-5 mimarisi, özellikle sağlık ve finans alanlarında devrim yaratacak gibi görünüyor. İlk test sonuçları beklentilerin çok üzerinde.', url:'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Haftanın Öne Çıkanları',size:'h2'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'2', url1:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=320', cap1:'Veri Analizi', url2:'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=320', cap2:'Donanım Yenilikleri'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'• Kuantum bilgisayarlarda yeni hata düzeltme algoritması bulundu.\n• Akıllı telefon satışları son çeyrekte rekor kırdı.\n• Siber güvenlikte sıfır güven (zero-trust) mimarisi standartlaşıyor.'} },
      { id:uid(), type:'link' as BT, data:{text:'Detaylı raporu okumak için teknoloji blogumuzu ziyaret edin',url:'#'} },
      { id:uid(), type:'separator' as BT, data:{style:'dotted'} },
      { id:uid(), type:'author' as BT, data:{name:'Caner Tekin',title:'Teknoloji Editörü',bio:'Gelecek koda yazıldı. Teknoloji dünyasındaki gelişmeleri sizin için sadeleştiriyoruz.',avatar:'https://images.unsplash.com/photo-1581382575275-97901c2635b7?w=128'} },
      { id:uid(), type:'poll' as BT, data:{question:'Yapay zeka işinizi nasıl etkileyecek?',opt1:'Verimliliğimi artıracak',opt2:'İş yapış şeklimi tamamen değiştirecek',opt3:'Pek etki etmeyecek'} },
      { id:uid(), type:'event' as BT, data:{title:'Webinar: AI Araçları Kullanımı',date:'2026-11-05',time:'20:00',location:'YouTube Live'} },
      { id:uid(), type:'button' as BT, data:{text:'Gelecek Haftaki Sayıya Abone Ol',url:'#'} }
    ]
  },
  {
    id: 'tpl_news_1', title: 'Sivil Toplum Haberleri', subtitle: 'Kasım 2026 Gelişmeleri', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1593113589914-0759901168f1?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Saha Çalışmalarımızdan Notlar',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Bu ay dezavantajlı gruplara yönelik başlattığımız yeni istihdam programının ilk meyvelerini topluyoruz. Destek veren tüm bağışçılarımıza teşekkür ederiz.'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'3', url1:'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=320', cap1:'Topluluk Buluşması', url2:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=320', cap2:'Saha Eğitimi', url3:'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=320', cap3:'Sertifika Töreni'} },
      { id:uid(), type:'separator' as BT, data:{style:'dotted'} },
      { id:uid(), type:'title' as BT, data:{text:'Ayın Gönüllüsü: Zeynep Kaya',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Zeynep Hanım, projedeki üstün gayreti ve pozitif enerjisiyle bu ay "Ayın Gönüllüsü" seçildi. Kendisi mülteci çocukların entegrasyonu için haftada 15 saatini feda ediyor.', url:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'author' as BT, data:{name:'Zeynep Kaya',title:'Gönüllü Eğitmen',bio:'Bir çocuğun hayatına dokunmak, dünyanın yönünü değiştirmek demektir.',avatar:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128'} },
      { id:uid(), type:'event' as BT, data:{title:'Aralık Ayı Dayanışma Kermesi',date:'2026-12-10',time:'10:00',location:'Merkez Şehir Meydanı'} },
      { id:uid(), type:'poll' as BT, data:{question:'Sıradaki kampanyamız hangi alanda olmalı?',opt1:'Çocuk Eğitimi',opt2:'Kadın İstihdamı',opt3:'Çevre ve İklim'} },
      { id:uid(), type:'attachment' as BT, data:{name:'STK_Aylik_Faaliyet_Raporu.pdf',url:'#'} },
      { id:uid(), type:'button' as BT, data:{text:'Gönüllü Başvuru Formu',url:'#'} }
    ]
  },
  {
    id: 'tpl_news_2', title: 'Avrupa Birliği Fırsatları', subtitle: 'Açık Çağrılar ve Hibeler', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'2027 Erasmus+ Bütçeleri Belli Oldu',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Yeni dönemde yeşil seyahat (green travel) ödenekleri artırıldı. Ayrıca küçük ölçekli ortaklıklar için başvuru süreçleri dijitalleştirilerek kolaylaştırıldı.'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Ufuk Avrupa (Horizon Europe) Açık Çağrıları',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Küresel ısınmayla mücadele kapsamında açılan ve 5 Milyon Euro bütçeli "İklim Nötr Şehirler" çağrısı için son başvuru tarihi yaklaşıyor. Konsorsiyum yapısı kurarken mutlaka KOBİ ve STK dengesine dikkat ediniz.', url:'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Avrupa Komisyonu Resmi Çağrı Tanıtım Videosu'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'• KA122 (Kısa Dönemli Projeler): Son Gün 20 Şubat\n• KA220 (İşbirliği Ortaklıkları): Son Gün 24 Mart\n• CERV (Vatandaşlık): Son Gün 15 Nisan'} },
      { id:uid(), type:'attachment' as BT, data:{name:'2027_Cagri_Rehberi_TR.pdf',url:'#'} },
      { id:uid(), type:'link' as BT, data:{text:'Tüm güncel fırsatlar için EU Funding portalını ziyaret edin',url:'#'} },
      { id:uid(), type:'button' as BT, data:{text:'Proje Fikrini Test Et (Ücretsiz)',url:'#'} }
    ]
  },
  {
    id: 'tpl_news_3', title: 'Eğitim Gelişmeleri', subtitle: 'Dijital Öğrenme Trendleri', design: 'minimal' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Hibrit Öğrenme Modeli Yaygınlaşıyor',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Geçtiğimiz ay yayınlanan ulusal eğitim raporuna göre, okulların %40\'ı artık derslerin bir kısmını tamamen çevrimiçi platformlardan yürütüyor.'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'2', url1:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=320', cap1:'Dijital Sınıflar', url2:'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=320', cap2:'Online Mentörlük'} },
      { id:uid(), type:'separator' as BT, data:{style:'dashed'} },
      { id:uid(), type:'title' as BT, data:{text:'Uzman Görüşü: EdTech Geleceği',size:'h2'} },
      { id:uid(), type:'author' as BT, data:{name:'Prof. Dr. Ali Veli',title:'Eğitim Teknoloğu',bio:'Sanal gerçeklik (VR) laboratuvar derslerinin kalıcı bir parçası haline gelecek.',avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Yeni nesil tablet ve etkileşimli tahtalar, öğretmenlerin notlarını anlık olarak veli portallarına aktarıyor. Bu şeffaflık, öğrenci takibini inanılmaz derecede kolaylaştırdı.', url:'https://images.unsplash.com/photo-1531545514251-b146e5008b48?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'poll' as BT, data:{question:'Sizce geleneksel testler kalkmalı mı?',opt1:'Evet, proje bazlı ödevlere geçilmeli',opt2:'Hayır, sınavlar şart',opt3:'Hibrit bir yapı mantıklı'} },
      { id:uid(), type:'button' as BT, data:{text:'Teknoloji Entegreli Müfredat Raporu',url:'#'} }
    ]
  },
  {
    id: 'tpl_news_4', title: 'Yerel Yönetim & Gençlik', subtitle: 'İzmir Gençlik Meclisi Bülteni', design: 'bold' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Gençlik Fonu Başvuruları Açıldı!',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Belediyemiz tarafından desteklenen ve 18-29 yaş arası genç girişimcilerin başvurabileceği yeni inovasyon fonu resmi olarak duyuruldu.'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Gençlik Başkanı Mesajı'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Desteklenen Proje Kategorileri',size:'h2'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'• Akıllı Şehir Uygulamaları\n• Kültür ve Sanat İnisiyatifleri\n• Sosyal Medya İçerik Üretimi\n• Sıfır Atık / Ekoloji'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Proje başına 50.000 TL hibe desteği sağlanacaktır. Tüm katılımcılar ayrıca belediyemizin kuluçka merkezindeki paylaşımlı ofis alanından 6 ay ücretsiz yararlanacaktır.', url:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'event' as BT, data:{title:'Açılış Lansmanı ve Soru-Cevap',date:'2026-11-25',time:'18:00',location:'Büyükşehir Gençlik Merkezi'} },
      { id:uid(), type:'attachment' as BT, data:{name:'Genc_Girisimci_Fon_Rehberi.pdf',url:'#'} },
      { id:uid(), type:'button' as BT, data:{text:'Hemen Fikrini Gönder',url:'#'} }
    ]
  },
  {
    id: 'tpl_news_5', title: 'Ar-Ge ve İnovasyon', subtitle: 'Aylık Ekosistem Haberleri', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'TÜBİTAK 1501 Çağrısı Gelişmeleri',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Özel sektör Ar-Ge destek programları kapsamında yeni dönem çağrı dokümanları yayınlandı. Dijital ikiz (digital twin) odaklı projeler öncelikli desteklenecek.'} },
      { id:uid(), type:'separator' as BT, data:{style:'dotted'} },
      { id:uid(), type:'title' as BT, data:{text:'Ayın Başarı Hikayesi: Yeşil Kimya',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Marmara Teknokent bünyesinde faaliyet gösteren BioPlast A.Ş., bitkisel atıklardan 100% çözünebilir plastik üreten yeni patentiyle 2 Milyon Dolar yatırım aldı.', url:'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'author' as BT, data:{name:'Dr. Aslı Demir',title:'Genel Müdür (CEO)',bio:'Dünyayı yaşanabilir kılmak için doğadan ilham alan inovasyonlar şart.',avatar:'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128'} },
      { id:uid(), type:'poll' as BT, data:{question:'Firmanızın Ar-Ge harcamaları ne yönde?',opt1:'Artıyor',opt2:'Aynı Kaldı',opt3:'Düşüyor'} },
      { id:uid(), type:'event' as BT, data:{title:'Üniversite - Sanayi Çöpçatanlık Etkinliği',date:'2026-12-01',time:'09:00',location:'Kongre Merkezimiz'} },
      { id:uid(), type:'button' as BT, data:{text:'İkili Görüşmelere (B2B) Kayıt',url:'#'} }
    ]
  },
  {
    id: 'tpl_edu_1', title: 'Eğitim: Proje Döngüsü (PCM)', subtitle: 'Sıfırdan İleri Seviyeye Proje Yazımı', design: 'modern' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'AB Hibe Fonlarına Erişin',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Fikrinizi hibe kazanan bir projeye dönüştürmek için size uygulamalı bir mentörlük programı hazırladık. Mantıksal çerçeve (Logframe) analizinden bütçelemeye kadar her detayı öğrenin.'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Eğitim Tanıtım Videosu'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Program Detayları',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'1. Modül: Sorun Analizi ve LFM Tablosu\n2. Modül: Ortak Bulma ve Ön Başvuru\n3. Modül: Bütçe Yazımı ve Kalemler\n4. Modül: Son Okuma ve Dış Etki Anketi', url:'https://images.unsplash.com/photo-1513128034602-7814ccaddd4e?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'author' as BT, data:{name:'Can Yılmaz',title:'Kıdemli Proje Uzmanı',bio:'15 yılda 40\'tan fazla onaylanmış KA2 projesi referansıyla yanınızdayım.',avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128'} },
      { id:uid(), type:'event' as BT, data:{title:'Canlı Online İlk Ders',date:'2026-11-10',time:'20:00',location:'Zoom (Adresinize Link Gelecektir)'} },
      { id:uid(), type:'attachment' as BT, data:{name:'PCM_Egitim_Mufredati.pdf',url:'#'} },
      { id:uid(), type:'button' as BT, data:{text:'Eğitime Kayıt Ol (%20 İndirimli)',url:'#'} }
    ]
  },
  {
    id: 'tpl_edu_2', title: 'Danışmanlık Hizmetleri', subtitle: 'Kurumsal Kapasite Geliştirme', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Şirketinizin Hibe Stratejisi Hazır Mı?',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Avrupa Birliği ve Ulusal fonlara kendi iç ekibinizle bağımsız şekilde başvurabilmeniz için özel danışmanlık paketimizi sunuyoruz. Sizi balık almaya değil, balık tutmaya çağırıyoruz.'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Danışmanlık Kapsamı',size:'h2'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'3', url1:'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=320', cap1:'İhtiyaç Analizi', url2:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=320', cap2:'Ulusal Fon Haritası', url3:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=320', cap3:'Strateji Belgesi'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Ekibinizin yetkinliklerini analiz ediyor, PIC numarası kaydından kurum tanıtım dosyasına (PIF) kadar uluslararası ağlara katılmanızı sağlayacak tüm vitrininizi birlikte oluşturuyoruz.', url:'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'poll' as BT, data:{question:'Proje ekibiniz var mı?',opt1:'Evet, ayrı bir departmanımız var',opt2:'Hayır, dışarıyla çalışıyoruz',opt3:'Kurmaya çalışıyoruz'} },
      { id:uid(), type:'button' as BT, data:{text:'Ücretsiz 30 Dk Tanışma Toplantısı Ayarla',url:'#'} }
    ]
  },
  {
    id: 'tpl_edu_3', title: 'Mentörlük: Genç Girişimciler', subtitle: 'Fikirden Yatırıma Yolculuk', design: 'bold' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Startup Mentörlüğü Programı 2026',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Cevheri parlak bir fikriniz varsa, onu yatırım yapılabilir bir iş modeline dönüştürmek için ihtiyacınız olan rehberliği sunuyoruz.'} },
      { id:uid(), type:'separator' as BT, data:{style:'dashed'} },
      { id:uid(), type:'title' as BT, data:{text:'Programda Neler Var?',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'• 1-on-1 (Birebir) Haftalık Koçluk Görüşmeleri\n• Pazar Büyüklüğü (TAM/SAM/SOM) Analizleri\n• Rakip Analizi ve SWOT Çıkarımı\n• Pitch Deck (Yatırımcı Sunumu) Tasarımı\n• Birebir Yatırımcı (Angel Investor) Simulasyonları', url:'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'video' as BT, data:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption:'Mezun girişimcilerimizin başarı hikayeleri'} },
      { id:uid(), type:'author' as BT, data:{name:'Selin Doğan',title:'Melek Yatırımcı & Mentör',bio:'Harika ürünler değil, harika takımlar yatırım alır. O takım siz olabilirsiniz.',avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128'} },
      { id:uid(), type:'event' as BT, data:{title:'Açık Seçim Günü (Pitch Day)',date:'2026-12-20',time:'09:00',location:'Galata İnovasyon Merkezi'} },
      { id:uid(), type:'attachment' as BT, data:{name:'Basvuru_Sartnamesi.pdf',url:'#'} },
      { id:uid(), type:'button' as BT, data:{text:'Mentorluk Başvurusunu Tamamla',url:'#'} }
    ]
  },
  {
    id: 'tpl_edu_4', title: 'Atölye: Teknoloji & Yapay Zeka', subtitle: 'Proje Süreçlerinde AI Kullanımı', design: 'minimal' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1485686531765-ba63b07845a7?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Projelerinizi Yapay Zekayla Hızlandırın',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Eski usül word dosyalarıyla boğuşmak geride kaldı. Project Factory AI ve ChatGPT gibi araçlarla hibe projelerinizi %70 daha hızlı nasıl yazacağınızı öğrenin.'} },
      { id:uid(), type:'photogrid' as BT, data:{cols:'2', url1:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=320', cap1:'AI İle Metin Üretimi', url2:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=320', cap2:'Bütçe Analizi'} },
      { id:uid(), type:'separator' as BT, data:{style:'dashed'} },
      { id:uid(), type:'title' as BT, data:{text:'Kazanımlarınız Neler Olacak?',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Katılımcılar atölye sonunda kendi kurumlarının AI tabanlı proje şablonlarını (Prompt Matrix) oluşturabilecek ve hibe değerlendirme algoritmalarının nasıl çalıştığını (3 Lens Sistemi) anlayacaklardır.', url:'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=80', imagePos:'right'} },
      { id:uid(), type:'link' as BT, data:{text:'Kullanılacak Eğitim Materyallerine Göz Atın',url:'#'} },
      { id:uid(), type:'poll' as BT, data:{question:'ChatGPT/AI araçlarını işinizde sık kullanıyor musunuz?',opt1:'Her gün',opt2:'Haftada birkaç kez',opt3:'Hiç kullanmadım'} },
      { id:uid(), type:'event' as BT, data:{title:'1 Günlük Hackathon/Atölye',date:'2026-11-28',time:'10:00',location:'Teknopark Konferans Salonu'} },
      { id:uid(), type:'button' as BT, data:{text:'Atölye Biletini Al',url:'#'} }
    ]
  },
  {
    id: 'tpl_edu_5', title: 'Lobicilik ve Networking', subtitle: 'Brüksel Odaklı Ağ Kurma Eğitimi', design: 'classic' as Design,
    headerImgUrl: 'https://images.unsplash.com/photo-1507679622767-14e3ee3193e2?w=640&q=80',
    blocks: [
      { id:uid(), type:'title' as BT, data:{text:'Kurumunuzu Avrupa Çapında Konumlandırın',size:'h1'} },
      { id:uid(), type:'paragraph' as BT, data:{text:'Yüksek bütçeli Konsorsiyum projelerinde asistan ortak olmak yerine koordinatörlüğe soyunmak istiyorsanız, doğru kişilerle nasıl stratejik ortaklıklar kurulacağını keşfedin.'} },
      { id:uid(), type:'separator' as BT, data:{style:'solid'} },
      { id:uid(), type:'title' as BT, data:{text:'Ağ Kurma Eğitim İçeriği',size:'h2'} },
      { id:uid(), type:'textphoto' as BT, data:{text:'Avrupa Komisyonu veritabanlarında (FTOP) profilinizi öne çıkarma, LinkedIn üzerinden Avrupalı proje sahiplerine erişme, Brüksel InfoDay etkinliklerinde etkili elevator-pitch yapma teknikleri gibi kritik yetkinlikler.', url:'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640&q=80', imagePos:'left'} },
      { id:uid(), type:'attachment' as BT, data:{name:'Networking_Checklist.pdf',url:'#'} },
      { id:uid(), type:'author' as BT, data:{name:'Mehmet Çelik',title:'Uluslararası İlişkiler Direktörü',bio:'Büyük projeler kağıt üzerinde değil, kahve molalarında lobi yapılarak kazanılır.',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128'} },
      { id:uid(), type:'event' as BT, data:{title:'Stratejik Ortaklıklar Semineri',date:'2026-12-05',time:'13:30',location:'Ankara Hilton Otel'} },
      { id:uid(), type:'button' as BT, data:{text:'Rezervasyon Yap (! Son 5 Kontenjan !)',url:'#'} }
    ]
  }
];

// ── Design configs ─────────────────────────────────────────────────────
const DESIGNS: Record<Design, DesignConfig> = {
  modern:  { label:'Modern',   headerBg:'#003366', headerColor:'#fff',    accentColor:'#0066cc', bodyBg:'#fff',    textColor:'#1a1a2e', font:'Inter, system-ui, sans-serif' },
  classic: { label:'Classic',  headerBg:'#2d6a2d', headerColor:'#fff',    accentColor:'#2d6a2d', bodyBg:'#fffef5', textColor:'#2d2d2d', font:'Georgia, serif' },
  bold:    { label:'Bold',     headerBg:'#c0392b', headerColor:'#fff',    accentColor:'#e74c3c', bodyBg:'#fff',    textColor:'#1a1a1a', font:'Outfit, sans-serif' },
  minimal: { label:'Minimal',  headerBg:'#1a1a1a', headerColor:'#f5f5f5', accentColor:'#555',    bodyBg:'#fafafa', textColor:'#222',    font:'system-ui, sans-serif' },
};

// ── Block palette ─────────────────────────────────────────────────────
const PALETTE: { type: BT; icon: string; label: string; def: Record<string,string> }[] = [
  { type:'title',      icon:'T',   label:'Title',       def:{ text:'Başlık', size:'h2' } },
  { type:'paragraph',  icon:'¶',   label:'Paragraph',   def:{ text:'Buraya metin yazın...' } },
  { type:'photos',     icon:'🖼',  label:'Photos',      def:{ url:'', layout:'1', caption:'' } },
  { type:'textphoto',  icon:'🗒',  label:'Text+Photo',  def:{ text:'Metin buraya...', url:'', imagePos:'right' } },
  { type:'photogrid',  icon:'🗳',  label:'Photo Grid',  def:{ cols:'2', url1:'', cap1:'', url2:'', cap2:'', url3:'' , cap3:'' } },
  { type:'author',     icon:'👤',  label:'Author',      def:{ name:'Ad Soyad', title:'Moderator', avatar:'', bio:'', facebook:'', twitter:'', instagram:'', youtube:'' } },
  { type:'form',       icon:'📋',  label:'Form',        def:{ title:'Geri Bildirim', field1:'Ad Soyad', field2:'E-posta', field3:'Mesaj', submit:'Gönder' } },
  { type:'googleform', icon:'📝',  label:'Google Form', def:{ url:'', title:'Form', height:'520' } },
  { type:'video',      icon:'►',   label:'Video',       def:{ url:'', caption:'' } },
  { type:'event',      icon:'📅',  label:'Event',       def:{ title:'Etkinlik', date:'', time:'', location:'' } },
  { type:'separator',  icon:'—',   label:'Separator',   def:{ style:'solid' } },
  { type:'link',       icon:'🔗',  label:'Link',        def:{ text:'Bağlantı', url:'#' } },
  { type:'button',     icon:'⬛',  label:'Button',      def:{ text:'Tıklayın', url:'#', align:'center' } },
  { type:'poll',       icon:'📊',  label:'Poll',        def:{ question:'Sorunuz?', opt1:'Seçenek A', opt2:'Seçenek B', opt3:'' } },
  { type:'attachment', icon:'📎',  label:'Attachment',  def:{ name:'dosya.pdf', url:'#' } },
];

function uid() { return Math.random().toString(36).slice(2,9); }

function ytId(url:string){ const m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/); return m?m[1]:null; }

// ── Canvas block renderer ──────────────────────────────────────────────
function CanvasBlock({ block, design, selected, onClick }: {
  block: Block; design: DesignConfig; selected: boolean; onClick: ()=>void;
}) {
  const d = block.data;
  const ac = design.accentColor;
  const tc = design.textColor;
  const ff = design.font;

  let inner: React.ReactNode = null;

  if(block.type === 'title'){
    const Tag = (d.size||'h2') as 'h1'|'h2'|'h3';
    const sz = {h1:'28px',h2:'22px',h3:'18px'}[Tag];
    const titleEl = <Tag style={{margin:0,fontFamily:ff,fontSize:sz,fontWeight:800,color:ac,textDecoration:d.url?'underline':'none',textDecorationColor:`${ac}44`}}>{d.text}</Tag>;
    inner = d.url
      ? <a href={d.url} target="_blank" rel="noreferrer" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:6}}>{titleEl}<span style={{fontSize:13,opacity:.5}}>↗️</span></a>
      : titleEl;
  } else if(block.type === 'paragraph'){
    inner = <p style={{margin:0,fontFamily:ff,fontSize:15,lineHeight:1.75,color:tc,whiteSpace:'pre-wrap'}}>{d.text}</p>;
  } else if(block.type === 'photos'){
    const isColumns = d.layout === 'columns';
    if(isColumns){
      const items = [{url:d.url, cap:d.caption}, {url:d.url2, cap:d.caption2}];
      inner = (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {items.map((item,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',gap:0}}>
              {item.url
                ? <img src={item.url} alt={item.cap||''} style={{width:'100%',borderRadius:8,display:'block'}}/>
                : <div style={{background:'#e2e8f0',borderRadius:8,height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:4,border:'1.5px dashed #cbd5e1'}}>
                    <span style={{fontSize:24}}>+📷</span>
                    <span style={{fontSize:11,fontFamily:ff}}>Görsel Seçin</span>
                  </div>}
              {item.cap && <p style={{margin:'6px 0 0',fontSize:12,color:'#64748b',fontFamily:ff,textAlign:'center'}}>{item.cap}</p>}
            </div>
          ))}
        </div>
      );
    } else {
      const hasUrl = d.url && d.url.trim();
      inner = (
        <div>
          {hasUrl
             ? <img src={d.url} alt={d.caption||''} style={{width:'100%',borderRadius:8,display:'block'}}/>
             : <div style={{background:'#e2e8f0',borderRadius:8,height:160,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:8}}>
                 <span style={{fontSize:32}}>🖼</span>
                 <span style={{fontSize:13,fontFamily:ff}}>Görsel Seçin</span>
               </div>}
          {d.caption && <p style={{margin:'8px 0 0',fontSize:12,color:'#64748b',fontFamily:ff,textAlign:'center'}}>{d.caption}</p>}
        </div>
      );
    }
  } else if(block.type === 'video'){
    const vid = ytId(d.url||'');
    inner = vid
      ? <div style={{position:'relative',paddingBottom:'56.25%',height:0,borderRadius:8,overflow:'hidden'}}>
          <iframe style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} src={`https://www.youtube.com/embed/${vid}`} allowFullScreen title="video"/>
        </div>
      : <div style={{background:'#e2e8f0',borderRadius:8,height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:8}}>
          <span style={{fontSize:32}}>▶</span>
          <span style={{fontSize:13,fontFamily:ff}}>YouTube URL ekleyin</span>
        </div>;
  } else if(block.type === 'event'){
    inner = (
      <div style={{borderLeft:`4px solid ${ac}`,paddingLeft:16,fontFamily:ff}}>
        <div style={{fontWeight:800,fontSize:16,color:ac,marginBottom:4}}>{d.title||'Etkinlik'}</div>
        {d.date && <div style={{fontSize:13,color:tc}}>📅 {d.date} {d.time}</div>}
        {d.location && <div style={{fontSize:13,color:tc}}>📍 {d.location}</div>}
      </div>
    );
  } else if(block.type === 'separator'){
    inner = <hr style={{border:'none',borderTop:`2px ${d.style||'solid'} ${ac}`,margin:0}}/>;
  } else if(block.type === 'link'){
    inner = <a href={d.url||'#'} style={{color:ac,fontFamily:ff,fontSize:14,textDecoration:'underline',fontWeight:600}}>🔗 {d.text||'Bağlantı'}</a>;
  } else if(block.type === 'button'){
    const align = d.align||'center';
    inner = <div style={{textAlign:align as 'left'|'center'|'right'}}>
      <a href={d.url||'#'} style={{display:'inline-block',padding:'12px 28px',background:ac,color:'#fff',borderRadius:30,fontFamily:ff,fontWeight:700,fontSize:14,textDecoration:'none'}}>{d.text||'Tıklayın'}</a>
    </div>;
  } else if(block.type === 'poll'){
    inner = (
      <div style={{fontFamily:ff}}>
        <div style={{fontWeight:700,fontSize:15,color:tc,marginBottom:10}}>{d.question||'Sorunuz?'}</div>
        {[d.opt1,d.opt2,d.opt3].filter(Boolean).map((o,i)=>(
          <div key={i} style={{padding:'8px 14px',border:`1.5px solid ${ac}`,borderRadius:8,marginBottom:6,fontSize:14,color:tc,cursor:'pointer'}}>○ {o}</div>
        ))}
      </div>
    );
  } else if(block.type === 'attachment'){
    inner = <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',border:`1.5px solid #e2e8f0`,borderRadius:8,fontFamily:ff}}>
      <span style={{fontSize:22}}>📎</span>
      <a href={d.url||'#'} style={{color:ac,fontWeight:600,fontSize:14,textDecoration:'none'}}>{d.name||'dosya.pdf'}</a>
    </div>;
  } else if(block.type === 'textphoto'){
    const imgRight = (d.imagePos||'right')==='right';
    const hasImg = d.url && d.url.trim();
    inner = (
      <div style={{display:'flex',gap:16,alignItems:'flex-start',flexDirection: imgRight?'row':'row-reverse'}}>
        <div style={{flex:1}}>
          <p style={{margin:0,fontFamily:ff,fontSize:15,lineHeight:1.75,color:tc,whiteSpace:'pre-wrap'}}>{d.text||'Metin buraya...'}</p>
        </div>
        <div style={{flexShrink:0,width:180}}>
          {hasImg
            ? <img src={d.url} alt={d.caption||''} style={{width:'100%',borderRadius:8,display:'block'}}/>
            : <div style={{width:'100%',height:120,background:'#e2e8f0',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:4}}>
                <span style={{fontSize:24}}>🖼</span>
                <span style={{fontSize:11,fontFamily:ff}}>Add a Picture</span>
              </div>}
        </div>
      </div>
    );
  } else if(block.type === 'photogrid'){
    const cols = parseInt(d.cols||'2');
    const slots = Array.from({length:cols},(_,i)=>({url:d[`url${i+1}`]||'',cap:d[`cap${i+1}`]||''}));
    inner = (
      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:10}}>
        {slots.map((s,i)=>(
          <div key={i}>
            {s.url
              ? <img src={s.url} alt={s.cap} style={{width:'100%',borderRadius:8,display:'block'}}/>
              : <div style={{background:'#e2e8f0',borderRadius:8,height:120,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',gap:4}}>
                  <span style={{fontSize:24}}>🖼</span>
                  <span style={{fontSize:11,fontFamily:ff}}>Add a Picture</span>
                </div>}
            {s.cap && <p style={{margin:'4px 0 0',fontSize:11,color:'#64748b',fontFamily:ff,textAlign:'center'}}>{s.cap}</p>}
          </div>
        ))}
      </div>
    );
  } else if(block.type === 'author'){
    inner = (
      <div style={{border:`1px solid ${ac}22`,borderRadius:12,padding:'20px',fontFamily:ff,display:'flex',gap:16,alignItems:'flex-start',background:`${ac}06`}}>
        {d.avatar
          ? <img src={d.avatar} alt={d.name} style={{width:68,height:68,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`3px solid ${ac}`}}/>
          : <div style={{width:68,height:68,borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0,color:'#fff'}}>👤</div>}
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:16,color:tc}}>{d.name||'Ad Soyad'}</div>
          {d.title && <div style={{fontSize:13,color:ac,fontWeight:600,marginBottom:4}}>{d.title}</div>}
          {d.bio && <p style={{fontSize:13,color:tc,lineHeight:1.6,margin:'6px 0 0'}}>{d.bio}</p>}
          <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
            {d.facebook && <a href={`https://facebook.com/${d.facebook}`} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>Facebook</a>}
            {d.twitter && <a href={`https://twitter.com/${d.twitter}`} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>Twitter</a>}
            {d.instagram && <a href={`https://instagram.com/${d.instagram}`} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>Instagram</a>}
            {d.youtube && <a href={d.youtube} style={{color:ac,fontSize:12,textDecoration:'none',fontWeight:600}}>YouTube</a>}
          </div>
        </div>
      </div>
    );
  } else if(block.type === 'form'){
    const fields = [d.field1,d.field2,d.field3].filter(Boolean);
    inner = (
      <div style={{background:`${ac}08`,border:`1.5px solid ${ac}33`,borderRadius:12,padding:'20px',fontFamily:ff}}>
        {d.title && <div style={{fontWeight:800,fontSize:16,color:tc,marginBottom:14}}>{d.title}</div>}
        {fields.map((f,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,color:tc,display:'block',marginBottom:4}}>{f}</label>
            {(i===fields.length-1 && fields.length>1)
              ? <textarea rows={3} placeholder={f as string} disabled style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${ac}44`,fontSize:13,fontFamily:ff,resize:'none',boxSizing:'border-box' as const,background:'#fff',color:'#6b7280'}}/>
              : <input type={(f as string).toLowerCase().includes('mail')?'email':'text'} placeholder={f as string} disabled style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${ac}44`,fontSize:13,fontFamily:ff,boxSizing:'border-box' as const,background:'#fff',color:'#6b7280'}}/>}
          </div>
        ))}
        <button disabled style={{marginTop:4,padding:'10px 24px',background:ac,color:'#fff',border:'none',borderRadius:24,fontWeight:700,fontSize:14,fontFamily:ff,opacity:.9}}>{d.submit||'Gönder'}</button>
      </div>
    );
  } else if(block.type === 'googleform'){
    // Normalize URL: convert /viewform to /viewform?embedded=true
    const rawUrl = d.url || '';
    const embedUrl = rawUrl
      ? rawUrl.replace(/\/viewform.*$/, '/viewform?embedded=true')
      : '';
    const h = parseInt(d.height||'520');
    inner = (
      <div style={{border:`1.5px solid #4285F4`,borderRadius:12,overflow:'hidden'}}>
        {/* Google Form header bar */}
        <div style={{background:'#4285F4',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>📝</span>
          <span style={{color:'#fff',fontWeight:700,fontSize:14,fontFamily:ff}}>{d.title||'Google Form'}</span>
          {rawUrl && <a href={rawUrl} target="_blank" rel="noreferrer"
            style={{marginLeft:'auto',fontSize:11,color:'rgba(255,255,255,.8)',textDecoration:'underline',fontFamily:ff}}>Yeni sekmede aç ↗</a>}
        </div>
        {embedUrl
          ? <iframe src={embedUrl} width="100%" height={h} frameBorder={0} style={{display:'block'}}/>
          : <div style={{height:160,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontFamily:ff,background:'#f8fafc',gap:6}}>
              <span style={{fontSize:28}}>🔗</span>
              <span style={{fontSize:12,fontWeight:600}}>Google Form URL girin</span>
              <span style={{fontSize:11}}>Sağ panelden form linkinizi ekleyin</span>
            </div>}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding:'12px 0', cursor:'pointer',
        outline: selected ? `2px solid ${ac}` : '2px solid transparent',
        outlineOffset:4, borderRadius:6, position:'relative',
        transition:'outline 0.12s',
      }}
    >
      {selected && (
        <div style={{position:'absolute',top:6,right:6,background:ac,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,zIndex:10,pointerEvents:'none'}}>
          {PALETTE.find(p=>p.type===block.type)?.label}
        </div>
      )}
      {inner}
    </div>
  );
}

// ── Image uploader (URL + file upload) ───────────────────────────────
function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string)=>void; label?: string }) {
  const [tab, setTab] = React.useState<'url'|'file'>('url');
  const inp: React.CSSProperties = {width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1e293b'};

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {label && <label style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{label}</label>}
      {/* tab switcher */}
      <div style={{display:'flex',marginBottom:6,borderRadius:8,overflow:'hidden',border:'1px solid #d1d5db'}}>
        {(['url','file'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,padding:'5px 0',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',
              background:tab===t?'#0066cc':'#f9fafb',color:tab===t?'#fff':'#6b7280'}}>
            {t==='url'?'🔗 URL':'📁 Dosya'}
          </button>
        ))}
      </div>
      {tab==='url'
        ? <input style={inp} value={value} onChange={e=>onChange(e.target.value)} placeholder="https://site.com/gorsel.png"/>
        : <label style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:'2px dashed #d1d5db',borderRadius:8,cursor:'pointer',color:'#6b7280',fontSize:13,fontWeight:600,background:'#f9fafb'}}>
            📤 Görsel Seç
            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
          </label>
      }
      {value && (
        <div style={{marginTop:8,position:'relative',display:'inline-block'}}>
          <img src={value} alt="" style={{height:60,borderRadius:6,boxShadow:'0 1px 6px rgba(0,0,0,.12)',display:'block'}}/>
          <button onClick={()=>onChange('')}
            style={{position:'absolute',top:-5,right:-5,width:16,height:16,borderRadius:'50%',background:'#ef4444',border:'none',color:'#fff',fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Block editor (right panel) ─────────────────────────────────────────
function BlockEditor({ block, onChange, onAI, aiLoading }: {
  block: Block;
  onChange: (data: Record<string,string>)=>void;
  onAI: (mode: 'generate'|'rewrite'|'expand-short'|'expand-long'|'expand-bullets')=>void;
  aiLoading: boolean;
}) {
  const set = (k:string, v:string) => onChange({...block.data,[k]:v});
  const inp: React.CSSProperties = {width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1e293b'};
  const lbl: React.CSSProperties = {fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4};
  const row: React.CSSProperties = {marginBottom:10};

  const MergeTagHelper = ({ fieldKey, textValue }: { fieldKey: string, textValue: string }) => (
    <div style={{marginTop:6, display:'flex', gap:6, alignItems:'center'}}>
      <span style={{fontSize:10,color:'#64748b'}}>Değişken Ekle:</span>
      <button onClick={()=>set(fieldKey, (textValue||'') + ' {{isim}}')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #cbd5e1',background:'#f8fafc',fontSize:11,cursor:'pointer',color:'#0284c7',fontWeight:700}} title="Listeden kişinin adını otomatik çeker">{'{{isim}}'}</button>
    </div>
  );

  switch(block.type){
    case 'title': return <div>
      <div style={row}>
        <label style={lbl}>Başlık Metni</label>
        <input style={inp} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Başlık..."/>
        <MergeTagHelper fieldKey="text" textValue={block.data.text} />
      </div>
      <div style={row}><label style={lbl}>Boyut</label>
        <select style={inp} value={block.data.size} onChange={e=>set('size',e.target.value)}>
          <option value="h1">H1 — Büyük</option><option value="h2">H2 — Orta</option><option value="h3">H3 — Küçük</option>
        </select>
      </div>
      {/* Linkable title — Smore style */}
      {block.data.url
        ? <div style={row}>
            <label style={lbl}>Başlık Linki</label>
            <input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/>
            <button onClick={()=>set('url','')} style={{marginTop:6,padding:'5px 12px',borderRadius:6,border:'1px solid #e5e7eb',background:'#fef2f2',color:'#dc2626',fontSize:11,fontWeight:700,cursor:'pointer'}}>✕ Bağlantıyı Kaldır</button>
          </div>
        : <button onClick={()=>set('url','https://')} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #0d9488',background:'#f0fdfa',color:'#0d9488',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            🔗 Bu başlığı bağlantıya dönüştür
          </button>}
    </div>;
    case 'paragraph': return <div>
      <div style={row}><label style={lbl}>Metin ({block.data.text?.length||0} karakter)</label>
        <textarea style={{...inp,minHeight:110,resize:'vertical'}} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Metin yazın..."/>
        <MergeTagHelper fieldKey="text" textValue={block.data.text} />
      </div>
      <div style={{display:'flex',gap:6,marginTop:8}}>
        <button onClick={()=>onAI('generate')} disabled={aiLoading} title="Sıfırdan Üret" style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #6366f1',background:aiLoading?'#e0e7ff':'#eef2ff',color:'#6366f1',fontWeight:700,fontSize:11,cursor:aiLoading?'wait':'pointer'}}>
          {aiLoading?'⏳...':'✨ Üret'}
        </button>
        <button onClick={()=>onAI('rewrite')} disabled={aiLoading || !block.data.text} title="Yeniden Yaz / Geliştir" style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #0ea5e9',background:aiLoading?'#e0f2fe':'#e0f2fe',color:'#0284c7',fontWeight:700,fontSize:11,cursor:(aiLoading||!block.data.text)?'not-allowed':'pointer'}}>
          📝 Yeniden Yaz
        </button>
        <div style={{flex:1,position:'relative'}}>
           <button onClick={(e)=>{const div = e.currentTarget.nextElementSibling as HTMLElement; div.style.display = div.style.display==='none'?'flex':'none';}} disabled={aiLoading || !block.data.text} title="Daha Uzun Yaz" style={{width:'100%',padding:'8px',borderRadius:8,border:'1px solid #10b981',background:aiLoading?'#d1fae5':'#ecfdf5',color:'#059669',fontWeight:700,fontSize:11,cursor:(aiLoading||!block.data.text)?'not-allowed':'pointer'}}>
             ➕ Uzat ▾
           </button>
           <div style={{display:'none',position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'#fff',border:'1px solid #10b981',borderRadius:8,marginTop:4,flexDirection:'column',overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
             <button onClick={()=>{ onAI('expand-short'); (document.activeElement as HTMLElement)?.blur(); }} style={{padding:'8px',border:'none',borderBottom:'1px solid #e5e7eb',background:'#fff',color:'#059669',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'left'}}>+ Kısa Uzat (Detaylandır)</button>
             <button onClick={()=>{ onAI('expand-long'); (document.activeElement as HTMLElement)?.blur(); }} style={{padding:'8px',border:'none',borderBottom:'1px solid #e5e7eb',background:'#fff',color:'#059669',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'left'}}>++ Çok Uzat (2-3 Katı)</button>
             <button onClick={()=>{ onAI('expand-bullets'); (document.activeElement as HTMLElement)?.blur(); }} style={{padding:'8px',border:'none',background:'#fff',color:'#059669',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'left'}}>≡ Maddelerle Uzat</button>
           </div>
        </div>
      </div>
    </div>;
    case 'photos': return <div>
      {/* Layout chooser — Smore style card buttons */}
      <div style={{...row}}>
        <label style={lbl}>Düzen</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{val:'1',icon:'🖼️',lbl:'Büyük Fotoğraf'},{val:'columns',icon:'▐▊▊',lbl:'Yanyana Sütunlar'}].map(opt=>(
            <button key={opt.val} onClick={()=>set('layout',opt.val)}
              style={{padding:'12px 8px',borderRadius:10,border:`2px solid ${(block.data.layout||'1')===opt.val?'#0d9488':'#e5e7eb'}`,
                background:(block.data.layout||'1')===opt.val?'#f0fdfa':'#fff',
                cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>{opt.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:'#374151'}}>{opt.lbl}</span>
            </button>
          ))}
        </div>
      </div>
      {(block.data.layout === 'columns') ? (
        <div style={{display:'flex',gap:12,marginTop:10}}>
          <div style={{flex:1}}>
            <ImageUpload label="1. Görsel" value={block.data.url} onChange={url=>set('url',url)}/>
            <div style={{marginTop:6}}><label style={{...lbl,fontSize:9}}>1. Alt Yazı</label><input style={{...inp,padding:'4px 6px',fontSize:11}} value={block.data.caption||''} onChange={e=>set('caption',e.target.value)} placeholder="Açıklama..."/></div>
          </div>
          <div style={{flex:1}}>
            <ImageUpload label="2. Görsel" value={block.data.url2} onChange={url=>set('url2',url)}/>
            <div style={{marginTop:6}}><label style={{...lbl,fontSize:9}}>2. Alt Yazı</label><input style={{...inp,padding:'4px 6px',fontSize:11}} value={block.data.caption2||''} onChange={e=>set('caption2',e.target.value)} placeholder="Açıklama..."/></div>
          </div>
        </div>
      ) : (
        <>
          <ImageUpload label="Görsel" value={block.data.url} onChange={url=>set('url',url)}/>
          <div style={{...row,marginTop:10}}><label style={lbl}>Alt Yazı</label><input style={inp} value={block.data.caption} onChange={e=>set('caption',e.target.value)} placeholder="Görsel açıklaması..."/></div>
        </>
      )}
    </div>;
    case 'video': return <div>
      <div style={row}><label style={lbl}>YouTube URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://youtu.be/..."/></div>
      <div style={row}><label style={lbl}>Alt Yazı</label><input style={inp} value={block.data.caption} onChange={e=>set('caption',e.target.value)} placeholder="Video açıklaması..."/></div>
    </div>;
    case 'event': return <div>
      <div style={row}><label style={lbl}>Etkinlik Adı</label><input style={inp} value={block.data.title} onChange={e=>set('title',e.target.value)} placeholder="Etkinlik adı..."/></div>
      <div style={row}><label style={lbl}>Tarih</label><input style={inp} type="date" value={block.data.date} onChange={e=>set('date',e.target.value)}/></div>
      <div style={row}><label style={lbl}>Saat</label><input style={inp} type="time" value={block.data.time} onChange={e=>set('time',e.target.value)}/></div>
      <div style={row}><label style={lbl}>Yer</label><input style={inp} value={block.data.location} onChange={e=>set('location',e.target.value)} placeholder="Konum veya adres..."/></div>
    </div>;
    case 'separator': return <div>
      <div style={row}><label style={lbl}>Çizgi Stili</label>
        <select style={inp} value={block.data.style} onChange={e=>set('style',e.target.value)}>
          <option value="solid">Düz</option><option value="dashed">Kesik</option><option value="dotted">Noktalı</option>
        </select>
      </div>
    </div>;
    case 'link': return <div>
      <div style={row}><label style={lbl}>Bağlantı Metni</label><input style={inp} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Metin..."/></div>
      <div style={row}><label style={lbl}>URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/></div>
    </div>;
    case 'button': return <div>
      <div style={row}><label style={lbl}>Buton Metni</label><input style={inp} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Buton metni..."/></div>
      <div style={row}><label style={lbl}>URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/></div>
      <div style={row}><label style={lbl}>Hizalama</label>
        <select style={inp} value={block.data.align} onChange={e=>set('align',e.target.value)}>
          <option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option>
        </select>
      </div>
    </div>;
    case 'poll': return <div>
      <div style={row}><label style={lbl}>Soru</label><input style={inp} value={block.data.question} onChange={e=>set('question',e.target.value)} placeholder="Sorunuzu yazın..."/></div>
      {['opt1','opt2','opt3'].map((k,i)=>(
        <div key={k} style={row}><label style={lbl}>Seçenek {i+1}</label><input style={inp} value={block.data[k]} onChange={e=>set(k,e.target.value)} placeholder={`Seçenek ${i+1}...`}/></div>
      ))}
    </div>;
    case 'attachment': return <div>
      <div style={row}><label style={lbl}>Dosya Adı</label><input style={inp} value={block.data.name} onChange={e=>set('name',e.target.value)} placeholder="dosya.pdf"/></div>
      <div style={row}><label style={lbl}>URL</label><input style={inp} value={block.data.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/></div>
    </div>;
    case 'textphoto': return <div>
      <div style={row}><label style={lbl}>Metin</label>
        <textarea style={{...inp,minHeight:90,resize:'vertical'}} value={block.data.text} onChange={e=>set('text',e.target.value)} placeholder="Metin yazın..."/>
      </div>
      <div style={{...row,marginTop:8}}><ImageUpload label="Görsel" value={block.data.url} onChange={url=>set('url',url)}/></div>
      <div style={row}><label style={lbl}>Görsel Pozisyon</label>
        <select style={inp} value={block.data.imagePos||'right'} onChange={e=>set('imagePos',e.target.value)}>
          <option value="right">Sağda</option>
          <option value="left">Solda</option>
        </select>
      </div>
    </div>;
    case 'photogrid': return <div>
      <div style={row}><label style={lbl}>Sütun Sayısı</label>
        <select style={inp} value={block.data.cols||'2'} onChange={e=>set('cols',e.target.value)}>
          <option value="1">1 Sütun</option>
          <option value="2">2 Sütun</option>
          <option value="3">3 Sütun</option>
        </select>
      </div>
      {Array.from({length:parseInt(block.data.cols||'2')},(_,i)=>(
        <div key={i} style={{...row,borderTop:'1px solid #e5e7eb',paddingTop:10}}>
          <ImageUpload label={`Görsel ${i+1}`} value={block.data[`url${i+1}`]||''} onChange={url=>set(`url${i+1}`,url)}/>
          <div style={{marginTop:6}}><label style={lbl}>Alt Yazı {i+1}</label>
            <input style={inp} value={block.data[`cap${i+1}`]||''} onChange={e=>set(`cap${i+1}`,e.target.value)} placeholder="Açıklama..."/>
          </div>
        </div>
      ))}
    </div>;
    case 'author': return <div>
      <ImageUpload label="Avatar" value={block.data.avatar||''} onChange={url=>set('avatar',url)}/>
      <div style={{...row,marginTop:10}}><label style={lbl}>Ad Soyad</label><input style={inp} value={block.data.name} onChange={e=>set('name',e.target.value)} placeholder="Ad Soyad"/></div>
      <div style={row}><label style={lbl}>Ünvan / Site</label><input style={inp} value={block.data.title} onChange={e=>set('title',e.target.value)} placeholder="Moderator veya https://..."/></div>
      <div style={row}><label style={lbl}>Bio</label><textarea style={{...inp,minHeight:70,resize:'vertical'}} value={block.data.bio} onChange={e=>set('bio',e.target.value)} placeholder="Kısa biyografi..."/></div>
      <div style={{borderTop:'1px solid #e5e7eb',paddingTop:10,marginBottom:4}}><label style={lbl}>Sosyal Medya</label></div>
      {[['facebook','Facebook'],['twitter','Twitter / X'],['instagram','Instagram'],['youtube','YouTube URL']].map(([k,l])=>(
        <div key={k} style={row}><label style={lbl}>{l}</label><input style={inp} value={block.data[k]||''} onChange={e=>set(k,e.target.value)} placeholder={k==='youtube'?'https://youtube.com/...':'@kullanici'}/></div>
      ))}
    </div>;
    case 'form': return <div>
      <div style={row}><label style={lbl}>Form Başlığı</label><input style={inp} value={block.data.title||''} onChange={e=>set('title',e.target.value)} placeholder="Geri Bildirim..."/></div>
      {['field1','field2','field3'].map((k,i)=>(
        <div key={k} style={row}><label style={lbl}>Alan {i+1}</label><input style={inp} value={block.data[k]||''} onChange={e=>set(k,e.target.value)} placeholder={`Alan ${i+1} etiketi...`}/></div>
      ))}
      <div style={row}><label style={lbl}>Buton Metni</label><input style={inp} value={block.data.submit||''} onChange={e=>set('submit',e.target.value)} placeholder="Gönder"/></div>
    </div>;
    case 'googleform': return <div>
      <div style={row}><label style={lbl}>Google Form URL</label>
        <input style={inp} value={block.data.url||''} onChange={e=>set('url',e.target.value)} placeholder="https://forms.gle/... veya https://docs.google.com/forms/..."/>
        <div style={{fontSize:10,color:'#6b7280',marginTop:4,lineHeight:1.4}}>Google Form'u açın → Sağ üst — Gönder → İframe kodunu kopyala → src= içindeki linki buraya yapıştırın</div>
      </div>
      <div style={row}><label style={lbl}>Başlık</label><input style={inp} value={block.data.title||''} onChange={e=>set('title',e.target.value)} placeholder="Form başlığı..."/></div>
      <div style={row}><label style={lbl}>Yükseklik (px)</label>
        <select style={inp} value={block.data.height||'520'} onChange={e=>set('height',e.target.value)}>
          {['400','520','640','800','1000'].map(h=><option key={h} value={h}>{h}px</option>)}
        </select>
      </div>
    </div>;
    default: return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────
export default function BultenReadPage() {
  const a11y = useAccessibility({ storagePrefix: 'bulten_a11y_' });
  const dragTypeRef = React.useRef<BT|null>(null);
  const [dropIndicator, setDropIndicator] = React.useState<number|null>(null);
  const [title,    setTitle]    = useState('The Weekly Update');
  const [subtitle, setSubtitle] = useState('#1  •  March 24th, 2026');
  const [design,        setDesign]        = useState<Design>('modern');
  const [showTOC,       setShowTOC]       = useState(true);
  const [logoUrl,       setLogoUrl]       = useState('');
  const [headerImgUrl,  setHeaderImgUrl]  = useState('');
  const [previewMode,   setPreviewMode]   = useState<'desktop'|'mobile'>('desktop');
  const draggedBlockIdRef = React.useRef<string|null>(null);

  const [blocks,        _setBlocks]       = useState<Block[]>([
    { id:uid(), type:'title',     data:{ text:'Use titles for easy scanning', size:'h2'} },
    { id:uid(), type:'paragraph', data:{ text:'You can use a paragraph block to write a welcome message, explain assignments, or share an inspiration for the week.\n\nThe more your readers know about what\'s happening, the better they can support your goals.' } },
    { id:uid(), type:'photos',    data:{ url:'', caption:'Add a photo to personalize your newsletter!' } },
    { id:uid(), type:'separator', data:{ style:'solid' } },
    { id:uid(), type:'event',     data:{ title:'Proje Toplantısı', date:'2026-04-01', time:'14:00', location:'Online — Zoom' } },
  ]);

  const historyRef = React.useRef<{ past: Block[][], future: Block[][] }>({ past: [], future: [] });

  const setBlocks = React.useCallback((val: React.SetStateAction<Block[]>) => {
    _setBlocks(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > 50) historyRef.current.past.shift();
        historyRef.current.future = [];
      }
      return next;
    });
  }, []);

  const handleUndo = React.useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    _setBlocks(prev => {
      const previous = historyRef.current.past.pop()!;
      historyRef.current.future.push(prev);
      return previous;
    });
  }, []);

  const handleRedo = React.useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    _setBlocks(prev => {
      const next = historyRef.current.future.pop()!;
      historyRef.current.past.push(prev);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) { e.preventDefault(); handleRedo(); }
        else { e.preventDefault(); handleUndo(); }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [selectedId,    setSelectedId]    = useState<string|null>(blocks[0].id);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [published,     setPublished]     = useState(false);
  const [activeTab,     setActiveTab]     = useState<'design'|'content'>('content');
  const [designSubTab,  setDesignSubTab]  = useState<'backgrounds'|'colors'|'fonts'>('backgrounds');
  const [lang, setLang] = useState<Lang>('tr');
  const t = T[lang];
  const [isGenerating, setIsGenerating] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Auto-save / Restore logic ───────────────────────────────────────
  const DRAFT_KEY = 'bulten_draft_v1';
  
  // On mount: Restore
  React.useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data && data.blocks && data.blocks.length > 0) {
          setTitle(data.title || 'Yeni Bülten');
          setSubtitle(data.subtitle || '');
          setDesign(data.design || 'modern');
          setLogoUrl(data.logoUrl || '');
          setHeaderImgUrl(data.headerImgUrl || '');
          const safeBlocks = data.blocks.filter((b: any) => b && typeof b === 'object' && b.id);
          if (safeBlocks.length) {
             setBlocks(safeBlocks);
             setSelectedId(safeBlocks[0].id);
          }
        }
      } catch(e) {}
    }
  }, []);

  // On change: Save
  React.useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, subtitle, design, logoUrl, headerImgUrl, blocks }));
  }, [title, subtitle, design, logoUrl, headerImgUrl, blocks]);

  // ── Text-to-Speech ──────────────────────────────────────────────────
  // ── Notebook Sync ─────────────────────────────────────────────────────
  // On mount, fetch any payload sent from Google Notebook LM and apply it to the editor state.
  // This runs only once per page load.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/notebook-sync')
      .then(r => {
        if (!r.ok) throw new Error('No notebook payload');
        return r.json();
      })
      .then(data => {
        // Apply payload fields if they exist.
        if (data.title) setTitle(data.title);
        if (data.subtitle) setSubtitle(data.subtitle);
        if (data.design) setDesign(data.design);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.headerImgUrl) setHeaderImgUrl(data.headerImgUrl);
        if (Array.isArray(data.blocks) && data.blocks.length) {
          const safeBlocks = data.blocks.filter((b: any) => b && typeof b === 'object' && b.id);
          if (safeBlocks.length) {
             setBlocks(safeBlocks);
             setSelectedId(safeBlocks[0].id);
          }
        }
      })
      .catch(err => {
        // Silently ignore if no payload – normal operation.
        console.debug('Notebook sync not available:', err.message);
      });
  }, []);

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToRead = blocks
      .map(b => {
        if (b.type === 'title') return b.data.text;
        if (b.type === 'paragraph') return b.data.text;
        if (b.type === 'textphoto') return b.data.text;
        if (b.type === 'event') return `${b.data.title}. Tarih: ${b.data.date}, Yer: ${b.data.location}`;
        return '';
      })
      .filter(Boolean)
      .join('. ');

    const fullText = `${title}. ${subtitle}. ${textToRead}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    const targetPrefix = lang === 'en' ? 'en' : 'tr';
    utterance.lang = lang === 'en' ? 'en-GB' : 'tr-TR';
    
    // Evaluate best female voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix));
    
    let bestVoice = matchingVoices[0] || voices[0] || null;
    let maxScore = -999;
    
    const femaleNames = ['zira','aria','sonia','emelie','natasha','samantha','victoria','karen','tessa','kız','kadın','ayda','emine','gizem','derya','meltem','selin','yelda','emel'];
    const maleNames = ['david','mark','george','arthur','tolga','cem','erkek','ahmet','kemal','hakan','male','man'];

    matchingVoices.forEach(v => {
      let score = 0;
      const n = v.name.toLowerCase();
      if (maleNames.some(m => n.includes(m))) score -= 100;
      if (n.includes('female') || n.includes('woman') || femaleNames.some(f => n.includes(f))) score += 50;
      if (n.includes('premium') || n.includes('enhanced') || n.includes('natural')) score += 20;
      if (n.includes('google')) score += 10;
      if (n.includes('microsoft')) score += 5;
      if (targetPrefix === 'tr' && n.includes('google') && n.includes('türkçe')) score += 30;
      if (targetPrefix === 'en' && (n.includes('british') || n.includes('uk')) && n.includes('female')) score += 50;
      if (targetPrefix === 'en' && n.includes('google') && n.includes('english') && (n.includes('female') || n.includes('uk'))) score += 30;

      if (score > maxScore) {
        maxScore = score;
        bestVoice = v;
      }
    });

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // ── IP-based language detection (on mount) ──────────────────────────
  React.useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r=>r.json())
      .then(data=>{
        if(data.country_code && data.country_code!=='TR') setLang('en');
        else setLang('tr');
      })
      .catch(()=>{}); // silently fallback
  }, []);

  // ── Translate blocks via OpenAI ──────────────────────────────────────
  const [translating, setTranslating] = React.useState(false);

  const translateBlocks = useCallback(async (targetLang: Lang) => {
    const textBlocks = blocks.filter(b => b.type==='title'||b.type==='paragraph'||b.type==='event'||b.type==='button'||b.type==='link');
    if (textBlocks.length === 0 && !title && !subtitle) return;
    setTranslating(true);
    try {
      const langName = targetLang==='en' ? 'English' : 'Turkish';
      const payload: {id:string, type:string, fields:Record<string,string>}[] = textBlocks.map(b=>({
        id: b.id,
        type: b.type,
        fields: Object.fromEntries(Object.entries(b.data).filter(([k])=>['text','title','caption','location'].includes(k)))
      }));
      
      // Include global text attributes so they get parsed too
      if (title.trim()) payload.push({ id: 'GLOBAL_TITLE', type: 'global', fields: { text: title } });
      if (subtitle.trim()) payload.push({ id: 'GLOBAL_SUBTITLE', type: 'global', fields: { text: subtitle } });

      const res = await fetch('/api/ai-generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          systemPrompt: 'You are a translation API. Return ONLY raw, valid JSON array of objects. No markdown, no triple backticks, no explanations. Exact structure matching the input array.',
          prompt: `Translate the ALL values in 'fields' to ${langName}. Output ONLY the JSON array.\n${JSON.stringify(payload)}`,
          maxTokens: 2000
        })
      });
      if(!res.ok) return;
      const data = await res.json();
      try {
        const translated: {id:string; fields:Record<string,string>}[] = JSON.parse(data.result.replace(/```json|```/g,'').trim());
        
        const trTitle = translated.find(t=>t.id==='GLOBAL_TITLE');
        if (trTitle && trTitle.fields.text) setTitle(trTitle.fields.text);
        
        const trSub = translated.find(t=>t.id==='GLOBAL_SUBTITLE');
        if (trSub && trSub.fields.text) setSubtitle(trSub.fields.text);

        setBlocks(prev => prev.map(b => {
          const tr = translated.find(t=>t.id===b.id);
          if(!tr) return b;
          return { ...b, data: { ...b.data, ...tr.fields } };
        }));
      } catch(e){
        console.error('Translation JSON parse error:', e, data.result);
      }
    } finally { setTranslating(false); }
  }, [blocks, title, subtitle]);

  const handleLangSwitch = (l: Lang) => {
    setLang(l);
    translateBlocks(l);
  };

  type SavedNL = { id:string; title:string; subtitle:string; design:Design; blocks:Block[]; logoUrl:string; headerImgUrl:string; showTOC:boolean; savedAt:string; };

  const [showSavedModal, setShowSavedModal] = React.useState(false);
  const [savedList, setSavedList] = React.useState<SavedNL[]>([]);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSave = async () => {
    const entry: SavedNL = { id:uid(), title, subtitle, design, blocks, logoUrl, headerImgUrl, showTOC, savedAt:new Date().toISOString() };
    const next = [entry,...savedList].slice(0,20);
    setSavedList(next);
    setSaveSuccess(true); setTimeout(()=>setSaveSuccess(false),2000);
    try {
      await fetch('/api/db/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch(e) {
      console.error('Failed to save to DB:', e);
      alert('Bülten kaydedilemedi. Lütfen giriş yaptığınızdan emin olun.');
    }
  };

  const handleLoad = (s:SavedNL) => {
    setTitle(s.title); setSubtitle(s.subtitle); setDesign(s.design);
    setBlocks(s.blocks); setLogoUrl(s.logoUrl||''); setHeaderImgUrl(s.headerImgUrl||'');
    setShowTOC(s.showTOC); setSelectedId(null); setShowSavedModal(false);
  };

  const handleDelete = async (id:string) => {
    const next = savedList.filter(s=>s.id!==id);
    setSavedList(next);
    try {
      await fetch(`/api/db/newsletters?id=${id}`, { method: 'DELETE' });
    } catch(e) {}
  };

  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = React.useState(false);
  const [copyDone, setCopyDone] = React.useState<string|null>(null);

  // Analytics helpers
  const [analytics, setAnalytics] = React.useState<{views:number, lastWeek:number, opens:number, clicks:number}>({views:0, lastWeek:0, opens:0, clicks:0});
  // Fetch real analytics when modal opens
  const openAnalytics = async () => {
    try {
      const res = await fetch('/api/db/analytics');
      const data = await res.json();
      setAnalytics({
        views: data.totalOpens || 0,
        opens: data.uniqueOpens || 0,
        clicks: data.totalClicks || 0,
        lastWeek: data.uniqueOpens || 0
      });
    } catch(e) {}
    setShowAnalyticsModal(true);
  };
  // Derived analytics from blocks
  const wordCount = blocks.filter(b=>b.type==='paragraph'||b.type==='title').reduce((acc,b)=>acc+(b.data.text||'').split(/\s+/).length,0);
  const readingTime = Math.max(1,Math.round(wordCount/200));
  const [analyticsTab, setAnalyticsTab] = React.useState<string>('overview');

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

  const [showTemplatesModal, setShowTemplatesModal] = React.useState(false);

  // ── Mailing List ─────────────────────────────────────────────────
  const ML_KEY = 'bulten_mailing_lists';
  type MLContact = { email:string; name:string; addedAt:string };
  type MailingList = { id:string; name:string; contacts:MLContact[]; createdAt:string };
  const [showMailModal, setShowMailModal] = React.useState(false);
  const [mailingLists, setMailingLists] = React.useState<MailingList[]>([]);
  
  React.useEffect(() => {
    // Load newsletters and mailing lists from DB
    fetch('/api/db/newsletters').then(r=>r.json()).then(d=>{
      if(Array.isArray(d)) setSavedList(d);
    }).catch(()=>{});

    fetch('/api/db/mailing-lists').then(r=>r.json()).then(d=>{
      if(Array.isArray(d)) setMailingLists(d);
    }).catch(()=>{});
  }, []);
  const [activeListId, setActiveListId] = React.useState<string|null>(null);
  const [newListName, setNewListName] = React.useState('');
  const [newContactEmail, setNewContactEmail] = React.useState('');
  const [newContactName, setNewContactName] = React.useState('');
  const [mlSearch, setMlSearch] = React.useState('');
  const [mlError, setMlError] = React.useState('');
  const [csvInput, setCsvInput] = React.useState('');
  const [showCsvPanel, setShowCsvPanel] = React.useState(false);
  const [showSendPrompt, setShowSendPrompt] = React.useState(false);
  const [customMsg, setCustomMsg] = React.useState('Merhaba,\n\nYeni bültenimiz yayında! Aşağıda kısa bir özetini bulabilirsiniz.');
  const [testEmail, setTestEmail] = React.useState('');

  const saveLists = async (lists: MailingList[]) => {
    setMailingLists(lists);
    try {
      await fetch('/api/db/mailing-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lists)
      });
    } catch(e) {}
  };
  const activeList = mailingLists.find(l=>l.id===activeListId)||null;
  const filteredContacts = (activeList?.contacts||[]).filter(c=>
    c.email.toLowerCase().includes(mlSearch.toLowerCase())||
    c.name.toLowerCase().includes(mlSearch.toLowerCase())
  );
  const createList = () => {
    if(!newListName.trim()) return;
    const nl:MailingList = {id:uid(),name:newListName.trim(),contacts:[],createdAt:new Date().toISOString()};
    const next=[...mailingLists,nl];
    saveLists(next); setActiveListId(nl.id); setNewListName('');
  };
  const addContact = () => {
    if(!activeList) return;
    const email = newContactEmail.trim().toLowerCase();
    if(!email||!/^[^@]+@[^@]+\.[^@]+$/.test(email)){setMlError('Geçerli e-posta girin');return;}
    if(activeList.contacts.some(c=>c.email===email)){setMlError('Bu e-posta zaten listede');return;}
    setMlError('');
    const next = mailingLists.map(l=>l.id===activeListId
      ?{...l,contacts:[...l.contacts,{email,name:newContactName.trim()||email,addedAt:new Date().toISOString()}]}
      :l);
    saveLists(next); setNewContactEmail(''); setNewContactName('');
  };
  const removeContact = (email:string) => {
    const next = mailingLists.map(l=>l.id===activeListId
      ?{...l,contacts:l.contacts.filter(c=>c.email!==email)}:l);
    saveLists(next);
  };
  const importCsv = () => {
    if(!activeList||!csvInput.trim()) return;
    const lines = csvInput.trim().split('\n');
    const existing = new Set(activeList.contacts.map(c=>c.email));
    let added=0, dupes=0;
    const newContacts:MLContact[]=[];
    lines.forEach(line=>{
      const [rawEmail,rawName=''] = line.split(',');
      const email=rawEmail.trim().toLowerCase();
      if(!email||!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return;
      if(existing.has(email)){dupes++;return;}
      existing.add(email);
      newContacts.push({email,name:rawName.trim()||email,addedAt:new Date().toISOString()});
      added++;
    });
    const next=mailingLists.map(l=>l.id===activeListId?{...l,contacts:[...l.contacts,...newContacts]}:l);
    saveLists(next);
    setCsvInput(''); setShowCsvPanel(false);
    setMlError(`${added} kişi eklendi${dupes>0?`, ${dupes} tekrar atlandı`:''}`);
    setTimeout(()=>setMlError(''),4000);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsGenerating(true);
    try {
      // 1. Extract text from Document
      const fd = new FormData();
      fd.append('file', file);
      const parseRes = await fetch('/api/parse-file', { method: 'POST', body: fd });
      if (!parseRes.ok) throw new Error('Dosya okunamadı. Lütfen desteklenen bir format (PDF, DOCX, TXT) yükleyin.');
      const { text } = await parseRes.json();
      
      // 2. Generate Newsletter JSON via AI
      const prompt = `Aşağıdaki belge metninden profesyonel, ilgi çekici ve zengin içerikli bir e-bülten tasarla. 
Lütfen JSON formatında dön:
{
  "title": "Bülten Başlığı",
  "subtitle": "Alt başlık (ör. Sayı: 1 | Tarih)",
  "blocks": [
    { "type": "title", "data": { "text": "...", "size": "h2" } },
    { "type": "paragraph", "data": { "text": "..." } },
    { "type": "textphoto", "data": { "text": "...", "url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=640", "imagePos": "right" } },
    { "type": "separator", "data": { "style": "solid" } },
    { "type": "photogrid", "data": { "cols": "2", "url1": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=320", "cap1": "Açıklama 1", "url2": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=320", "cap2": "Açıklama 2" } },
    { "type": "poll", "data": { "question": "Görüşünüz?", "opt1": "Evet", "opt2": "Hayır", "opt3": "Belki" } }
  ]
}

Geçerli blok tipleri: title, paragraph, photos, textphoto, photogrid, author, form, googleform, video, event, separator, link, button, poll, attachment.
Önemli Notlar: Metnin içeriğine göre en uygun blokları (özellikle görsel ve etkileşimli blokları) gerçekçi placeholder Unsplash resimleriyle hayal et. Hedef kitleye (paydaşlar, ortaklar) seslenen profesyonel bir dil kullan. Yalnızca JSON objesini yaz, başında veya sonunda markdown karakterleri kullanma.

BELGE METNİ:
${text}`;

      const aiRes = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await aiRes.json();
      let rawJson = data.reply || '';
      rawJson = rawJson.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const generated = JSON.parse(rawJson);
      
      setTitle(generated.title || 'Yeni Bülten');
      setSubtitle(generated.subtitle || 'Otomatik Oluşturuldu');
      if (generated.blocks && Array.isArray(generated.blocks)) {
        // give them IDs
        const finalBlocks = generated.blocks.map((b: any) => ({ ...b, id: uid() }));
        setBlocks(finalBlocks);
      }
    } catch (err: any) {
      alert(err.message || 'Bülten oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateEmailBody = () => {
    let body = '';
    if (customMsg.trim()) body += customMsg.trim() + '\n\n-----------------------------------\n\n';
    body += `BÜLTEN: ${title}\n${subtitle}\n\n`;
    
    blocks.forEach(b => {
      if (b.type === 'title') body += `\n>> ${b.data.text}\n`;
      else if (b.type === 'paragraph' || b.type === 'textphoto') body += `${b.data.text}\n\n`;
      else if (b.type === 'button' || b.type === 'link') body += `[🔗 Link: ${b.data.text} - ${b.data.url}]\n\n`;
      else if (b.type === 'event') body += `📅 Etkinlik: ${b.data.title} | ${b.data.date} ${b.data.time} | Konum: ${b.data.location}\n\n`;
      else if (b.type === 'attachment') body += `📎 Ek: ${b.data.name || 'Dosya'} (${b.data.url})\n\n`;
    });
    
    body += `-----------------------------------\nTamamı ve tasarımı için lütfen tarayıcıda veya platformda görüntüleyin.`;
    return body;
  };

  const executeSend = async (isTest: boolean) => {
    setMlError('Gönderiliyor, lütfen bekleyin...');
    try {
      const htmlContent = generateHTML();
      let payload;

      if (isTest) {
        if (!testEmail) { setMlError('Lütfen geçerli bir test e-posta adresi girin'); setTimeout(()=>setMlError(''),3000); return; }
        payload = {
          subject: '[TEST] ' + title,
          html: htmlContent,
          customMsg: customMsg,
          contacts: [{ email: testEmail, name: 'Test Kullanıcısı' }]
        };
      } else {
        if(!activeList||activeList.contacts.length===0) return;
        payload = {
          subject: title,
          html: htmlContent,
          customMsg: customMsg,
          contacts: activeList.contacts
        };
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bilinmeyen bir hata oluştu');

      setMlError(isTest ? 'Test maili başarıyla gönderildi!' : 'Bülten başarıyla listeye gönderildi!');
      setTimeout(() => setMlError(''), 4000);
      if (!isTest) {
        setShowSendPrompt(false);
        setCustomMsg('');
      }

    } catch (err: any) {
      setMlError(`Hata: ${err.message}`);
    }
  };

  const bulkSend = () => {
    if(!activeList||activeList.contacts.length===0) return;
    setShowSendPrompt(true);
  };
  const btnCount = blocks.filter(b=>b.type==='button').length;
  const videoCount = blocks.filter(b=>b.type==='video').length;
  const linkCount = blocks.filter(b=>b.type==='link').length;
  const attachCount = blocks.filter(b=>b.type==='attachment').length;
  const formCount = blocks.filter(b=>b.type==='form'||b.type==='googleform').length;

  // Categorized background images
  const BG_CATEGORIES = [
    { id:'doga', label:'🌿 Doğa', images:[
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=640&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=640&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80',
      'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=640&q=80',
      'https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=640&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=640&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&q=80',
      'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80',
      'https://images.unsplash.com/photo-1487530811015-780c80ce0e68?w=640&q=80',
    ]},
    { id:'sehir', label:'🏙 Şehir', images:[
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&q=80',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=640&q=80',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=640&q=80',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=640&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=640&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=640&q=80',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=640&q=80',
      'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=640&q=80',
      'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=640&q=80',
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=640&q=80',
    ]},
    { id:'egitim', label:'📚 Eğitim', images:[
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=80',
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=640&q=80',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=640&q=80',
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=640&q=80',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=640&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=640&q=80',
      'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=640&q=80',
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=640&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=640&q=80',
    ]},
    { id:'soyut', label:'🎨 Soyut', images:[
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&q=80',
      'https://images.unsplash.com/photo-1550684848-86a5d8727436?w=640&q=80',
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=640&q=80',
      'https://images.unsplash.com/photo-1567359781514-81173b801d69?w=640&q=80',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=640&q=80',
      'https://images.unsplash.com/photo-1566041510394-cf7c1b1edc55?w=640&q=80',
      'https://images.unsplash.com/photo-1570059136358-0c321cb0dc97?w=640&q=80',
      'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=640&q=80',
      'https://images.unsplash.com/photo-1536152470836-b943b246224c?w=640&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&q=80',
    ]},
    { id:'karanlik', label:'🌑 Karanlık', images:[
      'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=640&q=80',
      'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=640&q=80',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=640&q=80',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&q=80',
      'https://images.unsplash.com/photo-1475274047050-1d0c0975864c?w=640&q=80',
      'https://images.unsplash.com/photo-1501472312651-726afe119ff1?w=640&q=80',
      'https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=640&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=640&q=80',
      'https://images.unsplash.com/photo-1501691223387-dd0500403074?w=640&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=640&q=80',
    ]},
    { id:'minimalist', label:'⬜ Minimalist', images:[
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=640&q=80',
      'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=640&q=80',
      'https://images.unsplash.com/photo-1527614919459-7ad5a5b19d30?w=640&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&q=80',
      'https://images.unsplash.com/photo-1492366254240-43affaefc3e3?w=640&q=80',
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=640&q=80',
      'https://images.unsplash.com/photo-1517816428104-797678c7cf0c?w=640&q=80',
      'https://images.unsplash.com/photo-1490750967868-88df5691cc13?w=640&q=80',
      'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=640&q=80',
    ]},
  ];
  const [bgCategory, setBgCategory] = React.useState('doga');
  const currentBgImages = BG_CATEGORIES.find(c=>c.id===bgCategory)?.images || [];

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    setHeaderImgUrl(url);
  };

  const D = DESIGNS[design] || DESIGNS['modern'];
  const selectedBlock = blocks.find(b=> b && b.id===selectedId)||null;

  const addBlock = useCallback((type:BT)=>{
    const p = PALETTE.find(x=>x.type===type)!;
    const nb:Block = { id:uid(), type, data:{...p.def} };
    setBlocks(prev=>[...prev,nb]);
    setSelectedId(nb.id);
  },[]);

  const [insertAtIdx, setInsertAtIdx] = React.useState<number|null>(null);
  const [insertMenuOpen, setInsertMenuOpen] = React.useState(false);

  const insertBlock = useCallback((type:BT, at:number)=>{
    const p = PALETTE.find(x=>x.type===type)!;
    const nb:Block = { id:uid(), type, data:{...p.def} };
    setBlocks(prev=>{ const next=[...prev]; next.splice(at,0,nb); return next; });
    setSelectedId(nb.id);
    setInsertMenuOpen(false);
    setInsertAtIdx(null);
  },[]);

  const updateBlock = useCallback((id:string, data:Record<string,string>)=>{
    setBlocks(prev=>prev.map(b=>b.id===id?{...b,data}:b));
  },[]);

  const deleteBlock = useCallback((id:string)=>{
    setBlocks(prev=>{
      const next=prev.filter(b=>b.id!==id);
      setSelectedId(next.length?next[next.length-1].id:null);
      return next;
    });
  },[]);

  const moveBlock = useCallback((id:string,dir:-1|1)=>{
    setBlocks(prev=>{
      const i=prev.findIndex(b=>b.id===id), ni=i+dir;
      if(ni<0||ni>=prev.length) return prev;
      const n=[...prev]; [n[i],n[ni]]=[n[ni],n[i]]; return n;
    });
  },[]);

  const handleAI = useCallback(async(mode: 'generate'|'rewrite'|'expand-short'|'expand-long'|'expand-bullets')=>{
    if(!selectedBlock||selectedBlock.type!=='paragraph') return;
    setAiLoading(true);
    let prompt = '';
    const currentText = selectedBlock.data.text || '';
    if (mode === 'rewrite') {
      prompt = `Aşağıdaki bülten metnini daha profesyonel, akıcı ve ilgi çekici bir şekilde yeniden yaz:\n\n"${currentText}"`;
    } else if (mode === 'expand-short') {
      prompt = `Aşağıdaki bülten metnini biraz detaylandır ve açıklayıcı eklemeler yaparak %50 oranında uzat:\n\n"${currentText}"`;
    } else if (mode === 'expand-long') {
      prompt = `Aşağıdaki bülten metnini detaylandır, açıklayıcı eklemeler yaparak daha uzun ve zengin bir içeriğe dönüştür (yaklaşık 2-3 katı uzunlukta):\n\n"${currentText}"`;
    } else if (mode === 'expand-bullets') {
      prompt = `Aşağıdaki bülten metnini uzat ve önemli kısımlarını madde işaretli liste (bullet points) kullanarak detaylandır:\n\n"${currentText}"`;
    } else {
      prompt = `AB projesi bülteni için kısa, profesyonel paragraflar üret. Konu fikri olarak şundan ilham al veya sıfırdan yaz: "${currentText || 'proje genel ilerleme durumu'}". Eğlenceli ama resmi ol.`;
    }

    try {
      const res = await fetch('/api/ai-generate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ prompt, maxTokens:800, systemPrompt: 'You are an expert newsletter copywriter. Return ONLY the requested text without markdown formatting or introductory words.' })});
      if(res.ok){ const d=await res.json(); const t=d.result||''; if(t && !t.includes('kullanılamıyor')) updateBlock(selectedBlock.id,{...selectedBlock.data,text:t}); }
    } catch {
      updateBlock(selectedBlock.id,{...selectedBlock.data,text:'AI içerik üretimi şu an kullanılamıyor. Lütfen API anahtarınızı kontrol edin.'});
    } finally { setAiLoading(false); }
  },[selectedBlock,updateBlock]);

  // HTML export
  const generateHTML = useCallback(()=>{
    const blockHtml = blocks.map(b=>{
      const d=b.data; const ac=D.accentColor; const tc=D.textColor; const ff=D.font;
      if(b.type==='title'){const sz={h1:'28px',h2:'22px',h3:'18px'}[d.size||'h2'];return `<${d.size||'h2'} style="color:${ac};font-size:${sz};font-family:${ff};font-weight:800;margin:0 0 8px;">${d.text}</${d.size||'h2'}>`;}
      if(b.type==='paragraph') return `<p style="color:${tc};font-size:15px;line-height:1.75;font-family:${ff};margin:0 0 8px;white-space:pre-wrap;">${d.text}</p>`;
      if(b.type==='photos') {
        if(d.layout === 'columns') {
          return `<div style="display:flex;gap:12px;">
            <div style="flex:1;">${d.url?`<img src="${d.url}" alt="${d.caption||''}" style="width:100%;border-radius:8px;display:block;"/>`:''} ${d.caption?`<p style="margin:6px 0 0;font-size:12px;color:#64748b;font-family:${ff};text-align:center;">${d.caption}</p>`:''}</div>
            <div style="flex:1;">${d.url2?`<img src="${d.url2}" alt="${d.caption2||''}" style="width:100%;border-radius:8px;display:block;"/>`:''} ${d.caption2?`<p style="margin:6px 0 0;font-size:12px;color:#64748b;font-family:${ff};text-align:center;">${d.caption2}</p>`:''}</div>
          </div>`;
        }
        return d.url?`<img src="${d.url}" alt="${d.caption||''}" style="width:100%;border-radius:8px;display:block;"/>`:`<div style="height:80px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-family:${ff};">🖼 Görsel ekleyin</div>`;
      }

      if(b.type==='video'){const v=ytId(d.url||'');return v?`<div style="position:relative;padding-bottom:56.25%;height:0;"><iframe src="https://www.youtube.com/embed/${v}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`:``;}
      if(b.type==='event') return `<div style="border-left:4px solid ${ac};padding:8px 16px;font-family:${ff};"><b style="color:${ac};">${d.title}</b>${d.date?`<br/><span style="color:${tc};font-size:13px;">📅 ${d.date} ${d.time}</span>`:''}${d.location?`<br/><span style="color:${tc};font-size:13px;">📍 ${d.location}</span>`:''}</div>`;
      if(b.type==='separator') return `<hr style="border:none;border-top:2px ${d.style} ${ac};margin:8px 0;"/>`;
      if(b.type==='link') return `<a href="${d.url}" style="color:${ac};font-family:${ff};font-weight:600;">🔗 ${d.text}</a>`;
      if(b.type==='button') return `<div style="text-align:${d.align||'center'};"><a href="${d.url}" style="display:inline-block;padding:12px 28px;background:${ac};color:#fff;border-radius:30px;font-family:${ff};font-weight:700;text-decoration:none;">${d.text}</a></div>`;
      if(b.type==='poll') return `<div style="font-family:${ff};"><b style="color:${tc};">${d.question}</b><br/>${[d.opt1,d.opt2,d.opt3].filter(Boolean).map(o=>`<div style="padding:8px 14px;border:1.5px solid ${ac};border-radius:8px;margin-top:6px;color:${tc};font-size:14px;">○ ${o}</div>`).join('')}</div>`;
      if(b.type==='attachment') return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:${ff};">📎 <a href="${d.url}" style="color:${ac};font-weight:600;">${d.name}</a></div>`;
      
      if(b.type==='textphoto') {
        const imgRight = (d.imagePos||'right')==='right';
        return `<div style="display:flex;gap:16px;align-items:flex-start;flex-direction:${imgRight?'row':'row-reverse'};font-family:${ff};"><div style="flex:1;"><p style="margin:0;font-size:15px;line-height:1.75;color:${tc};white-space:pre-wrap;">${d.text||''}</p></div><div style="flex-shrink:0;width:180px;">${d.url?`<img src="${d.url}" style="width:100%;border-radius:8px;display:block;"/>`:''}</div></div>`;
      }
      if(b.type==='photogrid') {
        const cols = parseInt(d.cols||'2');
        const slots = Array.from({length:cols},(_,i)=>({url:d[`url${i+1}`]||'',cap:d[`cap${i+1}`]||''}));
        return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;font-family:${ff};">${slots.map(s=>`<div>${s.url?`<img src="${s.url}" style="width:100%;border-radius:8px;display:block;"/>`:''}${s.cap?`<p style="margin:4px 0 0;font-size:11px;color:#64748b;text-align:center;">${s.cap}</p>`:''}</div>`).join('')}</div>`;
      }
      if(b.type==='author') {
        return `<div style="border:1px solid ${ac}22;border-radius:12px;padding:20px;font-family:${ff};display:flex;gap:16px;align-items:flex-start;background:${ac}06;">${d.avatar?`<img src="${d.avatar}" style="width:68px;height:68px;border-radius:50%;object-fit:cover;flex-shrink:0;border:3px solid ${ac};"/>`:''}<div style="flex:1;"><div style="font-weight:800;font-size:16px;color:${tc};">${d.name||''}</div>${d.title?`<div style="font-size:13px;color:${ac};font-weight:600;margin-bottom:4px;">${d.title}</div>`:''}${d.bio?`<p style="font-size:13px;color:${tc};line-height:1.6;margin:6px 0 0;">${d.bio}</p>`:''}</div></div>`;
      }
      return '';
    }).map(h=>`<div style="padding:10px 0;">${h}</div>`).join('');

    const toc = showTOC ? `<div style="background:${D.accentColor}11;border-radius:8px;padding:14px 18px;margin-bottom:20px;border:1px solid ${D.accentColor}33;font-family:${D.font};">${blocks.filter(b=>b.type==='title').map(b=>`<div style="color:${D.accentColor};font-size:13px;font-weight:600;margin-bottom:4px;">→ ${b.data.text}</div>`).join('')}</div>` : '';
    const headerBgStyle = headerImgUrl ? `background:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${headerImgUrl}) center/cover no-repeat;` : `background:${D.headerBg};`;

    const embeddedTextToRead = blocks.map(b => (b.type==='title'||b.type==='paragraph'||b.type==='textphoto'||b.type==='event') ? b.data.title||b.data.text||'' : '').filter(Boolean).join('. ');
    const fullEmbeddedText = `${title}. ${subtitle}. ${embeddedTextToRead}`.replace(/"/g, '\\"').replace(/\n/g, ' ');

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;color-adjust:exact;print-color-adjust:exact;}body{background:#e5e7eb;font-family:${D.font};}a{text-decoration:none;}@media print{body{background:#fff!important;}div[style*="border-radius:12px"]{box-shadow:none!important;border-radius:0!important;margin:0 auto!important;max-width:100%!important;}#speakBtn{display:none!important;}}</style></head><body><div style="max-width:640px;margin:24px auto;background:${D.bodyBg};border-radius:12px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.15);position:relative;"><div style="${headerBgStyle}padding:36px 40px;text-align:center;position:relative;"><button id="speakBtn" onclick="window.bultenSpeak()" style="position:absolute;top:20px;right:24px;background:#fff;border:none;color:#1e293b;border-radius:30px;padding:8px 16px;display:flex;gap:6px;justify-content:center;align-items:center;cursor:pointer;font-size:13px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:${D.font};"><span id="speakIcon" style="font-size:16px;">🔊</span> <span id="speakText">Dinle</span></button><h1 style="color:${headerImgUrl?'#ffffff':D.headerColor};text-shadow:${headerImgUrl?'0 2px 10px rgba(0,0,0,0.8)':'none'};font-size:26px;font-weight:800;margin:0 0 6px;font-family:${D.font};">${title}</h1><p style="color:${headerImgUrl?'#ffffff':D.headerColor};text-shadow:${headerImgUrl?'0 2px 10px rgba(0,0,0,0.8)':'none'};opacity:${headerImgUrl?'1':'.8'};font-size:13px;font-family:${D.font};">${subtitle}</p></div><div style="padding:32px 40px;">${toc}${blockHtml}</div><div style="background:${D.headerBg};padding:16px 40px;text-align:center;"><p style="color:${D.headerColor};opacity:.6;font-size:12px;font-family:${D.font};">Bu bülten Project Factory AI ile oluşturulmuştur.</p></div></div>
    <script>
      window.bultenIsSpeaking = false;
      window.bultenSpeak = function() {
        if(window.bultenIsSpeaking) { window.speechSynthesis.cancel(); window.bultenIsSpeaking=false; document.getElementById('speakIcon').innerText='🔊'; document.getElementById('speakText').innerText='Dinle'; return; }
        var u = new SpeechSynthesisUtterance("${fullEmbeddedText}");
        var targetPrefix = "${lang === 'en' ? 'en' : 'tr'}";
        u.lang = "${lang === 'en' ? 'en-GB' : 'tr-TR'}";
        
        var voices = window.speechSynthesis.getVoices();
        var matchingVoices = voices.filter(function(v) { return v.lang.toLowerCase().startsWith(targetPrefix); });
        var bestVoice = matchingVoices[0] || voices[0] || null;
        var maxScore = -999;
        var femaleNames = ['zira','aria','sonia','emelie','natasha','samantha','victoria','karen','tessa','kız','kadın','ayda','emine','gizem','derya','meltem','selin','yelda','emel'];
        var maleNames = ['david','mark','george','arthur','tolga','cem','erkek','ahmet','kemal','hakan','male','man'];
        matchingVoices.forEach(function(v) {
          var score = 0;
          var n = v.name.toLowerCase();
          if (maleNames.some(function(m){return n.includes(m);})) score -= 100;
          if (n.includes('female') || n.includes('woman') || femaleNames.some(function(f){return n.includes(f);})) score += 50;
          if (n.includes('premium') || n.includes('enhanced') || n.includes('natural')) score += 20;
          if (n.includes('google')) score += 10;
          if (n.includes('microsoft')) score += 5;
          if (targetPrefix === 'tr' && n.includes('google') && n.includes('türkçe')) score += 30;
          if (targetPrefix === 'en' && (n.includes('british') || n.includes('uk')) && n.includes('female')) score += 50;
          if (targetPrefix === 'en' && n.includes('google') && n.includes('english') && (n.includes('female') || n.includes('uk'))) score += 30;
          if (score > maxScore) { maxScore = score; bestVoice = v; }
        });
        if (bestVoice) { u.voice = bestVoice; }

        u.onend = function() { window.bultenIsSpeaking=false; document.getElementById('speakIcon').innerText='🔊'; document.getElementById('speakText').innerText='Dinle'; };
        window.bultenIsSpeaking=true;
        document.getElementById('speakIcon').innerText='⏸';
        document.getElementById('speakText').innerText='Durdur';
        window.speechSynthesis.speak(u);
      };
    </script>
    </body></html>`;
  },[blocks,D,title,subtitle,showTOC,headerImgUrl,lang]);

  const handleExport = ()=>{
    const html=generateHTML();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
    a.download=`${title.replace(/\s+/g,'-').toLowerCase()}.html`; a.click();
  };

  const handlePdfExport = ()=>{
    const printHtml = generateHTML();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
    // Give images time to load before printing
    win.onload = () => { win.print(); };
    setTimeout(() => { try { win.print(); } catch(e){} }, 1800);
  };

  // ── Styles ──
  const panelHdr: React.CSSProperties = { fontSize:10,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:'#9ca3af',padding:'12px 14px 8px',borderBottom:'1px solid #e5e7eb',background:'#f9fafb' };
  // Auth state: set to false when Clerk is not configured (no NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  const isSignedIn = false;

  return (
    <>
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 60px)',fontFamily:'Inter,system-ui,sans-serif',background:'#f1f5f9'}}>

      {/* ── Top Bar ── */}
      <div style={{background:'#ffffff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',height:68,display:'flex',alignItems:'center',gap:8,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',zIndex:10}}>
        
        {/* Brand */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginRight:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg, #6366f1, #8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(99, 102, 241, 0.3)'}}>📰</div>
          <span style={{fontWeight:900,fontSize:18,color:'#0f172a',letterSpacing:'-0.5px',whiteSpace:'nowrap'}}>BÜLTEN <span style={{color:'#6366f1'}}>READ</span></span>
        </div>

        {/* Title inputs - taking less vertical space */}
        <div style={{display:'flex',flexDirection:'column',gap:2,flex:1,maxWidth:320,marginLeft:8}}>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            style={{padding:'4px 8px',borderRadius:6,border:'1px solid transparent',background:'transparent',fontSize:15,fontWeight:800,color:'#0f172a',outline:'none',transition:'all .2s'}}
            onFocus={e=>{(e.target as HTMLInputElement).style.background='#f8fafc';(e.target as HTMLInputElement).style.border='1px solid #e2e8f0';}} 
            onBlur={e=>{(e.target as HTMLInputElement).style.background='transparent';(e.target as HTMLInputElement).style.border='1px solid transparent';}}
            placeholder="Bülten başlığı..."/>
          <input value={subtitle} onChange={e=>setSubtitle(e.target.value)}
            style={{padding:'2px 8px',borderRadius:6,border:'1px solid transparent',background:'transparent',fontSize:12,color:'#64748b',outline:'none',transition:'all .2s',fontWeight:500}}
            onFocus={e=>{(e.target as HTMLInputElement).style.background='#f8fafc';(e.target as HTMLInputElement).style.border='1px solid #e2e8f0';}} 
            onBlur={e=>{(e.target as HTMLInputElement).style.background='transparent';(e.target as HTMLInputElement).style.border='1px solid transparent';}}
            placeholder="#1  •  Tarih..."/>
        </div>

        {/* Separator to move actions to right */}
        <div style={{flex:1}} />

        {/* Compact Actions */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{display:'flex',background:'#f1f5f9',borderRadius:10,padding:4,border:'1px solid #e2e8f0',marginRight:8}}>
            <button onClick={()=>setPreviewMode('desktop')}
              style={{background:previewMode==='desktop'?'#fff':'transparent',border:'none',borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:700,color:previewMode==='desktop'?'#0f172a':'#64748b',cursor:'pointer',boxShadow:previewMode==='desktop'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .2s'}}>💻 Masaüstü</button>
            <button onClick={()=>setPreviewMode('mobile')}
              style={{background:previewMode==='mobile'?'#fff':'transparent',border:'none',borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:700,color:previewMode==='mobile'?'#0f172a':'#64748b',cursor:'pointer',boxShadow:previewMode==='mobile'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .2s'}}>📱 Mobil</button>
          </div>
          
          {/* Action Buttons styled softly */}
          <button onClick={handleExport} title="HTML Olarak İndir" style={{display:'flex',alignItems:'center',gap:6,background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            <span style={{fontSize:15}}>⬇️</span> HTML
          </button>
          
          <button onClick={handlePdfExport} title="PDF Olarak Al" style={{display:'flex',alignItems:'center',gap:6,background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            <span style={{fontSize:15}}>📄</span> PDF
          </button>

          <div style={{width:1,height:24,background:'#e2e8f0',margin:'0 4px'}}/>

          <input type="file" accept=".pdf,.docx,.txt,.md" style={{display:'none'}} ref={fileInputRef} onChange={handleDocumentUpload} />
          
          <button onClick={()=>fileInputRef.current?.click()} disabled={isGenerating} title="Belgeden Bülten Üret (AI)"
            style={{display:'flex',alignItems:'center',gap:6,background:'linear-gradient(135deg, #a855f7, #7e22ce)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:isGenerating?'not-allowed':'pointer',padding:'8px 16px',borderRadius:8,opacity:isGenerating?0.7:1,boxShadow:'0 4px 12px rgba(126,34,206,0.25)',transition:'all .2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
            <span style={{fontSize:16}}>{isGenerating ? '⏳' : '✨'}</span> AI Üret
          </button>

          <button onClick={()=>setShowTemplatesModal(true)} title="Hazır Şablonlar"
            style={{background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',display:'flex',alignItems:'center',gap:6,borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            🎨 Şablonlar
          </button>
          
          <button onClick={openAnalytics} title="Bülten İstatistikleri"
            style={{background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer',padding:'8px 14px',display:'flex',alignItems:'center',gap:6,borderRadius:8,transition:'all .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.color='#0f172a'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='#ffffff';(e.currentTarget as HTMLElement).style.color='#475569'}}>
            📊 Analiz
          </button>

          <button onClick={()=>setShowMailModal(true)} title={`Mail Gönder (${isMounted ? mailingLists.reduce((a,c)=>a+c.contacts.length,0) : 0} kişi)`}
            style={{background:'linear-gradient(135deg, #ec4899, #e11d48)',border:'none',color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,marginLeft:4,boxShadow:'0 4px 12px rgba(225,29,72,0.25)',transition:'all .2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
            📤 Gönder
          </button>

          <div style={{display:'flex',background:'#f1f5f9',borderRadius:10,padding:4,border:'1px solid #e2e8f0',marginLeft:8}}>
            <button onClick={()=>setShowSavedModal(true)} title="Kayıtlı Bültenleri Aç"
              style={{background:'transparent',border:'none',color:'#0ea5e9',fontSize:13,fontWeight:800,cursor:'pointer',padding:'6px 14px',borderRadius:6,transition:'all .2s'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#e0f2fe'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
              📂 Aç
            </button>
            <button onClick={()=>{ handleSave(); setBlocks([]); setTitle('Yeni Bülten'); setSubtitle('#1  •  ' + new Date().toLocaleDateString('tr-TR')); setHeaderImgUrl(''); setLogoUrl(''); }} title="Yeni boş bülten aç"
              style={{background:'transparent',border:'none',color:'#10b981',fontSize:13,fontWeight:800,cursor:'pointer',padding:'6px 14px',borderRadius:6,transition:'all .2s'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#d1fae5'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
              ✨ Yeni
            </button>
            <button onClick={handleSave} title="Kaydet"
              style={{background:saveSuccess?'#10b981':'#0ea5e9',border:'none',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer',padding:'6px 16px',borderRadius:6,boxShadow:'0 2px 6px rgba(14,165,233,0.3)',transition:'all .2s'}}>
              {saveSuccess ? 'OK!' : '💾 Kaydet'}
            </button>
          </div>

          <div style={{width:1,height:24,background:'#e2e8f0',margin:'0 4px'}}/>
          
          {/* Auth button — Clerk keys required for full login functionality */}
          <button style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontWeight:700,fontSize:13,cursor:'default',opacity:0.6}} title="Giriş yapmak için Clerk API anahtarları gerekli">
            👤 Hesap
          </button>
        </div>
      </div>

      {/* ── 3-Panel ── */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'240px 1fr 280px',overflow:'hidden'}}>

        {/* LEFT — palette + design */}
        <div style={{background:'#fff',borderRight:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'4px 0 16px rgba(0,0,0,0.02)',zIndex:5}}>
          {/* Tabs */}
          <div style={{display:'flex',borderBottom:'1px solid #e5e7eb'}}>
            {(['content','design'] as const).map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                style={{flex:1,padding:'10px 0',fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
                  background: activeTab===tab?'#fff':'#f9fafb',
                  color: activeTab===tab?D.accentColor:'#6b7280',
                  borderBottom: activeTab===tab?`2px solid ${D.accentColor}`:'2px solid transparent'}}>
                {tab==='content'?t.addContent:t.chooseDesign}
              </button>
            ))}
          </div>

          {activeTab==='content' ? (
            <div style={{overflowY:'auto',flex:1}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0}} id="block-palette">
                {PALETTE.map(p=>(
                  <button key={p.type}
                    draggable
                    onDragStart={e=>{ dragTypeRef.current=p.type; e.dataTransfer.effectAllowed='copy'; }}
                    onClick={()=>addBlock(p.type)}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'14px 4px',
                      border:'none',borderRight:'1px solid #f3f4f6',borderBottom:'1px solid #f3f4f6',
                      background:'#fff',cursor:'grab',gap:5,transition:'background .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f0f9ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
                    <span style={{fontSize:20,lineHeight:1}}>{p.icon}</span>
                    <span style={{fontSize:10.5,color:'#374151',fontWeight:600}}>{t[p.type as keyof typeof t] as string || p.label}</span>
                  </button>
                ))}
              </div>

              {/* TOC toggle */}
              <div style={{padding:'12px 14px',borderTop:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{t.toc}</span>
                <div onClick={()=>setShowTOC(x=>!x)}
                  style={{width:40,height:22,borderRadius:11,background:showTOC?D.accentColor:'#d1d5db',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                  <div style={{position:'absolute',top:3,left:showTOC?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                </div>
              </div>

              {/* Block list */}
              <div style={{borderTop:'1px solid #e5e7eb'}}>
                <div style={panelHdr}>{t.blocks} ({blocks.length})</div>
                <div style={{overflowY:'auto',maxHeight:180}}>
                  {blocks.map((b,i)=>{
                    const p=PALETTE.find(x=>x.type===b.type)!;
                    return (
                      <div key={b.id} onClick={()=>setSelectedId(b.id)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',cursor:'pointer',
                          background:selectedId===b.id?'#eff6ff':'transparent',
                          borderLeft:selectedId===b.id?`3px solid ${D.accentColor}`:'3px solid transparent',transition:'all .1s'}}>
                        <span style={{fontSize:14}}>{p.icon}</span>
                        <span style={{flex:1,fontSize:12,color:'#374151',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {(b.data.text||b.data.title||p.label).slice(0,20)}
                        </span>
                        <div style={{display:'flex',gap:1}}>
                          <button onClick={e=>{e.stopPropagation();moveBlock(b.id,-1);}} disabled={i===0} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:9,padding:'1px 3px'}}>▲</button>
                          <button onClick={e=>{e.stopPropagation();moveBlock(b.id,1);}} disabled={i===blocks.length-1} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:9,padding:'1px 3px'}}>▼</button>
                          <button onClick={e=>{e.stopPropagation();deleteBlock(b.id);}} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:11,padding:'1px 3px'}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
              {/* Design sub-tabs */}
              <div style={{display:'flex',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                {(['backgrounds','colors','fonts'] as const).map(dsTab=>(
                  <button key={dsTab} onClick={()=>setDesignSubTab(dsTab)}
                    style={{flex:1,padding:'8px 0',fontSize:11,fontWeight:700,cursor:'pointer',border:'none',
                      background:designSubTab===dsTab?'#fff':'#f9fafb',
                      color:designSubTab===dsTab?D.accentColor:'#6b7280',
                      borderBottom:designSubTab===dsTab?`2px solid ${D.accentColor}`:'2px solid transparent',
                      textTransform:'capitalize'}}>
                    {dsTab==='backgrounds'?t.bgTab:dsTab==='colors'?t.colorTab:t.fontTab}
                  </button>
                ))}
              </div>

              <div style={{overflowY:'auto',flex:1,padding:10}}>
                {designSubTab==='backgrounds' && (
                  <>
                    {/* Choose design dropdown */}
                    <div style={{marginBottom:10}}>
                      <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:5}}>{t.designLabel}</label>
                      <select value={design} onChange={e=>setDesign(e.target.value as Design)}
                        style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',background:D.headerBg,color:D.headerColor,fontWeight:700,cursor:'pointer'}}>
                        {(Object.entries(DESIGNS) as [Design,DesignConfig][]).map(([k,c])=>(
                          <option key={k} value={k} style={{background:'#fff',color:'#1a1a2e'}}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Categorized Background Images */}
                    <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                      <button onClick={()=>setHeaderImgUrl('')}
                        style={{padding:'4px 8px',borderRadius:12,border:`1px solid ${headerImgUrl===''?'#0d9488':'#e5e7eb'}`,
                          background:headerImgUrl===''?'#f0fdfa':'#fff',color:headerImgUrl===''?'#0d9488':'#6b7280',
                          fontSize:10,fontWeight:700,cursor:'pointer'}}>Boş/Renk</button>
                      {BG_CATEGORIES.map(c=>(
                        <button key={c.id} onClick={()=>setBgCategory(c.id)}
                          style={{padding:'4px 8px',borderRadius:12,border:`1px solid ${bgCategory===c.id?'#ec4899':'#e5e7eb'}`,
                            background:bgCategory===c.id?'#fdf2f8':'#fff',color:bgCategory===c.id?'#ec4899':'#6b7280',
                            fontSize:10,fontWeight:700,cursor:'pointer'}}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(60px,1fr))',gap:4,marginBottom:10}}>
                      {currentBgImages.map(url=>(
                        <div key={url} onClick={()=>setHeaderImgUrl(url)}
                          style={{height:44,borderRadius:6,border:headerImgUrl===url?`2px solid ${D.accentColor}`:'2px solid transparent',
                            backgroundImage:`url(${url})`,backgroundSize:'cover',backgroundPosition:'center',cursor:'pointer',
                            boxShadow:headerImgUrl===url?`0 0 0 2px ${D.accentColor}`:'none'}}/>
                      ))}
                    </div>
                    <label style={{display:'block',padding:'8px',textAlign:'center',background:'#f9fafb',border:'1px dashed #d1d5db',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:'#4b5563',marginBottom:10}}>
                      📂 Bilgisayardan Yükle
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={handleBgUpload}/>
                    </label>

                    {/* Custom URL */}
                    <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{t.customUrl}</label>
                    <input value={headerImgUrl} onChange={e=>setHeaderImgUrl(e.target.value)}
                      placeholder="https://... (görsel URL)"
                      style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
                  </>
                )}
                {designSubTab==='colors' && (
                  <>
                    <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:8}}>{t.designLabel}</label>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {(Object.entries(DESIGNS) as [Design,DesignConfig][]).map(([k,c])=>(
                        <button key={k} onClick={()=>setDesign(k)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,
                            border:design===k?`2px solid ${c.accentColor}`:'1px solid #e5e7eb',
                            background:design===k?c.headerBg:c.bodyBg,cursor:'pointer',textAlign:'left',transition:'all .15s'}}>
                          <div style={{width:16,height:16,borderRadius:4,background:c.accentColor,flexShrink:0}}/>
                          <div style={{fontSize:13,fontWeight:700,color:design===k?c.headerColor:c.textColor}}>{c.label}</div>
                          {design===k && <span style={{marginLeft:'auto',color:c.headerColor,fontSize:13}}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {designSubTab==='fonts' && (
                  <>
                    <label style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:8}}>{t.fontTab}</label>
                    {[
                      {label:'Modern (Inter)',     value:'Inter, system-ui, sans-serif'},
                      {label:'Klasik (Georgia)',   value:'Georgia, serif'},
                      {label:'Dinamik (Outfit)',   value:'Outfit, sans-serif'},
                      {label:'Nötr (Trebuchet)',   value:'Trebuchet MS, sans-serif'},
                    ].map(f=>(
                      <div key={f.value} onClick={()=>{}}
                        style={{padding:'10px 12px',borderRadius:8,border:`1px solid #e5e7eb`,marginBottom:6,cursor:'pointer',background:'#fff'}}>
                        <div style={{fontFamily:f.value,fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{f.label}</div>
                        <div style={{fontFamily:f.value,fontSize:11,color:'#6b7280',marginTop:2}}>Aa Bb Cc 123</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CENTER — canvas */}
        <div style={{
          overflowY:'auto', padding:32,
          ...(headerImgUrl
            ? { backgroundImage:`url(${headerImgUrl})`, backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed', position:'relative' }
            : { background:'#f8fafc', backgroundImage:'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize:'24px 24px' })
        }}>
          {/* TOC */}
          {showTOC && blocks.some(b=>b.type==='title') && (
            <div style={{maxWidth:previewMode==='mobile'?375:640,margin:'0 auto 12px',background:'#fff',borderRadius:8,padding:'10px 16px',border:`1px solid ${D.accentColor}33`,transition:'max-width 0.3s ease'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:'#9ca3af',marginBottom:6}}>Contents</div>
              {blocks.filter(b=>b.type==='title').map(b=>(
                <div key={b.id} style={{fontSize:12,color:D.accentColor,fontWeight:600,marginBottom:2,fontFamily:D.font}}>→ {b.data.text}</div>
              ))}
            </div>
          )}

          {/* Logo zone */}
          <div style={{maxWidth:previewMode==='mobile'?375:640,margin:'0 auto 0',paddingBottom:0,transition:'max-width 0.3s ease'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
              {logoUrl
                ? <div style={{position:'relative',display:'inline-block'}}>
                    <img src={logoUrl} alt="Logo" style={{height:52,borderRadius:8,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}/>
                    <button onClick={()=>setLogoUrl('')}
                      style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'#ef4444',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                  </div>
                : (
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    {/* URL input */}
                    <input
                      type="text" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)}
                      placeholder={t.logoPlaceholder}
                      style={{padding:'6px 12px',borderRadius:8,border:'1.5px dashed #d1d5db',
                        fontSize:12,outline:'none',color:'#374151',width:200,background:'#f9fafb'}}/>
                    <span style={{color:'#9ca3af',fontSize:12}}>veya</span>
                    {/* File upload */}
                    <label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,
                        border:'1.5px dashed #d1d5db',background:'#f9fafb',cursor:'pointer',color:'#6b7280',fontSize:13,fontWeight:600}}>
                      📂 {t.addLogo}
                      <input type="file" accept="image/*" style={{display:'none'}}
                        onChange={e=>{
                          const file=e.target.files?.[0]; if(!file) return;
                          const r=new FileReader(); r.onload=ev=>setLogoUrl(ev.target?.result as string); r.readAsDataURL(file);
                        }}/>
                    </label>
                  </div>
                )}
            </div>
          </div>

          <div style={{maxWidth:previewMode==='mobile'?375:640,margin:'8px auto 0',background:D.bodyBg,borderRadius:12,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.12)',transition:'max-width 0.3s ease'}}>        
            {/* Header — click to edit, supports background image */}
            <div style={{
              background: headerImgUrl ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${headerImgUrl}) center/cover no-repeat` : D.headerBg,
              padding:'36px 40px',textAlign:'center', position:'relative'
            }}>
              {/* Speaker Button inside Editor */}
              <button onClick={handleSpeak} title={isSpeaking ? "Dinlemeyi Durdur" : "Bülteni Sesli Dinle"}
                style={{position:'absolute',top:20,right:24,background:'#fff',border:'none',
                  color:'#1e293b',borderRadius:'30px',padding:'8px 16px',display:'flex',gap:'6px',justifyContent:'center',alignItems:'center',
                  cursor:'pointer',fontSize:13,fontWeight:800,boxShadow:'0 4px 12px rgba(0,0,0,0.2)',transition:'transform 0.2s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.05)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>
                <span style={{fontSize:16}}>{isSpeaking ? '⏸' : '🔊'}</span> {isSpeaking ? 'Durdur' : 'Dinle'}
              </button>
              <h1
                contentEditable suppressContentEditableWarning
                onBlur={e => setTitle(e.currentTarget.textContent || '')}
                style={{
                  color: headerImgUrl ? '#ffffff' : D.headerColor,
                  textShadow: headerImgUrl ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                  fontSize:26,fontWeight:800,margin:'0 0 6px',fontFamily:D.font,
                  outline:'none',cursor:'text',borderBottom:'2px dashed transparent',
                  transition:'border-color .15s'
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'rgba(255,255,255,0.4)'}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'}
                title="Başlığı düzenlemek için tıklayın"
              >{title}</h1>
              <p
                contentEditable suppressContentEditableWarning
                onBlur={e => setSubtitle(e.currentTarget.textContent || '')}
                style={{
                  color: headerImgUrl ? '#ffffff' : D.headerColor,
                  textShadow: headerImgUrl ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                  opacity: headerImgUrl ? 1 : .8,
                  fontSize:13,margin:0,fontFamily:D.font,
                  outline:'none',cursor:'text',borderBottom:'2px dashed transparent',
                  transition:'border-color .15s'
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'rgba(255,255,255,0.4)'}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'}
                title="Alt başlığı düzenlemek için tıklayın"
              >{subtitle}</p>
            </div>

            {/* Blocks — supports drag-from-palette drop and internal sorting */}
            <div style={{padding:previewMode==='mobile'?'20px 16px':'28px 36px', minHeight:200}}
              onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move';
                const container = e.currentTarget;
                const children = Array.from(container.querySelectorAll('[data-block="true"]'));
                let insertAt = blocks.length;
                for(let i=0;i<children.length;i++){
                  const rect = children[i].getBoundingClientRect();
                  if(e.clientY < rect.top + rect.height/2){ insertAt=i; break; }
                }
                setDropIndicator(insertAt);
              }}
              onDragLeave={()=>setDropIndicator(null)}
              onDrop={e=>{
                e.preventDefault();
                const type = dragTypeRef.current;
                const draggedId = draggedBlockIdRef.current;
                
                const container = e.currentTarget;
                const children = Array.from(container.querySelectorAll('[data-block="true"]'));
                let insertAt = blocks.length;
                for(let i=0;i<children.length;i++){
                  const rect = children[i].getBoundingClientRect();
                  if(e.clientY < rect.top + rect.height/2){ insertAt=i; break; }
                }

                if (type) {
                  // New block from palette
                  const p = PALETTE.find(x=>x.type===type)!;
                  const nb: Block = { id: uid(), type, data: {...p.def} };
                  setBlocks(prev=>{ const next=[...prev]; next.splice(insertAt,0,nb); return next; });
                  setSelectedId(nb.id);
                  dragTypeRef.current=null;
                } else if (draggedId) {
                  // Reorder existing block
                  setBlocks(prev=>{
                    const next=[...prev];
                    const fromIdx = next.findIndex(b=>b.id===draggedId);
                    if(fromIdx===-1) return prev;
                    const [removed] = next.splice(fromIdx, 1);
                    let finalInsert = insertAt;
                    if (fromIdx < finalInsert) finalInsert--;
                    next.splice(finalInsert, 0, removed);
                    return next;
                  });
                }
                setDropIndicator(null);
                draggedBlockIdRef.current = null;
              }}>
              {blocks.length===0 && (
                <div style={{textAlign:'center',padding:'60px 0',color:'#9ca3af',fontFamily:D.font,
                  border:'2px dashed #d1d5db',borderRadius:12,
                  background: dropIndicator===0?'#eff6ff':'transparent',transition:'background .2s'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📭</div>
                  <p>{t.noBlocks}</p>
                  <p style={{fontSize:12,marginTop:4}}>veya bloğu buraya sürükleyin</p>
                </div>
              )}
              {/* ── Inline insert system ── */}
              {(() => {
                const InsertDivider = ({ idx }: { idx: number }) => (
                  <div
                    style={{ position:'relative', height:28, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 -8px', opacity:0, transition:'opacity .2s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'}
                    onMouseLeave={e=>{ if(!(insertMenuOpen && insertAtIdx===idx)) (e.currentTarget as HTMLElement).style.opacity='0'; }}>
                    <div style={{ position:'absolute', left:0, right:0, top:'50%', borderTop:'2px dashed #10b981', opacity:.4 }}/>
                    <button
                      onClick={e=>{ e.stopPropagation(); const same = insertMenuOpen && insertAtIdx===idx; setInsertAtIdx(idx); setInsertMenuOpen(!same); }}
                      style={{ position:'relative', zIndex:2, width:28, height:28, borderRadius:'50%', background:'#10b981', border:'none', color:'#fff', fontSize:18, lineHeight:'1', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(16,185,129,.4)', flexShrink:0 }}>
                      +
                    </button>
                    {insertMenuOpen && insertAtIdx===idx && (
                      <div onClick={e=>e.stopPropagation()}
                        style={{ position:'absolute', top:34, left:'50%', transform:'translateX(-50%)', zIndex:9990, background:'#fff', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.18)', border:'1px solid #e5e7eb', padding:14, width:340 }}>
                        <div style={{ fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Buraya blok ekle</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                          {PALETTE.map(p=>(
                            <button key={p.type}
                              onClick={()=>insertBlock(p.type, idx)}
                              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 6px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fafafa', cursor:'pointer', transition:'all .12s' }}
                              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background='#ecfdf5'; (e.currentTarget as HTMLElement).style.borderColor='#10b981'; }}
                              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background='#fafafa'; (e.currentTarget as HTMLElement).style.borderColor='#e5e7eb'; }}>
                              <span style={{ fontSize:18 }}>{p.icon}</span>
                              <span style={{ fontSize:9, fontWeight:700, color:'#374151', textAlign:'center', lineHeight:1.2 }}>{p.label}</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={()=>setInsertMenuOpen(false)} style={{ marginTop:10, width:'100%', padding:'5px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:11, cursor:'pointer' }}>Kapat</button>
                      </div>
                    )}
                  </div>
                );
                return (
                  <>
                    {blocks.map((b,i)=>(
                      <div key={b.id} data-block="true"
                        draggable
                        onDragStart={e => {
                          draggedBlockIdRef.current = b.id;
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', b.id);
                          setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.4'; }, 0);
                        }}
                        onDragEnd={e => {
                          (e.target as HTMLElement).style.opacity = '1';
                          draggedBlockIdRef.current = null;
                          setDropIndicator(null);
                        }}
                      >
                        <InsertDivider idx={i}/>
                        {dropIndicator===i && <div style={{height:3,background:D.accentColor,borderRadius:2,margin:'2px 0'}}/>}
                        <div style={{cursor:'grab'}}>
                          <CanvasBlock block={b} design={D} selected={selectedId===b.id} onClick={()=>setSelectedId(b.id)}/>
                        </div>
                      </div>
                    ))}
                    {blocks.length > 0 && <InsertDivider idx={blocks.length}/>}
                    {dropIndicator===blocks.length && blocks.length>0 && <div style={{height:3,background:D.accentColor,borderRadius:2,margin:'2px 0'}}/>}
                  </>
                );
              })()}

            </div>

            {/* Footer */}
            <div style={{background:D.headerBg,padding:'14px 36px',textAlign:'center'}}>
              <p style={{color:D.headerColor,opacity:.6,fontSize:12,margin:0,fontFamily:D.font}}>{t.footer}</p>
            </div>
          </div>
        </div>

        {/* RIGHT — block editor */}
        <div style={{background:'#ffffff',borderLeft:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-4px 0 16px rgba(0,0,0,0.02)',zIndex:5}}>
          {selectedBlock ? (
            <>
              <div style={panelHdr}>✏️ {t[selectedBlock.type as keyof typeof t] as string || PALETTE.find(p=>p.type===selectedBlock.type)?.label} — {t.edit}</div>
              <div style={{overflowY:'auto',flex:1,padding:14}}>
                <BlockEditor
                  block={selectedBlock}
                  onChange={data=>updateBlock(selectedBlock.id,data)}
                  onAI={handleAI}
                  aiLoading={aiLoading}
                />
                <div style={{display:'flex',gap:6,marginTop:14}}>
                  <button onClick={()=>moveBlock(selectedBlock.id,-1)} style={{flex:1,padding:7,borderRadius:8,border:'1px solid #e5e7eb',background:'#f9fafb',color:'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>{t.moveUp}</button>
                  <button onClick={()=>moveBlock(selectedBlock.id,1)} style={{flex:1,padding:7,borderRadius:8,border:'1px solid #e5e7eb',background:'#f9fafb',color:'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>{t.moveDown}</button>
                  <button onClick={()=>deleteBlock(selectedBlock.id)} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer'}}>🗑</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontSize:13,textAlign:'center',padding:24}}>
              <div style={{fontSize:32,marginBottom:10}}>👆</div>
              <p>{t.noBlocks}</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Saved Newsletters Modal */}
    {showSavedModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
           onClick={()=>setShowSavedModal(false)}>
        <div style={{background:'#fff',borderRadius:14,width:560,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center',background:'linear-gradient(135deg,#003366,#0066cc)'}}>
            <div style={{fontWeight:800,fontSize:15,color:'#fff'}}>📂 Kaydedilmiş Bültenler</div>
            <button onClick={()=>setShowSavedModal(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
          </div>
          <div style={{overflowY:'auto',flex:1,padding:'12px'}}>
            {savedList.length===0
              ? <div style={{textAlign:'center',padding:'50px 0',color:'#9ca3af'}}>
                  <div style={{fontSize:36,marginBottom:10}}>📭</div>
                  <p style={{fontWeight:600}}>Henüz kaydedilmiş bülten yok</p>
                  <p style={{fontSize:12,marginTop:4}}>"💾 Kaydet" butonuyla bülteni buraya kaydedin</p>
                </div>
              : savedList.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',borderRadius:10,border:'1px solid #e5e7eb',marginBottom:8,background:'#fafafa'}}
                     onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f0f9ff'}
                     onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fafafa'}>
                  <div style={{width:44,height:44,borderRadius:10,background:DESIGNS[s.design].headerBg,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📰</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#1a1a2e',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.title}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>{s.subtitle}</div>
                    <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>
                      {new Date(s.savedAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})} · {s.blocks.length} blok
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <button onClick={()=>handleLoad(s)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #0066cc',background:'#eff6ff',color:'#0066cc',fontSize:12,fontWeight:700,cursor:'pointer'}}>Yükle</button>
                    <button onClick={()=>handleDelete(s.id)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer'}}>🗑</button>
                  </div>
                </div>
              ))}
          </div>
          {savedList.length>0&&<div style={{padding:'10px 20px',borderTop:'1px solid #e5e7eb',fontSize:11,color:'#9ca3af',textAlign:'center'}}>Maks. 20 kayıt saklanır.</div>}
        </div>
      </div>
    )}

    {/* ── Share Modal ── */}
    {showShareModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
           onClick={()=>setShowShareModal(false)}>
        <div style={{background:'#fff',borderRadius:16,width:480,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          <div style={{padding:'16px 20px',background:'linear-gradient(135deg,#0d9488,#059669)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:800,fontSize:15,color:'#fff'}}>📤 Bülteni Paylaş</span>
            <button onClick={()=>setShowShareModal(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <div style={{padding:18,overflowY:'auto'}}>
            {/* Social share */}
            <div style={{fontSize:11,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Sosyal Medya</div>
            {[
              {icon:'🔵',label:'Facebook\'ta Paylaş',color:'#1877F2',bg:'#e8f0fe',url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(title)}`},
              {icon:'🐦',label:'Twitter / X\'te Paylaş',color:'#1da1f2',bg:'#e8f7fe',url:`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`},
              {icon:'💼',label:'LinkedIn\'de Paylaş',color:'#0077b5',bg:'#e8f1f8',url:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`},
              {icon:'💬',label:'WhatsApp ile Paylaş',color:'#25D366',bg:'#e8faf0',url:`https://wa.me/?text=${encodeURIComponent(title+' '+window.location.href)}`},
            ].map(s=>(
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px',borderRadius:10,background:s.bg,marginBottom:8,textDecoration:'none',border:`1px solid ${s.color}22`}}>
                <span style={{fontSize:20}}>{s.icon}</span>
                <span style={{fontWeight:700,fontSize:13,color:s.color}}>{s.label}</span>
                <span style={{marginLeft:'auto',fontSize:11,color:`${s.color}99`}}>↗</span>
              </a>
            ))}
            {/* Utility actions */}
            <div style={{fontSize:11,fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,margin:'16px 0 10px'}}>Diğer Seçenekler</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                {icon:'🔗',label:'Linki Kopyala',key:'link',action:()=>{navigator.clipboard.writeText(window.location.href);setCopyDone('link');setTimeout(()=>setCopyDone(null),2000);}},
                {icon:'✉️',label:'E-posta ile Paylaş',key:'email',action:()=>window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(subtitle+'\n\n'+window.location.href)}`)},
                {icon:'</>',label:'Embed Kodu',key:'embed',action:()=>{navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0"></iframe>`);setCopyDone('embed');setTimeout(()=>setCopyDone(null),2000);}},
                {icon:'🖨️',label:'Yazdır / PDF',key:'print',action:()=>window.print()},
              ].map(btn=>(
                <button key={btn.key} onClick={btn.action}
                  style={{padding:'12px',borderRadius:10,border:'1px solid #e5e7eb',background:copyDone===btn.key?'#ecfdf5':'#f9fafb',cursor:'pointer',display:'flex',alignItems:'center',gap:8,fontWeight:700,fontSize:12,color:copyDone===btn.key?'#059669':'#374151',transition:'all .2s'}}>
                  <span style={{fontSize:18}}>{btn.icon}</span>
                  {copyDone===btn.key?'✓ Kopyalandı!':btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Analytics Modal ── */}
    {showAnalyticsModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
           onClick={()=>setShowAnalyticsModal(false)}>
        <div style={{background:'#fff',borderRadius:16,width:960,height:'80vh',display:'flex',flexDirection:'row',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          
          {/* Sidebar */}
          <div style={{width:240,background:'#f8fafc',borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',padding:'24px 0'}}>
            <div style={{padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <span style={{fontWeight:800,fontSize:16,color:'#0f172a'}}>İstatistikler</span>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:4,padding:'0 12px'}}>
              {[
                {k:'overview',l:'Genel Bakış',icon:'📊'},
                {k:'deliveries',l:'E-posta Teslimatı',icon:'✉️'},
                {k:'locations',l:'Lokasyonlar',icon:'📍'},
                {k:'interactions',l:'Etkileşimler',icon:'🖱️'},
                {k:'traffic',l:'Trafik Kaynakları',icon:'🚗'},
              ].map(tab=>(
                <button key={tab.k} onClick={()=>setAnalyticsTab(tab.k)}
                  style={{padding:'10px 14px',borderRadius:8,border:analyticsTab===tab.k?'1px solid #10b981':'1px solid transparent',
                    background:analyticsTab===tab.k?'#ecfdf5':'transparent',
                    color:analyticsTab===tab.k?'#059669':'#475569',
                    fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left'}}>
                  <span style={{fontSize:16}}>{tab.icon}</span> {tab.l}
                </button>
              ))}
            </div>
            <button onClick={openAnalytics} style={{marginTop:'auto',margin:'0 24px',padding:'8px',background:'none',border:'none',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16}}>🔄</span> Yenile
            </button>
          </div>

          {/* Content Area */}
          <div style={{flex:1,display:'flex',flexDirection:'column',background:'#fff'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',margin:0}}>
                {analyticsTab==='overview'?'Analitik Genel Bakış':
                 analyticsTab==='locations'?'Lokasyonlar':
                 analyticsTab==='traffic'?'Trafik Kaynakları':
                 analyticsTab==='interactions'?'Blok Etkileşimleri':
                 'E-posta Teslimatları'}
              </h2>
              <button onClick={()=>setShowAnalyticsModal(false)} style={{background:'none',border:'none',color:'#94a3b8',fontSize:24,cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            
            <div style={{padding:32,overflowY:'auto',flex:1}}>
              {analyticsTab==='overview' && (
                <>
                  <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:24}}>
                    <span style={{fontWeight:800,fontSize:42,color:'#0f172a',lineHeight:1}}>{(analytics.views||0).toLocaleString('tr-TR')}</span>
                    <span style={{fontSize:13,color:'#64748b',fontWeight:600}}>toplam mail açılışı (opens)</span>
                  </div>
                  
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:32}}>
                    {[
                      {label:'Farklı Kişi Okudu',value:(analytics.opens||0).toString(),color:'#f59e0b',icon:'👤'},
                      {label:'Toplam Link Tıklaması',value:(analytics.clicks||0).toString(),color:'#ec4899',icon:'🔗'},
                      {label:'Ortalama Okuma',value:`${readingTime} dk`,color:'#8b5cf6',icon:'⏱️'},
                    ].map(m=>(
                      <div key={m.label} style={{background:'#f8fafc',borderRadius:12,padding:'20px',border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                        <div style={{fontWeight:800,fontSize:22,color:m.color}}>{m.value}</div>
                        <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginTop:4}}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <h3 style={{fontSize:14,fontWeight:800,color:'#334155',marginBottom:16}}>Cihaz Dağılımı</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{background:'#1e293b',borderRadius:12,padding:'20px',display:'flex',alignItems:'center',gap:16}}>
                      <div style={{fontSize:32}}>📱</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:20,color:'#fff'}}>48%</div>
                        <div style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>Mobil Cihazlar</div>
                      </div>
                    </div>
                    <div style={{background:'#ea580c',borderRadius:12,padding:'20px',display:'flex',alignItems:'center',gap:16}}>
                      <div style={{fontSize:32}}>🖥️</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:20,color:'#fff'}}>52%</div>
                        <div style={{fontSize:12,color:'#fed7aa',fontWeight:600}}>Masaüstü Cihazlar</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {analyticsTab==='locations' && (
                <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:20}}>
                    <span style={{fontWeight:800,fontSize:32,color:'#4f46e5'}}>72</span>
                    <span style={{fontSize:13,color:'#64748b',fontWeight:600}}>ziyaretçi konumu saptandı</span>
                  </div>
                  <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',flex:1,minHeight:400,boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                    <BultenLocationMap/>
                  </div>
                  <div style={{marginTop:16,fontSize:11,color:'#94a3b8',textAlign:'center'}}>
                    📍 Harita üzerindeki kırmızı pinler en son erişim konumlarını göstermektedir. (Simülasyon verisidir)
                  </div>
                </div>
              )}

              {analyticsTab==='traffic' && (
                <div>
                  <p style={{color:'#64748b',fontSize:13,marginBottom:24,fontWeight:600}}>Bülteninize gelen trafik kanallarının analizi (Google Analytics tabanlıdır).</p>
                  <div style={{display:'flex',flexDirection:'column',gap:20}}>
                  {[
                    {label:'Direkt (URL)',val:analytics.views?Math.round((analytics.views||10)*.52):52,color:'#0d9488'},
                    {label:'E-posta (Mailbox)',val:analytics.views?Math.round((analytics.views||10)*.25):25,color:'#4f46e5'},
                    {label:'Sosyal Medya',val:analytics.views?Math.round((analytics.views||10)*.15):15,color:'#2563eb'},
                    {label:'Web Sitesi / Platform',val:analytics.views?Math.round((analytics.views||10)*.08):8,color:'#7c3aed'},
                  ].map(src=>{
                    const total = analytics.views||100;
                    const pct = Math.round(src.val/total*100);
                    return (
                      <div key={src.label}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,color:'#334155',marginBottom:6}}>
                          <span>{src.label} ({pct}%)</span><span style={{color:src.color}}>{src.val} tık</span>
                        </div>
                        <div style={{background:'#f1f5f9',borderRadius:8,height:12,overflow:'hidden',boxShadow:'inset 0 1px 2px rgba(0,0,0,.05)'}}>
                          <div style={{height:'100%',borderRadius:8,background:src.color,width:`${pct}%`,transition:'width .6s ease-out'}}/>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {analyticsTab==='interactions' && (
                <div>
                  <p style={{color:'#64748b',fontSize:13,marginBottom:24,fontWeight:600}}>Bülten içindeki özel yapıtaşlarına olan etkileşim oranları.</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
                    {[
                      {label:'Tıklanan Butonlar',count:btnCount*4||12,color:'#0d9488',icon:'⬛'},
                      {label:'Video İzleme',count:videoCount*6||8,color:'#ef4444',icon:'▶'},
                      {label:'Ek İndirme',count:attachCount*2||5,color:'#f59e0b',icon:'📎'},
                      {label:'Link Tıklama',count:linkCount*7||18,color:'#6366f1',icon:'🔗'},
                      {label:'Form / Anket',count:formCount*3||2,color:'#8b5cf6',icon:'📋'},
                    ].map(item=>(
                      <div key={item.label} style={{display:'flex',alignItems:'center',gap:12,padding:'16px',borderRadius:12,background:item.color+'0a',border:`1px solid ${item.color}22`}}>
                        <span style={{fontSize:24}}>{item.icon}</span>
                        <div>
                          <div style={{fontWeight:800,fontSize:20,color:item.color}}>{item.count}</div>
                          <div style={{fontSize:12,color:'#64748b',fontWeight:700}}>{item.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {analyticsTab==='deliveries' && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:60,color:'#94a3b8',textAlign:'center'}}>
                  <span style={{fontSize:48,marginBottom:16}}>✉️</span>
                  <h3 style={{fontSize:16,fontWeight:800,color:'#475569',marginBottom:8}}>E-posta Teslimat Raporu</h3>
                  <p style={{fontSize:13,maxWidth:320,lineHeight:1.6}}>Detaylı gönderim başarısı raporları ve bounce (geri dönen) analizi için SendGrid veya Amazon SES entegrasyonu kurmanız gereklidir.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Mailing List Modal ── */}
    {showMailModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
           onClick={()=>setShowMailModal(false)}>
        <div style={{background:'#fff',borderRadius:16,width:720,height:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div style={{padding:'16px 24px',background:'linear-gradient(135deg,#ec4899,#db2777)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <span style={{fontWeight:800,fontSize:15,color:'#fff'}}>📧 Mail Listesi Yöneticisi</span>
              {showSendPrompt && <button onClick={()=>setShowSendPrompt(false)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,cursor:'pointer'}}>← Geri Dön</button>}
            </div>
            <button onClick={()=>setShowMailModal(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:showSendPrompt?'1fr':'220px 1fr',flex:1,overflow:'hidden'}}>
            {/* Left — list sidebar (hidden in send prompt mode) */}
            {!showSendPrompt && (
            <div style={{borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',overflow:'hidden',background:'#fafafa'}}>
              <div style={{padding:'10px 12px',borderBottom:'1px solid #e5e7eb'}}>
                <div style={{display:'flex',gap:6}}>
                  <input value={newListName} onChange={e=>setNewListName(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&createList()}
                    placeholder="Yeni liste adı..." style={{flex:1,padding:'6px 8px',borderRadius:6,border:'1px solid #d1d5db',fontSize:11,outline:'none'}}/>
                  <button onClick={createList} style={{padding:'6px 10px',borderRadius:6,border:'none',background:'#ec4899',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:700}}>+</button>
                </div>
              </div>
              <div style={{overflowY:'auto',flex:1,padding:8}}>
                {mailingLists.length===0
                  ? <div style={{textAlign:'center',padding:'30px 0',color:'#9ca3af',fontSize:12}}>
                      <div style={{fontSize:28,marginBottom:6}}>📥</div>
                      <p>Henüz liste yok<br/>Yukarıdan oluşturun</p>
                    </div>
                  : mailingLists.map(list=>(
                    <div key={list.id} onClick={()=>{setActiveListId(list.id);setMlSearch('');setMlError('');setShowCsvPanel(false);}}
                      style={{padding:'10px 12px',borderRadius:8,cursor:'pointer',marginBottom:4,
                        background:activeListId===list.id?'#fdf2f8':'#fff',
                        border:`1px solid ${activeListId===list.id?'#ec4899':'#e5e7eb'}`,
                        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:activeListId===list.id?'#ec4899':'#374151'}}>{list.name}</div>
                        <div style={{fontSize:10,color:'#9ca3af'}}>{list.contacts.length} kişi</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();const next=mailingLists.filter(l=>l.id!==list.id);saveLists(next);if(activeListId===list.id)setActiveListId(null);}}
                        style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:14,padding:'2px 4px'}}>×</button>
                    </div>
                  ))}
              </div>
            </div>
            )}

            {/* Right — contacts panel */}
            <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
              {!activeList
                ? <div style={{display:'flex',flex:1,alignItems:'center',justifyContent:'center',color:'#9ca3af',flexDirection:'column',gap:8}}>
                    <div style={{fontSize:36}}>📧</div>
                    <p style={{fontSize:13}}>Sol taraftan bir liste seçin veya oluşturun</p>
                  </div>
                : showSendPrompt ? (
                    <div style={{flex:1,display:'flex',flexDirection:'column',padding:24,overflowY:'auto'}}>
                      <h2 style={{fontSize:18,fontWeight:800,color:'#1a1a2e',marginBottom:16}}>Toplu Gönderim Ayarları</h2>
                      <div style={{marginBottom:16}}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Kişiselleştirilmiş Mesaj (Opsiyonel)</label>
                        <textarea value={customMsg} onChange={e=>setCustomMsg(e.target.value)} rows={4}
                          style={{width:'100%',padding:'10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}}
                          placeholder="Alıcılara özel bir giriş mesajı yazın..."></textarea>
                      </div>
                      
                      <div style={{padding:'16px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,marginBottom:20}}>
                        <div style={{fontWeight:700,fontSize:13,color:'#475569',marginBottom:10}}>Önizleme / Test Gönderimi</div>
                        <div style={{display:'flex',gap:8}}>
                          <input value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="Test için e-posta adresi..."
                            style={{flex:1,padding:'8px 12px',borderRadius:6,border:'1px solid #cbd5e1',fontSize:12,outline:'none'}}/>
                          <button onClick={()=>executeSend(true)}
                            style={{padding:'8px 16px',background:'#64748b',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                            Test Maili At
                          </button>
                        </div>
                      </div>

                      <div style={{marginTop:'auto',display:'flex',justifyContent:'flex-end',gap:12,borderTop:'1px solid #e5e7eb',paddingTop:16}}>
                        <button onClick={()=>setShowSendPrompt(false)} style={{padding:'10px 20px',background:'#fff',border:'1px solid #cbd5e1',color:'#475569',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>İptal</button>
                        <button onClick={()=>executeSend(false)} style={{padding:'10px 24px',background:'#ec4899',color:'#fff',border:'none',borderRadius:8,fontWeight:800,fontSize:13,cursor:'pointer'}}>
                          🚀 Listeye Gönder ({activeList.contacts.length} Kişi)
                        </button>
                      </div>
                    </div>
                  ) : <>
                    {/* Actions row */}
                    <div style={{padding:'10px 14px',borderBottom:'1px solid #e5e7eb',display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                      <span style={{fontWeight:800,fontSize:13,color:'#ec4899'}}>{activeList.name}</span>
                      <span style={{fontSize:11,color:'#6b7280',background:'#f3f4f6',padding:'2px 8px',borderRadius:10}}>{activeList.contacts.length} kişi</span>
                      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                        <button onClick={()=>setShowCsvPanel(x=>!x)}
                          style={{padding:'5px 10px',borderRadius:7,border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:11,fontWeight:700,cursor:'pointer',color:'#374151'}}>CSV İmport</button>
                        <button onClick={bulkSend} disabled={activeList.contacts.length===0}
                          style={{padding:'5px 12px',borderRadius:7,border:'none',background:activeList.contacts.length?'#ec4899':'#e5e7eb',color:'#fff',fontSize:11,fontWeight:800,cursor:activeList.contacts.length?'pointer':'not-allowed'}}>
                          📤 Toplu Gönder ({activeList.contacts.length})
                        </button>
                      </div>
                    </div>

                    {/* CSV import panel */}
                    {showCsvPanel && (
                      <div style={{padding:'10px 14px',background:'#fdf2f8',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:6}}>
                          <div style={{fontSize:11,fontWeight:700,color:'#ec4899'}}>CSV Format: her satırda <code>email,isim</code></div>
                          <label style={{padding:'4px 10px',borderRadius:6,border:'1px dashed #ec4899',background:'#fff',color:'#ec4899',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                            📂 Dosya Seç
                            <input type="file" accept=".csv" style={{display:'none'}}
                              onChange={e=>{
                                const file=e.target.files?.[0]; if(!file) return;
                                const r=new FileReader(); r.onload=ev=>setCsvInput(ev.target?.result as string); r.readAsText(file);
                              }}/>
                          </label>
                        </div>
                        <textarea value={csvInput} onChange={e=>setCsvInput(e.target.value)}
                          rows={4} placeholder="ali@ornek.com, Ali Yılmaz&#10;ayse@ornek.com&#10;..." style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #f9a8d4',fontSize:11,outline:'none',fontFamily:'monospace',resize:'vertical',boxSizing:'border-box'}}/>
                        <button onClick={importCsv} style={{marginTop:6,padding:'5px 14px',borderRadius:7,border:'none',background:'#ec4899',color:'#fff',fontWeight:700,fontSize:11,cursor:'pointer'}}>İmport Et</button>
                      </div>
                    )}

                    {/* Add contact form */}
                    <div style={{padding:'8px 14px',borderBottom:'1px solid #e5e7eb',display:'flex',gap:6,flexShrink:0}}>
                      <input value={newContactEmail} onChange={e=>setNewContactEmail(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addContact()}
                        placeholder="E-posta adresi *" style={{flex:2,padding:'5px 8px',borderRadius:6,border:'1px solid #d1d5db',fontSize:11,outline:'none'}}/>
                      <input value={newContactName} onChange={e=>setNewContactName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addContact()}
                        placeholder="İsim (opsiyonel)" style={{flex:1.5,padding:'5px 8px',borderRadius:6,border:'1px solid #d1d5db',fontSize:11,outline:'none'}}/>
                      <button onClick={addContact} style={{padding:'5px 12px',borderRadius:6,border:'none',background:'#ec4899',color:'#fff',fontSize:11,fontWeight:800,cursor:'pointer'}}>+ Ekle</button>
                    </div>
                    {mlError && <div style={{padding:'6px 14px',fontSize:11,color:mlError.includes('eklendi')?'#059669':'#dc2626',background:mlError.includes('eklendi')?'#ecfdf5':'#fef2f2'}}>{mlError}</div>}

                    {/* Search */}
                    <div style={{padding:'6px 14px',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                      <input value={mlSearch} onChange={e=>setMlSearch(e.target.value)}
                        placeholder="🔍 Kişi ara..." style={{width:'100%',padding:'5px 8px',borderRadius:6,border:'1px solid #e5e7eb',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
                    </div>

                    {/* Contact list */}
                    <div style={{overflowY:'auto',flex:1}}>
                      {filteredContacts.length===0
                        ? <div style={{textAlign:'center',padding:'30px 0',color:'#9ca3af',fontSize:12}}>
                            {activeList.contacts.length===0?'Henüz kişi eklenmedi — yukarıdan ekleyin':'Arama sonucu bulunamadı'}
                          </div>
                        : filteredContacts.map((c,i)=>(
                          <div key={c.email} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa'}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:'#fce7f3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#ec4899',flexShrink:0}}>
                              {(c.name||c.email)[0].toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:12,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                              <div style={{fontSize:11,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.email}</div>
                            </div>
                            <div style={{fontSize:10,color:'#9ca3af',flexShrink:0}}>{new Date(c.addedAt).toLocaleDateString('tr-TR')}</div>
                            <button onClick={()=>removeContact(c.email)}
                              style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:14,padding:'2px 4px',flexShrink:0}}
                              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#dc2626'}
                              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='#9ca3af'}>
                              🗑
                            </button>
                          </div>
                        ))}
                    </div>
                  </>}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Templates Modal ── */}
    {showTemplatesModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.75)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
           onClick={()=>setShowTemplatesModal(false)}>
        <div style={{background:'#ffffff',borderRadius:20,width:960,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 48px rgba(0,0,0,.2)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          <div style={{padding:'24px 32px',background:'#fff',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2 style={{fontWeight:800,fontSize:22,color:'#0f172a',margin:0,display:'flex',alignItems:'center',gap:8}}>✨ Hazır Şablonlar</h2>
              <p style={{margin:'6px 0 0',fontSize:14,color:'#64748b'}}>Sektörünüze uygun, profesyonel olarak tasarlanmış şablonlardan birini seçerek hemen başlayın.</p>
            </div>
            <button onClick={()=>setShowTemplatesModal(false)} style={{background:'#f1f5f9',border:'none',color:'#64748b',width:36,height:36,borderRadius:'50%',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .2s'}} onMouseOver={e=>(e.target as HTMLElement).style.background='#e2e8f0'} onMouseOut={e=>(e.target as HTMLElement).style.background='#f1f5f9'}>✕</button>
          </div>
          <div style={{padding:'32px',overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:24,flex:1,background:'#f8fafc'}}>
            {NEWSLETTER_TEMPLATES.map(tpl=>(
              <div key={tpl.id} onClick={()=>{
                  setTitle(tpl.title); setSubtitle(tpl.subtitle);
                  setDesign(tpl.design); setHeaderImgUrl(tpl.headerImgUrl);
                  setBlocks(tpl.blocks as unknown as Block[]); setShowTemplatesModal(false);
              }}
              style={{background:'#fff',borderRadius:16,border:'1px solid #e2e8f0',overflow:'hidden',cursor:'pointer',transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',boxShadow:'0 4px 6px -1px rgba(0,0,0,.05), 0 2px 4px -2px rgba(0,0,0,.05)',display:'flex',flexDirection:'column'}}
              onMouseEnter={e=>{const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-4px)'; el.style.boxShadow='0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)'; el.style.borderColor='#0ea5e9';}}
              onMouseLeave={e=>{const el = e.currentTarget as HTMLElement; el.style.transform='none'; el.style.boxShadow='0 4px 6px -1px rgba(0,0,0,.05), 0 2px 4px -2px rgba(0,0,0,.05)'; el.style.borderColor='#e2e8f0';}}>
                <div style={{height:160,backgroundImage:`url(${tpl.headerImgUrl})`,backgroundSize:'cover',backgroundPosition:'center',position:'relative'}}>
                  <div style={{position:'absolute',top:12,left:12,background:'rgba(255,255,255,.95)',backdropFilter:'blur(4px)',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:800,color:'#0f172a',boxShadow:'0 2px 4px rgba(0,0,0,.1)',textTransform:'uppercase',letterSpacing:.5}}>
                    {tpl.design} TASARIM
                  </div>
                </div>
                <div style={{padding:20,display:'flex',flexDirection:'column',flex:1}}>
                  <div style={{fontWeight:800,fontSize:18,color:'#0f172a',marginBottom:6,lineHeight:1.3}}>{tpl.title}</div>
                  <div style={{color:'#64748b',fontSize:13,lineHeight:1.5,marginBottom:16,flex:1}}>{tpl.subtitle}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto',paddingTop:16,borderTop:'1px solid #f1f5f9'}}>
                    <span style={{fontSize:12,fontWeight:700,color:'#94a3b8',display:'flex',alignItems:'center',gap:4}}>🧩 {tpl.blocks.length} Blok</span>
                    <span style={{fontWeight:800,color:'#0ea5e9',fontSize:13,display:'flex',alignItems:'center',gap:4}}>Şablonu Seç <span style={{fontSize:16}}>→</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* ── Saved Newsletters Modal ── */}
    {showSavedModal && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
           onClick={()=>setShowSavedModal(false)}>
        <div style={{background:'#fff',borderRadius:16,width:800,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,.25)',overflow:'hidden'}}
             onClick={e=>e.stopPropagation()}>
          <div style={{padding:'20px 24px',background:'linear-gradient(135deg,#0284c7,#0369a1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:800,fontSize:18,color:'#fff'}}>📂 Kayıtlı Bültenlerim</span>
            <button onClick={()=>setShowSavedModal(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <div style={{padding:24,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:20,flex:1}}>
            {savedList.length === 0 ? (
              <div style={{gridColumn:'1/-1', textAlign:'center', color:'#9ca3af', padding:'40px 0'}}>Henüz kaydedilmiş bir bülteniniz yok.</div>
            ) : savedList.map(s=>(
              <div key={s.id} onClick={()=>handleLoad(s)}
                style={{borderRadius:12,border:'1px solid #e5e7eb',overflow:'hidden',cursor:'pointer',transition:'all .2s',position:'relative'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(2,132,199,.25)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,.05)'}>
                <div style={{height:120,background:s.headerImgUrl?`url(${s.headerImgUrl}) center/cover`:'#e0f2fe',position:'relative'}}>
                  <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)'}}/>
                  <div style={{position:'absolute',bottom:12,left:14,right:14}}>
                    <div style={{color:'#fff',fontWeight:800,fontSize:14,textShadow:'0 1px 4px rgba(0,0,0,.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.title}</div>
                    <div style={{color:'rgba(255,255,255,.9)',fontSize:11,textShadow:'0 1px 4px rgba(0,0,0,.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.subtitle}</div>
                  </div>
                </div>
                <div style={{padding:12,background:'#fafafa',borderTop:'1px solid #e5e7eb',fontSize:11,color:'#6b7280',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{new Date(s.savedAt).toLocaleDateString('tr-TR')}</span>
                  <button onClick={e=>{e.stopPropagation();handleDelete(s.id);}} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontWeight:700}}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <AccessibilityToolbar {...a11y} lang={lang}/>

    </>
  );
}
