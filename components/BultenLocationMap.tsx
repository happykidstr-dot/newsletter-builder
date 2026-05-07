'use client';
import { useEffect, useRef } from 'react';

/** Simulated visitor locations (lat, lng, city, count) */
const SAMPLE_LOCATIONS = [
  { lat:41.01, lng:28.97, city:'İstanbul',    count:38 },
  { lat:39.92, lng:32.85, city:'Ankara',      count:21 },
  { lat:38.42, lng:27.14, city:'İzmir',       count:14 },
  { lat:48.85, lng:2.35,  city:'Paris',       count:12 },
  { lat:51.51, lng:-0.12, city:'Londra',      count:9  },
  { lat:52.52, lng:13.40, city:'Berlin',      count:7  },
  { lat:40.71, lng:-74.00,city:'New York',    count:6  },
  { lat:37.77, lng:-122.4,city:'San Francisco',count:4 },
  { lat:35.68, lng:139.69,city:'Tokyo',       count:3  },
  { lat:55.75, lng:37.62, city:'Moskova',     count:3  },
  { lat:41.89, lng:12.50, city:'Roma',        count:4  },
  { lat:40.41, lng:-3.70, city:'Madrid',      count:3  },
  { lat:50.08, lng:14.43, city:'Prag',        count:2  },
  { lat:47.50, lng:19.04, city:'Budapeşte',   count:2  },
  { lat:45.46, lng:9.18,  city:'Milano',      count:2  },
  { lat:-33.87,lng:151.21,city:'Sidney',      count:2  },
  { lat:25.20, lng:55.27, city:'Dubai',       count:2  },
  { lat:28.61, lng:77.20, city:'Yeni Delhi',  count:1  },
  { lat:39.90, lng:116.40,city:'Pekin',       count:1  },
  { lat:-23.55,lng:-46.63,city:'São Paulo',   count:1  },
];

export default function BultenLocationMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !mapRef.current) return;
    initRef.current = true;

    // Dynamically import Leaflet (SSR-safe)
    import('leaflet').then(L => {
      // Inject Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!, {
        center: [30, 20],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 10,
      }).addTo(map);

      // Custom red circle markers
      SAMPLE_LOCATIONS.forEach(loc => {
        const r = Math.min(20, 6 + loc.count * 0.6);
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius: r,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);
        circle.bindPopup(`<b>${loc.city}</b><br/>${loc.count} ziyaretçi`);
      });

      // Invalidate size after mount to avoid grey tiles
      setTimeout(() => map.invalidateSize(), 200);
    });
  }, []);

  return (
    <div ref={mapRef} style={{ width:'100%', height:340, borderRadius:10, overflow:'hidden', zIndex:0 }}/>
  );
}
