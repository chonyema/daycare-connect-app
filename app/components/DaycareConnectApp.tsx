'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Users, Phone, Mail, Calendar, DollarSign, Heart, Menu, X, User, Settings, MessageCircle, CreditCard, Bell } from 'lucide-react';

const DaycareConnectApp = () => {
  const [userType, setUserType] = useState('parent'); // 'parent' or 'provider'
  const [currentView, setCurrentView] = useState('search'); // 'search', 'profile', 'booking', 'dashboard'
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [searchLocation, setSearchLocation] = useState('Toronto, ON');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Sample provider data
  const providers = [
    {
      id: 1,
      name: "Sunshine Daycare Centre",
      type: "Licensed Daycare Center",
      address: "123 Main St, Toronto, ON",
      distance: "0.8 km",
      rating: 4.8,
      reviews: 42,
      availableSpots: 3,
      ageGroups: ["Infant", "Toddler", "Preschool"],
      pricing: "$55/day",
      hours: "7:00 AM - 6:00 PM",
      image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop",
      verified: true,
      waitlist: 5,
      features: ["Meals Included", "Outdoor Playground", "Educational Programs"]
    },
    {
      id: 2,
      name: "Little Stars Home Daycare",
      type: "Licensed Home Daycare",
      address: "456 Oak Ave, Toronto, ON",
      distance: "1.2 km",
      rating: 4.9,
      reviews: 28,
      availableSpots: 1,
      ageGroups: ["Toddler", "Preschool"],
      pricing: "$45/day",
      hours: "6:30 AM - 6:30 PM",
      image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop",
      verified: true,
      waitlist: 2,
      features: ["Small Groups", "Bilingual", "Flexible Hours"]
    },
    {
      id: 3,
      name: "Adventure Kids Learning Centre",
      type: "Licensed Daycare Center",
      address: "789 Pine St, Toronto, ON",
      distance: "2.1 km",
      rating: 4.6,
      reviews: 67,
      availableSpots: 0,
      ageGroups: ["Preschool", "School Age"],
      pricing: "$60/day",
      hours: "7:00 AM - 6:00 PM",
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
      verified: true,
      waitlist: 12,
      features: ["STEM Programs", "Music Classes", "Hot Meals"]
    }
  ];

  const ProviderCard = ({ provider }: { provider: any }) => (
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
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{provider.rating} ({provider.reviews})</span>
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
            <button className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium">
              Join Waitlist
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const SearchView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Find Quality Childcare Near You</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-md text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full px-4 py-2 rounded-md text-gray-900 placeholder-gray-500"
              />
            </div>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium">
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">All Ages</button>
            <button className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-30">Infant (0-18m)</button>
            <button className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-30">Toddler (18m-3y)</button>
            <button className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-30">Preschool (3-5y)</button>
            <button className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-30">School Age (5+)</button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Available Providers</h3>
        <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
          <option>Sort by Distance</option>
          <option>Sort by Rating</option>
          <option>Sort by Price</option>
          <option>Sort by Availability</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
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
              <button className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors font-medium">
                Join Waitlist
              </button>
            )}
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Message Provider
            </button>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium">
              <Heart className="w-4 h-4 inline mr-2" />
              Save
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

  const BookingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Book Childcare</h3>
          <button 
            onClick={() => setShowBookingModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Child&apos;s Name</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Care Type</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option>Full-time (5 days/week)</option>
              <option>Part-time (3 days/week)</option>
              <option>Drop-in (as needed)</option>
            </select>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span>Daily Rate:</span>
              <span className="font-medium">{selectedProvider?.pricing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Registration Fee:</span>
              <span className="font-medium">$50.00</span>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setShowBookingModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DaycareConnect</span>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => setCurrentView('search')}
              className={`${currentView === 'search' ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 px-3 py-2 text-sm font-medium`}
            >
              Find Care
            </button>
            <button className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              My Bookings
            </button>
            <button className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Messages
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Parent</span>
              <button 
                onClick={() => setUserType(userType === 'parent' ? 'provider' : 'parent')}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200"
              >
                Switch to {userType === 'parent' ? 'Provider' : 'Parent'}
              </button>
            </div>
            <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            <User className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'search' && <SearchView />}
        {currentView === 'profile' && selectedProvider && <ProviderProfile />}
      </main>
      
      {showBookingModal && <BookingModal />}
    </div>
  );
};

export default DaycareConnectApp;