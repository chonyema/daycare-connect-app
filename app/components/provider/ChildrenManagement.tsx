'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Heart,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Baby,
  Users,
  Clock,
  Activity,
  MessageSquare,
  Download,
  Upload,
  Eye,
  Edit,
} from 'lucide-react';

interface Child {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: string;
  daycare: {
    id: string;
    name: string;
  };
  parentName: string;
  parentContact: string;
  enrollmentStart: string;
  expectedExit: string | null;
  isActive: boolean;
  notes?: string;
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  doctorName?: string;
  doctorPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

interface ChildrenManagementProps {
  daycareId?: string;
}

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({ daycareId }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadChildren();
  }, [daycareId]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const url = daycareId
        ? `/api/provider/children?daycareId=${daycareId}`
        : '/api/provider/children';

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setChildren(data);
      } else {
        console.error('Failed to load children:', data.error);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         child.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && child.isActive) ||
                         (filterStatus === 'inactive' && !child.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleChildClick = (child: Child) => {
    if (selectedChild?.id === child.id) {
      setSelectedChild(null);
      setActiveSection('profile');
    } else {
      setSelectedChild(child);
      setActiveSection('profile');
    }
  };

  const ChildDetailModal = ({ child }: { child: Child }) => {
    const sections = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'parent', label: 'Parent Info', icon: Users },
      { id: 'medical', label: 'Medical Records', icon: Heart },
      { id: 'documents', label: 'Documentation', icon: FileText },
      { id: 'reports', label: 'Daily Reports', icon: Activity },
      { id: 'attendance', label: 'Attendance', icon: Clock },
      { id: 'notes', label: 'Notes & Incidents', icon: MessageSquare },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{child.fullName}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {child.age} • {child.daycare.name}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                child.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {child.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button
              onClick={() => setSelectedChild(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex px-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'profile' && <ProfileSection child={child} />}
            {activeSection === 'parent' && <ParentSection child={child} />}
            {activeSection === 'medical' && <MedicalSection child={child} />}
            {activeSection === 'documents' && <DocumentsSection child={child} />}
            {activeSection === 'reports' && <ReportsSection child={child} />}
            {activeSection === 'attendance' && <AttendanceSection child={child} />}
            {activeSection === 'notes' && <NotesSection child={child} />}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setSelectedChild(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert('Edit Profile feature coming soon!');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProfileSection = ({ child }: { child: Child }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <p className="text-gray-900">{child.fullName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <p className="text-gray-900">{new Date(child.dateOfBirth).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <p className="text-gray-900">{child.age}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Start</label>
          <p className="text-gray-900">{new Date(child.enrollmentStart).toLocaleDateString()}</p>
        </div>
        {child.expectedExit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Exit</label>
            <p className="text-gray-900">{new Date(child.expectedExit).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daycare</label>
          <p className="text-gray-900">{child.daycare.name}</p>
        </div>
      </div>
      {child.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{child.notes}</p>
        </div>
      )}
    </div>
  );

  const ParentSection = ({ child }: { child: Child }) => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4 text-gray-900">Primary Contact</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-gray-900 font-medium">{child.parentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Contact</p>
              <p className="text-gray-900 font-medium">{child.parentContact}</p>
            </div>
          </div>
        </div>
      </div>

      {(child.emergencyContactName || child.emergencyContactPhone) && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-lg text-red-900">Emergency Contact</h3>
          </div>
          {child.emergencyContactName && (
            <p className="text-red-800 font-medium">{child.emergencyContactName}</p>
          )}
          {child.emergencyContactPhone && (
            <p className="text-red-800">{child.emergencyContactPhone}</p>
          )}
          {child.emergencyContactRelation && (
            <p className="text-red-700 text-sm">Relation: {child.emergencyContactRelation}</p>
          )}
        </div>
      )}
    </div>
  );

  const MedicalSection = ({ child }: { child: Child }) => (
    <div className="space-y-6">
      {/* Allergies */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-lg text-yellow-900">Allergies & Restrictions</h3>
        </div>
        {child.allergies ? (
          <p className="text-yellow-900">{child.allergies}</p>
        ) : (
          <p className="text-yellow-700 italic">No allergies recorded</p>
        )}
      </div>

      {/* Medical Conditions */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">Medical Conditions</h3>
        {child.medicalConditions ? (
          <p className="text-gray-900">{child.medicalConditions}</p>
        ) : (
          <p className="text-gray-600 italic">No medical conditions recorded</p>
        )}
      </div>

      {/* Medications */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">Current Medications</h3>
        {child.medications ? (
          <p className="text-gray-900">{child.medications}</p>
        ) : (
          <p className="text-gray-600 italic">No medications recorded</p>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-3 text-blue-900">Emergency Contact</h3>
        {child.emergencyContactName || child.emergencyContactPhone ? (
          <div className="space-y-2">
            {child.emergencyContactName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-gray-900">{child.emergencyContactName}</span>
                {child.emergencyContactRelation && (
                  <span className="text-gray-600">({child.emergencyContactRelation})</span>
                )}
              </div>
            )}
            {child.emergencyContactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-gray-900">{child.emergencyContactPhone}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-blue-700 italic">No emergency contact recorded</p>
        )}
      </div>

      {/* Doctor Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">Doctor Information</h3>
        {child.doctorName || child.doctorPhone ? (
          <div className="space-y-2">
            {child.doctorName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">{child.doctorName}</span>
              </div>
            )}
            {child.doctorPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">{child.doctorPhone}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 italic">No doctor information recorded</p>
        )}
      </div>

      {/* Insurance Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">Insurance Information</h3>
        {child.insuranceProvider || child.insurancePolicyNumber ? (
          <div className="space-y-2">
            {child.insuranceProvider && (
              <div>
                <span className="text-gray-600 text-sm">Provider:</span>
                <p className="text-gray-900">{child.insuranceProvider}</p>
              </div>
            )}
            {child.insurancePolicyNumber && (
              <div>
                <span className="text-gray-600 text-sm">Policy Number:</span>
                <p className="text-gray-900">{child.insurancePolicyNumber}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 italic">No insurance information recorded</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => alert('Upload Medical Records feature coming soon!')}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Medical Records
        </button>
        <button
          onClick={() => alert('View All Records feature coming soon!')}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View All Records
        </button>
      </div>
    </div>
  );

  const DocumentsSection = ({ child }: { child: Child }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">Uploaded Documents</h3>
        <button
          onClick={() => alert('Upload Document feature coming soon!')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No documents uploaded yet</p>
        <p className="text-sm text-gray-500 mt-1">Birth certificate, immunization records, etc.</p>
      </div>
    </div>
  );

  const ReportsSection = ({ child }: { child: Child }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">Daily Reports</h3>
        <button
          onClick={() => alert('View All Reports feature coming soon!')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View All Reports
        </button>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No daily reports yet</p>
        <p className="text-sm text-gray-500 mt-1">Daily reports will appear here</p>
      </div>
    </div>
  );

  const AttendanceSection = ({ child }: { child: Child }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">Attendance History</h3>
        <button
          onClick={() => alert('View Full History feature coming soon!')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Full History
        </button>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No attendance records yet</p>
        <p className="text-sm text-gray-500 mt-1">Check-in and check-out times will appear here</p>
      </div>
    </div>
  );

  const NotesSection = ({ child }: { child: Child }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">Notes & Incidents</h3>
        <button
          onClick={() => alert('Add Note feature coming soon!')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Note
        </button>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No notes or incidents recorded</p>
        <p className="text-sm text-gray-500 mt-1">Important notes and incident reports will appear here</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Children Management</h2>
          <p className="text-gray-600 mt-1">Manage enrolled children profiles and information</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by child or parent name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Children</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Children List */}
      {filteredChildren.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Baby className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No children found</h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Children enrolled in your daycares will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredChildren.map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleChildClick(child)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Baby className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{child.fullName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          child.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {child.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{child.age}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{child.parentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{child.parentContact}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {child.daycare.name} • Enrolled: {new Date(child.enrollmentStart).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Child Detail Modal */}
      {selectedChild && <ChildDetailModal child={selectedChild} />}
    </div>
  );
};

export default ChildrenManagement;
