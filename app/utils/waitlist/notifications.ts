/**
 * Waitlist Offer Notification System
 * Handles email, SMS, and push notifications for waitlist offers
 */

import { sendEmail } from '../email';
import { WaitlistOffer, WaitlistEntry, User, Daycare } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

interface OfferNotificationData {
  offer: WaitlistOffer & {
    waitlistEntry: WaitlistEntry & {
      parent: User;
      daycare: Daycare;
    };
  };
}

/**
 * Send offer notification to parent
 */
export async function sendOfferNotification(data: OfferNotificationData) {
  const { offer } = data;
  const { parent, daycare } = offer.waitlistEntry;

  // Format offer expiration time
  const expiresAt = new Date(offer.offerExpiresAt);
  const hoursRemaining = Math.floor(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
  );

  // Email notification
  await sendOfferEmail(data);

  // TODO: SMS notification (if enabled and phone number available)
  // if (settings.sendSMSNotifications && parent.phone) {
  //   await sendOfferSMS(data);
  // }

  // TODO: Push notification (if enabled)
  // if (settings.sendPushNotifications) {
  //   await sendOfferPushNotification(data);
  // }
}

/**
 * Send offer email
 */
async function sendOfferEmail(data: OfferNotificationData) {
  const { offer } = data;
  const { parent, daycare, childName } = offer.waitlistEntry;

  const expiresAt = new Date(offer.offerExpiresAt);
  const hoursRemaining = Math.floor(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
  );

  const subject = `🎉 Spot Available for ${childName} at ${daycare.name}!`;

  const requiredDocs = offer.requiredDocuments
    ? JSON.parse(offer.requiredDocuments)
    : [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button.secondary { background: #6b7280; }
        .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .countdown { font-size: 24px; color: #dc2626; font-weight: bold; }
        ul { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎉 Great News!</h1>
          <p style="margin: 5px 0 0 0;">A spot is available for ${childName}</p>
        </div>

        <div class="content">
          <div class="highlight">
            <p style="margin: 0; font-size: 18px;">
              <strong>You have the first right of refusal!</strong>
            </p>
            <p class="countdown">${hoursRemaining} hours remaining</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">
              Offer expires: ${expiresAt.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">Spot Details</h3>
            <p><strong>Daycare:</strong> ${daycare.name}</p>
            <p><strong>Child:</strong> ${childName}</p>
            <p><strong>Start Date:</strong> ${new Date(
              offer.spotAvailableDate
            ).toLocaleDateString()}</p>
            ${
              offer.depositRequired
                ? `<p><strong>Deposit Required:</strong> $${offer.depositAmount?.toFixed(2)}</p>`
                : ''
            }
          </div>

          ${
            requiredDocs.length > 0
              ? `
          <div class="info-box">
            <h3 style="margin-top: 0;">Required Documents</h3>
            <ul>
              ${requiredDocs.map((doc: string) => `<li>${doc}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/waitlist/offers/${offer.id}/accept"
               class="button">
              ✅ Accept Offer
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/waitlist/offers/${offer.id}/decline"
               class="button secondary">
              ❌ Decline Offer
            </a>
          </div>

          <div class="info-box" style="margin-top: 30px; background: #fef3c7;">
            <p style="margin: 0;"><strong>⏰ Important:</strong> This spot is reserved exclusively for you until the offer expires. If you don't respond, the offer will automatically expire and move to the next family on the waitlist.</p>
          </div>

          <div class="footer">
            <p>Questions? Contact ${daycare.name} at ${daycare.phone || daycare.email}</p>
            <p style="font-size: 12px; color: #9ca3af;">
              This is an automated message from DaycareConnect.
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: parent.email,
    subject,
    html,
  });
}

/**
 * Send offer acceptance confirmation
 */
export async function sendOfferAcceptanceConfirmation(
  data: OfferNotificationData
) {
  const { offer } = data;
  const { parent, daycare, childName } = offer.waitlistEntry;

  const subject = `✅ Spot Confirmed for ${childName} at ${daycare.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Congratulations!</h1>
          <p style="margin: 5px 0 0 0;">Your spot is confirmed</p>
        </div>

        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #059669;">Spot Reserved Successfully!</h2>
            <p>We're excited to welcome ${childName} to ${daycare.name}!</p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">Next Steps</h3>
            <ol>
              ${
                offer.depositRequired && !offer.depositPaid
                  ? `<li>Complete deposit payment of $${offer.depositAmount?.toFixed(2)}</li>`
                  : ''
              }
              <li>Submit required documents</li>
              <li>Complete enrollment paperwork</li>
              <li>Attend orientation (if applicable)</li>
            </ol>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">Enrollment Details</h3>
            <p><strong>Start Date:</strong> ${new Date(
              offer.spotAvailableDate
            ).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${daycare.address}</p>
            <p><strong>Contact:</strong> ${daycare.phone || daycare.email}</p>
          </div>

          <div class="footer">
            <p>The daycare will contact you shortly with onboarding details.</p>
            <p style="font-size: 12px; color: #9ca3af;">
              DaycareConnect - Connecting Families with Quality Childcare
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: parent.email,
    subject,
    html,
  });

  // Also notify the provider
  const owner = await prisma.user.findUnique({
    where: { id: daycare.ownerId },
  });

  if (owner) {
    const providerHtml = `
      <h2>Waitlist Offer Accepted</h2>
      <p><strong>${parent.name}</strong> has accepted the spot offer for <strong>${childName}</strong>.</p>
      <p><strong>Start Date:</strong> ${new Date(offer.spotAvailableDate).toLocaleDateString()}</p>
      ${offer.depositRequired ? `<p><strong>Deposit Status:</strong> ${offer.depositPaid ? 'Paid' : 'Pending'}</p>` : ''}
      <p>Please proceed with onboarding for this family.</p>
    `;

    await sendEmail({
      to: owner.email,
      subject: `Waitlist Offer Accepted - ${childName}`,
      html: providerHtml,
    });
  }
}

/**
 * Send position update notification
 */
export async function sendPositionUpdateNotification(
  entry: WaitlistEntry & { parent: User; daycare: Daycare },
  oldPosition: number,
  newPosition: number
) {
  const positionChange = oldPosition - newPosition;
  if (positionChange <= 0) return; // Only notify on improvement

  const subject = `📈 You Moved Up on the Waitlist at ${entry.daycare.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .position { font-size: 48px; color: #2563eb; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📈 Great News!</h1>
          <p style="margin: 5px 0 0 0;">Your waitlist position improved</p>
        </div>

        <div class="content">
          <div class="highlight">
            <p style="margin: 0;">You moved up <strong>${positionChange} spot${positionChange > 1 ? 's' : ''}</strong>!</p>
            <p class="position">#${newPosition}</p>
            <p style="margin: 0; color: #6b7280;">Your current position</p>
          </div>

          <p>Hi ${entry.parent.name},</p>
          <p>Your waitlist position for <strong>${entry.childName}</strong> at <strong>${entry.daycare.name}</strong> has moved up from position #${oldPosition} to #${newPosition}.</p>

          ${
            newPosition <= 3
              ? `<p style="background: #fef3c7; padding: 15px; border-radius: 6px;"><strong>You're near the top!</strong> You could receive an offer soon. Make sure your contact information is up to date.</p>`
              : ''
          }

          <p>We'll notify you as soon as a spot becomes available.</p>

          <p style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            DaycareConnect - Connecting Families with Quality Childcare
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: entry.parent.email,
    subject,
    html,
  });
}

/**
 * Send offer expiration reminder (24 hours before expiry)
 */
export async function sendOfferExpirationReminder(
  data: OfferNotificationData
) {
  const { offer } = data;
  const { parent, daycare, childName } = offer.waitlistEntry;

  const hoursRemaining = Math.floor(
    (new Date(offer.offerExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
  );

  const subject = `⏰ Reminder: Offer Expires in ${hoursRemaining} Hours - ${daycare.name}`;

  const html = `
    <h2>⏰ Offer Expiring Soon</h2>
    <p>Hi ${parent.name},</p>
    <p>This is a friendly reminder that your spot offer for <strong>${childName}</strong> at <strong>${daycare.name}</strong> will expire in <strong>${hoursRemaining} hours</strong>.</p>
    <p><strong>Expiration Time:</strong> ${new Date(offer.offerExpiresAt).toLocaleString()}</p>
    <p>Please respond soon to secure your spot!</p>
    <p style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/waitlist/offers/${offer.id}"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
        Respond Now
      </a>
    </p>
  `;

  await sendEmail({
    to: parent.email,
    subject,
    html,
  });
}
