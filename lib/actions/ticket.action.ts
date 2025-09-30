'use server';

import { connectToDatabase } from '../dbconnection';
import Ticket, { ITicket } from '../models/ticket.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

export interface CreateTicketParams {
	eventId: string;
	userId: string;
	orderId?: string;
	metadata?: {
		ticketType?: string;
		seatNumber?: string;
		section?: string;
		additionalInfo?: string;
	};
	expiresAt?: Date;
}

export interface GetTicketsParams {
	eventId?: string;
	userId?: string;
	status?: 'active' | 'used' | 'expired' | 'cancelled';
}

export interface VerifyTicketParams {
	entryCode: string;
	eventId: string;
	verifiedBy: string;
}

export interface CancelTicketParams {
	orderId: string;
	userId: string;
}

/**
 * Generate a unique ticket ID
 */
function generateTicketId(): string {
	return `TKT-${nanoid(12).toUpperCase()}`;
}

/**
 * Generate a 6-digit random entry code
 */
function generateEntryCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a new ticket with entry code
 */
export async function createTicket(params: CreateTicketParams) {
	try {
		await connectToDatabase();

		// Verify event exists
		const event = await Event.findById(params.eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		// Verify user exists
		const user = await User.findById(params.userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Generate unique ticket ID
		const ticketId = generateTicketId();

		// Generate unique 6-digit entry code
		let entryCode = generateEntryCode();

		// Ensure entry code is unique for this event
		let existingTicket = await Ticket.findOne({
			entryCode,
			event: params.eventId,
		});
		while (existingTicket) {
			entryCode = generateEntryCode();
			existingTicket = await Ticket.findOne({
				entryCode,
				event: params.eventId,
			});
		}

		// Set expiration date (default to event end date + 1 day)
		const expiresAt =
			params.expiresAt ||
			new Date(event.endDate.getTime() + 24 * 60 * 60 * 1000);

		const ticketDoc = await Ticket.create({
			event: params.eventId,
			user: params.userId,
			order: params.orderId,
			ticketId,
			entryCode,
			status: 'active',
			expiresAt,
			metadata: params.metadata || {},
		});

		revalidatePath(`/event/${params.eventId}/tickets`);
		return JSON.parse(JSON.stringify(ticketDoc));
	} catch (error) {
		console.error('Error creating ticket:', error);
		throw error;
	}
}

/**
 * Get tickets based on filters
 */
export async function getTickets(params: GetTicketsParams) {
	try {
		await connectToDatabase();

		const query: any = {};

		if (params.eventId) {
			query.event = params.eventId;
		}

		if (params.userId) {
			query.user = params.userId;
		}

		if (params.status) {
			query.status = params.status;
		}

		const tickets = await Ticket.find(query)
			.populate('event', 'title startDate endDate location photo')
			.populate('user', 'firstName lastName email')
			.populate('order', 'stripeId totalTickets totalAmount')
			.sort({ createdAt: -1 });

		return JSON.parse(JSON.stringify(tickets));
	} catch (error) {
		console.error('Error getting tickets:', error);
		throw error;
	}
}

/**
 * Get a single ticket by ticket ID
 */
export async function getTicketByTicketId(ticketId: string) {
	try {
		await connectToDatabase();

		const ticket = await Ticket.findOne({ ticketId })
			.populate(
				'event',
				'title startDate endDate location photo startTime endTime'
			)
			.populate('user', 'firstName lastName email');

		if (!ticket) {
			throw new Error('Ticket not found');
		}

		return JSON.parse(JSON.stringify(ticket));
	} catch (error) {
		console.error('Error getting ticket:', error);
		throw error;
	}
}

/**
 * Get tickets for a specific user and event
 */
export async function getUserEventTickets(userId: string, eventId: string) {
	try {
		await connectToDatabase();

		const tickets = await Ticket.find({ user: userId, event: eventId })
			.populate(
				'event',
				'title startDate endDate location photo startTime endTime'
			)
			.populate('order', 'totalTickets totalAmount')
			.sort({ createdAt: -1 });

		return JSON.parse(JSON.stringify(tickets));
	} catch (error) {
		console.error('Error getting user event tickets:', error);
		throw error;
	}
}

/**
 * Get all tickets for an event (for organizers)
 */
export async function getEventTickets(params: { eventId: string }) {
	try {
		await connectToDatabase();

		const tickets = await Ticket.find({ event: params.eventId })
			.populate('event', 'title startDate endDate location')
			.populate('user', 'firstName lastName email')
			.sort({ createdAt: -1 });

		return JSON.parse(JSON.stringify(tickets));
	} catch (error) {
		console.error('Error getting event tickets:', error);
		throw error;
	}
}

/**
 * Verify a ticket using entry code
 */
export async function verifyTicket(params: VerifyTicketParams) {
	try {
		await connectToDatabase();

		const ticket = await Ticket.findOne({
			entryCode: params.entryCode,
			event: params.eventId,
		})
			.populate('event', 'title startDate endDate location')
			.populate('user', 'firstName lastName email');

		if (!ticket) {
			return {
				success: false,
				message: 'Invalid entry code',
			};
		}

		// Check if already used
		if (ticket.status === 'used') {
			return {
				success: false,
				message: 'Ticket already verified',
				ticket: JSON.parse(JSON.stringify(ticket)),
			};
		}

		// Check if expired
		if (ticket.expiresAt && new Date() > ticket.expiresAt) {
			await Ticket.findByIdAndUpdate(ticket._id, { status: 'expired' });
			return {
				success: false,
				message: 'Ticket expired',
				ticket: JSON.parse(JSON.stringify(ticket)),
			};
		}

		// Check if cancelled
		if (ticket.status === 'cancelled') {
			return {
				success: false,
				message: 'Ticket cancelled',
				ticket: JSON.parse(JSON.stringify(ticket)),
			};
		}

		// Mark as used/verified
		const updatedTicket = await Ticket.findByIdAndUpdate(
			ticket._id,
			{
				status: 'used',
				verifiedAt: new Date(),
				verifiedBy: params.verifiedBy,
			},
			{ new: true }
		)
			.populate('event', 'title startDate endDate location')
			.populate('user', 'firstName lastName email');

		return {
			success: true,
			message: 'Ticket verified successfully',
			ticket: JSON.parse(JSON.stringify(updatedTicket)),
		};
	} catch (error) {
		console.error('Error verifying ticket:', error);
		throw error;
	}
}

/**
 * Generate tickets for all attendees of an event
 */
export async function generateTicketsForEvent(
	eventId: string,
	organizerId: string
) {
	try {
		await connectToDatabase();

		// Verify event exists and user is organizer
		const event = await Event.findById(eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		if (String(event.organizer) !== organizerId) {
			throw new Error(
				'Unauthorized: Only event organizer can generate tickets'
			);
		}

		// Get all orders for this event
		const orders = await Order.find({ event: eventId }).populate('user');

		const results = [];

		for (const order of orders) {
			// Generate tickets for each ticket in the order
			for (let i = 0; i < order.totalTickets; i++) {
				try {
					const ticket = await createTicket({
						eventId,
						userId: order.user._id,
						orderId: order._id,
						metadata: {
							ticketType: 'General Admission',
							additionalInfo: `Ticket ${i + 1} of ${order.totalTickets}`,
						},
					});
					results.push(ticket);
				} catch (error) {
					console.error(`Error creating ticket for order ${order._id}:`, error);
				}
			}
		}

		revalidatePath(`/event/${eventId}/tickets`);
		return results;
	} catch (error) {
		console.error('Error generating tickets for event:', error);
		throw error;
	}
}

/**
 * Cancel tickets for a specific order
 */
export async function cancelTickets(params: CancelTicketParams) {
	try {
		await connectToDatabase();

		// Find the order and verify ownership
		const order = await Order.findById(params.orderId).populate('event');
		if (!order) {
			throw new Error('Order not found');
		}

		// Verify the user owns this order
		if (order.user.toString() !== params.userId) {
			throw new Error('Unauthorized: You can only cancel your own tickets');
		}

		// Check if the event has already started (optional business rule)
		const event = order.event;
		const now = new Date();
		const eventStart = new Date(event.startDate);

		// Allow cancellation up to 1 hour before event starts
		const cancellationDeadline = new Date(
			eventStart.getTime() - 60 * 60 * 1000
		);
		if (now > cancellationDeadline) {
			throw new Error(
				'Cannot cancel tickets less than 1 hour before the event starts'
			);
		}

		// Find all tickets for this order
		const tickets = await Ticket.find({ order: params.orderId });
		if (tickets.length === 0) {
			throw new Error('No tickets found for this order');
		}

		// Update all tickets to cancelled status
		await Ticket.updateMany(
			{ order: params.orderId },
			{
				status: 'cancelled',
				updatedAt: new Date(),
			}
		);

		// Update event capacity (add back the cancelled tickets)
		// Only update if the event has limited capacity (not -1)
		if (event.ticketsLeft !== -1) {
			event.ticketsLeft = (event.ticketsLeft || 0) + order.totalTickets;
			event.soldOut = false; // Event is no longer sold out
			await event.save();
		}

		// Optionally, you could also mark the order as cancelled
		// await Order.findByIdAndUpdate(params.orderId, { status: 'cancelled' });

		revalidatePath('/dashboard');
		revalidatePath(`/event/${event._id}`);
		revalidatePath(`/event/${event._id}/attendees`);

		return {
			success: true,
			message: `Successfully cancelled ${tickets.length} ticket${
				tickets.length > 1 ? 's' : ''
			}`,
			cancelledTickets: tickets.length,
			refundedCapacity: order.totalTickets,
		};
	} catch (error) {
		console.error('Error cancelling tickets:', error);
		throw error;
	}
}
