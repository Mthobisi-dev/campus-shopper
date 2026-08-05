'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CATEGORY_COLOURS: Record<string, string> = {
  grocery: '#22c55e',
  books: '#3b82f6',
  clothing: '#a855f7',
  electronics: '#f59e0b',
  pharmacy: '#06b6d4',
};

const studentIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function vendorIcon(category: string) {
  const colour = CATEGORY_COLOURS[category] || '#888';
  return L.divIcon({
    html: `<div style="width:16px;height:16px;background:${colour};border:2px solid white;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface VendorMapInnerProps {
  vendors: { id: string; name: string; category: string; lat: number; lng: number; suburb: string }[];
  studentLat?: number;
  studentLng?: number;
  studentSuburb?: string;
}

export default function VendorMapInner({ vendors, studentLat, studentLng, studentSuburb }: VendorMapInnerProps) {
  const centerLat = studentLat || -29.8650;
  const centerLng = studentLng || 30.9822;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={12}
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Student location */}
      {studentLat && studentLng && (
        <>
          <Marker position={[studentLat, studentLng]} icon={studentIcon}>
            <Popup>
              <strong>📍 You are here</strong><br />
              {studentSuburb || 'Your location'}
            </Popup>
          </Marker>
          <Circle
            center={[studentLat, studentLng]}
            radius={5000}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1 }}
          />
        </>
      )}

      {/* Vendor markers */}
      {vendors.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]} icon={vendorIcon(v.category)}>
          <Popup>
            <strong>{v.name}</strong><br />
            {v.suburb}, Durban<br />
            <span style={{ color: CATEGORY_COLOURS[v.category] || '#888', textTransform: 'capitalize' }}>
              {v.category}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
