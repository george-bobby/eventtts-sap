'use server';

import { connectToDatabase } from '@/lib/dbconnection';
import Issue, { IIssue } from '@/lib/models/issue.model';
import Event from '@/lib/models/event.model';
import User from '@/lib/models/user.model';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface CreateIssueParams {
	eventId: string;
	reportedBy: string;
	category: string;
	subcategory?: string;
	severity: 'low' | 'medium' | 'high';
	title: string;
	description: string;
	attachments?: string[];
}

export async function createIssue(
	params: CreateIssueParams
): Promise<{ success: boolean; issueId?: string; error?: string }> {
	try {
		await connectToDatabase();

		const {
			eventId,
			reportedBy,
			category,
			subcategory,
			severity,
			title,
			description,
			attachments = [],
		} = params;

		console.log('Creating issue for event:', eventId, 'by user:', reportedBy);

		// Fetch event and user details
		const [event, reporter] = await Promise.all([
			Event.findById(eventId).populate({
				path: 'organizer',
				model: 'User',
				select: 'firstName lastName email clerkId',
			}),
			User.findOne({ clerkId: reportedBy }),
		]);

		if (!event) {
			throw new Error('Event not found');
		}

		if (!reporter) {
			throw new Error('Reporter not found');
		}

		// Ensure organizer data is properly populated
		if (!event.organizer) {
			throw new Error('Event organizer not found');
		}

		const organizer = event.organizer as any; // Type assertion for populated data

		if (!organizer.email) {
			throw new Error('Organizer email not found');
		}

		console.log('Sending issue report email to organizer:', organizer.email); // Debug log
		console.log('Issue details:', {
			eventTitle: event.title,
			organizerName: `${organizer.firstName || ''} ${
				organizer.lastName || ''
			}`.trim(),
			reporterName: `${reporter.firstName} ${reporter.lastName}`,
			category,
			severity,
			title,
		});

		// Create the issue
		const newIssue = await Issue.create({
			eventId: event._id,
			eventTitle: event.title,
			reportedBy: reporter._id,
			reporterName: `${reporter.firstName} ${reporter.lastName}`,
			reporterEmail: reporter.email,
			category,
			subcategory,
			severity,
			title,
			description,
			attachments,
			organizer: organizer._id,
			organizerEmail: organizer.email,
			status: 'open',
		});

		// Send email notification to event organizer
		await sendIssueNotificationEmail({
			issue: newIssue,
			eventTitle: event.title,
			organizerEmail: organizer.email,
			organizerName: `${organizer.firstName || ''} ${
				organizer.lastName || ''
			}`.trim(),
			reporterName: `${reporter.firstName} ${reporter.lastName}`,
		});

		revalidatePath('/explore-events');

		return {
			success: true,
			issueId: newIssue._id.toString(),
		};
	} catch (error) {
		console.error('Error creating issue:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to create issue',
		};
	}
}

interface SendIssueNotificationEmailParams {
	issue: IIssue;
	eventTitle: string;
	organizerEmail: string;
	organizerName: string;
	reporterName: string;
}

