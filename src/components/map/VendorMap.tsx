'use client';

import dynamic from 'next/dynamic';

// Leaflet must be loaded client-side only (no SSR)
const VendorMapInner = dynamic(() => import('./VendorMapInner'), { ssr: false });

interface Vendor {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  suburb: string;
}

interface VendorMapProps {
  vendors: Vendor[];
  studentLat?: number;
  studentLng?: number;
  studentSuburb?: string;
}

export default function VendorMap(props: VendorMapProps) {
  return (
    <div className="h-64 rounded-2xl overflow-hidden border border-border">
      <VendorMapInner {...props} />
    </div>
  );
}
