'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Users, Phone, Mail, Calendar, DollarSign, Heart, Menu, X, User, Settings, MessageCircle, CreditCard, Bell, Filter, LogOut } from 'lucide-react';

// Simple auth modal component (inline for now)
const AuthModal = ({ isOpen, onClose, mode, onToggleMode }: {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onToggleMode: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'parent' as 'parent' | 'provider',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate successful login/signup
    const user = {
      id: Date.now().toString(),
      name: formData.name || 'Demo User',
      email: formData.email,
      type: formData.userType,
    };

    localStorage.setItem('user', JSON.stringify(user));
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">I am a:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({...formData, userType: 'parent'})}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                formData.userType === 'parent'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
              <div className="font-medium">Parent</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, userType: 'provider'})}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                formData.userType === 'provider'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🏫</div>
              <div className="font-medium">Provider</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-blue-600 font-medium hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

const DaycareConnectApp = () => {
  const [userType, setUserType] = useState('parent');
  const [currentView, setCurrentView] = useState('search');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [searchLocation, setSearchLocation] = useState('Toronto, ON');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All Ages');
  const [sortBy, setSortBy] = useState('distance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // DATABASE INTEGRATION: Dynamic state instead of hardcoded data
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [favorites, setFavorites] = useState<number[]>([]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setUserType(user.type);

      const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    }
  }, []);

  // DATABASE INTEGRATION: Fetch daycares from API
  useEffect(() => {
    fetchDaycares();
  }, [searchQuery, selectedAgeGroup, sortBy, searchLocation]);

  const fetchDaycares = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        location: searchLocation,
        ageGroup: selectedAgeGroup,
        sortBy: sortBy
      });
      
      const response = await fetch(`/api/daycares?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched daycares:', data);
      
      // Ensure data is an array
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching daycares:', error);
      setProviders([]); // Always set to empty array on error
    }
    setLoading(false);
  };

  // Authentication functions
  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem(`favorites_${currentUser?.id}`);
    setCurrentUser(null);
    setFavorites([]);
    setCurrentView('search');
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  // Favorites functionality
  const toggleFavorite = (providerId: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const newFavorites = favorites.includes(providerId)
      ? favorites.filter(id => id !== providerId)
      : [...favorites, providerId];

    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${currentUser.id}`, JSON.stringify(newFavorites));
  };

  const isFavorite = (providerId: number) => favorites.includes(providerId);

  // DATABASE INTEGRATION: Use filtered providers directly from API (filtering happens server-side)
  const filteredProviders = Array.isArray(providers) ? providers : [];
  const ageGroups = ['All Ages', 'Infant', 'Toddler', 'Preschool', 'School Age'];

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

        {/* Favorite Button */}
        <button
          onClick={() => toggleFavorite(provider.id)}
          className={`absolute top-14 right-3 p-2 rounded-full transition-colors ${
            isFavorite(provider.id)
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite(provider.id) ? 'fill-current' : ''}`} />
        </button>
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
          {provider.ageGroups?.map((age: string, index: number) => (
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
              onClick={() => {
                if (!currentUser) {
                  setShowAuthModal(true);
                  return;
                }
                setSelectedProvider(provider);
                setShowBookingModal(true);
              }}
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

  return (
    <div className="min-h-screen bg-gray-50">
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
              {currentUser && (
                <>
                  <button
                    onClick={() => setCurrentView('favorites')}
                    className={`${currentView === 'favorites' ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 px-3 py-2 text-sm font-medium`}
                  >
                    My Favorites ({favorites.length})
                  </button>
                  <button className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    My Bookings
                  </button>
                </>
              )}
              <button className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Messages
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{currentUser.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogin}
                    className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignup}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Sign Up
                  </button>
                </div>
              )}
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'search' && (
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
                      className="w-full px-4 py-2 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Location (e.g., Toronto, ON)"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full px-4 py-2 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <button className="bg-white text-blue-600 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ageGroups.map((age) => (
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
                  {loading ? 'Loading...' : `${filteredProviders.length} Provider${filteredProviders.length !== 1 ? 's' : ''} Found`}
                </h3>
                {searchQuery && !loading && (
                  <p className="text-sm text-gray-600">
                    Showing results for "{searchQuery}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={loading}
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="price">Sort by Price</option>
                  <option value="availability">Sort by Availability</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading daycares...</p>
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
                {filteredProviders.map(provider => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'favorites' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Favorites</h2>
              <p className="text-gray-600">
                {favorites.length > 0
                  ? `You have ${favorites.length} saved provider${favorites.length !== 1 ? 's' : ''}`
                  : 'No saved providers yet. Heart your favorites to see them here!'
                }
              </p>
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers
                  .filter(provider => favorites.includes(provider.id))
                  .map(provider => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-500 mb-2">No favorites yet</h3>
                <p className="text-gray-400 mb-4">
                  Click the heart icon on provider cards to save your favorites
                </p>
                <button
                  onClick={() => setCurrentView('search')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Providers
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'profile' && selectedProvider && (
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
                      Ages: {selectedProvider?.ageGroups?.join(', ')}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedProvider?.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedProvider?.email}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Features & Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider?.features?.map((feature: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  {selectedProvider?.availableSpots > 0 ? (
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setShowAuthModal(true);
                          return;
                        }
                        setShowBookingModal(true);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Book Now
                    </button>
                  ) : (
                    <button className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors font-medium">
                      Join Waitlist
                    </button>
                  )}
                  <button
                    onClick={() => toggleFavorite(selectedProvider.id)}
                    className={`px-6 py-3 rounded-md transition-colors font-medium ${
                      isFavorite(selectedProvider.id)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 inline mr-2 ${isFavorite(selectedProvider.id) ? 'fill-current' : ''}`} />
                    {isFavorite(selectedProvider.id) ? 'Saved' : 'Save'}
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium">
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Message Provider
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
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onToggleMode={toggleAuthMode}
      />

      {/* Booking Modal */}
      {showBookingModal && (
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
                <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Care Type</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300">
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
      )}
    </div>
  );
};

export default DaycareConnectApp;