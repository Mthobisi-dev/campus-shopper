const LOCATION_TOKEN = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjM0OGM4YWU2NDJmNjk0YmRlYjRmZWZlZDgzZTI2Y2VhYjAwOTYwZTI3MTMxYzEzZjA1NTRmOGRhIiwiaCI6Im11cm11cjY0In0=';

async function testLocationApi() {
  console.log('Testing Location Token with OpenRouteService & Location endpoints...');

  // OpenRouteService geocode/reverse or search endpoint
  const url1 = `https://api.openrouteservice.org/geocode/search?api_key=${LOCATION_TOKEN}&text=Durban&boundary.country=ZAF`;
  try {
    const res1 = await fetch(url1);
    console.log('ORS Geocode search status:', res1.status);
    if (res1.ok) {
      const data1 = await res1.json();
      console.log('ORS features count:', data1.features ? data1.features.length : 0);
    } else {
      console.log('ORS error:', await res1.text());
    }
  } catch (e) {
    console.log('ORS fetch error:', e.message);
  }

  // LocationIQ / Location API
  const url2 = `https://us1.locationiq.com/v1/search?key=${LOCATION_TOKEN}&q=Durban,South+Africa&format=json`;
  try {
    const res2 = await fetch(url2);
    console.log('LocationIQ status:', res2.status);
  } catch (e) {}
}

testLocationApi();
