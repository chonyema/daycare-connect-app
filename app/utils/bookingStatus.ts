// Utility functions for booking status display

export function getBookingStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'CANCELLED': 'Cancelled',
    'COMPLETED': 'Offboarded',
    'WAITLIST': 'Waitlist',
    'WAITLIST_CONVERTED': 'Waitlist Converted',
  }

  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export function getBookingStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'PENDING': 'bg-orange-100 text-orange-800',
    'CONFIRMED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'COMPLETED': 'bg-blue-100 text-blue-800',
    'WAITLIST': 'bg-yellow-100 text-yellow-800',
    'WAITLIST_CONVERTED': 'bg-purple-100 text-purple-800',
  }

  return colorMap[status] || 'bg-gray-100 text-gray-800'
}
