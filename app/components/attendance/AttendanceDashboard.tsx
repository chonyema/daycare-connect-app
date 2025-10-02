'use client';

import React, { useState } from 'react';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import TodayAttendance from './TodayAttendance';
import AttendanceHistory from './AttendanceHistory';

interface AttendanceDashboardProps {
  daycareId: string;
}

export default function AttendanceDashboard({ daycareId }: AttendanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor daily check-ins and attendance records</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={24} />
            <span className="text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'today'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline mr-2" size={20} />
            Today's Attendance
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="inline mr-2" size={20} />
            Attendance History
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'today' && <TodayAttendance daycareId={daycareId} />}
        {activeTab === 'history' && <AttendanceHistory daycareId={daycareId} />}
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={24} />
          <h3 className="text-lg font-semibold">Quick Tips</h3>
        </div>
        <ul className="space-y-2 text-sm opacity-90">
          <li>• Check in children as they arrive to maintain accurate records</li>
          <li>• Review attendance history to identify patterns and trends</li>
          <li>• Export attendance data for billing and reporting purposes</li>
          <li>• Use mood and health tracking to monitor child wellbeing</li>
        </ul>
      </div>
    </div>
  );
}
