const SERPAPI_KEY = '93e333f9009775bec00b07ac789c917cb8d76a4a7ef8ba49e7e37d2f3e3346ac';

async function testSerpApi(query = 'jacket') {
  console.log(`Testing SerpApi search for: "${query}" in Durban...`);
  
  // Test Google Shopping engine on SerpApi for Durban, South Africa
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&location=${encodeURIComponent('Durban, KwaZulu-Natal, South Africa')}&google_domain=google.co.za&gl=za&hl=en&api_key=${SERPAPI_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log('Google Shopping error status:', res.status, await res.text());
      // Try standard google engine if shopping fails
      return testGoogleSearch(query);
    }
    const data = await res.json();
    const shoppingResults = data.shopping_results || [];
    console.log(`✅ Google Shopping results count: ${shoppingResults.length}`);
    if (shoppingResults.length > 0) {
      shoppingResults.slice(0, 5).forEach((item, i) => {
        console.log(`\n  ${i+1}. ${item.title}`);
        console.log(`     Price: ${item.price || item.extracted_price}`);
        console.log(`     Source/Shop: ${item.source || item.merchant || 'Unknown'}`);
        console.log(`     Link: ${item.link}`);
      });
    } else {
      console.log('No shopping_results array found. Keys in response:', Object.keys(data));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function testGoogleSearch(query) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&location=${encodeURIComponent('Durban, KwaZulu-Natal, South Africa')}&google_domain=google.co.za&gl=za&hl=en&api_key=${SERPAPI_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Google search organic results:', (data.organic_results || []).length);
  if (data.inline_shopping_results) {
    console.log('Inline shopping results:', data.inline_shopping_results.length);
  }
}

testSerpApi('winter jacket').catch(console.error);
