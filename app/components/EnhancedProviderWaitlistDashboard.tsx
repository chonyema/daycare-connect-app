'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  Star,
  Plus,
  Settings,
  Send,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Eye,
  BarChart3,
  Filter,
  Search,
  Download,
  Mail,
  Zap,
  Target,
  Award,
  Timer,
  UserCheck,
  UserX,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckSquare,
  Square,
  Baby,
  MapPin,
  Phone,
  MessageSquare
} from 'lucide-react';
import BulkWaitlistActions from './BulkWaitlistActions';
import AdvancedWaitlistFilters from './AdvancedWaitlistFilters';
import WaitlistOfferManager from './provider/WaitlistOfferManager';

interface WaitlistEntry {
  id: string;
  childName: string;
  childAge?: string;
  position: number;
  priorityScore: number;
  daysOnWaitlist: number;
  positionBand: string;
  status: 'ACTIVE' | 'PAUSED' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'ENROLLED' | 'REMOVED';
  desiredStartDate: string;
  careType: string;
  hasSiblingEnrolled: boolean;
  isStaffChild: boolean;
  inServiceArea: boolean;
  hasSubsidyApproval: boolean;
  hasSpecialNeeds: boolean;
  estimatedWaitDays?: number;
  lastUpdatedAt: string;
  joinedAt: string;
  parent: {
    name: string;
    email: string;
    phone?: string;
  };
  program?: {
    id: string;
    name: string;
  };
  offers?: Array<{
    id: string;
    response?: string;
    spotAvailableDate: string;
    offerExpiresAt: string;
  }>;
  notes?: string;
}

interface FilterCriteria {
  search: string;
  status: string[];
  ageRange: { min: number; max: number };
  priorityRange: { min: number; max: number };
  positionRange: { min: number; max: number };
  startDateRange: { from: string; to: string };
  joinedDateRange: { from: string; to: string };
  programs: string[];
  careTypes: string[];
  specialNeeds: boolean | null;
  hasSibling: boolean | null;
  isStaffChild: boolean | null;
  hasSubsidy: boolean | null;
  inServiceArea: boolean | null;
  estimatedWaitDays: { min: number; max: number };
}

interface EnhancedProviderWaitlistDashboardProps {
  currentUser: {
    id: string;
    name: string;
    userType: string;
  };
}

