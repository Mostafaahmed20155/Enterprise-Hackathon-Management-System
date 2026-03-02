import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<
      Array<{ resource: string; action: string }>
    >('permissions', context.getHandler());

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        en: 'Access denied',
        ar: 'الوصول مرفوض',
      });
    }

    // Get event ID from params if exists (for event-scoped permissions)
    const eventId = request.params.eventId || request.body?.eventId;

    // Check if user has required permissions
    const hasPermission = await this.checkPermissions(
      user.sub,
      requiredPermissions,
      eventId,
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        en: 'You do not have permission to perform this action',
        ar: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      });
    }

    return true;
  }

  private async checkPermissions(
    userId: string,
    requiredPermissions: Array<{ resource: string; action: string }>,
    eventId?: string,
  ): Promise<boolean> {
    // Get user roles with permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        OR: [
          { eventId: null }, // Global roles
          { eventId }, // Event-scoped roles
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Extract all permissions
    const userPermissions = userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    );

    // Check if user has all required permissions
    return requiredPermissions.every((required) =>
      userPermissions.some(
        (up) => up.resource === required.resource && up.action === required.action,
      ),
    );
  }
}
