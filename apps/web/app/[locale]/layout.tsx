import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Cairo, Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
});

// Cairo font for beautiful Arabic rendering
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-display',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params as required by Next.js 15
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar' ? cairo.variable : inter.variable;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontClass} ${inter.variable} ${cairo.variable} ${instrumentSerif.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className={locale === 'ar' ? 'font-arabic' : 'font-sans'} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster
            position={locale === 'ar' ? 'top-left' : 'top-right'}
            dir={dir}
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: 'font-medium',
                title: 'text-sm',
                description: 'text-xs',
                actionButton: 'bg-primary text-white',
                cancelButton: 'bg-gray-200 dark:bg-gray-700',
                closeButton: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
