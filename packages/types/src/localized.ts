/**
 * Bilingual string type
 * All user-facing content is stored in both Arabic and English
 */
export type LocalizedString = {
  en: string;
  ar: string;
};

/**
 * Supported locales
 */
export type Locale = 'ar' | 'en';

/**
 * Helper to get localized string based on locale
 */
export function getLocalizedString(localized: LocalizedString, locale: Locale): string {
  return localized[locale];
}

/**
 * Type guard to check if value is LocalizedString
 */
export function isLocalizedString(value: unknown): value is LocalizedString {
  return (
    typeof value === 'object' &&
    value !== null &&
    'en' in value &&
    'ar' in value &&
    typeof (value as LocalizedString).en === 'string' &&
    typeof (value as LocalizedString).ar === 'string'
  );
}
