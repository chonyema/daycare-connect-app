// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { BookingStatus } from '@prisma/client';
import { emailService } from '../../../utils/email';

// GET - Get specific booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, email: true, phone: true }
        },
        daycare: {
          select: { 
            id: true, 
            name: true, 
            address: true, 
            city: true,
            phone: true, 
            email: true,
            dailyRate: true
          }
        }
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      booking
    });

  } catch (error: any) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    // Check if booking exists
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, email: true } },
        daycare: { select: { id: true, name: true } }
      }
    });
    
    if (!currentBooking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Validate updates
    if (updates.status && !Object.values(BookingStatus).includes(updates.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.childName) updateData.childName = updates.childName;
    if (updates.childAge) updateData.childAge = updates.childAge;
    if (updates.startDate) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate) updateData.endDate = new Date(updates.endDate);
    if (updates.careType) updateData.careType = updates.careType;
    if (updates.dailyRate) updateData.dailyRate = updates.dailyRate;
    if (updates.totalCost) updateData.totalCost = updates.totalCost;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.specialNeeds) updateData.specialNeeds = updates.specialNeeds;
    
    // If cancelling, handle availability restoration logic here
    if (updates.status === BookingStatus.CANCELLED && currentBooking.status !== BookingStatus.CANCELLED) {
      console.log(`Restoring availability for daycare ${currentBooking.daycareId}`);
      // TODO: Implement daycare availability update
    }
    
    // Update booking in database
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true, email: true, phone: true }
        },
        daycare: {
          select: { 
            id: true, 
            name: true, 
            address: true, 
            city: true,
            phone: true, 
            email: true,
            dailyRate: true
          }
        }
      }
    });
    
    // Send notification email for status changes
    if (updates.status && updates.status !== currentBooking.status) {
      await sendStatusUpdateEmail(updatedBooking);
    }
    
    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Booking updated successfully"
    });

  } catch (error: any) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the booking first
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, email: true } },
        daycare: { select: { id: true, name: true } }
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Check if booking can be cancelled
    const startDate = new Date(booking.startDate);
    const today = new Date();
    const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDifference < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot cancel booking less than 2 days before start date" 
        },
        { status: 400 }
      );
    }
    
    // Mark as cancelled instead of deleting
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        notes: booking.notes ? `${booking.notes}\n\nCancelled on ${new Date().toISOString()} - User requested cancellation` : `Cancelled on ${new Date().toISOString()} - User requested cancellation`
      },
      include: {
        parent: {
          select: { id: true, name: true, email: true, phone: true }
        },
        daycare: {
          select: { 
            id: true, 
            name: true, 
            address: true, 
            city: true,
            phone: true, 
            email: true,
            dailyRate: true
          }
        }
      }
    });
    
    // Restore daycare availability
    console.log(`Restoring availability for daycare ${booking.daycareId}`);
    // TODO: Implement daycare availability update
    
    // Send cancellation confirmation
    await sendCancellationEmail(cancelledBooking);
    
    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: cancelledBooking
    });

  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

// Helper function to send status update email
async function sendStatusUpdateEmail(booking: any) {
  try {
    console.log(`Sending status update email for booking ${booking.id}`);
    
    const emailData = {
      parentName: booking.parent.name,
      childName: booking.childName,
      daycareName: booking.daycare.name,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      dailyRate: booking.dailyRate,
      totalCost: booking.totalCost,
    };

    await emailService.sendBookingStatusUpdate(
      booking.parent.email,
      booking.status.toLowerCase(),
      emailData
    );
    
    console.log(`Status update email sent successfully for booking ${booking.id}`);
  } catch (error: any) {
    console.error(`Failed to send status update email for booking ${booking.id}:`, error);
  }
}

// Helper function to send cancellation email
async function sendCancellationEmail(booking: any) {
  try {
    console.log(`Sending cancellation email for booking ${booking.id}`);
    
    const emailData = {
      parentName: booking.parent.name,
      childName: booking.childName,
      daycareName: booking.daycare.name,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      dailyRate: booking.dailyRate,
      totalCost: booking.totalCost,
    };

    await emailService.sendBookingStatusUpdate(
      booking.parent.email,
      'cancelled',
      emailData
    );
    
    console.log(`Cancellation email sent successfully for booking ${booking.id}`);
  } catch (error: any) {
    console.error(`Failed to send cancellation email for booking ${booking.id}:`, error);
  }
} 
