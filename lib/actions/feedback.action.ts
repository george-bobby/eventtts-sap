'use server';

import { connectToDatabase } from '../dbconnection';
import { FeedbackTemplate, FeedbackResponse } from '../models/feedback.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import { sendBulkFeedbackEmails, FeedbackEmailData } from '../email/resend';
import {
	CreateFeedbackTemplateParams,
	SubmitFeedbackParams,
	GetFeedbackResponsesParams,
	IFeedbackAnalytics,
} from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Create feedback template for an event
 */
export async function createFeedbackTemplate(
	params: CreateFeedbackTemplateParams
) {
	try {
		await connectToDatabase();

		const { eventId, customQuestions } = params;

		// Check if template already exists
		const existingTemplate = await FeedbackTemplate.findOne({ event: eventId });

		if (existingTemplate) {
			// Update existing template
			existingTemplate.customQuestions = customQuestions;
			await existingTemplate.save();
			return JSON.parse(JSON.stringify(existingTemplate));
		}

		// Create new template
		const template = await FeedbackTemplate.create({
			event: eventId,
			customQuestions,
			isActive: true,
		});

		return JSON.parse(JSON.stringify(template));
	} catch (error) {
		console.error('Error creating feedback template:', error);
		throw error;
	}
}

/**
 * Get feedback template for an event
 */
export async function getFeedbackTemplate(eventId: string) {
	try {
		await connectToDatabase();

		const template = await FeedbackTemplate.findOne({
			event: eventId,
			isActive: true,
		}).populate('event', 'title description startDate endDate organizer');

		if (!template) {
			return null;
		}

		return JSON.parse(JSON.stringify(template));
	} catch (error) {
		console.error('Error getting feedback template:', error);
		throw error;
	}
}

/**
 * Submit feedback response
 */
export async function submitFeedbackResponse(params: SubmitFeedbackParams) {
	try {
		await connectToDatabase();

		const { eventId, userId, isAnonymous, ...feedbackData } = params;

		// Check if user already submitted feedback for this event
		if (!isAnonymous && userId) {
			const existingResponse = await FeedbackResponse.findOne({
				event: eventId,
				user: userId,
			});

			if (existingResponse) {
				throw new Error('You have already submitted feedback for this event');
			}
		}

		// Create feedback response
		const response = await FeedbackResponse.create({
			event: eventId,
			user: isAnonymous ? undefined : userId,
			isAnonymous,
			...feedbackData,
			submittedAt: new Date(),
		});

		return JSON.parse(JSON.stringify(response));
	} catch (error) {
		console.error('Error submitting feedback:', error);
		throw error;
	}
}

/**
 * Get feedback responses for an event (for organizers)
 */
export async function getFeedbackResponses(params: GetFeedbackResponsesParams) {
	try {
		await connectToDatabase();

		const { eventId, organizerId, page = 1, limit = 20 } = params;

		// Verify organizer owns the event
		const event = await Event.findById(eventId);
		if (!event || event.organizer.toString() !== organizerId) {
			throw new Error('Unauthorized: You are not the organizer of this event');
		}

		const skip = (page - 1) * limit;

		const responses = await FeedbackResponse.find({ event: eventId })
			.populate('user', 'firstName lastName email')
			.sort({ submittedAt: -1 })
			.skip(skip)
			.limit(limit);

		const totalResponses = await FeedbackResponse.countDocuments({
			event: eventId,
		});

		return {
			responses: JSON.parse(JSON.stringify(responses)),
			totalResponses,
			currentPage: page,
			totalPages: Math.ceil(totalResponses / limit),
		};
	} catch (error) {
		console.error('Error getting feedback responses:', error);
		throw error;
	}
}

/**
 * Get feedback analytics for an event
 */
