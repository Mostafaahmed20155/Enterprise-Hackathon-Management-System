import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException({
        en: 'Access denied',
        ar: 'الوصول مرفوض',
      });
    }

    const hasRole = user.roles.some((userRole: any) =>
      requiredRoles.includes(userRole.role.name),
    );

    if (!hasRole) {
      throw new ForbiddenException({
        en: 'You do not have the required role to perform this action',
        ar: 'ليس لديك الدور المطلوب لتنفيذ هذا الإجراء',
      });
    }

    return true;
  }
}
