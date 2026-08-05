/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app is fully auth-gated (uses cookies() on every route).
  // Prevent Next.js from attempting static optimisation on any page.
  experimental: {
    // Required for server actions / middleware cookie usage in Vercel builds
  },
  // All routes are dynamic – cookies() / headers() used throughout
  // This prevents the "Dynamic server usage" build error on Vercel
  output: undefined, // keep default (not 'export' or 'standalone')

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
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },
};

module.exports = nextConfig;

