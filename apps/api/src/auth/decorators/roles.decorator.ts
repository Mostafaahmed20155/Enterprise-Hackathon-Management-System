import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to require specific roles for a route
 * Usage: @Roles('SUPER_ADMIN', 'ORGANIZER')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
