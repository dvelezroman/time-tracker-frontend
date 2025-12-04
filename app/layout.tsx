import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/components/common/AuthProvider';
import { Toast } from '@/components/common/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Time Tracker',
  description: 'Time Tracker Application',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
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
            {children}
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
