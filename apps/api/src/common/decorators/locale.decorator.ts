import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Locale } from '@ehms/types';

/**
 * Decorator to extract locale from Accept-Language header
 * Usage: @UserLocale() locale: Locale
 */
export const UserLocale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Locale => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const acceptLanguage = request.headers['accept-language'];

    if (acceptLanguage?.includes('ar')) {
      return 'ar';
    }

    return 'en';
  },
);
