import type { Metadata } from 'next';
import '@/client/styles/globals.css';
import { AuthProvider } from '@/client/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'H1MS — Hospital Management System',
  description:
    'High-performance, interactive Hospital Management System with role-based access control, real-time monitoring, and automated patient notifications.',
  keywords: ['hospital', 'management', 'HMS', 'medical', 'healthcare', 'RBAC'],
  authors: [{ name: 'H1MS' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
