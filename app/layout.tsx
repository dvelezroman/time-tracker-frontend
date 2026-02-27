import type { Metadata, Viewport } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/components/common/AuthProvider';
import { Toast } from '@/components/common/Toast';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import { WebSocketProvider } from '@/components/common/WebSocketProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Time Tracker',
  description: 'Time Tracker Application for Race Management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Time Tracker',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Time Tracker" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            <AuthProvider>
              <WebSocketProvider>
                <ServiceWorkerRegistration />
                {children}
                <Toast />
              </WebSocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
