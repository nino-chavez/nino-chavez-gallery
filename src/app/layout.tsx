import type { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nino Chavez Photography',
  description: 'Creative action photography by Nino Chavez',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsDashboard />
      </body>
    </html>
  );
}
