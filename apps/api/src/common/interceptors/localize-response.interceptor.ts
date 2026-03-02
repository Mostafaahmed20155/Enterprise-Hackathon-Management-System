import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { isLocalizedString, LocalizedString, Locale } from '@ehms/types';

/**
 * Interceptor that automatically localizes JSONB fields in API responses
 * based on Accept-Language header
 */
@Injectable()
export class LocalizeResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const locale = this.getLocale(request);

    return next.handle().pipe(
      map((data) => {
        if (!data) return data;

        // Localize the data recursively
        return this.localizeData(data, locale);
      })
    );
  }

  private getLocale(request: Request): Locale {
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage?.includes('ar')) {
      return 'ar';
    }
    return 'en';
  }

  private localizeData(data: any, locale: Locale): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.localizeData(item, locale));
    }

    if (data !== null && typeof data === 'object') {
      // Don't process Date objects, return them as-is
      if (data instanceof Date) {
        return data;
      }

      const localized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Check if this is a LocalizedString
        if (isLocalizedString(value)) {
          localized[key] = (value as LocalizedString)[locale];
        } else if (value instanceof Date) {
          // Preserve Date objects
          localized[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          localized[key] = this.localizeData(value, locale);
        } else {
          localized[key] = value;
        }
      }

      return localized;
    }

    return data;
  }
}
