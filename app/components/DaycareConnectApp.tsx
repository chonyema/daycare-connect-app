'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Star, Clock, Users, Phone, Mail, Calendar, DollarSign, Heart, X, MessageCircle, Filter, CheckCircle, Loader2, AlertCircle, Upload, FileText, List } from 'lucide-react';
import MessageButton from './MessageButton';
import DocumentUpload from './DocumentUpload';
import DailyReports from './DailyReports';
import MessagingSystem from './MessagingSystem';
import ParentWaitlistManager from './ParentWaitlistManager';
import EnhancedWaitlistModal from './EnhancedWaitlistModal';

// MOVE SEARCHVIEW OUTSIDE THE MAIN COMPONENT - THIS IS THE KEY FIX!
const SearchView = React.memo(({
  searchQuery,
  setSearchQuery,
  searchLocation,
  setSearchLocation,
  selectedAgeGroup,
  setSelectedAgeGroup,
  sortBy,
  setSortBy,
  filteredProviders,
  ageGroups,
  setSelectedProvider,
  setCurrentView,
  setShowBookingModal,
  toggleFavorite,
  joinWaitlist,
  isFavorite,
  favoriteLoading,
  waitlistLoading,
  providersLoading,
  user
}: any) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Find Quality Childcare Near You</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, type, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Location (e.g., Toronto, ON)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center">
            <Search className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {ageGroups.map((age: string) => (
            <button
              key={age}
              onClick={() => setSelectedAgeGroup(age)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedAgeGroup === age
                  ? 'bg-blue-500 text-white'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              {age}
            </button>
          ))}
        </div>
      </div>
    </div>
    
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Found
        </h3>
        {searchQuery && (
          <p className="text-sm text-gray-600">
            Showing results for &quot;{searchQuery}&quot;
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="distance">Sort by Distance</option>
          <option value="rating">Sort by Rating</option>
          <option value="price">Sort by Price</option>
          <option value="availability">Sort by Availability</option>
        </select>
      </div>
    </div>
    
    {providersLoading ? (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for daycares...</p>
        </div>
      </div>
    ) : filteredProviders.length === 0 ? (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-500 mb-2">No providers found</h3>
        <p className="text-gray-400 mb-4">
          Try adjusting your search criteria or location
        </p>
        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedAgeGroup('All Ages');
            setSearchLocation('Toronto, ON');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider: any) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            setSelectedProvider={setSelectedProvider}
            setCurrentView={setCurrentView}
            setShowBookingModal={setShowBookingModal}
            toggleFavorite={toggleFavorite}
            joinWaitlist={joinWaitlist}
            isFavorite={isFavorite}
            favoriteLoading={favoriteLoading}
            waitlistLoading={waitlistLoading}
            user={user}
          />
        ))}
      </div>
    )}
  </div>
));

