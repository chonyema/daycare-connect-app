'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import DaycareConnectApp from './DaycareConnectApp';
import ProviderDashboardApp from './ProviderDashboardApp';
import {
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';

const UnifiedDaycareApp = () => {
  const { user, loading: authLoading, logout, isProvider, isParent } = useAuth();
  const [currentInterface, setCurrentInterface] = useState<'parent' | 'provider'>('parent');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set interface based on localStorage or user type
  useEffect(() => {
    // Check if there's a saved interface preference
    const savedInterface = localStorage.getItem('selectedInterface') as 'parent' | 'provider' | null;

    if (savedInterface) {
      setCurrentInterface(savedInterface);
    } else if (user && !authLoading) {
      // Default to their account type for new users
      if (isProvider) {
        setCurrentInterface('provider');
      }
    }
  }, [user, isProvider, authLoading]);

  // Handle interface switching
  const handleInterfaceSwitch = (newInterface: 'parent' | 'provider') => {
    setCurrentInterface(newInterface);
    localStorage.setItem('selectedInterface', newInterface);
    setMobileMenuOpen(false);
  };

  // If user is not logged in, show auth modal
  const showAuthRequired = !authLoading && !user;

  // If user is logged in but trying to access provider interface without being a provider
  const showProviderAccessDenied = user && currentInterface === 'provider' && !isProvider;

  // Main header component
  const UnifiedHeader = () => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DaycareConnect</span>
            </div>
          </div>

          {/* Center - Interface Switch for logged in users */}
          {user && (
            <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleInterfaceSwitch('parent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentInterface === 'parent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Parent View
              </button>
              <button
                onClick={() => handleInterfaceSwitch('provider')}
                disabled={!isProvider}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentInterface === 'provider'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : isProvider
                      ? 'text-gray-600 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                }`}
                title={!isProvider ? 'Provider account required' : ''}
              >
                Provider View
              </button>
            </div>
          )}

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <span>{user.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user.userType.toLowerCase()}
                  </span>
                </div>
                <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ?
                <X className="w-5 h-5 text-gray-400" /> :
                <Menu className="w-5 h-5 text-gray-400" />
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user ? (
              <div className="space-y-3">
                <div className="px-4 py-2">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1">
                    {user.userType.toLowerCase()}
                  </span>
                </div>
                <div className="px-4 space-y-2">
                  <button
                    onClick={() => handleInterfaceSwitch('parent')}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      currentInterface === 'parent' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    Parent View
                  </button>
                  <button
                    onClick={() => handleInterfaceSwitch('provider')}
                    disabled={!isProvider}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      currentInterface === 'provider' ? 'bg-blue-50 text-blue-600' :
                      isProvider ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    Provider View {!isProvider && '(Requires provider account)'}
                  </button>
                </div>
                <div className="px-4 pt-2 border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4">
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );

  // Auth required screen
  const AuthRequiredScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to DaycareConnect</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access your personalized dashboard and start connecting with childcare providers.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    </div>
  );

  // Provider access denied screen
  const ProviderAccessDeniedScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Users className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Access Required</h1>
            <p className="text-gray-600 mb-6">
              You need a provider account to access the provider dashboard. Your current account is set up for parents.
            </p>
            <button
              onClick={() => handleInterfaceSwitch('parent')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mr-3"
            >
              Switch to Parent View
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
            >
              Create Provider Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth required screen if not logged in
  if (showAuthRequired) {
    return (
      <>
        <AuthRequiredScreen />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Show provider access denied if trying to access provider view without being a provider
  if (showProviderAccessDenied) {
    return (
      <>
        <ProviderAccessDeniedScreen />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          requiredUserType="PROVIDER"
        />
      </>
    );
  }

  // Main app content based on selected interface
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />

      {currentInterface === 'parent' ? (
        <DaycareConnectApp />
      ) : (
        <ProviderDashboardApp />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default UnifiedDaycareApp;