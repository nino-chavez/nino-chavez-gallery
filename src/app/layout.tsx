import type { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { PageTransition } from '@/components/transitions';
import { EmotionProvider } from '@/contexts/EmotionContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nino Chavez Photography',
  description: 'Creative action photography by Nino Chavez',
};

/**
 * Root Layout
 * Task 2.1.1: Wrap app with EmotionProvider
 *
 * Provides emotion context to all components for persistent emotion state
 * across navigation
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="skip-to-content"
          aria-label="Skip to main content"
        >
          Skip to main content
        </a>

        {/* Task 2.1.1: EmotionProvider wraps entire app */}
        <EmotionProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </EmotionProvider>
        <AnalyticsDashboard />
      </body>
    </html>
  );
}