export async function getFeedbackAnalytics(
	eventId: string,
	organizerId: string
): Promise<IFeedbackAnalytics> {
	try {
		await connectToDatabase();

		// Verify organizer owns the event
		const event = await Event.findById(eventId);
		if (!event || event.organizer.toString() !== organizerId) {
			throw new Error('Unauthorized: You are not the organizer of this event');
		}

		const responses = await FeedbackResponse.find({ event: eventId });
		const totalAttendees = await Order.countDocuments({ event: eventId });

		if (responses.length === 0) {
			return {
				totalResponses: 0,
				responseRate: 0,
				averageRatings: {
					overallSatisfaction: 0,
					contentQuality: 0,
					organizationRating: 0,
					venueRating: 0,
					recommendationScore: 0,
				},
				npsScore: 0,
			};
		}

		// Calculate averages
		const averageRatings = {
			overallSatisfaction:
				responses.reduce((sum, r) => sum + r.overallSatisfaction, 0) /
				responses.length,
			contentQuality:
				responses.reduce((sum, r) => sum + r.contentQuality, 0) /
				responses.length,
			organizationRating:
				responses.reduce((sum, r) => sum + r.organizationRating, 0) /
				responses.length,
			venueRating:
				responses.filter((r) => r.venueRating).length > 0
					? responses
							.filter((r) => r.venueRating)
							.reduce((sum, r) => sum + (r.venueRating || 0), 0) /
					  responses.filter((r) => r.venueRating).length
					: undefined,
			recommendationScore:
				responses.reduce((sum, r) => sum + r.recommendationScore, 0) /
				responses.length,
		};

		// Calculate NPS (Net Promoter Score)
		const promoters = responses.filter(
			(r) => r.recommendationScore >= 9
		).length;
		const detractors = responses.filter(
			(r) => r.recommendationScore <= 6
		).length;
		const npsScore = ((promoters - detractors) / responses.length) * 100;

		return {
			totalResponses: responses.length,
			responseRate:
				totalAttendees > 0 ? (responses.length / totalAttendees) * 100 : 0,
			averageRatings,
			npsScore: Math.round(npsScore),
		};
	} catch (error) {
		console.error('Error getting feedback analytics:', error);
		throw error;
	}
}

/**
 * Send feedback emails manually to all event participants
 */
export async function sendFeedbackEmailsManually(eventId: string) {
	try {
		await connectToDatabase();

		const event = await Event.findById(eventId).populate(
			'organizer',
			'firstName lastName'
		);

		if (!event) {
			throw new Error('Event not found');
		}

		if (!event.feedbackEnabled) {
			return {
				success: false,
				message: 'Feedback is not enabled for this event',
			};
		}

		// Get all attendees for this event
		const orders = await Order.find({ event: eventId }).populate(
			'user',
			'firstName lastName email'
		);

		if (orders.length === 0) {
			return {
				success: false,
				message: 'No attendees found for this event',
			};
		}

		// Prepare email data for all attendees
		const attendeeEmails: FeedbackEmailData[] = orders.map((order) => ({
			eventTitle: event.title,
			eventId: event._id.toString(),
			attendeeName: `${order.user.firstName} ${order.user.lastName}`,
			attendeeEmail: order.user.email,
			eventDate: event.startDate.toLocaleDateString(),
			feedbackUrl: `${
				process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
			}/event/${event._id}/submit/feedback`,
			organizerName: `${event.organizer.firstName} ${event.organizer.lastName}`,
		}));

		// Send emails
		const emailResults = await sendBulkFeedbackEmails(attendeeEmails);

		const failedEmails = emailResults.filter((r) => !r.success);
		const successfulEmails = emailResults.filter((r) => r.success);

		return {
			success: failedEmails.length === 0,
			totalEmails: emailResults.length,
			successfulEmails: successfulEmails.length,
			failedEmails: failedEmails.length,
			message:
				failedEmails.length === 0
					? `Successfully sent feedback emails to ${successfulEmails.length} participants`
					: `Sent ${successfulEmails.length} emails successfully, ${failedEmails.length} failed`,
		};
	} catch (error) {
		console.error('Error sending feedback emails manually:', error);
		throw error;
	}
}
