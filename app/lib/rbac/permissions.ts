// Permission definitions for RBAC system

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Daycare Management
  DAYCARE_CREATE = 'daycare:create',
  DAYCARE_READ = 'daycare:read',
  DAYCARE_UPDATE = 'daycare:update',
  DAYCARE_DELETE = 'daycare:delete',
  DAYCARE_VERIFY = 'daycare:verify',

  // Staff Management
  STAFF_CREATE = 'staff:create',
  STAFF_READ = 'staff:read',
  STAFF_UPDATE = 'staff:update',
  STAFF_DELETE = 'staff:delete',

  // Waitlist Management
  WAITLIST_CREATE = 'waitlist:create',
  WAITLIST_READ = 'waitlist:read',
  WAITLIST_UPDATE = 'waitlist:update',
  WAITLIST_DELETE = 'waitlist:delete',
  WAITLIST_MANAGE_OFFERS = 'waitlist:manage_offers',

  // Booking Management
  BOOKING_CREATE = 'booking:create',
  BOOKING_READ = 'booking:read',
  BOOKING_UPDATE = 'booking:update',
  BOOKING_DELETE = 'booking:delete',

  // Review Management
  REVIEW_CREATE = 'review:create',
  REVIEW_READ = 'review:read',
  REVIEW_UPDATE = 'review:update',
  REVIEW_DELETE = 'review:delete',
  REVIEW_MODERATE = 'review:moderate',

  // Daily Reports
  REPORT_CREATE = 'report:create',
  REPORT_READ = 'report:read',
  REPORT_UPDATE = 'report:update',
  REPORT_DELETE = 'report:delete',

  // Attendance
  ATTENDANCE_CREATE = 'attendance:create',
  ATTENDANCE_READ = 'attendance:read',
  ATTENDANCE_UPDATE = 'attendance:update',

  // Messages
  MESSAGE_SEND = 'message:send',
  MESSAGE_READ = 'message:read',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',

  // System Administration
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
}

// Role-based permission mappings
export const RolePermissions = {
  USER: [
    // Parents can manage their own data
    Permission.DAYCARE_READ,
    Permission.BOOKING_CREATE,
    Permission.BOOKING_READ,
    Permission.BOOKING_UPDATE,
    Permission.REVIEW_CREATE,
    Permission.REVIEW_READ,
    Permission.REVIEW_UPDATE,
    Permission.WAITLIST_CREATE,
    Permission.WAITLIST_READ,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_READ,
    Permission.REPORT_READ,
  ],

  STAFF: [
    // Staff can manage operations at their assigned daycare
    Permission.DAYCARE_READ,
    Permission.WAITLIST_READ,
    Permission.WAITLIST_UPDATE,
    Permission.BOOKING_READ,
    Permission.BOOKING_UPDATE,
    Permission.REVIEW_READ,
    Permission.REPORT_CREATE,
    Permission.REPORT_READ,
    Permission.REPORT_UPDATE,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_READ,
  ],

  PROVIDER_ADMIN: [
    // Provider admins have full control over their daycare(s)
    Permission.DAYCARE_CREATE,
    Permission.DAYCARE_READ,
    Permission.DAYCARE_UPDATE,
    Permission.DAYCARE_DELETE,
    Permission.STAFF_CREATE,
    Permission.STAFF_READ,
    Permission.STAFF_UPDATE,
    Permission.STAFF_DELETE,
    Permission.WAITLIST_CREATE,
    Permission.WAITLIST_READ,
    Permission.WAITLIST_UPDATE,
    Permission.WAITLIST_DELETE,
    Permission.WAITLIST_MANAGE_OFFERS,
    Permission.BOOKING_CREATE,
    Permission.BOOKING_READ,
    Permission.BOOKING_UPDATE,
    Permission.BOOKING_DELETE,
    Permission.REVIEW_READ,
    Permission.REVIEW_MODERATE,
    Permission.REPORT_CREATE,
    Permission.REPORT_READ,
    Permission.REPORT_UPDATE,
    Permission.REPORT_DELETE,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_READ,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
  ],

  SUPER_ADMIN: [
    // Super admins have all permissions
    ...Object.values(Permission),
  ],
};

// Helper function to check if a role has a permission
export function hasPermission(role: string, permission: Permission, customPermissions?: string[]): boolean {
  // Check custom permissions first
  if (customPermissions && customPermissions.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const rolePerms = RolePermissions[role as keyof typeof RolePermissions];
  return rolePerms ? rolePerms.includes(permission) : false;
}

// Helper function to get all permissions for a role
export function getPermissions(role: string, customPermissions?: string[]): Permission[] {
  const rolePerms = RolePermissions[role as keyof typeof RolePermissions] || [];
  const custom = customPermissions?.filter(p => Object.values(Permission).includes(p as Permission)) || [];
  return [...new Set([...rolePerms, ...custom as Permission[]])];
}
