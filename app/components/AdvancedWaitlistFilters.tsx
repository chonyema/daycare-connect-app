'use client';

import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  Calendar,
  Users,
  Star,
  Clock,
  MapPin,
  X,
  ChevronDown,
  Save,
  Bookmark,
  RotateCcw,
  Download
} from 'lucide-react';

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

interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  createdAt: string;
}

interface AdvancedWaitlistFiltersProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  onExportFiltered: () => void;
  programs: Array<{ id: string; name: string }>;
  totalEntries: number;
  filteredCount: number;
}

const defaultCriteria: FilterCriteria = {
  search: '',
  status: [],
  ageRange: { min: 0, max: 60 },
  priorityRange: { min: 0, max: 500 },
  positionRange: { min: 1, max: 100 },
  startDateRange: { from: '', to: '' },
  joinedDateRange: { from: '', to: '' },
  programs: [],
  careTypes: [],
  specialNeeds: null,
  hasSibling: null,
  isStaffChild: null,
  hasSubsidy: null,
  inServiceArea: null,
  estimatedWaitDays: { min: 0, max: 365 }
};

const AdvancedWaitlistFilters: React.FC<AdvancedWaitlistFiltersProps> = ({
  onFilterChange,
  onExportFiltered,
  programs,
  totalEntries,
  filteredCount
}) => {
  const [criteria, setCriteria] = useState<FilterCriteria>(defaultCriteria);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'PAUSED', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'OFFERED', label: 'Offered', color: 'bg-blue-100 text-blue-800' },
    { value: 'ACCEPTED', label: 'Accepted', color: 'bg-purple-100 text-purple-800' },
    { value: 'DECLINED', label: 'Declined', color: 'bg-gray-100 text-gray-800' },
    { value: 'ENROLLED', label: 'Enrolled', color: 'bg-indigo-100 text-indigo-800' }
  ];

  const careTypeOptions = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'DROP_IN', label: 'Drop-in' },
    { value: 'BEFORE_AFTER_SCHOOL', label: 'Before/After School' }
  ];

  useEffect(() => {
    onFilterChange(criteria);
  }, [criteria]);

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('waitlist-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const updateCriteria = (field: keyof FilterCriteria, value: any) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayValue = (field: keyof FilterCriteria, value: string) => {
    const currentArray = criteria[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateCriteria(field, newArray);
  };

  const resetFilters = () => {
    setCriteria(defaultCriteria);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      alert('Please enter a filter name');
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      criteria: { ...criteria },
      createdAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem('waitlist-saved-filters', JSON.stringify(updatedFilters));

    setShowSaveModal(false);
    setFilterName('');
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setCriteria(filter.criteria);
  };

  const deleteSavedFilter = (filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    localStorage.setItem('waitlist-saved-filters', JSON.stringify(updatedFilters));
  };

  const hasActiveFilters = JSON.stringify(criteria) !== JSON.stringify(defaultCriteria);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Waitlist Filters</h3>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredCount} of {totalEntries} entries
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Saved Filters Dropdown */}
          {savedFilters.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const filter = savedFilters.find(f => f.id === e.target.value);
                    if (filter) loadSavedFilter(filter);
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
              >
                <option value="">Saved Filters</option>
                {savedFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Save className="h-4 w-4" />
            Save Filter
          </button>

          <button
            onClick={onExportFiltered}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Advanced
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={criteria.search}
              onChange={(e) => updateCriteria('search', e.target.value)}
              placeholder="Search by child name, parent name, or notes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex gap-1">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => toggleArrayValue('status', status.value)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    criteria.status.includes(status.value)
                      ? status.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Quick Filters:</span>

            {[
              { key: 'hasSibling', label: 'Has Sibling', icon: Users },
              { key: 'isStaffChild', label: 'Staff Child', icon: Star },
              { key: 'hasSubsidy', label: 'Has Subsidy', icon: Star },
              { key: 'specialNeeds', label: 'Special Needs', icon: Star }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  const currentValue = criteria[filter.key as keyof FilterCriteria];
                  updateCriteria(filter.key as keyof FilterCriteria, currentValue === true ? null : true);
                }}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                  criteria[filter.key as keyof FilterCriteria] === true
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <filter.icon className="h-3 w-3" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
          {/* Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child Age (months)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={criteria.ageRange.min}
                  onChange={(e) => updateCriteria('ageRange', { ...criteria.ageRange, min: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={criteria.ageRange.max}
                  onChange={(e) => updateCriteria('ageRange', { ...criteria.ageRange, max: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Priority Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Score
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={criteria.priorityRange.min}
                  onChange={(e) => updateCriteria('priorityRange', { ...criteria.priorityRange, min: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={criteria.priorityRange.max}
                  onChange={(e) => updateCriteria('priorityRange', { ...criteria.priorityRange, max: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Position Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Queue Position
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={criteria.positionRange.min}
                  onChange={(e) => updateCriteria('positionRange', { ...criteria.positionRange, min: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="1"
                  value={criteria.positionRange.max}
                  onChange={(e) => updateCriteria('positionRange', { ...criteria.positionRange, max: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          {/* Date Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desired Start Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desired Start Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={criteria.startDateRange.from}
                  onChange={(e) => updateCriteria('startDateRange', { ...criteria.startDateRange, from: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={criteria.startDateRange.to}
                  onChange={(e) => updateCriteria('startDateRange', { ...criteria.startDateRange, to: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Joined Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joined Waitlist Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={criteria.joinedDateRange.from}
                  onChange={(e) => updateCriteria('joinedDateRange', { ...criteria.joinedDateRange, from: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={criteria.joinedDateRange.to}
                  onChange={(e) => updateCriteria('joinedDateRange', { ...criteria.joinedDateRange, to: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Multi-select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Programs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programs
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {programs.map((program) => (
                  <label key={program.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={criteria.programs.includes(program.id)}
                      onChange={() => toggleArrayValue('programs', program.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{program.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Care Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Care Types
              </label>
              <div className="space-y-1">
                {careTypeOptions.map((careType) => (
                  <label key={careType.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={criteria.careTypes.includes(careType.value)}
                      onChange={() => toggleArrayValue('careTypes', careType.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{careType.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Save Filter</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a name for this filter"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentFilter}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedWaitlistFilters;