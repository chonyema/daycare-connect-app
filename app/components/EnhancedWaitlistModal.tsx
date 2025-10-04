'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Baby,
  Clock,
  MapPin,
  FileText,
  Star,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface EnhancedWaitlistModalProps {
  provider: any;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const EnhancedWaitlistModal: React.FC<EnhancedWaitlistModalProps> = ({
  provider,
  show,
  onClose,
  onSuccess,
  userId
}) => {
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    childBirthDate: '',
    desiredStartDate: '',
    preferredDays: [] as string[],
    careType: 'FULL_TIME',
    parentNotes: '',
    // Priority factors
    hasSiblingEnrolled: false,
    isStaffChild: false,
    inServiceArea: true,
    hasSubsidyApproval: false,
    hasCorporatePartnership: false,
    hasSpecialNeeds: false
  });

  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const careTypes = [
    { value: 'FULL_TIME', label: 'Full-time (5 days/week)' },
    { value: 'PART_TIME', label: 'Part-time (2-4 days/week)' },
    { value: 'DROP_IN', label: 'Drop-in (as needed)' },
    { value: 'BEFORE_AFTER_SCHOOL', label: 'Before/After School' }
  ];

  useEffect(() => {
    if (show && provider) {
      loadPrograms();
      resetForm();
    }
  }, [show, provider]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/programs?daycareId=${provider.id}`);
      const data = await res.json();

      if (data.success && data.programs) {
        // Format programs with age ranges
        const formattedPrograms = data.programs.map((program: any) => ({
          ...program,
          description: `Ages ${Math.floor(program.minAgeMonths / 12)}y ${program.minAgeMonths % 12}m - ${Math.floor(program.maxAgeMonths / 12)}y ${program.maxAgeMonths % 12}m`,
          minAge: program.minAgeMonths,
          maxAge: program.maxAgeMonths
        }));
        setPrograms(formattedPrograms);
      } else {
        setPrograms([]);
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      childName: '',
      childAge: '',
      childBirthDate: '',
      desiredStartDate: '',
      preferredDays: [],
      careType: 'FULL_TIME',
      parentNotes: '',
      hasSiblingEnrolled: false,
      isStaffChild: false,
      inServiceArea: true,
      hasSubsidyApproval: false,
      hasCorporatePartnership: false,
      hasSpecialNeeds: false
    });
    setSelectedProgram('');
    setErrors([]);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.childName.trim()) {
      newErrors.push("Child's name is required");
    }

    if (!formData.childAge) {
      newErrors.push("Child's age is required");
    }

    if (!formData.desiredStartDate) {
      newErrors.push("Desired start date is required");
    } else {
      const startDate = new Date(formData.desiredStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.push("Start date cannot be in the past");
      }
    }

    if (formData.careType === 'PART_TIME' && formData.preferredDays.length === 0) {
      newErrors.push("Please select preferred days for part-time care");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculatePriorityScore = () => {
    let score = 100; // Base score

    if (formData.hasSiblingEnrolled) score += 50;
    if (formData.isStaffChild) score += 40;
    if (formData.hasSubsidyApproval) score += 30;
    if (formData.hasCorporatePartnership) score += 20;
    if (formData.hasSpecialNeeds) score += 25;
    if (!formData.inServiceArea) score -= 10;

    return score;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/waitlist/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: userId,
          daycareId: provider.id,
          programId: selectedProgram || undefined,
          childName: formData.childName,
          childAge: formData.childAge,
          childBirthDate: formData.childBirthDate || undefined,
          desiredStartDate: formData.desiredStartDate,
          preferredDays: formData.preferredDays.length > 0 ? formData.preferredDays : undefined,
          careType: formData.careType,
          parentNotes: formData.parentNotes || undefined,
          // Priority factors
          hasSiblingEnrolled: formData.hasSiblingEnrolled,
          isStaffChild: formData.isStaffChild,
          inServiceArea: formData.inServiceArea,
          hasSubsidyApproval: formData.hasSubsidyApproval,
          hasCorporatePartnership: formData.hasCorporatePartnership,
          hasSpecialNeeds: formData.hasSpecialNeeds
        })
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        alert(`Successfully joined waitlist for ${provider.name}!\n\nYour position: #${result.data.position}\nPriority score: ${result.data.priorityScore}\nEstimated wait: ${result.data.estimatedWaitDays} days`);
      } else {
        setErrors([result.error || 'Failed to join waitlist']);
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      setErrors(['Failed to join waitlist. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Join Waitlist</h2>
              <p className="text-gray-600 mt-1">{provider?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-medium">Please fix the following errors:</h3>
                  <ul className="mt-1 text-red-700 text-sm list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Baby className="h-5 w-5 text-blue-600" />
                Child Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child's Name *
                  </label>
                  <input
                    type="text"
                    value={formData.childName}
                    onChange={(e) => handleInputChange('childName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Enter child's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child's Age *
                  </label>
                  <input
                    type="text"
                    value={formData.childAge}
                    onChange={(e) => handleInputChange('childAge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="e.g., 2 years, 18 months"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.childBirthDate}
                    onChange={(e) => handleInputChange('childBirthDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.desiredStartDate}
                    onChange={(e) => handleInputChange('desiredStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Program Selection */}
            {programs.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Program Selection (optional)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value=""
                        checked={selectedProgram === ''}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="font-medium text-gray-700">Any available program</span>
                    </label>
                  </div>

                  {programs.map((program) => (
                    <div key={program.id}>
                      <label className="flex items-start gap-2">
                        <input
                          type="radio"
                          value={program.id}
                          checked={selectedProgram === program.id}
                          onChange={(e) => setSelectedProgram(e.target.value)}
                          className="text-blue-600 mt-1"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{program.name}</span>
                          <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                          <p className="text-xs text-gray-500">Capacity: {program.totalCapacity} children</p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Care Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Care Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Care Type *
                  </label>
                  <div className="space-y-2">
                    {careTypes.map((type) => (
                      <label key={type.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={type.value}
                          checked={formData.careType === type.value}
                          onChange={(e) => handleInputChange('careType', e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.careType === 'PART_TIME' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            formData.preferredDays.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Priority Factors */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-600" />
                Priority Factors
              </h3>

              <div className="space-y-3">
                {[
                  { key: 'hasSiblingEnrolled', label: 'Has sibling currently enrolled', points: '+50 pts' },
                  { key: 'isStaffChild', label: 'Child of daycare staff member', points: '+40 pts' },
                  { key: 'hasSubsidyApproval', label: 'Has childcare subsidy approval', points: '+30 pts' },
                  { key: 'hasSpecialNeeds', label: 'Child has special needs', points: '+25 pts' },
                  { key: 'hasCorporatePartnership', label: 'Employer has corporate partnership', points: '+20 pts' },
                  { key: 'inServiceArea', label: 'Lives in primary service area', points: 'Default' }
                ].map((factor) => (
                  <label key={factor.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[factor.key as keyof typeof formData] as boolean}
                        onChange={(e) => handleInputChange(factor.key, e.target.checked)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{factor.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{factor.points}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Estimated Priority Score: {calculatePriorityScore()} points
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Higher scores result in better waitlist positions
                </p>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Notes (optional)
              </label>
              <textarea
                value={formData.parentNotes}
                onChange={(e) => handleInputChange('parentNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows={3}
                placeholder="Any special requirements, preferences, or additional information..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Join Waitlist
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWaitlistModal;