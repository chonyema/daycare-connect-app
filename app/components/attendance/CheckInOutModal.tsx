'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    childName: string;
    childAge?: string;
  };
  mode: 'check-in' | 'check-out';
  attendanceId?: string;
  onSuccess?: () => void;
}

export default function CheckInOutModal({
  isOpen,
  onClose,
  booking,
  mode,
  attendanceId,
  onSuccess,
}: CheckInOutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    notes: '',
    temperature: '',
    mood: '',
    emergencyContact: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint =
        mode === 'check-in'
          ? '/api/attendance/check-in'
          : '/api/attendance/check-out';

      const body =
        mode === 'check-in'
          ? {
              bookingId: booking.id,
              checkInNotes: formData.notes,
              temperature: formData.temperature,
              mood: formData.mood,
              emergencyContact: formData.emergencyContact,
            }
          : {
              attendanceId,
              checkOutNotes: formData.notes,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      // Success
      if (onSuccess) onSuccess();
      onClose();

      // Reset form
      setFormData({
        notes: '',
        temperature: '',
        mood: '',
        emergencyContact: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'check-in' ? 'Check In' : 'Check Out'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Child Info */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-lg text-gray-900">{booking.childName}</p>
            {booking.childAge && (
              <p className="text-gray-600">Age: {booking.childAge}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'check-in' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="98.6"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood
                  </label>
                  <select
                    value={formData.mood}
                    onChange={(e) =>
                      setFormData({ ...formData, mood: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select mood</option>
                    <option value="Happy">Happy</option>
                    <option value="Energetic">Energetic</option>
                    <option value="Calm">Calm</option>
                    <option value="Sleepy">Sleepy</option>
                    <option value="Fussy">Fussy</option>
                    <option value="Sick">Sick</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'check-in' ? 'Check-in Notes' : 'Check-out Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading
                  ? 'Processing...'
                  : mode === 'check-in'
                  ? 'Check In'
                  : 'Check Out'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
