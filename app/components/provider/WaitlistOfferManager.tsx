'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Settings,
  Users,
  TrendingUp,
  X,
} from 'lucide-react';

interface WaitlistOffer {
  id: string;
  spotAvailableDate: string;
  offerSentAt: string;
  offerExpiresAt: string;
  response: string | null;
  depositRequired: boolean;
  depositAmount: number | null;
  waitlistEntry: {
    childName: string;
    position: number;
    parent: {
      name: string;
      email: string;
    };
    program: {
      name: string;
    };
  };
}

interface WaitlistCandidate {
  entry: {
    id: string;
    childName: string;
    childAge: string;
    position: number;
    priorityScore: number;
    desiredStartDate: string;
    parent: {
      name: string;
      email: string;
    };
  };
  finalScore: number;
  reason: string;
}

export default function WaitlistOfferManager({ daycareId }: { daycareId: string }) {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'candidates'>('active');
  const [offers, setOffers] = useState<WaitlistOffer[]>([]);
  const [candidates, setCandidates] = useState<WaitlistCandidate[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [offerDate, setOfferDate] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    fetchOffers();
    fetchSettings();
    fetchPrograms();
  }, [daycareId, activeTab]);

  const fetchPrograms = async () => {
    try {
      const res = await fetch(`/api/programs?daycareId=${daycareId}`);
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const status = activeTab === 'active' ? 'active' : '';
      const res = await fetch(`/api/waitlist/offers?daycareId=${daycareId}&status=${status}`);
      const data = await res.json();
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/waitlist/settings?daycareId=${daycareId}`);
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const createOffer = async (programId: string, spotStartDate: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/waitlist/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daycareId,
          programId,
          spotStartDate,
          offerWindowHours: settings?.defaultOfferWindowHours || 48,
          depositRequired: settings?.requireDeposit || false,
          depositAmount: settings?.defaultDepositAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Offer sent successfully!');
        fetchOffers();
        setShowCreateModal(false);
      } else {
        alert(data.error || 'Failed to create offer');
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
      alert('Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const getStatusBadge = (offer: WaitlistOffer) => {
    if (offer.response === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted
        </span>
      );
    }
    if (offer.response === 'DECLINED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </span>
      );
    }
    if (offer.response === 'EXPIRED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }

    const timeRemaining = getTimeRemaining(offer.offerExpiresAt);
    const isUrgent = new Date(offer.offerExpiresAt).getTime() - new Date().getTime() < 12 * 60 * 60 * 1000;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isUrgent ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
      }`}>
        <Clock className="w-3 h-3 mr-1" />
        {timeRemaining}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Waitlist Offers</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage spot offers to waitlisted families
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Create Offer
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Active Offers
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Offers List */}
      <div className="divide-y divide-gray-200">
        {offers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No offers</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'active'
                ? 'No active offers at the moment'
                : 'No offer history available'}
            </p>
          </div>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900">
                      {offer.waitlistEntry.childName}
                    </h3>
                    <span className="ml-2 text-sm text-gray-500">
                      (Position #{offer.waitlistEntry.position})
                    </span>
                  </div>

                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{offer.waitlistEntry.parent.name}</span>
                    <span className="mx-2">•</span>
                    <span>{offer.waitlistEntry.parent.email}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      <strong>Program:</strong> {offer.waitlistEntry.program.name}
                    </span>
                    <span>
                      <strong>Start:</strong>{' '}
                      {new Date(offer.spotAvailableDate).toLocaleDateString()}
                    </span>
                    {offer.depositRequired && (
                      <span>
                        <strong>Deposit:</strong> ${offer.depositAmount?.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Sent {new Date(offer.offerSentAt).toLocaleString()}
                  </div>
                </div>

                <div className="ml-4">{getStatusBadge(offer)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settings Footer */}
      {settings && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                <strong>Offer Window:</strong> {settings.defaultOfferWindowHours}h
              </span>
              <span>
                <strong>Auto-Advance:</strong>{' '}
                {settings.autoAdvanceEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <span>
                <strong>Deposit:</strong>{' '}
                {settings.requireDeposit ? `$${settings.defaultDepositAmount}` : 'Not required'}
              </span>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              <Settings className="w-4 h-4 mr-1" />
              Configure
            </button>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Spot Offer</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program *
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => {
                    const ageRange = `${Math.floor(program.minAgeMonths / 12)}y ${program.minAgeMonths % 12}m - ${Math.floor(program.maxAgeMonths / 12)}y ${program.maxAgeMonths % 12}m`;
                    return (
                      <option key={program.id} value={program.id}>
                        {program.name} ({ageRange})
                      </option>
                    );
                  })}
                </select>
                {programs.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    No programs found. Please create a program for this daycare first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spot Available Date *
                </label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  The system will automatically select the best candidate based on your waitlist priority settings.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setOfferDate('');
                    setSelectedProgramId('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (offerDate && selectedProgramId) {
                      await createOffer(selectedProgramId, offerDate);
                      setShowCreateModal(false);
                      setOfferDate('');
                      setSelectedProgramId('');
                    }
                  }}
                  disabled={!offerDate || !selectedProgramId || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Waitlist Offer Settings</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm font-medium text-gray-700">Auto-advance waitlist positions</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.autoAdvanceEnabled}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-3">
                  Automatically move candidates up when spots open
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm font-medium text-gray-700">Require deposit</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.requireDeposit}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default deposit amount
                </label>
                <input
                  type="number"
                  defaultValue={settings?.defaultDepositAmount || 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response deadline (hours)
                </label>
                <input
                  type="number"
                  defaultValue={settings?.responseDeadlineHours || 48}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  placeholder="Enter hours"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long parents have to respond to an offer
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement save settings
                    alert('Settings save functionality will be implemented');
                    setShowConfigModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
