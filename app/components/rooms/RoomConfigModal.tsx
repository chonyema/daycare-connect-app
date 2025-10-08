'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Room {
  id?: string;
  name: string;
  description?: string;
  roomType: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  totalCapacity: number;
  staffChildRatio: string;
  minStaffRequired: number;
  maxStaffAllowed?: number;
  operatingDays: string;
  openTime: string;
  closeTime: string;
  floorLevel?: string;
  roomNumber?: string;
  squareFootage?: number;
  features?: string;
  equipment?: string;
  dailyRate?: number;
  hourlyRate?: number;
  licenseNumber?: string;
  isActive?: boolean;
  acceptingEnrollments?: boolean;
}

interface RoomConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  daycareId: string;
  room?: Room | null;
  onSuccess?: () => void;
}

const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'INFANT_ROOM', label: 'Infant Room' },
  { value: 'TODDLER_ROOM', label: 'Toddler Room' },
  { value: 'PRESCHOOL_ROOM', label: 'Preschool Room' },
  { value: 'NAP_ROOM', label: 'Nap Room' },
  { value: 'OUTDOOR_AREA', label: 'Outdoor Area' },
  { value: 'MULTI_PURPOSE', label: 'Multi-Purpose' },
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function RoomConfigModal({
  isOpen,
  onClose,
  daycareId,
  room,
  onSuccess,
}: RoomConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roomType: 'CLASSROOM',
    minAgeMonths: 0,
    maxAgeMonths: 60,
    totalCapacity: 10,
    staffChildRatio: '1:5',
    minStaffRequired: 1,
    maxStaffAllowed: 3,
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    openTime: '07:00',
    closeTime: '18:00',
    floorLevel: '',
    roomNumber: '',
    squareFootage: '',
    features: [] as string[],
    equipment: [] as string[],
    dailyRate: '',
    hourlyRate: '',
    licenseNumber: '',
    isActive: true,
    acceptingEnrollments: true,
  });

  useEffect(() => {
    if (room) {
      // Parse JSON fields
      let operatingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      let features: string[] = [];
      let equipment: string[] = [];
      let staffChildRatio = '1:5';

      try {
        if (room.operatingDays) {
          operatingDays = JSON.parse(room.operatingDays);
        }
      } catch (e) {}

      try {
        if (room.features) {
          features = JSON.parse(room.features);
        }
      } catch (e) {}

      try {
        if (room.equipment) {
          equipment = JSON.parse(room.equipment);
        }
      } catch (e) {}

      // Parse staffChildRatio if it's JSON stringified
      try {
        if (room.staffChildRatio) {
          staffChildRatio = JSON.parse(room.staffChildRatio);
        }
      } catch (e) {
        // If it's not JSON, use it as-is
        staffChildRatio = room.staffChildRatio || '1:5';
      }

      setFormData({
        name: room.name || '',
        description: room.description || '',
        roomType: room.roomType || 'CLASSROOM',
        minAgeMonths: room.minAgeMonths || 0,
        maxAgeMonths: room.maxAgeMonths || 60,
        totalCapacity: room.totalCapacity || 10,
        staffChildRatio,
        minStaffRequired: room.minStaffRequired || 1,
        maxStaffAllowed: room.maxStaffAllowed || 3,
        operatingDays,
        openTime: room.openTime || '07:00',
        closeTime: room.closeTime || '18:00',
        floorLevel: room.floorLevel || '',
        roomNumber: room.roomNumber || '',
        squareFootage: room.squareFootage?.toString() || '',
        features,
        equipment,
        dailyRate: room.dailyRate?.toString() || '',
        hourlyRate: room.hourlyRate?.toString() || '',
        licenseNumber: room.licenseNumber || '',
        isActive: room.isActive !== undefined ? room.isActive : true,
        acceptingEnrollments: room.acceptingEnrollments !== undefined ? room.acceptingEnrollments : true,
      });
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const method = room?.id ? 'PUT' : 'POST';
      const endpoint = '/api/rooms';

      const payload: any = {
        daycareId,
        name: formData.name,
        description: formData.description || null,
        roomType: formData.roomType,
        minAgeMonths: parseInt(formData.minAgeMonths.toString()),
        maxAgeMonths: parseInt(formData.maxAgeMonths.toString()),
        totalCapacity: parseInt(formData.totalCapacity.toString()),
        staffChildRatio: formData.staffChildRatio,
        minStaffRequired: parseInt(formData.minStaffRequired.toString()),
        maxStaffAllowed: formData.maxStaffAllowed ? parseInt(formData.maxStaffAllowed.toString()) : null,
        operatingDays: Array.isArray(formData.operatingDays) ? formData.operatingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        floorLevel: formData.floorLevel || null,
        roomNumber: formData.roomNumber || null,
        squareFootage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
        features: (formData.features && formData.features.length > 0) ? formData.features : null,
        equipment: (formData.equipment && formData.equipment.length > 0) ? formData.equipment : null,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : null,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        licenseNumber: formData.licenseNumber || null,
        isActive: formData.isActive,
        acceptingEnrollments: formData.acceptingEnrollments,
      };

      if (room?.id) {
        payload.roomId = room.id;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save room');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {room?.id ? 'Edit Room' : 'Create New Room'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Infant Room A, Toddler 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <select
                    required
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Brief description of the room..."
                />
              </div>
            </div>

            {/* Age Range & Capacity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Age Range & Capacity</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Age (months) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minAgeMonths}
                    onChange={(e) => setFormData({ ...formData, minAgeMonths: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Age (months) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.maxAgeMonths}
                    onChange={(e) => setFormData({ ...formData, maxAgeMonths: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalCapacity}
                    onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Staffing Ratios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Staffing Requirements</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Staff:Child Ratio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staffChildRatio}
                    onChange={(e) => setFormData({ ...formData, staffChildRatio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                    placeholder="1:5"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: 1:5 (1 staff per 5 children). Common ratios: Infants 1:3, Toddlers 1:5, Preschool 1:8
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Staff Required *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.minStaffRequired}
                    onChange={(e) => setFormData({ ...formData, minStaffRequired: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Staff Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStaffAllowed}
                    onChange={(e) => setFormData({ ...formData, maxStaffAllowed: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Operating Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Operating Schedule</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.operatingDays.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Open Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Close Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.acceptingEnrollments}
                    onChange={(e) => setFormData({ ...formData, acceptingEnrollments: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Accepting Enrollments</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Saving...' : room?.id ? 'Update Room' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
