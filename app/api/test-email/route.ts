import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    // Send a test email
    const success = await emailService.sendWelcomeEmail(email, 'Test User', 'PARENT');

    if (success) {
      return NextResponse.json({
        message: 'Test email sent successfully!',
        details: `Welcome email sent to ${email}`
      });
    } else {
      return NextResponse.json({
        error: 'Failed to send test email. Check your SMTP configuration.'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error.message
    }, { status: 500 });
  }
}