async function sendIssueNotificationEmail({
	issue,
	eventTitle,
	organizerEmail,
	organizerName,
	reporterName,
}: SendIssueNotificationEmailParams) {
	const severityColors = {
		low: '#10B981', // green
		medium: '#F59E0B', // amber
		high: '#EF4444', // red
	};

	const categoryLabels = {
		'event-info': 'Event Information Issue',
		'tickets-registration': 'Tickets & Registration',
		'event-experience': 'Event Experience',
		'payments': 'Payment Issue',
		'other': 'Other Issue',
	};

	const priorityIcons = {
		low: '🟢',
		medium: '🟡',
		high: '🔴',
	};

	const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #f9fafb;
                padding: 20px;
            }
            .card { 
                background: white; 
                border-radius: 12px; 
                padding: 24px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 20px;
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 20px; 
                border-radius: 12px; 
                margin-bottom: 20px;
                text-align: center;
            }
            .greeting {
                background: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #667eea;
            }
            .priority-badge { 
                display: inline-block; 
                padding: 6px 12px; 
                border-radius: 20px; 
                font-weight: bold; 
                color: white; 
                background-color: ${severityColors[issue.severity]};
                margin-bottom: 10px;
            }
            .category-badge {
                display: inline-block;
                padding: 4px 12px;
                background-color: #e5e7eb;
                color: #374151;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 500;
            }
            .field-group { 
                margin-bottom: 16px; 
                padding: 12px;
                background-color: #f8fafc;
                border-left: 4px solid #667eea;
                border-radius: 0 8px 8px 0;
            }
            .field-label { 
                font-weight: bold; 
                color: #374151; 
                margin-bottom: 4px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .field-value { 
                color: #1f2937; 
                line-height: 1.5;
            }
            .description-box {
                background-color: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
            }
            .footer {
                background-color: #1f2937;
                color: white;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
                margin-top: 20px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 New Issue Report for Your Event</h1>
                <p>An attendee has reported an issue with "${eventTitle}"</p>
            </div>
            
            <div class="greeting">
                <p><strong>Dear ${organizerName},</strong></p>
                <p>You have received a new issue report for your event. Please review the details below and take appropriate action.</p>
            </div>
            
            <div class="card">
                <div class="priority-badge">
                    ${
											priorityIcons[issue.severity]
										} ${issue.severity.toUpperCase()} PRIORITY
                </div>
                
                <div class="field-group">
                    <div class="field-label">🎫 Event Details</div>
                    <div class="field-value">
                        <strong>Event:</strong> ${eventTitle}<br>
                        <strong>Event Organizer:</strong> ${organizerName}<br>
                        <strong>Issue ID:</strong> #${(issue._id as any)
													.toString()
													.slice(-8)
													.toUpperCase()}
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label">👤 Reported By</div>
                    <div class="field-value">
                        <strong>Name:</strong> ${reporterName}<br>
                        <strong>Email:</strong> ${issue.reporterEmail}<br>
                        <strong>Date:</strong> ${new Date(
													issue.createdAt
												).toLocaleDateString('en-US', {
													weekday: 'long',
													year: 'numeric',
													month: 'long',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})}
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label">📋 Issue Classification</div>
                    <div class="field-value">
                        <span class="category-badge">${
													categoryLabels[
														issue.category as keyof typeof categoryLabels
													]
												}</span>
                        ${
													issue.subcategory
														? `<br><strong>Specific Issue:</strong> ${issue.subcategory}`
														: ''
												}
                    </div>
                </div>

                <div class="field-group">
                    <div class="field-label">📝 Issue Title</div>
                    <div class="field-value">
                        <strong>${issue.title}</strong>
                    </div>
                </div>

                <div class="description-box">
                    <div class="field-label">💬 Detailed Description</div>
                    <div class="field-value" style="white-space: pre-wrap;">${
											issue.description
										}</div>
                </div>

                ${
									issue.attachments && issue.attachments.length > 0
										? `
                <div class="field-group">
                    <div class="field-label">📎 Attachments</div>
                    <div class="field-value">
                        ${issue.attachments
													.map(
														(attachment) => `
                            <a href="${attachment}" style="color: #667eea; text-decoration: underline;">
                                View Attachment
                            </a>
                        `
													)
													.join('<br>')}
                    </div>
                </div>
                `
										: ''
								}
            </div>

            <div class="footer">
                <p><strong>Next Steps:</strong></p>
                <p>As the event organizer, please review this issue and respond to the attendee as soon as possible.</p>
                
                <div style="margin-top: 16px;">
                    <a href="mailto:${issue.reporterEmail}" class="cta-button">
                        📧 Contact Reporter
                    </a>
                    <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/event/${
		issue.eventId
	}" class="cta-button">
                        🎫 View Event
                    </a>
                </div>
                
                <div style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                    <p>This is an automated notification from the SAP Hackathon Event Management System.</p>
                    <p>Issue reported at: ${new Date(
											issue.createdAt
										).toISOString()}</p>
                    <p>Your event organizer email: ${organizerEmail}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

	try {
		await resend.emails.send({
			from: 'SAP Hackathon Events <noreply@saphackathon.com>',
			to: [organizerEmail],
			subject: `🚨 [${issue.severity.toUpperCase()} PRIORITY] Issue Report: ${eventTitle} - Issue #${(
				issue._id as any
			)
				.toString()
				.slice(-8)
				.toUpperCase()}`,
			html: emailHtml,
		});

		console.log(
			`Issue notification email sent successfully to organizer: ${organizerEmail}`
		);
	} catch (error) {
		console.error('Failed to send issue notification email:', error);
		// Don't throw error here to prevent issue creation failure due to email issues
	}
}