const EnhancedProviderWaitlistDashboard: React.FC<EnhancedProviderWaitlistDashboardProps> = ({
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'waitlist' | 'offers'>('waitlist');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [daycareId, setDaycareId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadWaitlistData();
  }, []);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);

      // First get the provider's daycares
      const daycaresResponse = await fetch('/api/daycares');
      const allDaycares = await daycaresResponse.json();

      // Filter to only daycares owned by this provider
      const providerDaycares = allDaycares.filter((daycare: any) => daycare.ownerId === currentUser.id);

      console.log('All daycares:', allDaycares.length, 'Provider daycares:', providerDaycares.length);

      if (!providerDaycares.length) {
        console.log('No daycares found for provider:', currentUser.id);
        setEntries([]);
        setPrograms([]);
        return;
      }

      // Set first daycare as default for offers
      if (providerDaycares.length > 0) {
        setDaycareId(providerDaycares[0].id);
      }

      // Get waitlist entries for all provider's daycares
      const allEntries = [];

      for (const daycare of providerDaycares) {
        console.log('Loading waitlist for daycare:', daycare.id, daycare.name);
        const entriesResponse = await fetch(`/api/waitlist/enhanced?daycareId=${daycare.id}`);
        const entriesData = await entriesResponse.json();

        console.log('Waitlist response for', daycare.name, ':', entriesData);

        if (entriesData.success) {
          allEntries.push(...(entriesData.data || []));
        }
      }

      setEntries(allEntries);
      setPrograms([]); // For now, until we implement programs API
      console.log('Loaded waitlist data:', { entries: allEntries.length, daycaresChecked: providerDaycares.length });

    } catch (error) {
      console.error('Failed to load waitlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter entries based on current filter criteria
  const filteredEntries = useMemo(() => {
    if (!currentFilters) return entries;

    return entries.filter(entry => {
      // Search filter
      if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        const searchableText = [
          entry.childName,
          entry.parent.name,
          entry.parent.email,
          entry.notes || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (currentFilters.status.length > 0 && !currentFilters.status.includes(entry.status)) {
        return false;
      }

      // Age range filter (assuming childAge is in months)
      if (entry.childAge) {
        const ageInMonths = parseFloat(entry.childAge.replace(/[^\d.]/g, ''));
        if (ageInMonths < currentFilters.ageRange.min || ageInMonths > currentFilters.ageRange.max) {
          return false;
        }
      }

      // Priority range filter
      if (entry.priorityScore < currentFilters.priorityRange.min || entry.priorityScore > currentFilters.priorityRange.max) {
        return false;
      }

      // Position range filter
      if (entry.position < currentFilters.positionRange.min || entry.position > currentFilters.positionRange.max) {
        return false;
      }

      // Date range filters
      if (currentFilters.startDateRange.from && new Date(entry.desiredStartDate) < new Date(currentFilters.startDateRange.from)) {
        return false;
      }
      if (currentFilters.startDateRange.to && new Date(entry.desiredStartDate) > new Date(currentFilters.startDateRange.to)) {
        return false;
      }

      if (currentFilters.joinedDateRange.from && new Date(entry.joinedAt) < new Date(currentFilters.joinedDateRange.from)) {
        return false;
      }
      if (currentFilters.joinedDateRange.to && new Date(entry.joinedAt) > new Date(currentFilters.joinedDateRange.to)) {
        return false;
      }

      // Program filter
      if (currentFilters.programs.length > 0) {
        if (!entry.program || !currentFilters.programs.includes(entry.program.id)) {
          return false;
        }
      }

      // Care type filter
      if (currentFilters.careTypes.length > 0 && !currentFilters.careTypes.includes(entry.careType)) {
        return false;
      }

      // Boolean filters
      if (currentFilters.specialNeeds !== null && entry.hasSpecialNeeds !== currentFilters.specialNeeds) {
        return false;
      }
      if (currentFilters.hasSibling !== null && entry.hasSiblingEnrolled !== currentFilters.hasSibling) {
        return false;
      }
      if (currentFilters.isStaffChild !== null && entry.isStaffChild !== currentFilters.isStaffChild) {
        return false;
      }
      if (currentFilters.hasSubsidy !== null && entry.hasSubsidyApproval !== currentFilters.hasSubsidy) {
        return false;
      }
      if (currentFilters.inServiceArea !== null && entry.inServiceArea !== currentFilters.inServiceArea) {
        return false;
      }

      // Estimated wait days filter
      if (entry.estimatedWaitDays !== undefined) {
        if (entry.estimatedWaitDays < currentFilters.estimatedWaitDays.min ||
            entry.estimatedWaitDays > currentFilters.estimatedWaitDays.max) {
          return false;
        }
      }

      return true;
    });
  }, [entries, currentFilters]);

  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedEntries(selected ? filteredEntries.map(e => e.id) : []);
  };

  const handleBulkAction = async (action: string, data?: any) => {
    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/waitlist/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entryIds: selectedEntries,
          data,
          performedBy: currentUser.id
        })
      });

      const result = await response.json();

      if (result.success) {
        // Reload data to reflect changes
        await loadWaitlistData();
        setSelectedEntries([]);

        if (action === 'export') {
          // Handle export download
          downloadCSV(result.data.data, result.data.filename);
        } else {
          alert(result.message || 'Bulk action completed successfully');
        }
      } else {
        alert(result.error || 'Bulk action failed');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCommunication = async (type: string, data: any) => {
    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/waitlist/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'communicate',
          entryIds: selectedEntries,
          data: { type, ...data },
          performedBy: currentUser.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`${type.toUpperCase()} sent to ${result.data.communicationsSent} families`);
        setSelectedEntries([]);
      } else {
        alert(result.error || 'Communication failed');
      }
    } catch (error) {
      console.error('Communication error:', error);
      alert('Failed to send communications');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'OFFERED': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-purple-100 text-purple-800';
      case 'ENROLLED': return 'bg-indigo-100 text-indigo-800';
      case 'DECLINED': return 'bg-gray-100 text-gray-800';
      case 'REMOVED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionBandColor = (band: string) => {
    switch (band) {
      case 'Very High': return 'text-green-600';
      case 'High': return 'text-blue-600';
      case 'Medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading waitlist data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Waitlist Management</h2>
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`${
                  activeTab === 'waitlist'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Waitlist Entries
              </button>
              <button
                onClick={() => setActiveTab('offers')}
                className={`${
                  activeTab === 'offers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Spot Offers
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'waitlist' && (
          <button
            onClick={loadWaitlistData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Refresh Data
          </button>
        )}
      </div>

      {/* Waitlist Tab Content */}
      {activeTab === 'waitlist' && (
        <>
          {/* Advanced Filters */}
          <AdvancedWaitlistFilters
            onFilterChange={setCurrentFilters}
            onExportFiltered={() => handleBulkAction('export')}
            programs={programs}
            totalEntries={entries.length}
            filteredCount={filteredEntries.length}
          />

          {/* Bulk Actions */}
          <BulkWaitlistActions
            selectedEntries={selectedEntries}
            totalEntries={filteredEntries.length}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedEntries([])}
            onBulkAction={handleBulkAction}
            onBulkCommunication={handleBulkCommunication}
            isLoading={bulkActionLoading}
          />
        </>
      )}

      {/* Offers Tab Content */}
      {activeTab === 'offers' && daycareId && (
        <WaitlistOfferManager daycareId={daycareId} />
      )}

      {/* Waitlist Table */}
      {activeTab === 'waitlist' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Waitlist Entries</h3>
            <p className="text-gray-600">
              {currentFilters ? 'No entries match your current filters.' : 'No waitlist entries found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Child & Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className={selectedEntries.includes(entry.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="rounded border-gray-300"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">#{entry.position}</span>
                        <span className={`text-sm font-medium ${getPositionBandColor(entry.positionBand)}`}>
                          {entry.positionBand}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Score: {entry.priorityScore}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <Baby className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">{entry.childName}</div>
                          <div className="text-sm text-gray-600">{entry.childAge}</div>
                          <div className="text-sm text-gray-500">{entry.parent.name}</div>
                          <div className="text-xs text-gray-400">{entry.parent.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {entry.hasSiblingEnrolled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <Users className="h-3 w-3 mr-1" />
                            Sibling
                          </span>
                        )}
                        {entry.isStaffChild && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            Staff
                          </span>
                        )}
                        {entry.hasSubsidyApproval && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            <Award className="h-3 w-3 mr-1" />
                            Subsidy
                          </span>
                        )}
                        {entry.hasSpecialNeeds && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            Special Needs
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                      {entry.estimatedWaitDays && (
                        <div className="text-xs text-gray-500 mt-1">
                          ~{entry.estimatedWaitDays} days
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Start: {formatDate(entry.desiredStartDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Joined: {formatDate(entry.joinedAt)}</span>
                        </div>
                        <div className="text-xs text-gray-500">{entry.careType}</div>
                        {entry.program && (
                          <div className="text-xs text-blue-600">{entry.program.name}</div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Contact parent"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Send offer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {/* Summary Stats */}
      {activeTab === 'waitlist' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
            </div>
            <Filter className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-gray-900">{selectedEntries.length}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                {entries.filter(e => e.status === 'ACTIVE').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default EnhancedProviderWaitlistDashboard;