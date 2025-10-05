import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Permission, hasPermission, getPermissions } from './permissions';
import { getUserFromRequest } from '@/app/utils/auth';

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string | null;
  userType: string;
  role: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  daycareId: string | null;
  permissions: Permission[];
}

// Get user with full RBAC information
export async function getAuthorizedUser(request: NextRequest): Promise<AuthorizedUser | null> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return null;
  }

  // Fetch full user data including RBAC fields
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
      role: true,
      isActive: true,
      isSuperAdmin: true,
      daycareId: true,
      permissions: true,
    },
  });

  if (!fullUser || !fullUser.isActive) {
    return null;
  }

  // Parse custom permissions
  const customPermissions = fullUser.permissions
    ? JSON.parse(fullUser.permissions)
    : [];

  return {
    ...fullUser,
    permissions: getPermissions(fullUser.role, customPermissions),
  };
}

// Check if user has a specific permission
export function can(user: AuthorizedUser | null, permission: Permission): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  // Super admins have all permissions
  if (user.isSuperAdmin) {
    return true;
  }

  return user.permissions.includes(permission);
}

// Check if user has any of the specified permissions
export function canAny(user: AuthorizedUser | null, permissions: Permission[]): boolean {
  return permissions.some(permission => can(user, permission));
}

// Check if user has all of the specified permissions
export function canAll(user: AuthorizedUser | null, permissions: Permission[]): boolean {
  return permissions.every(permission => can(user, permission));
}

// Middleware to require specific permission
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ authorized: boolean; user: AuthorizedUser | null; error?: string }> {
  const user = await getAuthorizedUser(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      error: 'Authentication required',
    };
  }

  if (!can(user, permission)) {
    return {
      authorized: false,
      user,
      error: 'Insufficient permissions',
    };
  }

  return {
    authorized: true,
    user,
  };
}

// Middleware to require specific role
export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<{ authorized: boolean; user: AuthorizedUser | null; error?: string }> {
  const user = await getAuthorizedUser(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      error: 'Authentication required',
    };
  }

  if (!roles.includes(user.role) && !user.isSuperAdmin) {
    return {
      authorized: false,
      user,
      error: 'Insufficient role',
    };
  }

  return {
    authorized: true,
    user,
  };
}

// Require super admin access
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ authorized: boolean; user: AuthorizedUser | null; error?: string }> {
  const user = await getAuthorizedUser(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      error: 'Authentication required',
    };
  }

  if (!user.isSuperAdmin) {
    return {
      authorized: false,
      user,
      error: 'Super admin access required',
    };
  }

  return {
    authorized: true,
    user,
  };
}

// Check if user owns or has access to a daycare
export async function canAccessDaycare(
  user: AuthorizedUser,
  daycareId: string
): Promise<boolean> {
  // Super admins can access all daycares
  if (user.isSuperAdmin) {
    return true;
  }

  // Check if user owns the daycare
  const daycare = await prisma.daycare.findFirst({
    where: {
      id: daycareId,
      ownerId: user.id,
    },
  });

  if (daycare) {
    return true;
  }

  // Check if user is staff at the daycare
  if (user.daycareId === daycareId) {
    return true;
  }

  return false;
}

// Log admin activity
export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
        userAgent: request?.headers.get('user-agent') || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
