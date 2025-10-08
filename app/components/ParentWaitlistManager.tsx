'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Info,
  ExternalLink,
  Baby,
  FileText,
  Award,
  Timer,
  Bell,
  MessageSquare,
  Phone
} from 'lucide-react';
import WaitlistNotifications from './WaitlistNotifications';
import WaitlistPositionTracker from './parent/WaitlistPositionTracker';

interface WaitlistEntry {
  id: string;
  childName: string;
  childAge: string;
  position: number;
  priorityScore: number;
  estimatedWaitDays: number;
  status: 'ACTIVE' | 'PAUSED' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'ENROLLED' | 'REMOVED';
  joinedAt: string;
  desiredStartDate: string;
  preferredDays?: string[];
  careType: string;
  parentNotes?: string;
  lastUpdatedAt: string;
  daycare: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
  program?: {
    id: string;
    name: string;
    description: string;
  };
  offers: WaitlistOffer[];
  auditLogs: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }>;
}

interface WaitlistOffer {
  id: string;
  spotAvailableDate: string;
  offerExpiresAt: string;
  response?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  responseNotes?: string;
  isExpired: boolean;
  hoursRemaining: number;
  canRespond: boolean;
}

interface ParentWaitlistManagerProps {
  userId: string;
  onJoinWaitlist?: () => void;
}

