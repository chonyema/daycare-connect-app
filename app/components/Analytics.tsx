'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Star, 
  BarChart3,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; amount: number }>;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    daily: Array<{ date: string; bookings: number }>;
  };
  occupancy: {
    current: number;
    capacity: number;
    rate: number;
    trend: Array<{ date: string; rate: number }>;
  };
  ratings: {
    average: number;
    total: number;
    distribution: Array<{ rating: number; count: number }>;
  };
  demographics: {
    ageGroups: Array<{ age: string; count: number }>;
    careTypes: Array<{ type: string; count: number }>;
  };
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'occupancy'>('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/provider/analytics?range=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        // Mock data for demonstration
        setData(generateMockData());
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): AnalyticsData => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    return {
      revenue: {
        total: 15750,
        growth: 12.5,
        monthly: Array.from({ length: 12 }, (_, i) => ({
          month: format(new Date(2024, i, 1), 'MMM'),
          amount: Math.floor(Math.random() * 3000) + 1000
        }))
      },
      bookings: {
        total: 156,
        confirmed: 134,
        pending: 15,
        cancelled: 7,
        daily: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
          date: format(subDays(new Date(), i), 'MMM dd'),
          bookings: Math.floor(Math.random() * 8) + 2
        })).reverse()
      },
      occupancy: {
        current: 87,
        capacity: 100,
        rate: 87,
        trend: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
          date: format(subDays(new Date(), i), 'MMM dd'),
          rate: Math.floor(Math.random() * 20) + 70
        })).reverse()
      },
      ratings: {
        average: 4.6,
        total: 89,
        distribution: [
          { rating: 5, count: 54 },
          { rating: 4, count: 23 },
          { rating: 3, count: 8 },
          { rating: 2, count: 3 },
          { rating: 1, count: 1 }
        ]
      },
      demographics: {
        ageGroups: [
          { age: '0-1 years', count: 25 },
          { age: '1-2 years', count: 35 },
          { age: '2-3 years', count: 28 },
          { age: '3-4 years', count: 22 },
          { age: '4+ years', count: 15 }
        ],
        careTypes: [
          { type: 'Full Day', count: 78 },
          { type: 'Half Day', count: 45 },
          { type: 'Hourly', count: 23 },
          { type: 'Extended', count: 10 }
        ]
      }
    };
  };

  const exportData = () => {
    if (!data) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daycare-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
        <p className="text-gray-600">Start accepting bookings to see your analytics.</p>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600">Track your daycare performance and insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${data.revenue.total.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{data.revenue.growth}%</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{data.bookings.total}</p>
              <p className="text-sm text-gray-500">{data.bookings.confirmed} confirmed</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-purple-600">{data.occupancy.rate}%</p>
              <p className="text-sm text-gray-500">{data.occupancy.current}/{data.occupancy.capacity} capacity</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{data.ratings.average}</p>
              <p className="text-sm text-gray-500">{data.ratings.total} reviews</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenue.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Daily Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bookings.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Trend */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Occupancy Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.occupancy.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
              <Line type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ratings Distribution */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Ratings Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ratings.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ rating, count }: any) => `${rating}★ (${count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.ratings.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Age Groups</h3>
          <div className="space-y-3">
            {data.demographics.ageGroups.map((group) => {
              const percentage = (group.count / data.demographics.ageGroups.reduce((sum, g) => sum + g.count, 0)) * 100;
              return (
                <div key={group.age} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{group.age}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{group.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Care Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.demographics.careTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }: any) => `${type} (${count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.demographics.careTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Status Summary */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Booking Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{data.bookings.confirmed}</p>
            <p className="text-sm text-green-700">Confirmed</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{data.bookings.pending}</p>
            <p className="text-sm text-yellow-700">Pending</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{data.bookings.cancelled}</p>
            <p className="text-sm text-red-700">Cancelled</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data.bookings.total}</p>
            <p className="text-sm text-blue-700">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;