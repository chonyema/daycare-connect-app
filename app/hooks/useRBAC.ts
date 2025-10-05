import { useAuth } from '../contexts/AuthContext';
import { Permission, hasPermission as checkPermission } from '../lib/rbac/permissions';

export interface RBACUser {
  id: string;
  email: string;
  name: string | null;
  userType: string;
  role: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export function useRBAC() {
  const { user } = useAuth();

  const can = (permission: Permission): boolean => {
    if (!user) return false;

    // Cast user to include RBAC fields (will be undefined if not set)
    const rbacUser = user as any;

    // Super admins have all permissions
    if (rbacUser.isSuperAdmin) return true;

    // Check role-based permissions
    const role = rbacUser.role || 'USER';
    const customPermissions = rbacUser.permissions ?
      (typeof rbacUser.permissions === 'string' ? JSON.parse(rbacUser.permissions) : rbacUser.permissions) :
      [];

    return checkPermission(role, permission, customPermissions);
  };

  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some(permission => can(permission));
  };

  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every(permission => can(permission));
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    const rbacUser = user as any;
    const role = rbacUser.role || 'USER';
    return roles.includes(role) || Boolean(rbacUser.isSuperAdmin);
  };

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    const rbacUser = user as any;
    return Boolean(rbacUser.isSuperAdmin);
  };

  const isProviderAdmin = (): boolean => {
    if (!user) return false;
    const rbacUser = user as any;
    return rbacUser.role === 'PROVIDER_ADMIN' || Boolean(rbacUser.isSuperAdmin);
  };

  const isStaff = (): boolean => {
    if (!user) return false;
    const rbacUser = user as any;
    return rbacUser.role === 'STAFF';
  };

  return {
    user: user as RBACUser | null,
    can,
    canAny,
    canAll,
    hasRole,
    isSuperAdmin: isSuperAdmin(),
    isProviderAdmin: isProviderAdmin(),
    isStaff: isStaff(),
  };
}
