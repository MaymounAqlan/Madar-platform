import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator that specifies which permissions are required to access a route.
 * The PermissionsGuard checks that the authenticated user has at least one of
 * the listed permissions (OR semantics). Combine with UseGuards when AND
 * semantics with roles are required.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
