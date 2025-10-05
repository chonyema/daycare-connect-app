'use client';

import React, { useState, useEffect } from 'react';
import { Users, Building2, Calendar, MessageSquare, TrendingUp, Activity, Star } from 'lucide-react';

interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    new30Days: number;
    byRole: Record<string, number>;
    byType: Record<string, number>;
  };
  daycares: {
    total: number;
    active: number;
    inactive: number;
    new30Days: number;
  };
  bookings: {
    total: number;
    new30Days: number;
  };
  waitlist: {
    total: number;
  };
  reviews: {
    total: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}

export default function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users.total,
      change: `+${stats.users.new30Days} this month`,
      icon: Users,
      color: 'bg-blue-500',
      subStats: [
        { label: 'Active', value: stats.users.active },
        { label: 'Inactive', value: stats.users.inactive },
      ],
    },
    {
      label: 'Daycares',
      value: stats.daycares.total,
      change: `+${stats.daycares.new30Days} this month`,
      icon: Building2,
      color: 'bg-green-500',
      subStats: [
        { label: 'Active', value: stats.daycares.active },
        { label: 'Inactive', value: stats.daycares.inactive },
      ],
    },
    {
      label: 'Bookings',
      value: stats.bookings.total,
      change: `+${stats.bookings.new30Days} this month`,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      label: 'Waitlist Entries',
      value: stats.waitlist.total,
      change: 'All time',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      label: 'Reviews',
      value: stats.reviews.total,
      change: 'All time',
      icon: Star,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
              </div>
              {stat.subStats && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  {stat.subStats.map((subStat, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-gray-500">{subStat.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{subStat.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Users by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
          <div className="space-y-3">
            {Object.entries(stats.users.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-700">{role}</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden ml-4">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${(count / stats.users.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold text-gray-900 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Type</h3>
          <div className="space-y-3">
            {Object.entries(stats.users.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-700">{type}</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden ml-4">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${(count / stats.users.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold text-gray-900 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent activity</div>
          ) : (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.user.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">({activity.user.email})</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {activity.description || activity.action}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium opacity-90">User Growth</h4>
            <TrendingUp className="h-5 w-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.users.new30Days}</p>
          <p className="text-sm opacity-75 mt-1">New users in last 30 days</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium opacity-90">Daycare Growth</h4>
            <TrendingUp className="h-5 w-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.daycares.new30Days}</p>
          <p className="text-sm opacity-75 mt-1">New daycares in last 30 days</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium opacity-90">Booking Growth</h4>
            <TrendingUp className="h-5 w-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.bookings.new30Days}</p>
          <p className="text-sm opacity-75 mt-1">New bookings in last 30 days</p>
        </div>
      </div>
    </div>
  );
}
