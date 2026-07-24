import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Role, RoleDocument } from '../users/roles/schemas/role.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  // Lightweight in-memory cache for role permissions (TTL 5 minutes).
  // Optional Memurai/Redis caching can be layered in later without changing the contract.
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(
    private reflector: Reflector,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    // Super admin bypasses all permission checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const userPermissions = await this.resolveUserPermissions(user.sub, user.roleId);

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private async resolveUserPermissions(userId?: string, roleId?: string | Types.ObjectId | null): Promise<string[]> {
    let resolvedRoleId = roleId;

    // JWT only carries userId and system role; resolve roleId from DB if needed.
    if (!resolvedRoleId && userId) {
      try {
        const user = await this.userModel.findById(userId).select('roleId').lean();
        resolvedRoleId = user?.roleId;
      } catch {
        return [];
      }
    }

    if (!resolvedRoleId) {
      return [];
    }

    const cacheKey = resolvedRoleId.toString();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    let permissions: string[] = [];
    try {
      const role = await this.roleModel.findById(resolvedRoleId).select('permissions').lean();
      permissions = Array.isArray(role?.permissions) ? role.permissions : [];
    } catch {
      permissions = [];
    }

    this.cache.set(cacheKey, { permissions, expiresAt: Date.now() + this.ttlMs });
    return permissions;
  }
}
