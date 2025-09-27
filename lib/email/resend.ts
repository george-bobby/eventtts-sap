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

export default resend;
