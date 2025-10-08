'use client';

import React, { useState } from 'react';
import { Shield, Check, X, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Permission, RolePermissions, getPermissions } from '@/app/lib/rbac/permissions';

const ROLES = [
  { id: 'USER', label: 'Parent/User', description: 'Standard user with basic permissions', color: 'bg-blue-100 text-blue-800' },
  { id: 'STAFF', label: 'Staff', description: 'Daycare staff with operational permissions', color: 'bg-green-100 text-green-800' },
  { id: 'PROVIDER_ADMIN', label: 'Provider Admin', description: 'Full control over their daycare(s)', color: 'bg-purple-100 text-purple-800' },
  { id: 'SUPER_ADMIN', label: 'Super Admin', description: 'System-wide administrative access', color: 'bg-red-100 text-red-800' },
];

const PERMISSION_CATEGORIES = {
  'User Management': [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
  ],
  'Daycare Management': [
    Permission.DAYCARE_CREATE,
    Permission.DAYCARE_READ,
    Permission.DAYCARE_UPDATE,
    Permission.DAYCARE_DELETE,
    Permission.DAYCARE_VERIFY,
  ],
  'Staff Management': [
    Permission.STAFF_CREATE,
    Permission.STAFF_READ,
    Permission.STAFF_UPDATE,
    Permission.STAFF_DELETE,
  ],
  'Waitlist': [
    Permission.WAITLIST_CREATE,
    Permission.WAITLIST_READ,
    Permission.WAITLIST_UPDATE,
    Permission.WAITLIST_DELETE,
    Permission.WAITLIST_MANAGE_OFFERS,
  ],
  'Bookings': [
    Permission.BOOKING_CREATE,
    Permission.BOOKING_READ,
    Permission.BOOKING_UPDATE,
    Permission.BOOKING_DELETE,
  ],
  'Reviews': [
    Permission.REVIEW_CREATE,
    Permission.REVIEW_READ,
    Permission.REVIEW_UPDATE,
    Permission.REVIEW_DELETE,
    Permission.REVIEW_MODERATE,
  ],
  'Daily Reports': [
    Permission.REPORT_CREATE,
    Permission.REPORT_READ,
    Permission.REPORT_UPDATE,
    Permission.REPORT_DELETE,
  ],
  'Attendance': [
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
  ],
  'Messages': [
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_READ,
  ],
  'Analytics': [
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
  ],
  'System': [
    Permission.SYSTEM_SETTINGS,
    Permission.SYSTEM_LOGS,
    Permission.SYSTEM_BACKUP,
  ],
};

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState<string | null>('USER');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['User Management']);
  const [viewMode, setViewMode] = useState<'role' | 'matrix'>('role');

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getRolePermissions = (roleId: string): Permission[] => {
    return getPermissions(roleId);
  };

  const formatPermissionName = (permission: string): string => {
    return permission
      .split(':')[1]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderRoleView = () => {
    const role = ROLES.find(r => r.id === selectedRole);
    if (!role) return null;

    const permissions = getRolePermissions(role.id);

    return (
      <div className="space-y-6">
        {/* Role Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{role.label}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                  {permissions.length} Permissions
                </span>
              </div>
              <p className="text-gray-600">{role.description}</p>
            </div>
          </div>
        </div>

        {/* Permissions by Category */}
        <div className="space-y-3">
          {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPermissions]) => {
            const hasAnyPermission = categoryPermissions.some(p => permissions.includes(p));
            const allPermissions = categoryPermissions.every(p => permissions.includes(p));
            const isExpanded = expandedCategories.includes(category);

            if (!hasAnyPermission) return null;

            return (
              <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <h4 className="font-semibold text-gray-900">{category}</h4>
                    <span className="text-sm text-gray-500">
                      ({categoryPermissions.filter(p => permissions.includes(p)).length}/{categoryPermissions.length})
                    </span>
                  </div>
                  {allPermissions ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="h-4 w-4" />
                      Full Access
                    </span>
                  ) : (
                    <span className="text-yellow-600 text-sm">Partial Access</span>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map(permission => {
                        const hasPermission = permissions.includes(permission);
                        return (
                          <div
                            key={permission}
                            className={`flex items-center gap-2 p-3 rounded-lg ${
                              hasPermission ? 'bg-green-50' : 'bg-white'
                            }`}
                          >
                            {hasPermission ? (
                              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                hasPermission ? 'text-green-900' : 'text-gray-400'
                              }`}>
                                {formatPermissionName(permission)}
                              </p>
                              <p className="text-xs text-gray-500">{permission}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMatrixView = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50">
                Permission
              </th>
              {ROLES.map(role => (
                <th key={role.id} className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  <div className="flex flex-col items-center gap-1">
                    <span>{role.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${role.color}`}>
                      {getRolePermissions(role.id).length}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <React.Fragment key={category}>
                <tr className="bg-gray-100">
                  <td colSpan={ROLES.length + 1} className="px-6 py-2 text-sm font-semibold text-gray-900">
                    {category}
                  </td>
                </tr>
                {permissions.map(permission => (
                  <tr key={permission} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900 sticky left-0 bg-white hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{formatPermissionName(permission)}</div>
                        <div className="text-xs text-gray-500">{permission}</div>
                      </div>
                    </td>
                    {ROLES.map(role => {
                      const hasPermission = getRolePermissions(role.id).includes(permission);
                      return (
                        <td key={role.id} className="px-6 py-3 text-center">
                          {hasPermission ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">View and understand permission assignments for each role</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('role')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'role'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Role
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'matrix'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Matrix View
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">About Permissions</p>
          <p>
            Permissions control what actions users can perform in the system. Each role has a predefined set of
            permissions. Super Admins have all permissions, while other roles have limited access based on their responsibilities.
          </p>
        </div>
      </div>

      {viewMode === 'role' && (
        <>
          {/* Role Selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {ROLES.map(role => {
              const permissions = getRolePermissions(role.id);
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedRole === role.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`h-5 w-5 ${selectedRole === role.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900">{role.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                    {permissions.length} permissions
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role Details */}
          {renderRoleView()}
        </>
      )}

      {viewMode === 'matrix' && renderMatrixView()}
    </div>
  );
}
