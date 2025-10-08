'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Phone,
  Mail,
  MapPin,
  Filter,
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { getBookingStatusLabel, getBookingStatusColor } from '@/app/utils/bookingStatus';

interface Booking {
  id: string;
  childName: string;
  childAge: string;
  startDate: string;
  endDate?: string;
  careType: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'WAITLIST';
  dailyRate: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
  parent: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  daycare: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

interface BookingData {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statusSummary: {
    ALL: number;
    PENDING: number;
    CONFIRMED: number;
    CANCELLED: number;
    COMPLETED: number;
    WAITLIST: number;
  };
}

const BookingManagement = () => {
  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [daycareFilter, setDaycareFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Daycares for filtering
  const [daycares, setDaycares] = useState<Array<{id: string, name: string}>>([]);
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchDaycares();
  }, [statusFilter, daycareFilter, currentPage]);

  const fetchDaycares = async () => {
    try {
      const response = await fetch('/api/provider/daycares');
      if (response.ok) {
        const daycaresData = await response.json();
        setDaycares(daycaresData);
      }
    } catch (error) {
      console.error('Failed to fetch daycares:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      
      if (daycareFilter !== 'ALL') {
        params.append('daycareId', daycareFilter);
      }

      const response = await fetch(`/api/provider/bookings?${params}`);
      if (response.ok) {
        const bookingData = await response.json();
        setData(bookingData);
      } else {
        console.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Booking fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string, notes?: string) => {
    setUpdating(bookingId);
    try {
      const response = await fetch('/api/provider/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus, notes }),
      });

      if (response.ok) {
        await fetchBookings(); // Refresh the data
      } else {
        const errorData = await response.json();
        if (errorData.suggestWaitlist) {
          // Show capacity error and suggest waitlist
          if (confirm(`${errorData.error}\n\nWould you like to move this booking to the waitlist instead?`)) {
            // Retry with WAITLIST status
            await updateBookingStatus(bookingId, 'WAITLIST', notes);
            return;
          }
        } else {
          alert(errorData.error || 'Failed to update booking status');
        }
        console.error('Failed to update booking status:', errorData);
      }
    } catch (error) {
      console.error('Booking update error:', error);
      alert('An error occurred while updating the booking status');
    } finally {
      setUpdating(null);
    }
  };


  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: <AlertCircle className="h-4 w-4" />,
      CONFIRMED: <CheckCircle className="h-4 w-4" />,
      CANCELLED: <XCircle className="h-4 w-4" />,
      COMPLETED: <CheckCircle className="h-4 w-4" />,
      WAITLIST: <Clock className="h-4 w-4" />,
    };
    return icons[status as keyof typeof icons] || <AlertCircle className="h-4 w-4" />;
  };

  const filteredBookings = data?.bookings.filter(booking =>
    booking.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.parent.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Manage all your daycare bookings</p>
        </div>
        
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Status Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(data.statusSummary).map(([status, count]) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`p-4 rounded-lg border text-center transition-colors ${
                statusFilter === status
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">{status === 'ALL' ? 'Total' : getBookingStatusLabel(status)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={daycareFilter}
            onChange={(e) => {
              setDaycareFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
          >
            <option value="ALL">All Daycares</option>
            {daycares.map((daycare) => (
              <option key={daycare.id} value={daycare.id}>
                {daycare.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          {statusFilter === 'WAITLIST' ? (
            <div className="text-gray-600 space-y-2">
              <p>Waitlist entries are managed in the separate Waitlist Management tab.</p>
              <p className="text-sm text-blue-600">
                Please use the "Waitlist Management" tab to view and manage waitlist entries.
              </p>
            </div>
          ) : (
            <p className="text-gray-600">No bookings match your current filters.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Child & Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daycare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.childName} ({booking.childAge})
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.parent.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {booking.parent.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.daycare.name}</div>
                      <div className="text-sm text-gray-500">{booking.daycare.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(booking.startDate), 'MMM dd, yyyy')}
                      </div>
                      {booking.endDate && (
                        <div className="text-sm text-gray-500">
                          to {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">{booking.careType.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {getBookingStatusLabel(booking.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${booking.totalCost}</div>
                      <div className="text-xs text-gray-500">${booking.dailyRate}/day</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetails(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                              disabled={updating === booking.id}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Confirm"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                              disabled={updating === booking.id}
                              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                            disabled={updating === booking.id}
                            className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            title="Mark as Offboarded"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {data.pagination.page} of {data.pagination.totalPages}
                  ({data.pagination.totalCount} total bookings)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!data.pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!data.pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Child Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Child Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span> <span className="text-gray-900">{selectedBooking.childName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Age:</span> <span className="text-gray-900">{selectedBooking.childAge}</span>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Parent Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{selectedBooking.parent.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{selectedBooking.parent.email}</span>
                  </div>
                  {selectedBooking.parent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{selectedBooking.parent.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{selectedBooking.daycare.name} - {selectedBooking.daycare.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {format(new Date(selectedBooking.startDate), 'MMM dd, yyyy')}
                    {selectedBooking.endDate && ` - ${format(new Date(selectedBooking.endDate), 'MMM dd, yyyy')}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{selectedBooking.careType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(selectedBooking.status)}`}>
                      {getStatusIcon(selectedBooking.status)}
                      {getBookingStatusLabel(selectedBooking.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Daily Rate:</span> <span className="text-gray-900">${selectedBooking.dailyRate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost:</span> <span className="font-semibold text-gray-900">${selectedBooking.totalCost}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedBooking.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        updateBookingStatus(selectedBooking.id, 'CONFIRMED');
                        setShowDetails(false);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => {
                        updateBookingStatus(selectedBooking.id, 'CANCELLED');
                        setShowDetails(false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                
                {selectedBooking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'COMPLETED');
                      setShowDetails(false);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Mark as Offboarded
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;