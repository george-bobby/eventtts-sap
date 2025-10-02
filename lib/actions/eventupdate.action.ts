'use server';

import { connectToDatabase } from '../dbconnection';
import EventUpdate, { IEventUpdate } from '../models/eventupdate.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '../email/resend';

export interface CreateEventUpdateParams {
	eventId: string;
	title: string;
	content: string;
	type?:
		| 'announcement'
		| 'schedule_change'
		| 'location_change'
		| 'cancellation'
		| 'reminder'
		| 'general';
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	createdBy: string;
	recipients?: {
		sendToAll?: boolean;
		specificUsers?: string[];
		userRoles?: string[];
	};
	sendEmail?: boolean;
	scheduledFor?: Date;
	attachments?: string[];
	metadata?: {
		tags?: string[];
		category?: string;
	};
}

export interface GetEventUpdatesParams {
	eventId: string;
	status?: 'draft' | 'published' | 'scheduled' | 'sent';
	type?:
		| 'announcement'
		| 'schedule_change'
		| 'location_change'
		| 'cancellation'
		| 'reminder'
		| 'general';
	page?: number;
	limit?: number;
}

export interface UpdateEventUpdateParams {
	updateId: string;
	updates: Partial<CreateEventUpdateParams>;
}

/**
 * Create a new event update
 */
