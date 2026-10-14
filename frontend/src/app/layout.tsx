import type { Metadata } from 'next';
import '@/styles/globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'Comprehensive maternal and newborn health programme management platform supporting antenatal, delivery, and postnatal workflows.',
  keywords: [
    'Maternal Health',
    'Newborn Care',
    'Antenatal Care',
    'Nigeria Healthcare',
    'Haihuwa Lafiya',
    'Primary Healthcare',
  ],
  authors: [{ name: 'Haihuwa Lafiya Initiative' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-background font-sans antialiased text-foreground">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
