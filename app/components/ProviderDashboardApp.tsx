'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  Settings,
  Bell,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  MessageCircle,
  BarChart3,
  Home,
  TrendingUp,
  Mail,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DaycareForm from './DaycareForm';
import EmailManagement from './EmailManagement';
import Analytics from './Analytics';
import BookingManagement from './BookingManagement';
import MessagingSystem from './MessagingSystem';
import EnhancedProviderWaitlistDashboard from './EnhancedProviderWaitlistDashboard';
import DailyReports from './DailyReports';
import TodayAttendance from './attendance/TodayAttendance';
import AttendanceHistory from './attendance/AttendanceHistory';
import { getBookingStatusLabel, getBookingStatusColor } from '@/app/utils/bookingStatus';

interface Daycare {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentOccupancy: number;
  dailyRate: number;
  averageRating: number;
  totalReviews: number;
  verified: boolean;
  active: boolean;
  waitlistCount: number;
}

interface Booking {
  id: string;
  childName: string;
  childAge: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'WAITLIST';
  dailyRate: number;
  totalCost: number;
  parent: {
    name: string;
    email: string;
    phone: string;
  };
}

const ProviderDashboardApp = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [daycares, setDaycares] = useState<Daycare[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDaycareForm, setShowDaycareForm] = useState(false);
  const [editingDaycare, setEditingDaycare] = useState<Daycare | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedAttendanceDaycareId, setSelectedAttendanceDaycareId] = useState<string>('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeBookings: 0,
    pendingRequests: 0,
    occupancyRate: 0
  });

  // Load real data when user is authenticated
  useEffect(() => {
    if (user) {
      loadProviderData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadProviderData = async () => {
    try {
      const [daycaresRes, bookingsRes, statsRes] = await Promise.all([
        fetch('/api/provider/daycares'),
        fetch('/api/provider/bookings'),
        fetch('/api/provider/stats')
      ]);

      if (daycaresRes.ok) {
        const daycaresData = await daycaresRes.json();
        setDaycares(daycaresData);
        // Set first daycare as default for attendance
        if (daycaresData.length > 0 && !selectedAttendanceDaycareId) {
          setSelectedAttendanceDaycareId(daycaresData[0].id);
        }
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDaycare = () => {
    setEditingDaycare(null);
    setShowDaycareForm(true);
  };

  const handleEditDaycare = (daycare: Daycare) => {
    setEditingDaycare(daycare);
    setShowDaycareForm(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const url = editingDaycare ? `/api/provider/daycares/${editingDaycare.id}` : '/api/provider/daycares';
      const method = editingDaycare ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowDaycareForm(false);
        setEditingDaycare(null);
        await loadProviderData(); // Reload the data
      } else {
        const errorData = await response.json();
        console.error('Failed to save daycare:', errorData);
        throw new Error(errorData.error || 'Failed to save daycare');
      }
    } catch (error) {
      console.error('Error saving daycare:', error);
      throw error; // Let DaycareForm handle the error display
    }
  };

  const handleDeleteDaycare = async (daycareId: string) => {
    if (!confirm('Are you sure you want to delete this daycare? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/provider/daycares/${daycareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadProviderData(); // Reload the data
      } else {
        console.error('Failed to delete daycare');
        alert('Failed to delete daycare. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting daycare:', error);
      alert('Error deleting daycare. Please try again.');
    }
  };

  // Loading check - return early if still loading
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Provider Navigation
  const ProviderNavigation = () => (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'daycares', label: 'My Daycares', icon: Home },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'attendance', label: 'Attendance', icon: UserCheck },
            { id: 'waitlist', label: 'Waitlist', icon: Users },
            { id: 'daily-reports', label: 'Daily Reports', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'emails', label: 'Emails', icon: Mail },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalRevenue}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeBookings}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.occupancyRate}%</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Booking Requests</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.isArray(bookings) && bookings.length > 0 ? (
              bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{booking.childName}</h4>
                    <p className="text-sm text-gray-600">{booking.parent.name} • {booking.parent.phone}</p>
                    <p className="text-sm text-gray-500">Start: {new Date(booking.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${booking.totalCost}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                      {getBookingStatusLabel(booking.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent booking requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DaycaresView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Daycares</h2>
        <button
          onClick={handleAddDaycare}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add New Daycare
        </button>
      </div>

      <div className="grid gap-6">
        {Array.isArray(daycares) && daycares.length > 0 ? (
          daycares.map((daycare) => (
            <div key={daycare.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{daycare.name}</h3>
                    {daycare.verified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-600">{daycare.type.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-700">{daycare.averageRating} ({daycare.totalReviews} reviews)</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {daycare.currentOccupancy}/{daycare.capacity} capacity
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditDaycare(daycare)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="View/Edit Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditDaycare(daycare)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDaycare(daycare.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Daily Rate</p>
                  <p className="text-lg font-semibold text-green-800">${daycare.dailyRate}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Occupancy</p>
                  <p className="text-lg font-semibold text-blue-800">
                    {Math.round((daycare.currentOccupancy / daycare.capacity) * 100)}%
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Waitlist</p>
                  <p className="text-lg font-semibold text-purple-800">{daycare.waitlistCount}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No daycares yet</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first daycare facility to begin accepting bookings.
            </p>
            <button
              onClick={handleAddDaycare}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Your First Daycare
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <ProviderNavigation />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'daycares' && <DaycaresView />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'attendance' && daycares.length > 0 && selectedAttendanceDaycareId && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Tracking</h2>
              <p className="text-gray-600">Manage daily check-in and check-out for children</p>
            </div>

            {/* Daycare Selector */}
            {daycares.length > 1 && (
              <div className="bg-white p-4 rounded-lg shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Daycare
                </label>
                <select
                  value={selectedAttendanceDaycareId}
                  onChange={(e) => setSelectedAttendanceDaycareId(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {daycares.map(daycare => (
                    <option key={daycare.id} value={daycare.id}>
                      {daycare.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Today's Attendance */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Attendance</h3>
              <TodayAttendance daycareId={selectedAttendanceDaycareId} />
            </div>

            {/* Attendance History */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Attendance History</h3>
              <AttendanceHistory daycareId={selectedAttendanceDaycareId} />
            </div>
          </div>
        )}
        {activeTab === 'attendance' && daycares.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Daycares Yet</h3>
            <p className="text-gray-600 mb-4">Create a daycare to start tracking attendance</p>
            <button
              onClick={() => setActiveTab('daycares')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to My Daycares
            </button>
          </div>
        )}
        {activeTab === 'daily-reports' && user && (
          <DailyReports
            userType="PROVIDER"
            currentUser={{
              id: user.id,
              name: user.name || '',
              userType: user.userType
            }}
          />
        )}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                <p className="text-gray-600">Communicate directly with parents</p>
              </div>
              <button
                onClick={() => setShowMessaging(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Open Messages
              </button>
            </div>

            <div className="bg-white rounded-lg border p-8 text-center">
              <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Message Center</h3>
              <p className="text-gray-600 mb-4">Stay connected with parents and manage all your conversations in one place.</p>
              <button
                onClick={() => setShowMessaging(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Start Messaging
              </button>
            </div>
          </div>
        )}
        {activeTab === 'waitlist' && user && (
          <EnhancedProviderWaitlistDashboard
            currentUser={{
              id: user.id,
              name: user.name || '',
              userType: user.userType
            }}
          />
        )}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'emails' && <EmailManagement />}
      </div>

      {/* Daycare Form Modal */}
      <DaycareForm
        isOpen={showDaycareForm}
        onClose={() => {
          setShowDaycareForm(false);
          setEditingDaycare(null);
        }}
        daycare={editingDaycare}
        onSave={handleFormSubmit}
      />

      {/* Messaging System */}
      {showMessaging && user && (
        <MessagingSystem
          currentUser={{
            id: user.id,
            name: user.name || '',
            email: user.email,
            userType: user.userType
          }}
          onClose={() => setShowMessaging(false)}
        />
      )}
    </div>
  );
};

export default ProviderDashboardApp;