export async function createEventUpdate(params: CreateEventUpdateParams) {
	try {
		await connectToDatabase();

		// Verify event exists
		const event = await Event.findById(params.eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		// Verify user exists and is organizer
		const user = await User.findById(params.createdBy);
		if (!user) {
			throw new Error('User not found');
		}

		if (String(event.organizer) !== params.createdBy) {
			throw new Error('Unauthorized: Only event organizer can create updates');
		}

		const eventUpdate = await EventUpdate.create({
			event: params.eventId,
			title: params.title,
			content: params.content,
			type: params.type || 'general',
			priority: params.priority || 'medium',
			createdBy: params.createdBy,
			recipients: {
				sendToAll: params.recipients?.sendToAll ?? true,
				specificUsers: params.recipients?.specificUsers || [],
				userRoles: params.recipients?.userRoles || [],
			},
			sendEmail: params.sendEmail ?? true,
			scheduledFor: params.scheduledFor,
			attachments: params.attachments || [],
			metadata: {
				tags: params.metadata?.tags || [],
				category: params.metadata?.category,
			},
		});

		revalidatePath(`/event/${params.eventId}/notifications`);
		return JSON.parse(JSON.stringify(eventUpdate));
	} catch (error) {
		console.error('Error creating event update:', error);
		throw error;
	}
}

/**
 * Get event updates for an event
 */
export async function getEventUpdates(params: GetEventUpdatesParams) {
	try {
		await connectToDatabase();

		const query: any = { event: params.eventId };

		if (params.status) {
			query.status = params.status;
		}

		if (params.type) {
			query.type = params.type;
		}

		const page = params.page || 1;
		const limit = params.limit || 10;
		const skip = (page - 1) * limit;

		const updates = await EventUpdate.find(query)
			.populate('createdBy', 'firstName lastName email')
			.populate('event', 'title')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await EventUpdate.countDocuments(query);

		return {
			updates: JSON.parse(JSON.stringify(updates)),
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		};
	} catch (error) {
		console.error('Error getting event updates:', error);
		throw error;
	}
}

/**
 * Get a specific event update
 */
export async function getEventUpdate(updateId: string) {
	try {
		await connectToDatabase();

		const update = await EventUpdate.findById(updateId)
			.populate('createdBy', 'firstName lastName email')
			.populate('event', 'title startDate endDate')
			.populate('recipients.specificUsers', 'firstName lastName email');

		if (!update) {
			throw new Error('Event update not found');
		}

		return JSON.parse(JSON.stringify(update));
	} catch (error) {
		console.error('Error getting event update:', error);
		throw error;
	}
}

/**
 * Update an event update
 */
export async function updateEventUpdate(params: UpdateEventUpdateParams) {
	try {
		await connectToDatabase();

		const existingUpdate = await EventUpdate.findById(params.updateId).populate(
			'event'
		);
		if (!existingUpdate) {
			throw new Error('Event update not found');
		}

		// Check if user is the organizer
		if (
			params.updates.createdBy &&
			String(existingUpdate.event.organizer) !== params.updates.createdBy
		) {
			throw new Error('Unauthorized: Only event organizer can update this');
		}

		const updatedUpdate = await EventUpdate.findByIdAndUpdate(
			params.updateId,
			params.updates,
			{ new: true }
		)
			.populate('createdBy', 'firstName lastName email')
			.populate('event', 'title');

		revalidatePath(`/event/${existingUpdate.event._id}/notifications`);
		return JSON.parse(JSON.stringify(updatedUpdate));
	} catch (error) {
		console.error('Error updating event update:', error);
		throw error;
	}
}

/**
 * Publish an event update
 */
export async function publishEventUpdate(updateId: string, userId: string) {
	try {
		await connectToDatabase();

		const update = await EventUpdate.findById(updateId).populate('event');
		if (!update) {
			throw new Error('Event update not found');
		}

		// Check if user is the organizer
		if (String(update.event.organizer) !== userId) {
			throw new Error('Unauthorized: Only event organizer can publish updates');
		}

		// If scheduled for future, set status to scheduled
		const now = new Date();
		const status =
			update.scheduledFor && update.scheduledFor > now
				? 'scheduled'
				: 'published';
		const publishedAt = status === 'published' ? now : undefined;

		const publishedUpdate = await EventUpdate.findByIdAndUpdate(
			updateId,
			{
				status,
				publishedAt,
			},
			{ new: true }
		);

		// Send email notifications if enabled
		if (publishedUpdate && publishedUpdate.sendEmail) {
			await sendEventUpdateEmails(publishedUpdate);
		}

		revalidatePath(`/event/${update.event._id}/notifications`);
		return JSON.parse(JSON.stringify(publishedUpdate));
	} catch (error) {
		console.error('Error publishing event update:', error);
		throw error;
	}
}

/**
 * Delete an event update
 */
export async function deleteEventUpdate(updateId: string, userId: string) {
	try {
		await connectToDatabase();

		const update = await EventUpdate.findById(updateId).populate('event');
		if (!update) {
			throw new Error('Event update not found');
		}

		// Check if user is the organizer
		if (String(update.event.organizer) !== userId) {
			throw new Error('Unauthorized: Only event organizer can delete updates');
		}

		await EventUpdate.findByIdAndDelete(updateId);
		revalidatePath(`/event/${update.event._id}/notifications`);

		return { success: true };
	} catch (error) {
		console.error('Error deleting event update:', error);
		throw error;
	}
}

/**
 * Get event attendees for recipient selection
 */
export async function getEventAttendees(eventId: string) {
	try {
		await connectToDatabase();

		// Get all users who have orders for this event
		const orders = await Order.find({ event: eventId })
			.populate('user', 'firstName lastName email')
			.distinct('user');

		const attendees = await User.find({ _id: { $in: orders } }).select(
			'firstName lastName email'
		);

		return JSON.parse(JSON.stringify(attendees));
	} catch (error) {
		console.error('Error getting event attendees:', error);
		throw error;
	}
}

/**
 * Get update statistics for an event
 */
export async function getEventUpdateStats(eventId: string) {
	try {
		await connectToDatabase();

		const stats = await EventUpdate.aggregate([
			{ $match: { event: eventId } },
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
				},
			},
		]);

		const typeStats = await EventUpdate.aggregate([
			{ $match: { event: eventId } },
			{
				$group: {
					_id: '$type',
					count: { $sum: 1 },
				},
			},
		]);

		const totalEmailsSent = await EventUpdate.aggregate([
			{ $match: { event: eventId } },
			{
				$group: {
					_id: null,
					totalSent: { $sum: '$emailStats.sent' },
					totalDelivered: { $sum: '$emailStats.delivered' },
					totalOpened: { $sum: '$emailStats.opened' },
					totalClicked: { $sum: '$emailStats.clicked' },
				},
			},
		]);

		return {
			statusStats: stats,
			typeStats,
			emailStats: totalEmailsSent[0] || {
				totalSent: 0,
				totalDelivered: 0,
				totalOpened: 0,
				totalClicked: 0,
			},
		};
	} catch (error) {
		console.error('Error getting event update stats:', error);
		throw error;
	}
}

