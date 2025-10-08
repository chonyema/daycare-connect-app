'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, User, AlertCircle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface StaffAssignment {
  id: string;
  staff: StaffMember;
  role: string;
  isPrimary: boolean;
  assignedDays: string;
  startTime?: string;
  endTime?: string;
}

interface RoomStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  daycareId: string;
  onSuccess?: () => void;
}

const STAFF_ROLES = [
  { value: 'LEAD_TEACHER', label: 'Lead Teacher' },
  { value: 'ASSISTANT', label: 'Assistant' },
  { value: 'FLOATER', label: 'Floater' },
  { value: 'SUPPORT', label: 'Support Staff' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RoomStaffModal({
  isOpen,
  onClose,
  roomId,
  daycareId,
  onSuccess,
}: RoomStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<StaffAssignment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    staffId: '',
    role: 'ASSISTANT',
    isPrimary: false,
    assignedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '07:00',
    endTime: '18:00',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, roomId, daycareId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available staff
      const staffRes = await fetch(`/api/provider/staff?daycareId=${daycareId}`);
      const staffData = await staffRes.json();

      // Fetch current assignments
      const assignmentsRes = await fetch(`/api/rooms/staff?roomId=${roomId}`);
      const assignmentsData = await assignmentsRes.json();

      if (staffRes.ok) {
        setAvailableStaff(staffData.staff || []);
      }

      if (assignmentsRes.ok) {
        setCurrentAssignments(assignmentsData.staffAssignments || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rooms/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          ...newAssignment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign staff');
      }

      setShowAddForm(false);
      setNewAssignment({
        staffId: '',
        role: 'ASSISTANT',
        isPrimary: false,
        assignedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '07:00',
        endTime: '18:00',
      });

      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this staff member from the room?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/staff?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove staff');
      }

      fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setNewAssignment(prev => ({
      ...prev,
      assignedDays: prev.assignedDays.includes(day)
        ? prev.assignedDays.filter(d => d !== day)
        : [...prev.assignedDays, day],
    }));
  };

  if (!isOpen) return null;

  const assignedStaffIds = currentAssignments.map(a => a.staff.id);
  const unassignedStaff = availableStaff.filter(s => !assignedStaffIds.includes(s.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Room Staff Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Assignments */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Staff</h3>

            {currentAssignments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No staff assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentAssignments.map((assignment) => {
                  let assignedDays = [];
                  try {
                    assignedDays = JSON.parse(assignment.assignedDays);
                  } catch (e) {}

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{assignment.staff.name}</h4>
                          {assignment.isPrimary && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{assignment.staff.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {assignment.role.replace(/_/g, ' ')}
                          </span>
                          {assignedDays.length > 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {assignedDays.join(', ')}
                            </span>
                          )}
                          {assignment.startTime && assignment.endTime && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {assignment.startTime} - {assignment.endTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(assignment.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Staff Form */}
          {!showAddForm && unassignedStaff.length > 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Assign Staff to Room
            </button>
          )}

          {showAddForm && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Assign New Staff</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Member *
                </label>
                <select
                  value={newAssignment.staffId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, staffId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select staff member</option>
                  {unassignedStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={newAssignment.role}
                    onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAssignment.isPrimary}
                      onChange={(e) => setNewAssignment({ ...newAssignment, isPrimary: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Primary Educator</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        newAssignment.assignedDays.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newAssignment.startTime}
                    onChange={(e) => setNewAssignment({ ...newAssignment, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newAssignment.endTime}
                    onChange={(e) => setNewAssignment({ ...newAssignment, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAssignStaff}
                  disabled={loading || !newAssignment.staffId || newAssignment.assignedDays.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Assigning...' : 'Assign Staff'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {unassignedStaff.length === 0 && currentAssignments.length > 0 && !showAddForm && (
            <p className="text-sm text-gray-500 text-center py-4">
              All available staff are already assigned to this room
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
