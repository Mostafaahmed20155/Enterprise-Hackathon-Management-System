import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to require specific permissions for a route
 * Usage: @RequirePermissions({ resource: 'EVENT', action: 'CREATE' })
 */
export const RequirePermissions = (
  ...permissions: Array<{ resource: string; action: string }>
) => SetMetadata('permissions', permissions);
