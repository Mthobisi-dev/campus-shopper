// ============================================================
// OpenRouteService (ORS) Location & Nearest Shop Service
// Calculates route distances, travel times & geocodes locations in Durban
// ============================================================

const LOCATION_API_KEY = process.env.LOCATION_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjM0OGM4YWU2NDJmNjk0YmRlYjRmZWZlZDgzZTI2Y2VhYjAwOTYwZTI3MTMxYzEzZjA1NTRmOGRhIiwiaCI6Im11cm11cjY0In0=';

export interface RouteInfo {
  distanceKm: number;
  durationMins: number;
}

export async function getDistanceMatrix(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[]
): Promise<RouteInfo[]> {
  try {
    const locations = [
      [origin.lng, origin.lat],
      ...destinations.map((d) => [d.lng, d.lat]),
    ];

    const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LOCATION_API_KEY,
      },
      body: JSON.stringify({
        locations,
        sources: [0],
        destinations: Array.from({ length: destinations.length }, (_, i) => i + 1),
        metrics: ['distance', 'duration'],
      }),
    });

    if (!response.ok) throw new Error('Matrix calculation failed');

    const data = await response.json();
    const distances = data.distances[0] || [];
    const durations = data.durations[0] || [];

    return destinations.map((_, i) => ({
      distanceKm: Number(((distances[i] || 0) / 1000).toFixed(1)),
      durationMins: Math.round((durations[i] || 0) / 60),
    }));
  } catch (err) {
    console.error('ORS Matrix error:', err);
    // Fallback to Haversine straight-line distance
    return destinations.map((dest) => {
      const R = 6371;
      const dLat = (dest.lat - origin.lat) * (Math.PI / 180);
      const dLng = (dest.lng - origin.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(origin.lat * (Math.PI / 180)) *
          Math.cos(dest.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Number((R * c).toFixed(1));
      return { distanceKm: dist, durationMins: Math.round(dist * 2.5) };
    });
  }
}

export async function geocodeSuburb(suburb: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${LOCATION_API_KEY}&text=${encodeURIComponent(
        suburb + ', Durban, South Africa'
      )}&boundary.country=ZAF`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (feature && feature.geometry && feature.geometry.coordinates) {
      const [lng, lat] = feature.geometry.coordinates;
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}
