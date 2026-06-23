import type { ValidationError } from 'class-validator';
import type { LocalizedString } from '@ehms/types';

/**
 * Serialize a bilingual message so it can travel through class-validator
 * (which only accepts string messages). The validation exception factory
 * parses it back into a {@link LocalizedString}.
 */
export function bilingual(en: string, ar: string): string {
  return JSON.stringify({ en, ar });
}

function parseLocalized(value: unknown): LocalizedString | null {
  if (typeof value !== 'string' || !value.startsWith('{')) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && 'en' in parsed && 'ar' in parsed) {
      return parsed as LocalizedString;
    }
  } catch {
    // not a JSON message
  }
  return null;
}

/**
 * Convert class-validator errors into a single bilingual message.
 * Messages created via {@link bilingual} are restored to { en, ar };
 * any plain-string message is surfaced as-is in both locales.
 */
export function formatValidationErrors(errors: ValidationError[]): LocalizedString {
  const collected: LocalizedString[] = [];

  const walk = (error: ValidationError) => {
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        collected.push(
          parseLocalized(message) ?? { en: String(message), ar: String(message) }
        );
      }
    }
    error.children?.forEach(walk);
  };

  errors.forEach(walk);

  return {
    en: collected.map((m) => m.en).join('. '),
    ar: collected.map((m) => m.ar).join('. '),
  };
}
