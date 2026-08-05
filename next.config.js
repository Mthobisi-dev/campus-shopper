/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'czzlkgnekogmltbhzhvq.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'serpapi.com' },
      // Google Shopping / SerpApi thumbnail hosts
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn1.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn2.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn3.gstatic.com' },
      { protocol: 'https', hostname: '*.google.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      // Merchant sites
      { protocol: 'https', hostname: '*.takealot.com' },
      { protocol: 'https', hostname: '*.woolworths.co.za' },
      { protocol: 'https', hostname: '*.ackermans.co.za' },
    ],
    // Allow raw URLs without strict domain check for external product images
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },
};

module.exports = nextConfig;
