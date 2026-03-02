import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isOptional = this.reflector.getAllAndOverride<boolean>('isOptionalAuth', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isOptional) {
      // Run JWT validation but never reject the request
      return super.canActivate(context);
    }

    return super.canActivate(context);
  }

  // When route is @OptionalAuth(), swallow errors so the request proceeds with user = null
  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    const isOptional = this.reflector.getAllAndOverride<boolean>('isOptionalAuth', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isOptional) {
      return user || null;
    }

    if (err || !user) {
      throw new UnauthorizedException({
        en: 'Unauthorized - please log in',
        ar: 'غير مصرح - يرجى تسجيل الدخول',
      });
    }

    return user;
  }
}
