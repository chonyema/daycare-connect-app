'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Bell,
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  childName: string;
  position: number;
  priorityScore: number;
  status: string;
  desiredStartDate: string;
  estimatedWaitDays: number | null;
  daycare: {
    id: string;
    name: string;
  };
  program: {
    id: string;
    name: string;
    waitlistCount: number;
  };
  offers: Array<{
    id: string;
    spotAvailableDate: string;
    offerExpiresAt: string;
    depositRequired: boolean;
    depositAmount: number | null;
    requiredDocuments: string | null;
  }>;
  insights: {
    totalInQueue: number;
    currentPosition: number;
    offersInProgress: number;
    hasActiveOffer: boolean;
    estimatedWaitTime: string;
  };
}

export default function WaitlistPositionTracker() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    fetchWaitlistPositions();
    const interval = setInterval(fetchWaitlistPositions, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchWaitlistPositions = async () => {
    try {
      const res = await fetch('/api/waitlist/position');
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToOffer = async (offerId: string, response: 'ACCEPTED' | 'DECLINED', notes?: string) => {
    try {
      const res = await fetch(`/api/waitlist/offers/${offerId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response,
          notes,
          depositPaid: false, // Will be handled separately
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Offer ${response.toLowerCase()} successfully!`);
        setShowOfferModal(false);
        fetchWaitlistPositions();
      } else {
        alert(data.error || 'Failed to respond to offer');
      }
    } catch (error) {
      console.error('Failed to respond:', error);
      alert('Failed to respond to offer');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return { text: 'Expired', urgent: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h remaining`, urgent: false };
    }
    return { text: `${hours}h ${minutes}m remaining`, urgent: hours < 12 };
  };

  const getPositionColor = (position: number, total: number) => {
    const percentage = (position / total) * 100;
    if (percentage <= 20) return 'text-green-600 bg-green-50';
    if (percentage <= 50) return 'text-blue-600 bg-blue-50';
    if (percentage <= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Waitlist Positions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your position and respond to offers
        </p>
      </div>

      {/* Waitlist Entries */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No waitlist entries</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're not currently on any waitlists
          </p>
        </div>
      ) : (
        entries.map((entry) => {
          const activeOffer = entry.offers[0];
          const hasActiveOffer = activeOffer && !activeOffer.offerExpiresAt;

          return (
            <div key={entry.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Active Offer Alert */}
              {hasActiveOffer && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center text-white">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        🎉 You Have an Active Offer!
                      </h3>
                      <p className="mt-1 text-sm text-white">
                        {getTimeRemaining(activeOffer.offerExpiresAt).text}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOffer(activeOffer);
                        setShowOfferModal(true);
                      }}
                      className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50"
                    >
                      View Offer
                    </button>
                  </div>
                </div>
              )}

              {/* Entry Details */}
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entry.childName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {entry.daycare.name}{entry.program?.name ? ` - ${entry.program.name}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Desired Start: {new Date(entry.desiredStartDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Position Badge */}
                  <div className={`px-4 py-2 rounded-lg ${getPositionColor(entry.position, entry.insights?.totalInQueue || entry.position)}`}>
                    <div className="text-center">
                      <div className="text-3xl font-bold">#{entry.position}</div>
                      <div className="text-xs">of {entry.insights?.totalInQueue || entry.position}</div>
                    </div>
                  </div>
                </div>

                {/* Insights Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Estimated Wait */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      Estimated Wait
                    </div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">
                      {entry.insights?.estimatedWaitTime || 'Calculating...'}
                    </div>
                  </div>

                  {/* Offers in Progress */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Offers Ahead
                    </div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">
                      {entry.insights?.offersInProgress || 0} families
                    </div>
                    {(entry.insights?.offersInProgress || 0) > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Currently reviewing offers
                      </p>
                    )}
                  </div>

                  {/* Priority Score */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Priority Score
                    </div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">
                      {entry.priorityScore.toFixed(1)} pts
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    entry.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    entry.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status}
                  </span>

                  {entry.position <= 3 && !hasActiveOffer && (
                    <div className="flex items-center text-sm text-amber-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      You're near the top! Expect an offer soon
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Offer Response Modal */}
      {showOfferModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Spot Offer Details</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Countdown */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Offer Expires In:</span>
                  <span className={`text-lg font-bold ${
                    getTimeRemaining(selectedOffer.offerExpiresAt).urgent
                      ? 'text-red-600'
                      : 'text-blue-700'
                  }`}>
                    {getTimeRemaining(selectedOffer.offerExpiresAt).text}
                  </span>
                </div>
              </div>

              {/* Offer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedOffer.spotAvailableDate).toLocaleDateString()}
                  </p>
                </div>

                {selectedOffer.depositRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deposit Required</label>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${selectedOffer.depositAmount?.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Required Documents */}
              {selectedOffer.requiredDocuments && JSON.parse(selectedOffer.requiredDocuments).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Documents</label>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {JSON.parse(selectedOffer.requiredDocuments).map((doc: string, idx: number) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => respondToOffer(selectedOffer.id, 'ACCEPTED')}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Offer
                </button>
                <button
                  onClick={() => respondToOffer(selectedOffer.id, 'DECLINED')}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Decline Offer
                </button>
              </div>

              <button
                onClick={() => setShowOfferModal(false)}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
