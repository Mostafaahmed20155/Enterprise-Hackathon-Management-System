import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LocalizedString } from '@ehms/types';

/**
 * Global exception filter that returns bilingual error messages
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.getErrorMessage(exception, request);

    const errorResponse = {
      success: false,
      error: {
        code: this.getErrorCode(exception),
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Log error for debugging
    if (status >= 500) {
      console.error('Server Error:', exception);
    }

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exception: unknown, request: Request): LocalizedString {
    const locale = this.getLocale(request);

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return this.createLocalizedMessage(response);
      }

      if (typeof response === 'object') {
        // Check if response itself is a LocalizedString
        if ('en' in response && 'ar' in response) {
          return response as LocalizedString;
        }

        // Check for message property
        if ('message' in response) {
          const msg = (response as any).message;

          // Check if message is a LocalizedString
          if (typeof msg === 'object' && msg !== null && 'en' in msg && 'ar' in msg) {
            return msg as LocalizedString;
          }

          if (typeof msg === 'string') {
            return this.createLocalizedMessage(msg);
          }
          if (Array.isArray(msg)) {
            return this.createLocalizedMessage(msg.join(', '));
          }
        }
      }
    }

    // Default error messages
    return {
      en: 'An unexpected error occurred',
      ar: 'حدث خطأ غير متوقع',
    };
  }

  private createLocalizedMessage(englishMessage: string): LocalizedString {
    // In production, this should use a translation service
    // For now, we'll use a simple mapping
    const translations: Record<string, LocalizedString> = {
      'Unauthorized': { en: 'Unauthorized', ar: 'غير مصرح' },
      'Forbidden': { en: 'Forbidden', ar: 'ممنوع' },
      'Not Found': { en: 'Not Found', ar: 'غير موجود' },
      'Bad Request': { en: 'Bad Request', ar: 'طلب غير صالح' },
      'Internal Server Error': { en: 'Internal Server Error', ar: 'خطأ في الخادم' },
      'Validation failed': { en: 'Validation failed', ar: 'فشل التحقق' },
    };

    return translations[englishMessage] || { en: englishMessage, ar: englishMessage };
  }

  private getErrorCode(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && 'code' in response) {
        return (response as any).code;
      }
    }
    return 'UNKNOWN_ERROR';
  }

  private getLocale(request: Request): 'ar' | 'en' {
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage?.includes('ar')) {
      return 'ar';
    }
    return 'en';
  }
}