// ALSO MOVE PROVIDER CARD OUTSIDE
const ProviderCard = React.memo(({ provider, setSelectedProvider, setCurrentView, setShowBookingModal, toggleFavorite, joinWaitlist, isFavorite, favoriteLoading, waitlistLoading, user }: any) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
    <div className="relative">
      <img 
        src={provider.image} 
        alt={provider.name}
        className="w-full h-48 object-cover"
      />
      {provider.verified && (
        <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          ✓ Verified
        </div>
      )}
      {provider.availableSpots > 0 && (
        <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          {provider.availableSpots} spots available
        </div>
      )}
      {provider.availableSpots === 0 && (
        <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          Waitlist ({provider.waitlist})
        </div>
      )}
    </div>
    
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900">{provider.name}</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{provider.rating} ({provider.reviews})</span>
          </div>
          <div className="flex items-center space-x-1">
            {user && provider.ownerId && (
              <MessageButton
                currentUser={{
                  id: user.id,
                  name: user.name || '',
                  email: user.email || '',
                  userType: user.userType
                }}
                targetUserId={provider.ownerId}
                daycareId={provider.id}
                variant="icon"
                size="sm"
              />
            )}
            <button
              onClick={() => toggleFavorite(provider.id)}
              disabled={favoriteLoading === provider.id}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Heart className={`w-4 h-4 ${isFavorite(provider.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{provider.type}</p>
      
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <MapPin className="w-4 h-4 mr-1" />
        {provider.address} • {provider.distance}
      </div>
      
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Clock className="w-4 h-4 mr-1" />
        {provider.hours}
      </div>
      
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <DollarSign className="w-4 h-4 mr-1" />
        {provider.pricing}
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {provider.ageGroups.map((age: string, index: number) => (
          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {age}
          </span>
        ))}
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{provider.description}</p>
      
      <div className="flex gap-2">
        <button 
          onClick={() => {setSelectedProvider(provider); setCurrentView('profile');}}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
        {provider.availableSpots > 0 ? (
          <button 
            onClick={() => {setSelectedProvider(provider); setShowBookingModal(true);}}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Book Now
          </button>
        ) : (
          <button 
            onClick={() => joinWaitlist(provider)}
            disabled={waitlistLoading === provider.id}
            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {waitlistLoading === provider.id ? 'Joining...' : 'Join Waitlist'}
          </button>
        )}
      </div>
    </div>
  </div>
));

// Enhanced Booking Modal Component
const BookingModal = ({ selectedProvider, showBookingModal, setShowBookingModal, fetchProviders, user }: any) => {
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    startDate: '',
    endDate: '',
    careType: 'FULL_TIME',
    parentId: 'cmfkkj1gr0000xtxcgtmccjzk', // Sarah Johnson - Parent user from database
    parentEmail: '',
    parentPhone: '',
    notes: '',
    specialNeeds: ''
  });

  const [availableParents, setAvailableParents] = useState([
    { id: 'cmfkkj1gr0000xtxcgtmccjzk', name: 'Sarah Johnson', email: 'parent@test.com' }
  ]);

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{name: string; data: string; type: string}>>([]);
  const [submitMessage, setSubmitMessage] = useState('');

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.childName.trim()) {
      newErrors.childName = "Child's name is required";
    } else if (formData.childName.trim().length < 2) {
      newErrors.childName = "Child's name must be at least 2 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (!formData.parentEmail.trim()) {
      newErrors.parentEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = "Please enter a valid email address";
    }

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const bookingData = {
        parentId: user?.id || formData.parentId, // Use authenticated user's ID, fallback to form data
        daycareId: selectedProvider?.id?.toString(), // Convert to string if numeric
        childName: formData.childName.trim(),
        childAge: formData.childAge.trim() || null,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        careType: formData.careType,
        dailyRate: selectedProvider?.priceValue || 0,
        totalCost: null, // Will be calculated by backend if needed
        notes: formData.notes.trim() || null,
        specialNeeds: formData.specialNeeds.trim() || null,
        documents: uploadedDocuments
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage(result.message || 'Booking created successfully!');

        // Refresh providers to update available spots
        console.log('Refreshing providers after successful booking...');
        fetchProviders();

        setTimeout(() => {
          resetForm();
          setShowBookingModal(false);
        }, 2000);
      } else {
        setSubmitStatus('error');
        if (result.errors && Array.isArray(result.errors)) {
          setSubmitMessage(result.errors.join(', '));
        } else {
          setSubmitMessage(result.error || 'Failed to create booking');
        }
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      childName: '',
      childAge: '',
      startDate: '',
      endDate: '',
      careType: 'FULL_TIME',
      parentId: 'cmfkkj1gr0000xtxcgtmccjzk',
      parentEmail: '',
      parentPhone: '',
      notes: '',
      specialNeeds: ''
    });
    setErrors({});
    setSubmitStatus('idle');
    setSubmitMessage('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      setShowBookingModal(false);
    }
  };

  const dailyRate = selectedProvider?.priceValue || 0;
  const registrationFee = 50;
  const weeklyRate = dailyRate * 5;

  if (!showBookingModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Book Childcare</h3>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-medium text-blue-900">{selectedProvider?.name}</h4>
              <p className="text-sm text-blue-700">{selectedProvider?.type}</p>
            </div>

            {user ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Account
                </label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-600 ml-2">({user.email})</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Booking will be created for your account</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Parent Account *
                </label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isSubmitting}
                >
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Demo mode - please log in for real usage</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child&apos;s Name *
              </label>
              <input 
                type="text"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.childName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your child's full name"
                disabled={isSubmitting}
              />
              {errors.childName && (
                <p className="text-red-500 text-sm mt-1">{errors.childName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input 
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Age (optional)
              </label>
              <input 
                type="text"
                name="childAge"
                value={formData.childAge}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="e.g., 3 years old, 18 months"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (optional)
              </label>
              <input 
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing care</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Care Type *
              </label>
              <select 
                name="careType"
                value={formData.careType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                disabled={isSubmitting}
              >
                <option value="FULL_TIME">Full-time (5 days/week)</option>
                <option value="PART_TIME">Part-time (3 days/week)</option>
                <option value="DROP_IN">Drop-in (as needed)</option>
                <option value="EMERGENCY">Emergency care</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <input 
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.parentEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
              />
              {errors.parentEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Phone Number *
              </label>
              <input 
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.parentPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(416) 555-0123"
                disabled={isSubmitting}
              />
              {errors.parentPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Notes
              </label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Any additional information or requests..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Needs or Allergies
              </label>
              <textarea 
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Any allergies, medical conditions, or special accommodations..."
                disabled={isSubmitting}
              />
            </div>

            {/* Document Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload any relevant documents such as medical records, immunization certificates, or identification.
              </p>

              <button
                type="button"
                onClick={() => setShowDocumentUpload(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </button>

              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">
                          {doc.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span>Daily Rate:</span>
                <span className="font-medium">{selectedProvider?.pricing}</span>
              </div>
              {formData.careType === 'FULL_TIME' && (
                <div className="flex justify-between items-center mb-2">
                  <span>Weekly Rate (5 days):</span>
                  <span className="font-medium">${weeklyRate}</span>
                </div>
              )}
              {formData.careType === 'PART_TIME' && (
                <div className="flex justify-between items-center mb-2">
                  <span>Weekly Rate (3 days):</span>
                  <span className="font-medium">${dailyRate * 3}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-2">
                <span>Registration Fee:</span>
                <span className="font-medium">${registrationFee}</span>
              </div>
            </div>

            {submitStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="w-5 h-5" />
                <span>{submitMessage}</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-5 h-5" />
                <span>{submitMessage}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || submitStatus === 'success'}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Confirm Booking</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <DocumentUpload
          onDocumentSelect={(document) => {
            setUploadedDocuments(prev => [...prev, document]);
            setShowDocumentUpload(false);
          }}
          onClose={() => setShowDocumentUpload(false)}
          title="Upload Supporting Document"
          description="Upload documents such as medical records, immunization certificates, or identification."
        />
      )}
    </div>
  );
};

// Main App Component - NOW MUCH SIMPLER
interface DaycareConnectAppProps {
  user?: {
    id: string;
    name: string;
    email: string;
    userType: 'PARENT' | 'PROVIDER' | 'ADMIN';
  } | null;
}

const DaycareConnectApp: React.FC<DaycareConnectAppProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState('search');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [searchLocation, setSearchLocation] = useState('Toronto, ON');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All Ages');
  const [sortBy, setSortBy] = useState('distance');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistProvider, setWaitlistProvider] = useState<any>(null);

  // State for favorites and waitlist
  const [favorites, setFavorites] = useState<number[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState<number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState<number | null>(null);
  const currentParentId = user?.id; // Use authenticated user's ID

  // Favorites functionality
  const toggleFavorite = async (providerId: number) => {
    if (!currentParentId) {
      alert('Please sign in to manage favorites');
      return;
    }

    setFavoriteLoading(providerId);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: currentParentId,
          daycareId: providerId
        })
      });

      const result = await response.json();
      if (result.success) {
        if (result.action === 'added') {
          setFavorites(prev => [...prev, providerId]);
        } else {
          setFavorites(prev => prev.filter(id => id !== providerId));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(null);
    }
  };

  // Enhanced waitlist functionality
  const joinWaitlist = async (provider: any) => {
    if (!currentParentId) {
      alert('Please sign in to join the waitlist');
      return;
    }

    setWaitlistProvider(provider);
    setShowWaitlistModal(true);
  };

  const handleWaitlistSuccess = () => {
    // Refresh any necessary data
    console.log('Waitlist joined successfully');
    // You might want to refresh the provider list or navigate to waitlist view
  };

  const isFavorite = (providerId: number) => favorites.includes(providerId);

  // Load providers from database
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  // Providers are already filtered and sorted by the API
  const filteredProviders = providers;

  const ageGroups = ['All Ages', 'Infant', 'Toddler', 'Preschool', 'School Age'];

  // Fetch providers from API
  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (searchLocation && searchLocation !== 'Toronto, ON') params.append('location', searchLocation);
      if (selectedAgeGroup && selectedAgeGroup !== 'All Ages') params.append('ageGroup', selectedAgeGroup);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(`/api/daycares?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched providers:', data);
        setProviders(data || []);
      } else {
        console.error('Failed to fetch providers');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setProvidersLoading(false);
    }
  };

  // Fetch providers on component mount and when search parameters change
  useEffect(() => {
    fetchProviders();
  }, []); // Initial load

  // Refetch when search parameters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProviders();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchLocation, selectedAgeGroup, sortBy]);

  // Fetch user bookings
  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const result = await response.json();

      if (response.ok && result.success) {
        setUserBookings(result.bookings);
      } else if (response.status === 401) {
        // User not authenticated, show empty bookings (this is expected for logged-out users)
        setUserBookings([]);
      } else {
        console.error('Failed to fetch bookings:', result.error);
        setUserBookings([]);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setUserBookings([]);
    }
  };

  useEffect(() => {
    if (currentView === 'bookings') {
      // Only fetch bookings if user is authenticated
      if (user) {
        fetchBookings();
      } else {
        setUserBookings([]); // Clear bookings for non-authenticated users
      }
    }
  }, [currentView, user]);

  // Bookings View Component
  const BookingsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
        <button
          onClick={() => setCurrentView('search')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Book New Care
        </button>
      </div>

      {userBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No bookings yet</h3>
          <p className="text-gray-400 mb-4">
            Start by searching for childcare providers in your area
          </p>
          <button
            onClick={() => setCurrentView('search')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Find Childcare
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userBookings.map((booking: any) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{booking.providerName}</h3>
                  <p className="text-gray-600">Child: {booking.childName}</p>
                  <p className="text-sm text-gray-500">Start Date: {new Date(booking.startDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <p className="text-lg font-bold text-blue-600 mt-1">{booking.dailyRate}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Care Type</p>
                  <p className="font-medium">{booking.careType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{booking.parentEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking Date</p>
                  <p className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {booking.specialRequests && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="text-sm">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ProviderProfile = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => setCurrentView('search')}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
      >
        ← Back to Search
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img 
          src={selectedProvider?.image} 
          alt={selectedProvider?.name}
          className="w-full h-64 object-cover"
        />
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProvider?.name}</h1>
              <p className="text-gray-600 mb-2">{selectedProvider?.type}</p>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                {selectedProvider?.address}
              </div>
              <div className="flex items-center mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-2 text-lg font-medium">{selectedProvider?.rating}</span>
                <span className="ml-1 text-gray-600">({selectedProvider?.reviews} reviews)</span>
              </div>
            </div>
            
            <div className="text-right">
              {selectedProvider?.availableSpots > 0 ? (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  {selectedProvider?.availableSpots} spots available
                </div>
              ) : (
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Waitlist: {selectedProvider?.waitlist} families
                </div>
              )}
              <div className="text-2xl font-bold text-blue-600">{selectedProvider?.pricing}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-700">{selectedProvider?.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Hours & Availability</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                {selectedProvider?.hours}
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                Ages: {selectedProvider?.ageGroups.join(', ')}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <Phone className="w-4 h-4 mr-2" />
                (416) 555-0123
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                info@sunshine-daycare.com
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Features & Services</h3>
            <div className="flex flex-wrap gap-2">
              {selectedProvider?.features.map((feature: string, index: number) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            {selectedProvider?.availableSpots > 0 ? (
              <button 
                onClick={() => setShowBookingModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Book Now
              </button>
            ) : (
              <button 
                onClick={() => joinWaitlist(selectedProvider)}
                disabled={waitlistLoading === selectedProvider?.id}
                className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
              >
                {waitlistLoading === selectedProvider?.id ? 'Joining...' : 'Join Waitlist'}
              </button>
            )}
            {user && selectedProvider?.ownerId && (
              <MessageButton
                currentUser={{
                  id: user.id,
                  name: user.name || '',
                  email: user.email,
                  userType: user.userType
                }}
                targetUserId={selectedProvider.ownerId}
                daycareId={selectedProvider.id}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
                size="md"
              >
                Message Provider
              </MessageButton>
            )}
            <button 
              onClick={() => toggleFavorite(selectedProvider?.id)}
              disabled={favoriteLoading === selectedProvider?.id}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              <Heart className={`w-4 h-4 inline mr-2 ${isFavorite(selectedProvider?.id) ? 'text-red-500 fill-current' : ''}`} />
              {favoriteLoading === selectedProvider?.id ? 'Saving...' : (isFavorite(selectedProvider?.id) ? 'Saved' : 'Save')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-2 font-medium text-gray-900">Sarah M.</span>
                <span className="ml-2 text-sm text-gray-500">2 weeks ago</span>
              </div>
              <p className="text-gray-700">Amazing daycare! My daughter loves going here and the staff is so caring and professional. Highly recommend!</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ParentNavigation = () => (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => setCurrentView('search')}
            className={`${currentView === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 border-b-2 border-transparent'} hover:text-blue-600 px-3 py-4 text-sm font-medium transition-colors`}
          >
            Find Care
          </button>
          <button
            onClick={() => setCurrentView('bookings')}
            className={`${currentView === 'bookings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 border-b-2 border-transparent'} hover:text-blue-600 px-3 py-4 text-sm font-medium transition-colors`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setCurrentView('waitlist')}
            className={`${currentView === 'waitlist' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 border-b-2 border-transparent'} hover:text-blue-600 px-3 py-4 text-sm font-medium transition-colors flex items-center gap-2`}
          >
            <List className="h-4 w-4" />
            My Waitlists
          </button>
          <button
            onClick={() => setCurrentView('daily-reports')}
            className={`${currentView === 'daily-reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 border-b-2 border-transparent'} hover:text-blue-600 px-3 py-4 text-sm font-medium transition-colors flex items-center gap-2`}
          >
            <FileText className="h-4 w-4" />
            Daily Reports
          </button>
          <button
            onClick={() => setShowMessaging(true)}
            className="text-gray-500 hover:text-blue-600 px-3 py-4 text-sm font-medium border-b-2 border-transparent transition-colors"
          >
            Messages
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div>
      <ParentNavigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'search' && (
          <SearchView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchLocation={searchLocation}
            setSearchLocation={setSearchLocation}
            selectedAgeGroup={selectedAgeGroup}
            setSelectedAgeGroup={setSelectedAgeGroup}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filteredProviders={filteredProviders}
            ageGroups={ageGroups}
            setSelectedProvider={setSelectedProvider}
            setCurrentView={setCurrentView}
            setShowBookingModal={setShowBookingModal}
            toggleFavorite={toggleFavorite}
            joinWaitlist={joinWaitlist}
            isFavorite={isFavorite}
            favoriteLoading={favoriteLoading}
            waitlistLoading={waitlistLoading}
            providersLoading={providersLoading}
            user={user}
          />
        )}
        {currentView === 'bookings' && <BookingsView />}
        {currentView === 'waitlist' && user && (
          <ParentWaitlistManager
            userId={user.id}
            onJoinWaitlist={() => setCurrentView('search')}
          />
        )}
        {currentView === 'daily-reports' && user && (
          <DailyReports
            userType="PARENT"
            currentUser={{
              id: user.id,
              name: user.name || '',
              userType: user.userType
            }}
          />
        )}
        {currentView === 'profile' && selectedProvider && <ProviderProfile />}
      </main>
      
      <BookingModal
        selectedProvider={selectedProvider}
        showBookingModal={showBookingModal}
        setShowBookingModal={setShowBookingModal}
        fetchProviders={fetchProviders}
        user={user}
      />

      {showMessaging && user && (
        <MessagingSystem
          currentUser={{
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            userType: user.userType
          }}
          onClose={() => setShowMessaging(false)}
        />
      )}

      <EnhancedWaitlistModal
        provider={waitlistProvider}
        show={showWaitlistModal}
        onClose={() => {
          setShowWaitlistModal(false);
          setWaitlistProvider(null);
        }}
        onSuccess={handleWaitlistSuccess}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default DaycareConnectApp;