export async function getIssuesByEvent(eventId: string) {
	try {
		await connectToDatabase();

		const issues = await Issue.find({ eventId })
			.populate('reportedBy', 'firstName lastName email')
			.sort({ createdAt: -1 });

		return { success: true, issues: JSON.parse(JSON.stringify(issues)) };
	} catch (error) {
		console.error('Error fetching issues:', error);
		return { success: false, error: 'Failed to fetch issues' };
	}
}

export async function updateIssueStatus(
	issueId: string,
	status: string,
	adminNotes?: string
) {
	try {
		await connectToDatabase();

		const updateData: any = { status };
		if (status === 'resolved' || status === 'closed') {
			updateData.resolvedAt = new Date();
		}
		if (adminNotes) {
			updateData.adminNotes = adminNotes;
		}

		const issue = await Issue.findByIdAndUpdate(issueId, updateData, {
			new: true,
		});

		if (!issue) {
			throw new Error('Issue not found');
		}

		revalidatePath('/admin/issues');

		return { success: true, issue: JSON.parse(JSON.stringify(issue)) };
	} catch (error) {
		console.error('Error updating issue status:', error);
		return { success: false, error: 'Failed to update issue status' };
	}
}

export async function getIssueAnalytics(eventId: string) {
	try {
		await connectToDatabase();

		const issues = await Issue.find({ eventId });

		const analytics = {
			totalIssues: issues.length,
			byStatus: {
				open: issues.filter((i) => i.status === 'open').length,
				inProgress: issues.filter((i) => i.status === 'in-progress').length,
				resolved: issues.filter((i) => i.status === 'resolved').length,
				closed: issues.filter((i) => i.status === 'closed').length,
			},
			bySeverity: {
				high: issues.filter((i) => i.severity === 'high').length,
				medium: issues.filter((i) => i.severity === 'medium').length,
				low: issues.filter((i) => i.severity === 'low').length,
			},
			byCategory: {
				'event-info': issues.filter((i) => i.category === 'event-info').length,
				'tickets-registration': issues.filter(
					(i) => i.category === 'tickets-registration'
				).length,
				'event-experience': issues.filter(
					(i) => i.category === 'event-experience'
				).length,
				'payments': issues.filter((i) => i.category === 'payments').length,
				'other': issues.filter((i) => i.category === 'other').length,
			},
			resolutionRate:
				issues.length > 0
					? (issues.filter(
							(i) => i.status === 'resolved' || i.status === 'closed'
					  ).length /
							issues.length) *
					  100
					: 0,
			avgResolutionTime: calculateAverageResolutionTime(
				issues.filter((i) => i.resolvedAt)
			),
		};

		return { success: true, analytics };
	} catch (error) {
		console.error('Error getting issue analytics:', error);
		return { success: false, error: 'Failed to get issue analytics' };
	}
}

function calculateAverageResolutionTime(resolvedIssues: any[]): number {
	if (resolvedIssues.length === 0) return 0;

	const totalTime = resolvedIssues.reduce((sum, issue) => {
		const createdAt = new Date(issue.createdAt);
		const resolvedAt = new Date(issue.resolvedAt);
		return sum + (resolvedAt.getTime() - createdAt.getTime());
	}, 0);

	// Return average time in hours
	return Math.round(totalTime / resolvedIssues.length / (1000 * 60 * 60));
}
