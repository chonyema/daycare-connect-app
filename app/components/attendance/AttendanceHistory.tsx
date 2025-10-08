'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, Download } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  childName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  totalHours?: number;
  mood?: string;
  temperature?: number;
  checkInNotes?: string;
  checkOutNotes?: string;
  daycare: {
    name: string;
  };
}

interface AttendanceHistoryProps {
  bookingId?: string;
  daycareId?: string;
  showFilters?: boolean;
}

export default function AttendanceHistory({
  bookingId,
  daycareId,
  showFilters = true,
}: AttendanceHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = '/api/attendance?';
      if (bookingId) url += `bookingId=${bookingId}&`;
      if (daycareId) url += `daycareId=${daycareId}&`;
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.startDate) url += `startDate=${filters.startDate}&`;
      if (filters.endDate) url += `endDate=${filters.endDate}&`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      setRecords(data.attendance || []);
      setFilteredRecords(data.attendance || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [bookingId, daycareId, filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const calculateStats = () => {
    const totalDays = records.length;
    const totalHours = records.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;

    return {
      totalDays,
      totalHours: totalHours.toFixed(2),
      avgHours: avgHours.toFixed(2),
    };
  };

  const stats = calculateStats();

  const exportToCSV = () => {
    const headers = ['Date', 'Child Name', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Mood'];
    const rows = filteredRecords.map(record => [
      formatDate(record.checkInTime),
      record.childName,
      formatTime(record.checkInTime),
      record.checkOutTime ? formatTime(record.checkOutTime) : 'N/A',
      record.totalHours?.toFixed(2) || 'N/A',
      record.status,
      record.mood || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Days</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalDays}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Hours</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalHours}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Avg Hours/Day</p>
          <p className="text-2xl font-bold text-purple-600">{stats.avgHours}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">All</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="LATE">Late Pickup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Attendance History</h3>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <div key={record.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg text-gray-900">{record.childName}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'CHECKED_IN'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'LATE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <Calendar className="inline mr-1" size={16} />
                        {formatDate(record.checkInTime)}
                      </div>
                      <div>
                        <Clock className="inline mr-1" size={16} />
                        In: {formatTime(record.checkInTime)}
                      </div>
                      <div>
                        <Clock className="inline mr-1" size={16} />
                        Out: {record.checkOutTime ? formatTime(record.checkOutTime) : 'N/A'}
                      </div>
                      <div className="font-semibold text-gray-900">
                        Total: {record.totalHours?.toFixed(2) || 'N/A'} hrs
                      </div>
                    </div>

                    {(record.mood || record.temperature) && (
                      <div className="mt-2 text-sm text-gray-600">
                        {record.mood && <span className="mr-4">Mood: {record.mood}</span>}
                        {record.temperature && <span>Temp: {record.temperature}°F</span>}
                      </div>
                    )}

                    {(record.checkInNotes || record.checkOutNotes) && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {record.checkInNotes && (
                          <p>
                            <strong>Check-in:</strong> {record.checkInNotes}
                          </p>
                        )}
                        {record.checkOutNotes && (
                          <p>
                            <strong>Check-out:</strong> {record.checkOutNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No attendance records found
          </div>
        )}
      </div>
    </div>
  );
}