const ParentWaitlistManager: React.FC<ParentWaitlistManagerProps> = ({
  userId,
  onJoinWaitlist
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'positions'>('positions');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeOffers, setActiveOffers] = useState<WaitlistOffer[]>([]);
  const [respondingToOffer, setRespondingToOffer] = useState<string | null>(null);
  const [offerResponse, setOfferResponse] = useState<'ACCEPTED' | 'DECLINED' | null>(null);
  const [responseNotes, setResponseNotes] = useState('');

  useEffect(() => {
    if (userId) {
      loadWaitlistEntries();
    }
  }, [userId]);

  const loadWaitlistEntries = async () => {
    try {
      setLoading(true);
      console.log('Loading waitlist entries for userId:', userId);
      const response = await fetch(`/api/waitlist/enhanced?parentId=${userId}`);
      const data = await response.json();

      console.log('Waitlist API response:', data);
      console.log('Response success:', data.success);
      console.log('Response data length:', data.data?.length || 0);

      if (data.success) {
        setEntries(data.data || []);
        console.log('Set entries to:', data.data || []);

        // Extract active offers
        const offers: WaitlistOffer[] = [];
        data.data?.forEach((entry: WaitlistEntry) => {
          entry.offers?.forEach((offer: WaitlistOffer) => {
            if (offer.canRespond && !offer.isExpired) {
              offers.push(offer);
            }
          });
        });
        setActiveOffers(offers);
        console.log('Active offers found:', offers.length);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load waitlist entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferResponse = async (offerId: string, response: 'ACCEPTED' | 'DECLINED') => {
    try {
      setRespondingToOffer(offerId);

      const result = await fetch(`/api/waitlist/offers/${offerId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response,
          responseNotes,
          respondedBy: userId
        })
      });

      const data = await result.json();

      if (data.success) {
        // Reload entries to get updated status
        await loadWaitlistEntries();
        setRespondingToOffer(null);
        setOfferResponse(null);
        setResponseNotes('');

        // Show success message
        alert(data.message || `Offer ${response.toLowerCase()} successfully!`);
      } else {
        alert(data.error || `Failed to ${response.toLowerCase()} offer`);
      }
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      alert('Failed to respond to offer. Please try again.');
    } finally {
      setRespondingToOffer(null);
    }
  };

  const updateWaitlistEntry = async (entryId: string, updates: any) => {
    try {
      const response = await fetch(`/api/waitlist/enhanced/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        await loadWaitlistEntries();
        return true;
      } else {
        alert(data.error || 'Failed to update waitlist entry');
        return false;
      }
    } catch (error) {
      console.error('Failed to update waitlist entry:', error);
      alert('Failed to update waitlist entry. Please try again.');
      return false;
    }
  };

  const pauseEntry = (entryId: string) => {
    updateWaitlistEntry(entryId, { status: 'PAUSED' });
  };

  const resumeEntry = (entryId: string) => {
    updateWaitlistEntry(entryId, { status: 'ACTIVE' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'OFFERED': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-purple-100 text-purple-800';
      case 'ENROLLED': return 'bg-indigo-100 text-indigo-800';
      case 'DECLINED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'PAUSED': return <Pause className="h-4 w-4" />;
      case 'OFFERED': return <Bell className="h-4 w-4" />;
      case 'ACCEPTED': return <Award className="h-4 w-4" />;
      case 'ENROLLED': return <Users className="h-4 w-4" />;
      case 'DECLINED': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} days${remainingHours > 0 ? `, ${remainingHours} hours` : ''}`;
  };

  const getPositionBand = (position: number) => {
    if (position <= 5) return { text: 'Very High', color: 'text-green-600' };
    if (position <= 15) return { text: 'High', color: 'text-blue-600' };
    if (position <= 30) return { text: 'Medium', color: 'text-yellow-600' };
    return { text: 'Lower', color: 'text-gray-600' };
  };

  const getEstimatedWaitText = (days: number) => {
    if (days <= 30) return `~${days} days`;
    if (days <= 90) return `~${Math.round(days / 7)} weeks`;
    return `~${Math.round(days / 30)} months`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your waitlist entries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Waitlists</h2>
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('positions')}
                className={`${
                  activeTab === 'positions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Position Tracker
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Manage Entries
              </button>
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <WaitlistNotifications userId={userId} userType="PARENT" />

          {onJoinWaitlist && (
            <button
              onClick={onJoinWaitlist}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Join Waitlist
            </button>
          )}
        </div>
      </div>

      {/* Position Tracker Tab */}
      {activeTab === 'positions' && (
        <WaitlistPositionTracker />
      )}

      {/* Manage Entries Tab */}
      {activeTab === 'list' && (
        <>
          {/* Active Offers Alert */}
          {activeOffers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                You have {activeOffers.length} active offer{activeOffers.length !== 1 ? 's' : ''}!
              </h3>
              <p className="text-blue-700 mt-1">
                Please respond to your offers before they expire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Waitlist Entries</h3>
          <p className="text-gray-600 mb-4">
            You haven't joined any waitlists yet. Start by finding childcare providers.
          </p>
          {onJoinWaitlist && (
            <button
              onClick={onJoinWaitlist}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Find Childcare
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{entry.childName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                        {entry.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {entry.daycare.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Baby className="h-4 w-4" />
                        {entry.childAge}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(entry.desiredStartDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.status === 'ACTIVE' && (
                      <button
                        onClick={() => pauseEntry(entry.id)}
                        className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                        title="Pause waitlist entry"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    )}

                    {entry.status === 'PAUSED' && (
                      <button
                        onClick={() => resumeEntry(entry.id)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Resume waitlist entry"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowDetails(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View details"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Position and Wait Time Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Position</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">#{entry.position}</span>
                      <span className={`text-sm font-medium ${getPositionBand(entry.position).color}`}>
                        {getPositionBand(entry.position).text}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Est. Wait</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {getEstimatedWaitText(entry.estimatedWaitDays)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Priority Score</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {entry.priorityScore.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Active Offers */}
                {entry.offers?.filter(offer => offer.canRespond && !offer.isExpired).map((offer) => (
                  <div key={offer.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Spot Offer Available!</h4>
                        <p className="text-blue-700 text-sm">
                          Available start date: <strong>{formatDate(offer.spotAvailableDate)}</strong>
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          <Timer className="h-4 w-4 inline mr-1" />
                          Expires in {formatTimeRemaining(offer.hoursRemaining)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRespondingToOffer(offer.id);
                            setOfferResponse('DECLINED');
                          }}
                          disabled={respondingToOffer === offer.id}
                          className="px-4 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => {
                            setRespondingToOffer(offer.id);
                            setOfferResponse('ACCEPTED');
                          }}
                          disabled={respondingToOffer === offer.id}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          {respondingToOffer === offer.id ? 'Processing...' : 'Accept'}
                        </button>
                      </div>
                    </div>

                    {respondingToOffer === offer.id && offerResponse && (
                      <div className="border-t border-blue-200 pt-3 mt-3">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-blue-900 mb-1">
                            Response Notes (Optional)
                          </label>
                          <textarea
                            value={responseNotes}
                            onChange={(e) => setResponseNotes(e.target.value)}
                            placeholder={`Add any notes about your ${offerResponse.toLowerCase()} response...`}
                            className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm"
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRespondingToOffer(null);
                              setOfferResponse(null);
                              setResponseNotes('');
                            }}
                            className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleOfferResponse(offer.id, offerResponse)}
                            className={`px-4 py-1 text-sm rounded-md transition-colors ${
                              offerResponse === 'ACCEPTED'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            Confirm {offerResponse === 'ACCEPTED' ? 'Acceptance' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Expired Offers */}
                {entry.offers?.filter(offer => (offer.isExpired || offer.response === 'EXPIRED') && offer.response !== 'ACCEPTED' && offer.response !== 'DECLINED').slice(0, 2).map((offer) => (
                  <div key={offer.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4 opacity-75">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-700 mb-1">Offer Expired</h4>
                        <p className="text-gray-600 text-sm mb-1">
                          A spot was offered for <strong>{formatDate(offer.spotAvailableDate)}</strong>
                        </p>
                        <p className="text-gray-500 text-xs">
                          Expired on {formatDate(offer.offerExpiresAt)}
                        </p>
                        <p className="text-gray-600 text-sm mt-2">
                          You've been returned to the active waitlist at position <strong>#{entry.position}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Program Info */}
                {entry.program && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Program:</span> {entry.program.name}
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Joined {formatDate(entry.joinedAt)} • Last updated {formatDate(entry.lastUpdatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedEntry.childName}</h3>
                  <p className="text-gray-600">{selectedEntry.daycare.name}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Detailed Information */}
              <div className="space-y-6">
                {/* Child & Care Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Care Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Child Age:</span>
                      <p className="font-medium">{selectedEntry.childAge}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Care Type:</span>
                      <p className="font-medium">{selectedEntry.careType}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Desired Start:</span>
                      <p className="font-medium">{formatDate(selectedEntry.desiredStartDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Preferred Days:</span>
                      <p className="font-medium">{selectedEntry.preferredDays?.join(', ') || 'Any'}</p>
                    </div>
                  </div>
                </div>

                {/* Daycare Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Daycare Information</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedEntry.daycare.address}, {selectedEntry.daycare.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedEntry.daycare.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span>{selectedEntry.daycare.email}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedEntry.parentNotes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Your Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      {selectedEntry.parentNotes}
                    </p>
                  </div>
                )}

                {/* Recent Activity */}
                {selectedEntry.auditLogs && selectedEntry.auditLogs.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedEntry.auditLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="text-xs bg-gray-50 rounded p-2">
                          <div className="flex justify-between items-start">
                            <span className="text-gray-700">{log.description}</span>
                            <span className="text-gray-500">{formatDate(log.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ParentWaitlistManager;