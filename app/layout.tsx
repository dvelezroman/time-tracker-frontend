import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/components/common/AuthProvider';
import { Toast } from '@/components/common/Toast';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: 'Time Tracker',
  description: 'Time Tracker Application',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
