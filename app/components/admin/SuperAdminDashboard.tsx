'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '@/app/hooks/useRBAC';
import { Users, Activity, BarChart3, Shield, Search, Plus, Edit, Trash2, Eye, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import UserManagement from './UserManagement';
import ActivityLogs from './ActivityLogs';
import SystemStats from './SystemStats';

export default function SuperAdminDashboard() {
  const { isSuperAdmin } = useRBAC();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'activity'>('stats');

  const handleBackToApp = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedInterface', 'parent');
      window.location.href = '/';
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-500">
            You need Super Admin privileges to access this area.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'activity' as const, label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-indigo-600" />
                <h1 className="ml-3 text-2xl font-bold text-gray-900">Super Admin Panel</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium text-sm">
                  Super Admin
                </span>
                <button
                  onClick={handleBackToApp}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to App
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stats' && <SystemStats />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'activity' && <ActivityLogs />}
      </div>
    </div>
  );
}
