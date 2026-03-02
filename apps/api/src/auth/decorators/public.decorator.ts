import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as public (skip JWT authentication)
 * Usage: @Public()
 */
export const Public = () => SetMetadata('isPublic', true);
