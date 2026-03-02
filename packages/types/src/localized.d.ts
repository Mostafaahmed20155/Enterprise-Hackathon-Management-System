export type LocalizedString = {
    en: string;
    ar: string;
};
export type Locale = 'ar' | 'en';
export declare function getLocalizedString(localized: LocalizedString, locale: Locale): string;
export declare function isLocalizedString(value: unknown): value is LocalizedString;
//# sourceMappingURL=localized.d.ts.map