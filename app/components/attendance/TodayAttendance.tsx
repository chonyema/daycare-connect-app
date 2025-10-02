'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
import CheckInOutModal from './CheckInOutModal';

interface AttendanceRecord {
  id: string;
  childName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  totalHours?: number;
  mood?: string;
  temperature?: number;
  booking: {
    id: string;
    childName: string;
    childAge?: string;
    parent: {
      name: string;
      phone?: string;
    };
  };
}

interface TodayAttendanceProps {
  daycareId: string;
}

export default function TodayAttendance({ daycareId }: TodayAttendanceProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'check-in' | 'check-out'>('check-in');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string>('');

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/today?daycareId=${daycareId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch attendance');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, [daycareId]);

  const handleCheckIn = (booking: any) => {
    setSelectedBooking(booking);
    setModalMode('check-in');
    setModalOpen(true);
  };

  const handleCheckOut = (attendance: AttendanceRecord) => {
    setSelectedBooking(attendance.booking);
    setSelectedAttendanceId(attendance.id);
    setModalMode('check-out');
    setModalOpen(true);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
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
        <AlertCircle className="inline mr-2" size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expected</p>
              <p className="text-2xl font-bold text-blue-600">
                {data?.summary?.expectedTotal || 0}
              </p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-green-600">
                {data?.summary?.checkedIn || 0}
              </p>
            </div>
            <UserCheck className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Checked Out</p>
              <p className="text-2xl font-bold text-orange-600">
                {data?.summary?.checkedOut || 0}
              </p>
            </div>
            <Clock className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">
                {data?.summary?.absent || 0}
              </p>
            </div>
            <UserX className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Currently Checked In */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Currently Checked In</h3>
        {data?.attendance?.checkedIn?.length > 0 ? (
          <div className="space-y-3">
            {data.attendance.checkedIn.map((record: AttendanceRecord) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{record.booking.childName}</p>
                  <p className="text-sm text-gray-600">
                    Parent: {record.booking.parent.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Check-in: {formatTime(record.checkInTime)}
                  </p>
                  {record.mood && (
                    <p className="text-sm text-gray-500">Mood: {record.mood}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCheckOut(record)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Check Out
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No children checked in</p>
        )}
      </div>

      {/* Checked Out Today */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Checked Out Today</h3>
        {data?.attendance?.checkedOut?.length > 0 ? (
          <div className="space-y-3">
            {data.attendance.checkedOut.map((record: AttendanceRecord) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{record.booking.childName}</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(record.checkInTime)} - {formatTime(record.checkOutTime || '')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: {record.totalHours?.toFixed(2)} hours
                  </p>
                </div>
                {record.status === 'LATE' && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    Late Pickup
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No check-outs today</p>
        )}
      </div>

      {/* Absent/Expected */}
      {data?.attendance?.absent?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Expected But Not Checked In</h3>
          <div className="space-y-3">
            {data.attendance.absent.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{item.booking.childName}</p>
                  <p className="text-sm text-gray-600">
                    Parent: {item.booking.parent.name}
                  </p>
                  {item.booking.parent.phone && (
                    <p className="text-sm text-gray-500">
                      Phone: {item.booking.parent.phone}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleCheckIn(item.booking)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Check In
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedBooking && (
        <CheckInOutModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedBooking(null);
            setSelectedAttendanceId('');
          }}
          booking={selectedBooking}
          mode={modalMode}
          attendanceId={selectedAttendanceId}
          onSuccess={fetchTodayAttendance}
        />
      )}
    </div>
  );
}
