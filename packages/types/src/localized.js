"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalizedString = getLocalizedString;
exports.isLocalizedString = isLocalizedString;
function getLocalizedString(localized, locale) {
    return localized[locale];
}
function isLocalizedString(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'en' in value &&
        'ar' in value &&
        typeof value.en === 'string' &&
        typeof value.ar === 'string');
}
//# sourceMappingURL=localized.js.map