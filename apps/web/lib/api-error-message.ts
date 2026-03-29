/**
 * Nest API errors use { success: false, error: { message: LocalizedString | string } }.
 */
export function getApiErrorMessage(
  body: unknown,
  locale: string,
  fallback: string,
): string {
  if (!body || typeof body !== 'object') return fallback;
  const o = body as Record<string, unknown>;
  const err = o.error as Record<string, unknown> | undefined;
  const msg = err?.message ?? o.message;

  if (msg && typeof msg === 'object' && msg !== null && 'en' in msg && 'ar' in msg) {
    const m = msg as { en: string; ar: string };
    return locale === 'ar' ? m.ar : m.en;
  }
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) return msg.join(', ');
  return fallback;
}
