import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as optionally authenticated.
 * If a valid JWT token is present, the user will be populated.
 * If no token or an invalid token is provided, the request still proceeds with user = null.
 * Usage: @OptionalAuth()
 */
export const OptionalAuth = () => SetMetadata('isOptionalAuth', true);
