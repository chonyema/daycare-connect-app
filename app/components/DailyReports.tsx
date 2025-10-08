'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  Utensils,
  Bed,
  Activity,
  Baby,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Download,
  Filter,
  Search,
  X
} from 'lucide-react';
import DailyReportForm from './DailyReportForm';
import { format, formatDistanceToNow, startOfWeek, endOfWeek, isToday } from 'date-fns';

interface DailyReportsProps {
  userType: 'PARENT' | 'PROVIDER';
  currentUser: {
    id: string;
    name: string;
    userType: string;
  };
}

const DailyReports: React.FC<DailyReportsProps> = ({ userType, currentUser }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('this-week');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailReport, setDetailReport] = useState<any>(null);

  const activityIcons = {
    MEAL: { icon: Utensils, color: 'text-green-600', bg: 'bg-green-100' },
    NAP: { icon: Bed, color: 'text-blue-600', bg: 'bg-blue-100' },
    ACTIVITY: { icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    DIAPER_CHANGE: { icon: Baby, color: 'text-orange-600', bg: 'bg-orange-100' },
    MILESTONE: { icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    INCIDENT: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    PHOTO: { icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
    OTHER: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' }
  };

  useEffect(() => {
    fetchReports();
    if (userType === 'PROVIDER') {
      fetchBookings();
    }
  }, [dateFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      let startDate, endDate;
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.toDateString());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'this-week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/daily-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch daily reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/provider/bookings');
      if (response.ok) {
        const data = await response.json();
        // The API returns { bookings: [...], pagination: {...}, statusSummary: {...} }
        const bookingsArray = data.bookings || [];
        const filteredBookings = bookingsArray.filter((booking: any) =>
          booking.status === 'CONFIRMED' || booking.status === 'PENDING'
        );
        setBookings(filteredBookings);
      } else {
        console.error('Failed to fetch bookings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleSaveReport = async (reportData: any) => {
    try {
      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        await fetchReports();
        setShowReportForm(false);
        setSelectedBooking(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/daily-reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchReports();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const getActivityIcon = (activityType: string) => {
    const config = activityIcons[activityType as keyof typeof activityIcons] || activityIcons.OTHER;
    const IconComponent = config.icon;
    return (
      <div className={`p-2 rounded-full ${config.bg}`}>
        <IconComponent className={`h-4 w-4 ${config.color}`} />
      </div>
    );
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      'Happy': '😊',
      'Content': '😌',
      'Playful': '🤪',
      'Sleepy': '😴',
      'Fussy': '😤',
      'Cranky': '😠',
      'Sad': '😢'
    };
    return moodEmojis[mood] || '😐';
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    return (
      report.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.daycare.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.overallMood && report.overallMood.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const groupedReports = filteredReports.reduce((groups, report) => {
    const date = format(new Date(report.reportDate), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(report);
    return groups;
  }, {} as { [key: string]: any[] });

  const sortedDates = Object.keys(groupedReports).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Reports</h2>
          <p className="text-gray-600">
            {userType === 'PROVIDER'
              ? 'Create and manage daily reports for children'
              : 'View daily reports for your children'
            }
          </p>
        </div>

        {userType === 'PROVIDER' && (
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Report
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600 mb-6">
            {userType === 'PROVIDER'
              ? 'Start creating daily reports to keep parents informed about their children.'
              : 'Daily reports will appear here when providers create them for your children.'
            }
          </p>
          {userType === 'PROVIDER' && (
            <button
              onClick={() => setShowReportForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create First Report
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isToday(new Date(date)) ? 'Today' : format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedReports[date].map((report: any) => (
                  <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    {/* Report Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{report.childName}</h4>
                        <p className="text-sm text-gray-600">{report.daycare.name}</p>
                      </div>
                      {userType === 'PROVIDER' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setSelectedBooking(report.booking);
                              setShowReportForm(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit report"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Overall Mood */}
                    {report.overallMood && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{getMoodEmoji(report.overallMood)}</span>
                        <span className="text-sm font-medium text-gray-700">{report.overallMood}</span>
                      </div>
                    )}

                    {/* Activities Summary */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">
                        Activities ({report.activities.length})
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {report.activities.slice(0, 6).map((activity: any, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            {getActivityIcon(activity.activityType)}
                          </div>
                        ))}
                        {report.activities.length > 6 && (
                          <div className="p-2 rounded-full bg-gray-100 text-xs text-gray-600">
                            +{report.activities.length - 6}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* General Notes Preview */}
                    {report.generalNotes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {report.generalNotes}
                        </p>
                      </div>
                    )}

                    {/* Report Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {userType === 'PARENT' && (
                        <div className="flex items-center gap-1">
                          {!report.parentViewed && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              New
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        setDetailReport(report);
                        setShowDetailModal(true);
                      }}
                      className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Selection Modal for New Reports */}
      {showReportForm && userType === 'PROVIDER' && !selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Child</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="font-semibold text-gray-900">{booking.childName}</div>
                      <div className="text-sm text-gray-600">{booking.daycare.name}</div>
                      <div className="text-xs text-gray-500">Age: {booking.childAge}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">No children available</div>
                    <div className="text-xs text-gray-400">
                      You need confirmed or pending bookings to create daily reports
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setSelectedBooking(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Report Form */}
      {showReportForm && selectedBooking && (
        <DailyReportForm
          isOpen={showReportForm}
          onClose={() => {
            setShowReportForm(false);
            setSelectedBooking(null);
            setSelectedReport(null);
          }}
          onSave={handleSaveReport}
          booking={selectedBooking}
          existingReport={selectedReport}
        />
      )}

      {/* Report Detail Modal */}
      {showDetailModal && detailReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Daily Report Details</h2>
                <p className="text-gray-600">{detailReport.childName} - {format(new Date(detailReport.reportDate), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailReport(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Header Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Child Information</h3>
                    <p className="text-gray-600">{detailReport.childName}</p>
                    <p className="text-sm text-gray-500">Age: {detailReport.childAge}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Daycare</h3>
                    <p className="text-gray-600">{detailReport.daycare.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Provider</h3>
                    <p className="text-gray-600">{detailReport.provider.name}</p>
                  </div>
                </div>
              </div>

              {/* Overall Mood */}
              {detailReport.overallMood && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Overall Mood</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getMoodEmoji(detailReport.overallMood)}</span>
                    <span className="text-xl font-medium text-gray-700">{detailReport.overallMood}</span>
                  </div>
                </div>
              )}

              {/* General Notes */}
              {detailReport.generalNotes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">General Notes</h3>
                  <p className="text-gray-700">{detailReport.generalNotes}</p>
                </div>
              )}

              {/* Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities ({detailReport.activities.length})</h3>
                <div className="space-y-4">
                  {detailReport.activities.map((activity: any, index: number) => (
                    <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        {getActivityIcon(activity.activityType)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                            <span className="text-xs text-gray-500">
                              {format(new Date(activity.startTime), 'h:mm a')}
                              {activity.endTime && ` - ${format(new Date(activity.endTime), 'h:mm a')}`}
                            </span>
                          </div>

                          {activity.description && (
                            <p className="text-gray-600 mb-2">{activity.description}</p>
                          )}

                          {/* Meal specific details */}
                {activity.activityType === 'MEAL' && (
                            <div className="bg-green-50 p-3 rounded text-sm text-gray-700">
                              {activity.mealType && <p><strong>Meal Type:</strong> {activity.mealType}</p>}
                              {activity.foodItems && (
                                <p><strong>Food Items:</strong> {JSON.parse(activity.foodItems).join(', ')}</p>
                              )}
                              {activity.amountEaten && <p><strong>Amount Eaten:</strong> {activity.amountEaten}</p>}
                            </div>
                          )}

                          {/* Nap specific details */}
                          {activity.activityType === 'NAP' && activity.napQuality && (
                            <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
                              <p><strong>Nap Quality:</strong> {activity.napQuality}</p>
                              {activity.duration && <p><strong>Duration:</strong> {activity.duration} minutes</p>}
                            </div>
                          )}

                          {/* Photos */}
                          {activity.photos && JSON.parse(activity.photos).length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Photos:</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {JSON.parse(activity.photos).map((photo: string, photoIndex: number) => (
                                  <img
                                    key={photoIndex}
                                    src={photo}
                                    alt={`Activity photo ${photoIndex + 1}`}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {activity.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Notes:</strong> {activity.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Report created: {format(new Date(detailReport.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  {detailReport.updatedAt && detailReport.updatedAt !== detailReport.createdAt && (
                    <span>Last updated: {format(new Date(detailReport.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  )}
                </div>
                {userType === 'PARENT' && detailReport.parentViewedAt && (
                  <div className="mt-1">
                    <span>First viewed: {format(new Date(detailReport.parentViewedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReports;