import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface BookingEmailData {
  parentName: string;
  childName: string;
  daycareName: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalCost: number;
  providerEmail?: string;
  parentEmail?: string;
}

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"Daycare Connect" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendBookingConfirmationToParent(data: BookingEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmation</h2>
        
        <p>Dear ${data.parentName},</p>
        
        <p>Your daycare booking has been confirmed! Here are the details:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Booking Details</h3>
          <p><strong>Daycare:</strong> ${data.daycareName}</p>
          <p><strong>Child:</strong> ${data.childName}</p>
          <p><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
          <p><strong>Daily Rate:</strong> $${data.dailyRate}</p>
          <p><strong>Total Cost:</strong> $${data.totalCost}</p>
        </div>
        
        <p>If you have any questions, please contact the daycare provider directly.</p>
        
        <p>Thank you for choosing Daycare Connect!</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated email from Daycare Connect. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: data.parentEmail || '',
      subject: `Booking Confirmed - ${data.daycareName}`,
      html,
      text: `Booking confirmed for ${data.childName} at ${data.daycareName} from ${data.startDate} to ${data.endDate}. Total cost: $${data.totalCost}`,
    });
  }

  async sendBookingNotificationToProvider(data: BookingEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">New Booking Request</h2>
        
        <p>You have received a new booking request for your daycare!</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">Booking Details</h3>
          <p><strong>Parent:</strong> ${data.parentName}</p>
          <p><strong>Child:</strong> ${data.childName}</p>
          <p><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
          <p><strong>Daily Rate:</strong> $${data.dailyRate}</p>
          <p><strong>Total Cost:</strong> $${data.totalCost}</p>
        </div>
        
        <p>Please log into your provider dashboard to review and respond to this booking request.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/provider" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated email from Daycare Connect. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: data.providerEmail || '',
      subject: `New Booking Request - ${data.childName}`,
      html,
      text: `New booking request from ${data.parentName} for ${data.childName} from ${data.startDate} to ${data.endDate}. Total: $${data.totalCost}`,
    });
  }

  async sendBookingStatusUpdate(
    email: string, 
    status: string, 
    data: BookingEmailData
  ): Promise<boolean> {
    const statusColors = {
      confirmed: '#059669',
      cancelled: '#dc2626',
      pending: '#d97706',
    };

    const statusMessages = {
      confirmed: 'Your booking has been confirmed!',
      cancelled: 'Your booking has been cancelled.',
      pending: 'Your booking is pending review.',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColors[status as keyof typeof statusColors] || '#6b7280'};">
          Booking Status Update
        </h2>
        
        <p>Dear ${data.parentName},</p>
        
        <p>${statusMessages[status as keyof typeof statusMessages] || 'Your booking status has been updated.'}</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Booking Details</h3>
          <p><strong>Status:</strong> <span style="color: ${statusColors[status as keyof typeof statusColors] || '#6b7280'}; text-transform: uppercase; font-weight: bold;">${status}</span></p>
          <p><strong>Daycare:</strong> ${data.daycareName}</p>
          <p><strong>Child:</strong> ${data.childName}</p>
          <p><strong>Dates:</strong> ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}</p>
        </div>
        
        <p>Thank you for using Daycare Connect!</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated email from Daycare Connect. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${data.daycareName}`,
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string, userType: string): Promise<boolean> {
    const isProvider = userType === 'PROVIDER';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Daycare Connect!</h2>
        
        <p>Dear ${name},</p>
        
        <p>Welcome to Daycare Connect! We're excited to have you join our community.</p>
        
        ${isProvider ? `
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Get Started as a Provider</h3>
            <ul style="color: #1f2937;">
              <li>Set up your daycare profile</li>
              <li>Add photos and detailed descriptions</li>
              <li>Set your availability and rates</li>
              <li>Start receiving booking requests</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/provider" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Setup Your Profile
            </a>
          </div>
        ` : `
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Get Started as a Parent</h3>
            <ul style="color: #1f2937;">
              <li>Browse available daycares in your area</li>
              <li>Read reviews and compare options</li>
              <li>Book childcare with confidence</li>
              <li>Manage all your bookings in one place</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Find Daycares
            </a>
          </div>
        `}
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        
        <p>Happy connecting!</p>
        <p>The Daycare Connect Team</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated email from Daycare Connect. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Daycare Connect!',
      html,
    });
  }
}

export const emailService = new EmailService();

// Export a standalone sendEmail function for direct use
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return emailService['sendEmail'](options);
}