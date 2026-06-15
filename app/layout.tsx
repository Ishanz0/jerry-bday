import type {Metadata, Viewport} from 'next';
import './globals.css'; 

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#05070A',
};

export const metadata: Metadata = {
  title: 'EarthViewer',
  description: 'An ultra-realistic interactive 3D earth globe using React Three Fiber.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EarthViewer'
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="overflow-hidden bg-[#05070A] touch-none">{children}</body>
    </html>
  );
}
