import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';

export const metadata: Metadata = {
  title: 'CampusShopper — Smart Shopping for SA Students',
  description:
    'Shop smarter on your NSFAS allowance. Compare prices from Durban vendors, track your budget, and get personalised recommendations.',
  keywords: ['NSFAS', 'student budget', 'South Africa', 'Durban', 'shopping', 'DUT', 'Durban University of Technology'],
  authors: [{ name: 'CampusShopper' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-foreground antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
