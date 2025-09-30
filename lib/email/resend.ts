import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
	to: string[];
	subject: string;
	html: string;
	from?: string;
}

export interface FeedbackEmailData {
	eventTitle: string;
	eventId: string;
	attendeeName: string;
	attendeeEmail: string;
	eventDate: string;
	feedbackUrl: string;
	organizerName: string;
}

export interface CertificateEmailData {
	eventTitle: string;
	eventId: string;
	participantName: string;
	participantEmail: string;
	participantRole: string;
	eventDate: string;
	certificateUrl: string;
	galleryUrl?: string;
	organizerName: string;
}

export interface ThankYouEmailData {
	eventTitle: string;
	eventId: string;
	participantName: string;
	participantEmail: string;
	participantRole: string;
	eventDate: string;
	galleryUrl?: string;
	certificateUrl?: string;
	organizerName: string;
	eventHighlights?: string[];
}

export interface TicketConfirmationEmailData {
	eventTitle: string;
	eventId: string;
	attendeeName: string;
	attendeeEmail: string;
	eventDate: string;
	eventTime: string;
	eventLocation: string;
	totalTickets: number;
	tickets: Array<{
		ticketId: string;
		entryCode: string;
	}>;
}

/**
 * Send a generic email using Resend
 */
export async function sendEmail(emailData: EmailData) {
	try {
		const { data, error } = await resend.emails.send({
			from: emailData.from || 'Eventtts Platform <noreply@resend.dev>',
			to: emailData.to,
			subject: emailData.subject,
			html: emailData.html,
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error(`Email sending failed: ${error.message}`);
		}

		return { success: true, data };
	} catch (error) {
		console.error('Email sending error:', error);
		throw error;
	}
}

/**
 * Send email with attachment using Resend
 */
export async function sendEmailWithAttachment(
	emailData: EmailData & {
		attachments?: {
			filename: string;
			content: string | Buffer;
			contentType?: string;
		}[];
	}
) {
	try {
		const { data, error } = await resend.emails.send({
			from: emailData.from || 'Eventtts Platform <noreply@resend.dev>',
			to: emailData.to,
			subject: emailData.subject,
			html: emailData.html,
			attachments: emailData.attachments,
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error(`Email sending failed: ${error.message}`);
		}

		return { success: true, data };
	} catch (error) {
		console.error('Email sending error:', error);
		throw error;
	}
}

/**
 * Generate HTML template for feedback email
 */
export function generateFeedbackEmailTemplate(data: FeedbackEmailData): string {
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Share Your Feedback</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #e11d48;
          margin-bottom: 10px;
        }
        .event-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .event-date {
          color: #6b7280;
          font-size: 14px;
        }
        .content {
          margin: 30px 0;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .message {
          margin-bottom: 25px;
          line-height: 1.7;
        }
        .cta-button {
          display: inline-block;
          background-color: #e11d48;
          color: white;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: background-color 0.3s ease;
        }
        .cta-button:hover {
          background-color: #be185d;
        }
        .time-estimate {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }
        .organizer {
          margin-top: 20px;
          font-size: 14px;
          color: #6b7280;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .container {
            padding: 20px;
          }
          .cta-button {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Event Platform</div>
          <div class="event-title">${data.eventTitle}</div>
          <div class="event-date">${data.eventDate}</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.attendeeName},</div>
          
          <div class="message">
            Thank you for attending <strong>${data.eventTitle}</strong>! We hope you had a great experience.
          </div>
          
          <div class="message">
            Your feedback is incredibly valuable to us and helps us improve future events. We'd love to hear about your experience and any suggestions you might have.
          </div>
          
          <div class="time-estimate">
            ⏱️ This should take less than 3 minutes to complete
          </div>
          
          <div style="text-align: center;">
            <a href="${data.feedbackUrl}" class="cta-button">
              Share Your Feedback
            </a>
          </div>
          
          <div class="message">
            Your responses will help us create even better events in the future. Thank you for taking the time to share your thoughts!
          </div>
          
          <div class="organizer">
            Best regards,<br>
            ${data.organizerName}<br>
            Event Organizer
          </div>
        </div>
        
        <div class="footer">
          <p>This email was sent because you attended ${data.eventTitle}.</p>
          <p>If you have any questions, please contact the event organizer.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send feedback request email to an attendee
 */
export async function sendFeedbackEmail(data: FeedbackEmailData) {
	const emailHtml = generateFeedbackEmailTemplate(data);

	const emailData: EmailData = {
		to: [data.attendeeEmail],
		subject: `Share your feedback: ${data.eventTitle}`,
		html: emailHtml,
		from: 'Eventtts Platform <noreply@resend.dev>',
	};

	return await sendEmail(emailData);
}

/**
 * Send bulk feedback emails to multiple attendees
 */
export async function sendBulkFeedbackEmails(attendees: FeedbackEmailData[]) {
	const results = [];

	for (const attendee of attendees) {
		try {
			const result = await sendFeedbackEmail(attendee);
			results.push({
				email: attendee.attendeeEmail,
				success: true,
				data: result.data,
			});

			// Add small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			console.error(
				`Failed to send email to ${attendee.attendeeEmail}:`,
				error
			);
			results.push({
				email: attendee.attendeeEmail,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	return results;
}

/**
 * Generate HTML template for certificate email
 */
export function generateCertificateEmailTemplate(
	data: CertificateEmailData
): string {
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Certificate is Ready!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .certificate-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .title {
          color: #2563eb;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .content {
          margin-bottom: 30px;
        }
        .event-details {
          background-color: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .download-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .gallery-link {
          display: inline-block;
          background-color: #059669;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
        .organizer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="certificate-icon">🏆</div>
          <h1 class="title">Your Certificate is Ready!</h1>
          <p class="subtitle">Congratulations on your participation in ${
						data.eventTitle
					}</p>
        </div>

        <div class="content">
          <p>Dear ${data.participantName},</p>

          <p>Thank you for your valuable participation as a <strong>${
						data.participantRole
					}</strong> in our event. We're pleased to present you with your certificate of participation.</p>

          <div class="event-details">
            <h3>Event Details:</h3>
            <p><strong>Event:</strong> ${data.eventTitle}</p>
            <p><strong>Date:</strong> ${data.eventDate}</p>
            <p><strong>Your Role:</strong> ${data.participantRole}</p>
          </div>

          <div style="text-align: center;">
            <a href="${
							data.certificateUrl
						}" class="download-button">Download Your Certificate</a>
          </div>

          ${
						data.galleryUrl
							? `
          <p>Don't forget to check out the event photo gallery to relive the memorable moments:</p>
          <div style="text-align: center;">
            <a href="${data.galleryUrl}" class="gallery-link">View Photo Gallery</a>
          </div>
          `
							: ''
					}

          <p>Your certificate serves as recognition of your contribution to making this event successful. You can download, print, or share it as needed.</p>
        </div>

        <div class="organizer">
          Best regards,<br>
          ${data.organizerName}<br>
          Event Organizer
        </div>
      </div>

      <div class="footer">
        <p>This certificate was generated for ${data.eventTitle}.</p>
        <p>If you have any questions, please contact the event organizer.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML template for thank you email
 */
export function generateThankYouEmailTemplate(data: ThankYouEmailData): string {
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Attending!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .thank-you-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .title {
          color: #059669;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .content {
          margin-bottom: 30px;
        }
        .highlights {
          background-color: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 10px;
        }
        .certificate-button {
          background-color: #2563eb;
          color: white;
        }
        .gallery-button {
          background-color: #059669;
          color: white;
        }
        .organizer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="thank-you-icon">🙏</div>
          <h1 class="title">Thank You!</h1>
          <p class="subtitle">Your participation made ${
						data.eventTitle
					} a success</p>
        </div>

        <div class="content">
          <p>Dear ${data.participantName},</p>

          <p>Thank you for being an amazing <strong>${
						data.participantRole
					}</strong> at ${
		data.eventTitle
	}. Your participation and engagement contributed significantly to the success of our event.</p>

          ${
						data.eventHighlights && data.eventHighlights.length > 0
							? `
          <div class="highlights">
            <h3>Event Highlights:</h3>
            <ul>
              ${data.eventHighlights
								.map((highlight) => `<li>${highlight}</li>`)
								.join('')}
            </ul>
          </div>
          `
							: ''
					}

          <p>We hope you found the event valuable and enjoyed connecting with fellow participants. Your feedback and continued engagement mean a lot to us.</p>

          <div class="action-buttons">
            ${
							data.certificateUrl
								? `
            <a href="${data.certificateUrl}" class="button certificate-button">Download Certificate</a>
            `
								: ''
						}

            ${
							data.galleryUrl
								? `
            <a href="${data.galleryUrl}" class="button gallery-button">View Photo Gallery</a>
            `
								: ''
						}
          </div>

          <p>Stay connected with us for future events and opportunities. We look forward to seeing you again!</p>
        </div>

        <div class="organizer">
          With gratitude,<br>
          ${data.organizerName}<br>
          Event Organizer
        </div>
      </div>

      <div class="footer">
        <p>This email was sent because you participated in ${
					data.eventTitle
				}.</p>
        <p>Thank you for being part of our community!</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send certificate email to a participant
 */
export async function sendCertificateEmail(data: CertificateEmailData) {
	const emailHtml = generateCertificateEmailTemplate(data);

	const emailData: EmailData = {
		to: [data.participantEmail],
		subject: `Your Certificate: ${data.eventTitle}`,
		html: emailHtml,
		from: 'Eventtts Platform <noreply@resend.dev>',
	};

	return await sendEmail(emailData);
}

/**
 * Send thank you email to a participant
 */
export async function sendThankYouEmail(data: ThankYouEmailData) {
	const emailHtml = generateThankYouEmailTemplate(data);

	const emailData: EmailData = {
		to: [data.participantEmail],
		subject: `Thank you for attending ${data.eventTitle}!`,
		html: emailHtml,
		from: 'Eventtts Platform <noreply@resend.dev>',
	};

	return await sendEmail(emailData);
}

/**
 * Send bulk certificate emails
 */
export async function sendBulkCertificateEmails(
	participants: CertificateEmailData[]
) {
	const results = [];

	for (const participant of participants) {
		try {
			const result = await sendCertificateEmail(participant);
			results.push({
				email: participant.participantEmail,
				success: true,
				data: result.data,
			});

			// Add small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			console.error(
				`Failed to send certificate email to ${participant.participantEmail}:`,
				error
			);
			results.push({
				email: participant.participantEmail,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	return results;
}

/**
 * Send bulk thank you emails
 */
export async function sendBulkThankYouEmails(
	participants: ThankYouEmailData[]
) {
	const results = [];

	for (const participant of participants) {
		try {
			const result = await sendThankYouEmail(participant);
			results.push({
				email: participant.participantEmail,
				success: true,
				data: result.data,
			});

			// Add small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			console.error(
				`Failed to send thank you email to ${participant.participantEmail}:`,
				error
			);
			results.push({
				email: participant.participantEmail,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	return results;
}

/**
 * Generate ticket confirmation email template
 */
function generateTicketConfirmationEmailTemplate(
	data: TicketConfirmationEmailData
): string {
	const ticketsHtml = data.tickets
		.map(
			(ticket, index) => `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #4f46e5;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">Ticket ${
				index + 1
			}</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-size: 14px;">Ticket ID:</span>
          <span style="font-family: 'Courier New', monospace; font-weight: 600; color: #1f2937; font-size: 14px;">${
						ticket.ticketId
					}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 12px; border-radius: 6px; border: 2px dashed #4f46e5;">
          <span style="color: #4f46e5; font-weight: 600; font-size: 14px;">Entry Code:</span>
          <span style="font-family: 'Courier New', monospace; font-weight: 700; color: #4f46e5; font-size: 24px; letter-spacing: 4px;">${
						ticket.entryCode
					}</span>
        </div>
      </div>
    </div>
  `
		)
		.join('');

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Ticket Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Ticket Confirmed!</h1>
          <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">You're all set for ${
						data.eventTitle
					}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
            Dear ${data.attendeeName},
          </p>

          <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
            Great news! Your ticket${
							data.totalTickets > 1 ? 's have' : ' has'
						} been confirmed for <strong>${
		data.eventTitle
	}</strong>. We're excited to see you there!
          </p>

          <!-- Event Details -->
          <div style="background-color: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Event Details</h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: start;">
                <span style="color: #6b7280; font-size: 14px; min-width: 100px;">📅 Date:</span>
                <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${
									data.eventDate
								}</span>
              </div>
              <div style="display: flex; align-items: start;">
                <span style="color: #6b7280; font-size: 14px; min-width: 100px;">🕐 Time:</span>
                <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${
									data.eventTime
								}</span>
              </div>
              <div style="display: flex; align-items: start;">
                <span style="color: #6b7280; font-size: 14px; min-width: 100px;">📍 Location:</span>
                <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${
									data.eventLocation
								}</span>
              </div>
              <div style="display: flex; align-items: start;">
                <span style="color: #6b7280; font-size: 14px; min-width: 100px;">🎫 Tickets:</span>
                <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${
									data.totalTickets
								}</span>
              </div>
            </div>
          </div>

          <!-- Tickets -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Your Ticket${
							data.totalTickets > 1 ? 's' : ''
						}</h2>
            ${ticketsHtml}
          </div>

          <!-- Important Information -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">⚠️ Important Information</h3>
            <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
              <li>Please save this email or take a screenshot of your entry code${
								data.totalTickets > 1 ? 's' : ''
							}</li>
              <li>You'll need to provide your entry code at the event entrance for verification</li>
              <li>Each entry code can only be used once</li>
              <li>Arrive early to avoid queues at the entrance</li>
            </ul>
          </div>

          <!-- View Ticket Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/event/${
		data.eventId
	}/ticket"
               style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
              View My Ticket${data.totalTickets > 1 ? 's' : ''}
            </a>
          </div>

          <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions or need assistance, please don't hesitate to contact the event organizer.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
            This email was sent because you purchased a ticket for ${
							data.eventTitle
						}.
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} Eventtts Platform. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send ticket confirmation email to an attendee
 */
export async function sendTicketConfirmationEmail(
	data: TicketConfirmationEmailData
) {
	const emailHtml = generateTicketConfirmationEmailTemplate(data);

	const emailData: EmailData = {
		to: [data.attendeeEmail],
		subject: `🎉 Your Ticket for ${data.eventTitle} - Entry Code Inside`,
		html: emailHtml,
		from: 'Eventtts Platform <noreply@resend.dev>',
	};

	return await sendEmail(emailData);
}

export default resend;
