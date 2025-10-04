'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Clock,
  Camera,
  Upload,
  Utensils,
  Bed,
  Activity,
  Baby,
  AlertTriangle,
  Image,
  FileText,
  Trash2,
  Save
} from 'lucide-react';

interface DailyReportActivity {
  id?: string;
  activityType: 'MEAL' | 'NAP' | 'ACTIVITY' | 'DIAPER_CHANGE' | 'MILESTONE' | 'INCIDENT' | 'PHOTO' | 'OTHER';
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  foodItems?: string[];
  amountEaten?: 'ALL' | 'MOST' | 'SOME' | 'LITTLE' | 'NONE';
  napQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  photos?: string[];
  documents?: string[];
  notes?: string;
}

interface DailyReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: any) => void;
  booking: {
    id: string;
    childName: string;
    childAge: string;
    daycare: {
      name: string;
    };
  };
  existingReport?: any;
}

const DailyReportForm: React.FC<DailyReportFormProps> = ({
  isOpen,
  onClose,
  onSave,
  booking,
  existingReport
}) => {
  const [overallMood, setOverallMood] = useState(existingReport?.overallMood || '');
  const [generalNotes, setGeneralNotes] = useState(existingReport?.generalNotes || '');
  const [activities, setActivities] = useState<DailyReportActivity[]>(
    existingReport?.activities?.map((activity: any) => ({
      ...activity,
      startTime: new Date(activity.startTime).toISOString().slice(0, 16),
      endTime: activity.endTime ? new Date(activity.endTime).toISOString().slice(0, 16) : '',
      foodItems: activity.foodItems ? JSON.parse(activity.foodItems) : [],
      photos: activity.photos ? JSON.parse(activity.photos) : [],
      documents: activity.documents ? JSON.parse(activity.documents) : []
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activityTypes = [
    { value: 'MEAL', label: 'Meal', icon: Utensils, color: 'text-green-600' },
    { value: 'NAP', label: 'Nap', icon: Bed, color: 'text-blue-600' },
    { value: 'ACTIVITY', label: 'Activity', icon: Activity, color: 'text-purple-600' },
    { value: 'DIAPER_CHANGE', label: 'Diaper Change', icon: Baby, color: 'text-orange-600' },
    { value: 'MILESTONE', label: 'Milestone', icon: Activity, color: 'text-yellow-600' },
    { value: 'INCIDENT', label: 'Incident', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'PHOTO', label: 'Photo', icon: Image, color: 'text-pink-600' },
    { value: 'OTHER', label: 'Other', icon: FileText, color: 'text-gray-600' }
  ];

  const moodOptions = [
    { value: 'Happy', emoji: '😊' },
    { value: 'Content', emoji: '😌' },
    { value: 'Playful', emoji: '🤪' },
    { value: 'Sleepy', emoji: '😴' },
    { value: 'Fussy', emoji: '😤' },
    { value: 'Cranky', emoji: '😠' },
    { value: 'Sad', emoji: '😢' }
  ];

  const addActivity = (type: DailyReportActivity['activityType']) => {
    const now = new Date();
    const timeString = now.toISOString().slice(0, 16);

    const newActivity: DailyReportActivity = {
      activityType: type,
      title: activityTypes.find(t => t.value === type)?.label || type,
      startTime: timeString,
      photos: [],
      documents: []
    };

    setActivities([...activities, newActivity]);
  };

  const updateActivity = (index: number, updates: Partial<DailyReportActivity>) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = { ...updatedActivities[index], ...updates };
    setActivities(updatedActivities);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleFileSelect = (activityIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const activity = activities[activityIndex];

      if (file.type.startsWith('image/')) {
        updateActivity(activityIndex, {
          photos: [...(activity.photos || []), result]
        });
      } else {
        updateActivity(activityIndex, {
          documents: [...(activity.documents || []), result]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const reportData = {
        bookingId: booking.id,
        reportDate: new Date().toISOString().split('T')[0],
        overallMood,
        generalNotes,
        activities: activities.map(activity => ({
          ...activity,
          startTime: new Date(activity.startTime).toISOString(),
          endTime: activity.endTime ? new Date(activity.endTime).toISOString() : undefined,
          duration: activity.startTime && activity.endTime ?
            Math.round((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000) :
            undefined
        }))
      };

      await onSave(reportData);
      onClose();
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const getActivityIcon = (type: DailyReportActivity['activityType']) => {
    const activityType = activityTypes.find(t => t.value === type);
    const IconComponent = activityType?.icon || FileText;
    return <IconComponent className={`h-5 w-5 ${activityType?.color || 'text-gray-600'}`} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Daily Report - {booking.childName}
            </h2>
            <p className="text-gray-600">
              {booking.daycare?.name || 'Daycare'} • {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overall Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setOverallMood(mood.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    overallMood === mood.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">{mood.emoji}</span>
                  {mood.value}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
              <div className="flex flex-wrap gap-2">
                {activityTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => addActivity(type.value as DailyReportActivity['activityType'])}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      title={`Add ${type.label}`}
                    >
                      <IconComponent className={`h-4 w-4 ${type.color}`} />
                      <Plus className="h-3 w-3" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.activityType)}
                      <input
                        type="text"
                        value={activity.title}
                        onChange={(e) => updateActivity(index, { title: e.target.value })}
                        className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                        placeholder="Activity title"
                      />
                    </div>
                    <button
                      onClick={() => removeActivity(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Time */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={activity.startTime}
                        onChange={(e) => updateActivity(index, { startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={activity.endTime || ''}
                        onChange={(e) => updateActivity(index, { endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                      />
                    </div>

                    {/* Meal-specific fields */}
                    {activity.activityType === 'MEAL' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Meal Type
                          </label>
                          <select
                            value={activity.mealType || ''}
                            onChange={(e) => updateActivity(index, { mealType: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                          >
                            <option value="">Select meal type</option>
                            <option value="BREAKFAST">Breakfast</option>
                            <option value="LUNCH">Lunch</option>
                            <option value="DINNER">Dinner</option>
                            <option value="SNACK">Snack</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount Eaten
                          </label>
                          <select
                            value={activity.amountEaten || ''}
                            onChange={(e) => updateActivity(index, { amountEaten: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                          >
                            <option value="">Select amount</option>
                            <option value="ALL">All</option>
                            <option value="MOST">Most</option>
                            <option value="SOME">Some</option>
                            <option value="LITTLE">Little</option>
                            <option value="NONE">None</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Nap-specific fields */}
                    {activity.activityType === 'NAP' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nap Quality
                        </label>
                        <select
                          value={activity.napQuality || ''}
                          onChange={(e) => updateActivity(index, { napQuality: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                        >
                          <option value="">Select quality</option>
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={activity.description || ''}
                      onChange={(e) => updateActivity(index, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                      rows={2}
                      placeholder="Describe the activity..."
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current!.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect(index, file);
                        };
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <Camera className="h-4 w-4" />
                      Add Photo
                    </button>

                    {/* Show uploaded photos */}
                    {activity.photos && activity.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {activity.photos.map((photo, photoIndex) => (
                          <div key={photoIndex} className="relative">
                            <img
                              src={photo}
                              alt={`Activity photo ${photoIndex + 1}`}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <button
                              onClick={() => {
                                const updatedPhotos = activity.photos?.filter((_, i) => i !== photoIndex);
                                updateActivity(index, { photos: updatedPhotos });
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={activity.notes || ''}
                      onChange={(e) => updateActivity(index, { notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                      rows={2}
                      placeholder="Any additional notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Notes
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              rows={3}
              placeholder="Any general notes about the day..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Report'}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DailyReportForm;