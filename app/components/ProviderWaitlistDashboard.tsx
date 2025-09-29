'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Star,
  Plus,
  Settings,
  Send,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Eye,
  BarChart3,
  Filter,
  Search,
  Download,
  Mail,
  Zap,
  Target,
  Award,
  Timer,
  UserCheck,
  UserX,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  childName: string;
  childAge?: string;
  position: number;
  priorityScore: number;
  daysOnWaitlist: number;
  positionBand: string;
  status: 'ACTIVE' | 'PAUSED' | 'OFFERED' | 'ACCEPTED' | 'DECLINED';
  desiredStartDate: string;
  careType: string;
  hasSiblingEnrolled: boolean;
  isStaffChild: boolean;
  inServiceArea: boolean;
  hasSubsidyApproval: boolean;
  hasSpecialNeeds: boolean;
  estimatedWaitDays?: number;
  parent: {
    name: string;
    email: string;
  };
  program?: {
    name: string;
  };
  joinedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  spotsAvailable: number;
  spotsRemaining: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalOffered: number;
  totalAccepted: number;
  totalDeclined: number;
  createdAt: string;
  spotAvailableDate: string;
  stats: {
    responseRate: number;
    acceptanceRate: number;
  };
}

interface PriorityRule {
  id: string;
  name: string;
  ruleType: string;
  points: number;
  isActive: boolean;
  sortOrder: number;
  description?: string;
  stats: {
    affectedEntries: number;
  };
}

interface ProviderWaitlistDashboardProps {
  currentUser: any;
  daycareId: string;
}

