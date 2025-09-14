'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload, MapPin, Clock, Users, DollarSign } from 'lucide-react';

interface DaycareFormProps {
  isOpen: boolean;
  onClose: () => void;
  daycare?: any;
  onSave: (daycareData: any) => Promise<void>;
}

const DaycareForm: React.FC<DaycareFormProps> = ({ 
  isOpen, 
  onClose, 
  daycare, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'LICENSED_DAYCARE_CENTER',
    description: '',
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    capacity: '',
    ageGroups: [] as string[],
    dailyRate: '',
    hourlyRate: '',
    openTime: '07:00',
    closeTime: '18:00',
    operatingDays: [] as string[],
    features: [] as string[],
  });

  const provinces = [
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
  ];

  const daycareTypes = [
    { value: 'LICENSED_DAYCARE_CENTER', label: 'Licensed Daycare Center' },
    { value: 'LICENSED_HOME_DAYCARE', label: 'Licensed Home Daycare' },
    { value: 'UNLICENSED_HOME_DAYCARE', label: 'Unlicensed Home Daycare' },
    { value: 'NANNY_SERVICE', label: 'Nanny Service' },
  ];

  const ageGroupOptions = [
    'Infant (0-12 months)',
    'Toddler (1-2 years)',
    'Preschool (3-4 years)',
    'School Age (5+ years)'
  ];

  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const featureOptions = [
    'Meals Included',
    'Outdoor Playground',
    'Educational Programs',
    'Bilingual Staff',
    'Transportation',
    'Extended Hours',
    'Special Needs Support',
    'Music Classes',
    'Art Activities',
    'Sports Programs'
  ];

  useEffect(() => {
    if (daycare) {
      setFormData({
        name: daycare.name || '',
        type: daycare.type || 'LICENSED_DAYCARE_CENTER',
        description: daycare.description || '',
        address: daycare.address || '',
        city: daycare.city || '',
        province: daycare.province || 'ON',
        postalCode: daycare.postalCode || '',
        phone: daycare.phone || '',
        email: daycare.email || '',
        website: daycare.website || '',
        capacity: daycare.capacity?.toString() || '',
        ageGroups: daycare.ageGroups ? JSON.parse(daycare.ageGroups) : [],
        dailyRate: daycare.dailyRate?.toString() || '',
        hourlyRate: daycare.hourlyRate?.toString() || '',
        openTime: daycare.openTime || '07:00',
        closeTime: daycare.closeTime || '18:00',
        operatingDays: daycare.operatingDays ? JSON.parse(daycare.operatingDays) : [],
        features: daycare.features ? JSON.parse(daycare.features) : [],
      });
    } else {
      // Reset form for new daycare
      setFormData({
        name: '',
        type: 'LICENSED_DAYCARE_CENTER',
        description: '',
        address: '',
        city: '',
        province: 'ON',
        postalCode: '',
        phone: '',
        email: '',
        website: '',
        capacity: '',
        ageGroups: [],
        dailyRate: '',
        hourlyRate: '',
        openTime: '07:00',
        closeTime: '18:00',
        operatingDays: [],
        features: [],
      });
    }
  }, [daycare]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save daycare:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleArrayToggle = (array: string[], value: string, field: string) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    
    setFormData({
      ...formData,
      [field]: newArray,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {daycare ? 'Edit Daycare' : 'Add New Daycare'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daycare Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sunshine Daycare Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {daycareTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your daycare, philosophy, and what makes it special..."
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Toronto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province *
                </label>
                <select
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="M5V 3L9"
                />
              </div>
            </div>
          </div>

          {/* Contact & Pricing */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Contact & Pricing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="info@daycare.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.daycare.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate ($) *
                </label>
                <input
                  type="number"
                  name="dailyRate"
                  required
                  min="0"
                  step="0.01"
                  value={formData.dailyRate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="45.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8.00"
                />
              </div>
            </div>
          </div>

          {/* Hours & Days */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open Time *
                </label>
                <input
                  type="time"
                  name="openTime"
                  required
                  value={formData.openTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Close Time *
                </label>
                <input
                  type="time"
                  name="closeTime"
                  required
                  value={formData.closeTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Days *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                {dayOptions.map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.operatingDays.includes(day)}
                      onChange={() => handleArrayToggle(formData.operatingDays, day, 'operatingDays')}
                      className="mr-2"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Age Groups & Features */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Groups Served *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ageGroupOptions.map(age => (
                  <label key={age} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ageGroups.includes(age)}
                      onChange={() => handleArrayToggle(formData.ageGroups, age, 'ageGroups')}
                      className="mr-2"
                    />
                    <span className="text-sm">{age}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features & Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {featureOptions.map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleArrayToggle(formData.features, feature, 'features')}
                      className="mr-2"
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {daycare ? 'Update Daycare' : 'Create Daycare'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DaycareForm;