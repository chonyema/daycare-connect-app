'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  MessageCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Baby,
  Heart,
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  activeBookings: number;
  upcomingCheckIns: number;
  unreadMessages: number;
  pendingWaitlistOffers: number;
  children: ChildSummary[];
  recentReports: RecentReport[];
  todaySchedule: TodaySchedule[];
}

interface ChildSummary {
  id: string;
  name: string;
  age: string;
  daycareName: string;
  daycareId: string;
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'UPCOMING' | 'NOT_SCHEDULED';
  lastCheckIn?: string;
  nextCheckIn?: string;
}

interface RecentReport {
  id: string;
  childName: string;
  daycareName: string;
  category: string;
  content: string;
  createdAt: string;
}

interface TodaySchedule {
  id: string;
  childName: string;
  daycareName: string;
  checkInTime: string;
  checkOutTime: string;
  status: 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT';
}

interface ParentDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  onNavigate: (view: string) => void;
  onOpenMessages: () => void;
}

export default function ParentDashboard({ user, onNavigate, onOpenMessages }: ParentDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/parent/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MEAL': return '🍽️';
      case 'NAP': return '😴';
      case 'ACTIVITY': return '🎨';
      case 'DIAPER_CHANGE': return '🚼';
      case 'MILESTONE': return '🌟';
      case 'INCIDENT': return '⚠️';
      case 'PHOTO': return '📷';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-100 text-green-800 border-green-200';
      case 'CHECKED_OUT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'UPCOMING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="font-bold text-red-900">Error Loading Dashboard</h3>
        </div>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Find Childcare
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 -mt-4 px-4 py-6 md:rounded-t-lg">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, {user.name || 'Parent'}!
        </h1>
        <p className="text-blue-100 text-sm">
          Here's what's happening with your children today
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('bookings')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.activeBookings}</span>
          </div>
          <p className="text-sm text-gray-600">Active Bookings</p>
        </button>

        <button
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.upcomingCheckIns}</span>
          </div>
          <p className="text-sm text-gray-600">Today's Check-ins</p>
        </button>

        <button
          onClick={onOpenMessages}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</span>
          </div>
          <p className="text-sm text-gray-600">Unread Messages</p>
        </button>

        <button
          onClick={() => onNavigate('waitlist')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.pendingWaitlistOffers}</span>
          </div>
          <p className="text-sm text-gray-600">Waitlist Offers</p>
        </button>
      </div>

      {/* My Children Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Baby className="h-5 w-5 text-blue-600" />
            My Children
          </h2>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>

        {stats.children.length === 0 ? (
          <div className="p-8 text-center">
            <Baby className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No children enrolled yet</p>
            <button
              onClick={() => onNavigate('search')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Find Childcare
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.children.map((child) => (
              <div key={child.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.age}</p>
                      <p className="text-xs text-gray-500 mt-1">{child.daycareName}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(child.status)}`}>
                    {child.status.replace('_', ' ')}
                  </span>
                </div>
                {child.lastCheckIn && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last check-in: {new Date(child.lastCheckIn).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Schedule */}
      {stats.todaySchedule.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Today's Schedule
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.todaySchedule.map((schedule) => (
              <div key={schedule.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{schedule.childName}</h3>
                    <p className="text-sm text-gray-600">{schedule.daycareName}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Check-in: {schedule.checkInTime}</span>
                      <span>•</span>
                      <span>Check-out: {schedule.checkOutTime}</span>
                    </div>
                  </div>
                  {schedule.status === 'CHECKED_IN' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : schedule.status === 'CHECKED_OUT' ? (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Recent Reports
          </h2>
          <button
            onClick={() => onNavigate('daily-reports')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>

        {stats.recentReports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No recent reports</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentReports.slice(0, 5).map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getCategoryIcon(report.category)}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{report.childName}</h3>
                        <p className="text-xs text-gray-500">{report.daycareName}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('search')}
          className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors text-left"
        >
          <TrendingUp className="h-6 w-6 mb-2" />
          <h3 className="font-semibold">Find New Care</h3>
          <p className="text-sm text-blue-100 mt-1">Search for daycares</p>
        </button>

        <button
          onClick={onOpenMessages}
          className="bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors text-left"
        >
          <MessageCircle className="h-6 w-6 mb-2" />
          <h3 className="font-semibold">Messages</h3>
          <p className="text-sm text-purple-100 mt-1">Chat with providers</p>
        </button>
      </div>
    </div>
  );
}