const ProviderWaitlistDashboard: React.FC<ProviderWaitlistDashboardProps> = ({
  currentUser,
  daycareId
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [priorityRules, setPriorityRules] = useState<PriorityRule[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Stats
  const [dashboardStats, setDashboardStats] = useState({
    totalWaitlist: 0,
    activeOffers: 0,
    avgWaitTime: 0,
    conversionRate: 0,
    todayJoined: 0,
    topPriorityBand: '',
    capacityUtilization: 0
  });

  useEffect(() => {
    loadWaitlistData();
    loadCampaigns();
    loadPriorityRules();
  }, [daycareId, selectedProgram]);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        daycareId,
        ...(selectedProgram !== 'all' && { programId: selectedProgram })
      });

      const response = await fetch(`/api/waitlist/enhanced?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setWaitlistEntries(data.data);

        // Calculate stats
        const entries = data.data;
        const today = new Date().toDateString();
        const todayJoined = entries.filter((e: WaitlistEntry) =>
          new Date(e.joinedAt).toDateString() === today
        ).length;

        const avgWaitTime = entries.length > 0
          ? Math.round(entries.reduce((sum: number, e: WaitlistEntry) => sum + (e.estimatedWaitDays || 0), 0) / entries.length)
          : 0;

        setDashboardStats(prev => ({
          ...prev,
          totalWaitlist: entries.length,
          activeOffers: entries.filter((e: WaitlistEntry) => e.status === 'OFFERED').length,
          avgWaitTime,
          todayJoined,
          topPriorityBand: entries.length > 0 ? entries[0]?.positionBand || 'None' : 'None'
        }));
      }
    } catch (error) {
      console.error('Failed to load waitlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`/api/waitlist/campaigns?daycareId=${daycareId}`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadPriorityRules = async () => {
    try {
      const response = await fetch(`/api/waitlist/priority-rules?daycareId=${daycareId}`);
      const data = await response.json();
      if (data.success) {
        setPriorityRules(data.data);
      }
    } catch (error) {
      console.error('Failed to load priority rules:', error);
    }
  };

  const filteredEntries = waitlistEntries.filter(entry => {
    const matchesSearch = entry.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.parent.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const createCampaign = async (campaignData: any) => {
    try {
      const response = await fetch('/api/waitlist/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignData,
          daycareId,
          createdBy: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCampaignModal(false);
        loadCampaigns();
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const executeCampaign = async (campaignId: string, dryRun = false) => {
    try {
      const response = await fetch(`/api/waitlist/campaigns/${campaignId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performedBy: currentUser.id,
          dryRun
        })
      });

      const data = await response.json();
      if (data.success) {
        if (dryRun) {
          alert(`Campaign preview: ${data.data.plannedOffers} offers would be sent`);
        } else {
          alert(`Campaign executed: ${data.data.actualOffersSent} offers sent`);
          loadCampaigns();
          loadWaitlistData();
        }
      }
    } catch (error) {
      console.error('Failed to execute campaign:', error);
    }
  };

  const recalculatePositions = async () => {
    try {
      const response = await fetch('/api/waitlist/enhanced/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daycareId,
          programId: selectedProgram !== 'all' ? selectedProgram : undefined,
          performedBy: currentUser.id,
          reason: 'Manual position recalculation'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Positions updated for ${data.data.updatedCount} entries`);
        loadWaitlistData();
      }
    } catch (error) {
      console.error('Failed to recalculate positions:', error);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Waitlist</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalWaitlist}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Offers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeOffers}</p>
            </div>
            <Send className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.avgWaitTime}d</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Joined Today</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.todayJoined}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </button>

          <button
            onClick={recalculatePositions}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:text-green-500 transition-colors"
          >
            <Zap className="h-5 w-5" />
            Recalculate Positions
          </button>

          <button
            onClick={() => setShowRuleModal(true)}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-500 transition-colors"
          >
            <Settings className="h-5 w-5" />
            Manage Rules
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Recent Waitlist Activity</h3>
        <div className="space-y-3">
          {filteredEntries.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  entry.status === 'ACTIVE' ? 'bg-green-500' :
                  entry.status === 'OFFERED' ? 'bg-yellow-500' :
                  entry.status === 'PAUSED' ? 'bg-gray-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium">{entry.childName}</p>
                  <p className="text-sm text-gray-600">Position #{entry.position} • {entry.daysOnWaitlist} days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{entry.positionBand}</p>
                <p className="text-xs text-gray-500">{entry.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWaitlistTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by child or parent name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="OFFERED">Offered</option>
            <option value="PAUSED">Paused</option>
            <option value="ACCEPTED">Accepted</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wait Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">#{entry.position}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        entry.positionBand === 'Top 5' ? 'bg-green-100 text-green-800' :
                        entry.positionBand === '6-10' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.positionBand}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.childName}</div>
                      <div className="text-sm text-gray-500">{entry.childAge} • {entry.careType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.parent.name}</div>
                      <div className="text-sm text-gray-500">{entry.parent.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{entry.priorityScore}</span>
                      <div className="flex gap-1">
                        {entry.hasSiblingEnrolled && <span title="Sibling enrolled"><UserCheck className="h-3 w-3 text-blue-500" /></span>}
                        {entry.isStaffChild && <span title="Staff child"><Star className="h-3 w-3 text-yellow-500" /></span>}
                        {entry.hasSubsidyApproval && <span title="Subsidy approved"><Award className="h-3 w-3 text-green-500" /></span>}
                        {entry.hasSpecialNeeds && <span title="Special needs"><AlertTriangle className="h-3 w-3 text-purple-500" /></span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{entry.daysOnWaitlist} days</div>
                      {entry.estimatedWaitDays && (
                        <div className="text-sm text-gray-500">~{entry.estimatedWaitDays} days left</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      entry.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      entry.status === 'OFFERED' ? 'bg-yellow-100 text-yellow-800' :
                      entry.status === 'PAUSED' ? 'bg-gray-100 text-gray-800' :
                      entry.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Offer Campaigns</h2>
        <button
          onClick={() => setShowCampaignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <p className="text-sm text-gray-600">
                  {campaign.spotsAvailable} spots • Available {new Date(campaign.spotAvailableDate).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                campaign.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {campaign.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{campaign.totalOffered}</p>
                <p className="text-sm text-gray-600">Offered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{campaign.totalAccepted}</p>
                <p className="text-sm text-gray-600">Accepted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{campaign.totalDeclined}</p>
                <p className="text-sm text-gray-600">Declined</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{campaign.stats.responseRate}%</p>
                <p className="text-sm text-gray-600">Response Rate</p>
              </div>
            </div>

            <div className="flex gap-2">
              {campaign.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => executeCampaign(campaign.id, true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => executeCampaign(campaign.id, false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Launch Campaign
                  </button>
                </>
              )}
              {campaign.status === 'ACTIVE' && (
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  Monitor Progress
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPriorityRulesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Priority Rules</h2>
        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Priority Rules</h3>
          <div className="space-y-4">
            {priorityRules
              .filter(rule => rule.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((rule, index) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-blue-600">+{rule.points} points</p>
                      <p className="text-sm text-gray-500">{rule.stats?.affectedEntries || 0} affected</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'waitlist', label: 'Waitlist', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'rules', label: 'Priority Rules', icon: Settings }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
        <p className="text-gray-600">Manage your daycare waitlist, campaigns, and priority rules</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'waitlist' && renderWaitlistTab()}
          {activeTab === 'campaigns' && renderCampaignsTab()}
          {activeTab === 'rules' && renderPriorityRulesTab()}
        </>
      )}
    </div>
  );
};

export default ProviderWaitlistDashboard;