/**
 * Send email notifications for an event update
 */
async function sendEventUpdateEmails(eventUpdate: any) {
	try {
		// Get the event details
		const event = await Event.findById(eventUpdate.event).populate(
			'organizer',
			'firstName lastName email'
		);

		if (!event) {
			console.error('Event not found for update:', eventUpdate._id);
			return;
		}

		// Get all attendees (people who have orders for this event)
		const orders = await Order.find({
			event: eventUpdate.event,
			status: 'completed', // Only send to confirmed attendees
		}).populate('buyer', 'firstName lastName email');

		if (!orders || orders.length === 0) {
			console.log('No attendees found for event:', event.title);
			return;
		}

		// Extract unique attendee emails
		const attendeeEmails = [
			...new Set(orders.map((order) => order.buyer.email).filter(Boolean)),
		];

		console.log(
			`Sending event update to ${attendeeEmails.length} attendees for event: ${event.title}`
		);

		// Create email content
		const emailSubject = `Update: ${event.title} - ${eventUpdate.title}`;
		const emailHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
					Event Update: ${event.title}
				</h2>

				<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
					<h3 style="color: #007bff; margin-top: 0;">${eventUpdate.title}</h3>
					<p style="color: #666; margin: 0;">
						<strong>Update Type:</strong> ${eventUpdate.type
							.replace('_', ' ')
							.toUpperCase()}
					</p>
				</div>

				<div style="margin: 20px 0;">
					<h4 style="color: #333;">Message:</h4>
					<div style="background-color: #fff; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
						${eventUpdate.content.replace(/\n/g, '<br>')}
					</div>
				</div>

				<div style="margin: 30px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
					<h4 style="color: #333; margin-top: 0;">Event Details:</h4>
					<p><strong>Event:</strong> ${event.title}</p>
					<p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString(
						'en-US',
						{
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						}
					)}</p>
					<p><strong>Time:</strong> ${new Date(event.startDate).toLocaleTimeString(
						'en-US',
						{
							hour: '2-digit',
							minute: '2-digit',
						}
					)}</p>
					${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
				</div>

				<div style="margin: 30px 0; text-align: center;">
					<p style="color: #666; font-size: 14px;">
						This update was sent by ${event.organizer.firstName} ${
			event.organizer.lastName
		}<br>
						Published on ${new Date(eventUpdate.publishedAt).toLocaleDateString('en-US')}
					</p>
				</div>

				<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
					<p style="margin: 0; color: #856404; font-size: 14px;">
						<strong>Note:</strong> This is an automated message. Please do not reply to this email.
						If you have questions, contact the event organizer directly.
					</p>
				</div>
			</div>
		`;

		// Send emails to all attendees
		const emailPromises = attendeeEmails.map((email) =>
			sendEmail({
				to: [email],
				subject: emailSubject,
				html: emailHtml,
				from: 'SAP Hackathon Events <noreply@saphackathon.com>',
			}).catch((error) => {
				console.error(`Failed to send email to ${email}:`, error);
				return { success: false, email, error };
			})
		);

		const results = await Promise.allSettled(emailPromises);

		// Count successful sends
		const successful = results.filter(
			(result) =>
				result.status === 'fulfilled' && result.value?.success !== false
		).length;

		const failed = results.length - successful;

		// Update email stats
		await EventUpdate.findByIdAndUpdate(eventUpdate._id, {
			$set: {
				'emailStats.sent': successful,
				'emailStats.failed': failed,
				'emailStats.delivered': successful, // Assume delivered if sent successfully
			},
		});

		console.log(
			`Event update emails sent: ${successful} successful, ${failed} failed`
		);
	} catch (error) {
		console.error('Error sending event update emails:', error);

		// Update failed stats
		await EventUpdate.findByIdAndUpdate(eventUpdate._id, {
			$inc: {
				'emailStats.failed': 1,
			},
		}).catch(console.error);
	}
}
