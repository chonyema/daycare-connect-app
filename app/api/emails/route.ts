import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../utils/email';
import { getUserFromRequest } from '../../utils/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    let success = false;

    switch (type) {
      case 'booking_confirmation_parent':
        success = await emailService.sendBookingConfirmationToParent(data);
        break;
      
      case 'booking_notification_provider':
        success = await emailService.sendBookingNotificationToProvider(data);
        break;
      
      case 'booking_status_update':
        success = await emailService.sendBookingStatusUpdate(data.email, data.status, data);
        break;
      
      case 'welcome':
        success = await emailService.sendWelcomeEmail(data.email, data.name, data.userType);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({ message: 'Email sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}