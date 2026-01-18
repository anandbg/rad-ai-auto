import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { PreferencesProvider } from '@/lib/preferences/preferences-context';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorSuppressors } from '@/components/error-suppressors';

export const metadata: Metadata = {
  title: 'AI Radiologist - AI-Powered Report Generation',
  description:
    'Generate professional radiology reports with AI-powered transcription and report generation.',
  keywords: ['radiology', 'AI', 'medical reports', 'transcription'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before body to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.dataset.theme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Suppress AbortError from Supabase auth-js locks - must run before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isSupabaseAbortError(err) {
                  return err && err.name === 'AbortError' &&
                    (err.message === 'signal is aborted without reason' ||
                     err.message === '' ||
                     (err.message && err.message.includes('aborted')));
                }
                window.addEventListener('error', function(e) {
                  if (isSupabaseAbortError(e.error)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (isSupabaseAbortError(e.reason)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <ErrorSuppressors />
        {/* Skip link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <PreferencesProvider>
            <ToastProvider>{children}</ToastProvider>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
