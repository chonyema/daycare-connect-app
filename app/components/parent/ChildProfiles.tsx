'use client';

import { useState, useEffect } from 'react';
import {
  Baby,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Heart,
  FileText,
  Clock,
  User,
  Edit,
  Loader2
} from 'lucide-react';

interface ChildProfile {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  age: string;
  daycare: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  parentName: string;
  parentContact: string;
  enrollmentStart: Date;
  expectedExit?: Date;
  isActive: boolean;
  notes?: string;
}

interface ChildProfilesProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  onNavigate: (view: string) => void;
}

export default function ChildProfiles({ user, onNavigate }: ChildProfilesProps) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/parent/children');

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: Date): string => {
    const today = new Date();
    const birthDate = new Date(dob);
    const years = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();

    let totalMonths = years * 12 + months;
    if (today.getDate() < birthDate.getDate()) {
      totalMonths--;
    }

    const ageYears = Math.floor(totalMonths / 12);
    const ageMonths = totalMonths % 12;

    if (ageYears === 0) {
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    } else if (ageMonths === 0) {
      return `${ageYears} year${ageYears !== 1 ? 's' : ''}`;
    } else {
      return `${ageYears} year${ageYears !== 1 ? 's' : ''}, ${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading children...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="font-bold text-red-900">Error Loading Children</h3>
        </div>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchChildren}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (selectedChild) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedChild(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to All Children
          </button>
        </div>

        {/* Child Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                {selectedChild.fullName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedChild.fullName}</h1>
                <p className="text-blue-100">{calculateAge(selectedChild.dateOfBirth)} old</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900 flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(selectedChild.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedChild.isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {selectedChild.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Daycare Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Baby className="h-5 w-5 text-purple-600" />
                Current Daycare
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900">{selectedChild.daycare.name}</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedChild.daycare.address}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {selectedChild.daycare.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrollment Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Enrollment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedChild.enrollmentStart).toLocaleDateString()}
                  </p>
                </div>
                {selectedChild.expectedExit && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expected Exit</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedChild.expectedExit).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Parent Contact */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                Parent Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900 mt-1">{selectedChild.parentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact</label>
                  <p className="text-gray-900 mt-1">{selectedChild.parentContact}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedChild.notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Notes
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedChild.notes}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // TODO: Implement view daily reports for this child
                  onNavigate('daily-reports');
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm">Daily Reports</span>
              </button>
              <button
                onClick={() => {
                  // TODO: Implement view attendance for this child
                  onNavigate('attendance');
                }}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clock className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm">Attendance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 -mt-4 px-4 py-6 md:rounded-t-lg">
        <h1 className="text-2xl font-bold text-white mb-1">My Children</h1>
        <p className="text-blue-100 text-sm">Manage your children's profiles and information</p>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Baby className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
          <p className="text-gray-600 mb-6">
            You don't have any children enrolled in daycare yet.
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Find Childcare
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {child.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{child.fullName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      child.isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {child.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{calculateAge(child.dateOfBirth)} old</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Baby className="h-3 w-3" />
                    {child.daycare.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Enrolled: {new Date(child.enrollmentStart).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
