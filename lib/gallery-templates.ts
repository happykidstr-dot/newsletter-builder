// Curated, distinct and fully editable sample newsletters for BÜLTEN READ.
// All content is fictional sample content; no factual claims are implied.
export type GalleryDesign = 'european' | 'impact' | 'partnership' | 'evently' | 'corporate' | 'inclusive' | 'stories' | 'editorial';
export type GalleryCategory = 'AB Projeleri' | 'Etkinlikler' | 'Kurumsal' | 'Erişilebilirlik' | 'Hikâyeler';
export type GalleryBlockType = 'title' | 'paragraph' | 'photos' | 'textphoto' | 'photogrid' | 'event' | 'separator' | 'button' | 'author' | 'link' | 'poll' | 'video' | 'attachment' | 'form' | 'googleform';
export type GalleryBlock = { type: GalleryBlockType; data: Record<string,string> };
export type GalleryTemplate = { id:string; title:string; subtitle:string; category:GalleryCategory; description:string; design:GalleryDesign; kind:string; tag:string; headerImgUrl:string; palette:{header:string;accent:string;surface:string;ink:string;font:string}; blocks:GalleryBlock[] };
export const GALLERY_TEMPLATES: GalleryTemplate[] = [
  {
    "id": "european",
    "title": "European Project Magazine",
    "subtitle": "Avrupa projeleri için editoryal bülten",
    "category": "AB Projeleri",
    "description": "Konsorsiyum, faaliyet, çıktı ve ortak haberleri için güçlü bir yayın dili.",
    "design": "european",
    "kind": "magazine",
    "tag": "AB PROJELERİ",
    "headerImgUrl": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1100&q=80",
    "palette": {
      "header": "#122c4a",
      "accent": "#d6ac59",
      "surface": "#f5f0e8",
      "ink": "#18273a",
      "font": "Georgia, 'Times New Roman', serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Birlikte Daha Güçlü Bir Avrupa",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Projemizin yeni döneminde ortaklarımızın çalışmalarını, uluslararası buluşmaları ve öğrenme deneyimlerini bir araya getiriyoruz."
        }
      },
      {
        "type": "photos",
        "data": {
          "url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=80",
          "caption": "Ortaklarımızdan haberler"
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Bu sayıda",
          "size": "h2"
        }
      },
      {
        "type": "textphoto",
        "data": {
          "text": "Ortak toplantıları, katılımcı faaliyetleri ve yaklaşan proje etkinlikleri hakkında kısa notlar.",
          "url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=80",
          "imagePos": "right"
        }
      },
      {
        "type": "button",
        "data": {
          "text": "Proje hakkında daha fazla bilgi",
          "url": "#",
          "align": "center"
        }
      }
    ]
  },
  {
    "id": "impact",
    "title": "Project Impact",
    "subtitle": "Proje sonuçları ve sosyal etki",
    "category": "AB Projeleri",
    "description": "Somut çıktıları, sonuç hikâyelerini ve öğrenimleri görünür kılın.",
    "design": "impact",
    "kind": "report",
    "tag": "ETKİ RAPORU",
    "headerImgUrl": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1100&q=80",
    "palette": {
      "header": "#075d53",
      "accent": "#e1a342",
      "surface": "#edf7f3",
      "ink": "#143e38",
      "font": "Inter, system-ui, sans-serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "İyi Fikirler, Ölçülebilir Etki",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Topluma değer katan çalışmalarımızdan örnekler, deneyimler ve yeni dönem hedefleri."
        }
      },
      {
        "type": "separator",
        "data": {
          "style": "solid"
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Sahadan üç hikâye",
          "size": "h2"
        }
      },
      {
        "type": "photogrid",
        "data": {
          "cols": "2",
          "url1": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1100&q=80",
          "cap1": "Yerel buluşmalar",
          "url2": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1100&q=80",
          "cap2": "Eğitim faaliyetleri"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Faaliyetlerden öğrenilen dersleri paylaşarak yeni ortaklıklara kapı açıyoruz."
        }
      },
      {
        "type": "button",
        "data": {
          "text": "Etki raporunu inceleyin",
          "url": "#",
          "align": "center"
        }
      }
    ]
  },
  {
    "id": "partnership",
    "title": "Partnership News",
    "subtitle": "Ortaklık ve iş birliği çağrıları",
    "category": "AB Projeleri",
    "description": "Avrupa ağınızdaki yeni iş birliklerini sade ve güven veren biçimde duyurun.",
    "design": "partnership",
    "kind": "network",
    "tag": "ORTAKLIK",
    "headerImgUrl": "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=80",
    "palette": {
      "header": "#263b59",
      "accent": "#547bb6",
      "surface": "#eef3fb",
      "ink": "#182f4c",
      "font": "Inter, system-ui, sans-serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Yeni Ortaklıklar, Yeni Ufuklar",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Kurumlar arası bilgi paylaşımı, proje geliştirme ve uluslararası dayanışma için güncel haberler."
        }
      },
      {
        "type": "photos",
        "data": {
          "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1100&q=80",
          "caption": "Birlikte üretmek"
        }
      },
      {
        "type": "title",
        "data": {
          "text": "İş birliği alanlarımız",
          "size": "h2"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Kapsayıcı eğitim • Dijital dönüşüm • Sivil toplumun güçlendirilmesi • Gençlik çalışmaları"
        }
      },
      {
        "type": "button",
        "data": {
          "text": "Ortaklık için iletişime geçin",
          "url": "#",
          "align": "center"
        }
      }
    ]
  },
  {
    "id": "evently",
    "title": "Event & Webinar",
    "subtitle": "Eğitim ve etkinlik daveti",
    "category": "Etkinlikler",
    "description": "Etkinliğinizi tek bakışta anlaşılır kılan güçlü bir davet tasarımı.",
    "design": "evently",
    "kind": "event",
    "tag": "ETKİNLİK",
    "headerImgUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1100&q=80",
    "palette": {
      "header": "#8a335a",
      "accent": "#faac72",
      "surface": "#fff0f3",
      "ink": "#44263b",
      "font": "Outfit, Inter, system-ui, sans-serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Bir Sonraki Buluşmada Görüşelim",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Fikirlerin, deneyimlerin ve yeni ortaklıkların buluştuğu ilham verici bir etkinliğe davetlisiniz."
        }
      },
      {
        "type": "event",
        "data": {
          "title": "Proje Geliştirme Webinarı",
          "date": "",
          "time": "15:00",
          "location": "Çevrim içi"
        }
      },
      {
        "type": "photos",
        "data": {
          "url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1100&q=80",
          "caption": "Etkileşimli bir öğrenme deneyimi"
        }
      },
      {
        "type": "button",
        "data": {
          "text": "Etkinliğe kayıt olun",
          "url": "#",
          "align": "center"
        }
      }
    ]
  },
  {
    "id": "corporate",
    "title": "Corporate Digest",
    "subtitle": "Kurumsal gündem ve duyurular",
    "category": "Kurumsal",
    "description": "Yönetici özeti, kısa haberler ve önemli gelişmeleri tek akışta sunun.",
    "design": "corporate",
    "kind": "digest",
    "tag": "KURUMSAL",
    "headerImgUrl": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1100&q=80",
    "palette": {
      "header": "#212936",
      "accent": "#cda46c",
      "surface": "#f3f4f6",
      "ink": "#26303d",
      "font": "Inter, system-ui, sans-serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Bu Ay Kurumumuzda",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Kısa, net ve güncel bir özet: ekipten haberler, yapılan çalışmalar ve takip edilmesi gereken başlıklar."
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Öne çıkan gelişmeler",
          "size": "h2"
        }
      },
      {
        "type": "textphoto",
        "data": {
          "text": "Yeni girişimlerimiz ve paydaşlarla yürüttüğümüz çalışmalar hakkında güncel notlar.",
          "url": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=80",
          "imagePos": "right"
        }
      },
      {
        "type": "separator",
        "data": {
          "style": "solid"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Bir sonraki sayıda görüşmek üzere."
        }
      }
    ]
  },
  {
    "id": "inclusive",
    "title": "Inclusive Newsletter",
    "subtitle": "Kolay okunabilir ve erişilebilir",
    "category": "Erişilebilirlik",
    "description": "Büyük yazı, güçlü kontrast ve sade bölüm yapısıyla kapsayıcı iletişim.",
    "design": "inclusive",
    "kind": "accessible",
    "tag": "KAPSAYICI",
    "headerImgUrl": "",
    "palette": {
      "header": "#153f5f",
      "accent": "#147e86",
      "surface": "#ffffff",
      "ink": "#132f45",
      "font": "Arial, Inter, system-ui, sans-serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Herkes İçin Haberler",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Merhaba!\nBu bülten kolay okunabilen kısa bölümlerle hazırlandı.\nÖnemli bilgileri açık bir dille paylaşıyoruz."
        }
      },
      {
        "type": "separator",
        "data": {
          "style": "solid"
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Bu hafta neler var?",
          "size": "h2"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "• Yeni eğitimler\n• Yaklaşan buluşmalar\n• Katılım fırsatları"
        }
      },
      {
        "type": "event",
        "data": {
          "title": "Herkese Açık Bilgilendirme Toplantısı",
          "date": "",
          "time": "",
          "location": "Çevrim içi ve yüz yüze"
        }
      },
      {
        "type": "button",
        "data": {
          "text": "Daha fazla bilgi alın",
          "url": "#",
          "align": "center"
        }
      }
    ]
  },
  {
    "id": "stories",
    "title": "Visual Stories",
    "subtitle": "Fotoğraf ağırlıklı proje hikâyeleri",
    "category": "Hikâyeler",
    "description": "Görselleri ve katılımcı hikâyelerini sayfanın merkezine alın.",
    "design": "stories",
    "kind": "story",
    "tag": "HİKÂYELER",
    "headerImgUrl": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=80",
    "palette": {
      "header": "#65402f",
      "accent": "#b76942",
      "surface": "#fbf3ed",
      "ink": "#36251d",
      "font": "Georgia, serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Bir Fotoğraf, Bir Hikâye",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Her buluşma yeni bir hikâye demek. Bu sayıda katılımcıların gözünden çalışmalarımıza bakıyoruz."
        }
      },
      {
        "type": "photogrid",
        "data": {
          "cols": "2",
          "url1": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=80",
          "cap1": "Birlikte geçirilen anlar",
          "url2": "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1100&q=80",
          "cap2": "Paylaşılan deneyimler"
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Katılımcıların gözünden",
          "size": "h2"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Küçük adımların büyük değişimlere dönüştüğü anları keşfedin."
        }
      },
      {
        "type": "button",
        "data": {
          "text": "Hikâyelerin devamı",
          "url": "#",
          "align": "center"
        }
      }
    ]
  },
  {
    "id": "editorial",
    "title": "Minimal Editorial",
    "subtitle": "Sade ve prestijli kurumsal yayın",
    "category": "Kurumsal",
    "description": "Görsele bağımlı olmayan güçlü tipografi, bol boşluk ve yalın anlatım.",
    "design": "editorial",
    "kind": "minimal",
    "tag": "EDİTORYAL",
    "headerImgUrl": "",
    "palette": {
      "header": "#1f252b",
      "accent": "#6f7258",
      "surface": "#fcfcfa",
      "ink": "#22272a",
      "font": "Georgia, 'Times New Roman', serif"
    },
    "blocks": [
      {
        "type": "title",
        "data": {
          "text": "Bakış Açısı",
          "size": "h1"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Yeni dönemden notlar, seçilmiş fikirler ve üzerinde düşünmeye değer kısa okumalar."
        }
      },
      {
        "type": "separator",
        "data": {
          "style": "solid"
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Bu sayının odağı",
          "size": "h2"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "Niteliği niceliğin önüne koyan yaklaşımımızla, birlikte öğrenmenin ve paylaşmanın değerini ele alıyoruz."
        }
      },
      {
        "type": "title",
        "data": {
          "text": "Kısa not",
          "size": "h3"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "En iyi iletişim, okuyucuya zaman kazandıran iletişimdir."
        }
      }
    ]
  }
];
