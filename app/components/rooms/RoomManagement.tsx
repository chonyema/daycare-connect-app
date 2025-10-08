'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, Baby, AlertTriangle, Settings, TrendingUp, UserPlus } from 'lucide-react';
import RoomConfigModal from './RoomConfigModal';
import RoomStaffModal from './RoomStaffModal';

interface Room {
  id: string;
  name: string;
  description?: string;
  roomType: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  totalCapacity: number;
  currentOccupancy: number;
  staffChildRatio: string;
  minStaffRequired: number;
  operatingDays: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  acceptingEnrollments: boolean;
  _count?: {
    staff: number;
    children: number;
    incidents: number;
  };
}

interface RoomManagementProps {
  daycareId: string;
}

export default function RoomManagement({ daycareId }: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let url = `/api/rooms?daycareId=${daycareId}`;
      if (filterActive !== null) {
        url += `&isActive=${filterActive}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rooms');
      }

      setRooms(data.rooms || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (daycareId) {
      fetchRooms();
    }
  }, [daycareId, filterActive]);

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setShowConfigModal(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowConfigModal(true);
  };

  const handleManageStaff = (room: Room) => {
    setSelectedRoom(room);
    setShowStaffModal(true);
  };

  const handleModalClose = () => {
    setShowConfigModal(false);
    setSelectedRoom(null);
  };

  const handleRoomSaved = () => {
    fetchRooms();
    handleModalClose();
  };

  const calculateOccupancyPercentage = (room: Room) => {
    return Math.round((room.currentOccupancy / room.totalCapacity) * 100);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRatioCompliance = (room: Room) => {
    const staffCount = room._count?.staff || 0;
    if (staffCount < room.minStaffRequired) {
      return { status: 'warning', message: 'Understaffed' };
    }
    return { status: 'ok', message: 'Compliant' };
  };

  const formatAgeRange = (minMonths: number, maxMonths: number) => {
    const formatAge = (months: number) => {
      if (months < 12) return `${months}m`;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) return `${years}y`;
      return `${years}y ${remainingMonths}m`;
    };
    return `${formatAge(minMonths)} - ${formatAge(maxMonths)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
          <p className="text-gray-600 mt-1">
            Manage classrooms, capacity, and staff assignments
          </p>
        </div>
        <button
          onClick={handleCreateRoom}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Room
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
          onChange={(e) => {
            if (e.target.value === 'all') setFilterActive(null);
            else setFilterActive(e.target.value === 'active');
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Rooms</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Room Grid */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const occupancyPercentage = calculateOccupancyPercentage(room);
            const ratioCompliance = getRatioCompliance(room);

            return (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{room.name}</h3>
                      <p className="text-sm text-blue-100 mt-1">
                        {room.roomType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleManageStaff(room)}
                      className="p-2 hover:bg-blue-400 rounded-lg transition-colors"
                      title="Manage Staff"
                    >
                      <UserPlus size={18} />
                    </button>
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="p-2 hover:bg-blue-400 rounded-lg transition-colors"
                      title="Room Settings"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Age Range */}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Baby size={18} className="text-blue-600" />
                    <span className="text-sm">
                      Ages: {formatAgeRange(room.minAgeMonths, room.maxAgeMonths)}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Capacity</span>
                      <span className={`text-sm font-bold ${getOccupancyColor(occupancyPercentage)}`}>
                        {room.currentOccupancy}/{room.totalCapacity} ({occupancyPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          occupancyPercentage >= 90
                            ? 'bg-red-500'
                            : occupancyPercentage >= 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${occupancyPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Staff */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Staff: {room._count?.staff || 0}/{room.minStaffRequired}
                      </span>
                    </div>
                    {ratioCompliance.status === 'warning' && (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle size={14} />
                        {ratioCompliance.message}
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {room._count?.children || 0}
                      </div>
                      <div className="text-xs text-gray-600">Children</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {room._count?.staff || 0}
                      </div>
                      <div className="text-xs text-gray-600">Staff</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {room._count?.incidents || 0}
                      </div>
                      <div className="text-xs text-gray-600">Incidents</div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2 flex-wrap">
                    {!room.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                    {!room.acceptingEnrollments && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        Not Accepting
                      </span>
                    )}
                    {room.acceptingEnrollments && room.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Accepting
                      </span>
                    )}
                  </div>

                  {/* Operating Hours */}
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    Hours: {room.openTime} - {room.closeTime}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first room to start organizing children and staff
          </p>
          <button
            onClick={handleCreateRoom}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create First Room
          </button>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <RoomConfigModal
          isOpen={showConfigModal}
          onClose={handleModalClose}
          daycareId={daycareId}
          room={selectedRoom}
          onSuccess={handleRoomSaved}
        />
      )}

      {/* Staff Modal */}
      {showStaffModal && selectedRoom && (
        <RoomStaffModal
          isOpen={showStaffModal}
          onClose={() => {
            setShowStaffModal(false);
            setSelectedRoom(null);
          }}
          roomId={selectedRoom.id}
          daycareId={daycareId}
          onSuccess={fetchRooms}
        />
      )}
    </div>
  );
}
