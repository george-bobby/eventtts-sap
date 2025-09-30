import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import QRCode from 'qrcode';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { getEventById } from '@/lib/actions/event.action';
import { getEventTickets } from '@/lib/actions/ticket.action';

interface RouteParams {
	params: Promise<{ eventId: string }>;
}

/**
 * GET /api/qrcode/[eventId] - Get QR codes for all tickets in an event
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { eventId } = await params;

		// Get MongoDB user ID
		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Verify event exists
		const event = await getEventById(eventId);
		if (!event) {
			return NextResponse.json({ error: 'Event not found' }, { status: 404 });
		}

		// Check if user is the event organizer
		if (String(event.organizer._id) !== mongoUser._id) {
			return NextResponse.json(
				{ error: 'Unauthorized: Only event organizer can access QR codes' },
				{ status: 403 }
			);
		}

		// Get all tickets for the event
		const tickets = await getEventTickets({ eventId });

		if (!tickets || tickets.length === 0) {
			return NextResponse.json({
				success: true,
				message: 'No tickets found for this event',
				qrCodes: [],
				event: {
					id: event._id,
					title: event.title,
				},
			});
		}

		// Generate QR codes for all tickets
		const qrCodes = await Promise.all(
			tickets.map(async (ticket: any) => {
				try {
					const qrCodeDataURL = await QRCode.toDataURL(ticket.entryCode, {
						errorCorrectionLevel: 'M',
						margin: 1,
						color: {
							dark: '#000000',
							light: '#FFFFFF',
						},
						width: 200,
					});

					return {
						ticketId: ticket.ticketId,
						entryCode: ticket.entryCode,
						qrCode: qrCodeDataURL,
						status: ticket.status,
						user: {
							firstName: ticket.user.firstName,
							lastName: ticket.user.lastName,
							email: ticket.user.email,
						},
						metadata: ticket.metadata,
						createdAt: ticket.createdAt,
						verifiedAt: ticket.verifiedAt,
					};
				} catch (qrError) {
					console.error(
						`Error generating QR for ticket ${ticket.ticketId}:`,
						qrError
					);
					return {
						ticketId: ticket.ticketId,
						entryCode: ticket.entryCode,
						qrCode: null,
						error: 'Failed to generate QR code',
						status: ticket.status,
						user: {
							firstName: ticket.user.firstName,
							lastName: ticket.user.lastName,
							email: ticket.user.email,
						},
						metadata: ticket.metadata,
						createdAt: ticket.createdAt,
						verifiedAt: ticket.verifiedAt,
					};
				}
			})
		);

		return NextResponse.json({
			success: true,
			message: `Generated QR codes for ${qrCodes.length} tickets`,
			qrCodes,
			event: {
				id: event._id,
				title: event.title,
				startDate: event.startDate,
				endDate: event.endDate,
				location: event.location,
			},
			stats: {
				total: qrCodes.length,
				active: qrCodes.filter((qr: any) => qr.status === 'active').length,
				used: qrCodes.filter((qr: any) => qr.status === 'used').length,
				expired: qrCodes.filter((qr: any) => qr.status === 'expired').length,
				cancelled: qrCodes.filter((qr: any) => qr.status === 'cancelled')
					.length,
			},
		});
	} catch (error) {
		console.error('Error getting event QR codes:', error);
		return NextResponse.json(
			{
				error: 'Failed to get event QR codes',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/qrcode/[eventId] - Regenerate QR codes for an event
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { eventId } = await params;

		// Get MongoDB user ID
		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Verify event exists and user is organizer
		const event = await getEventById(eventId);
		if (!event) {
			return NextResponse.json({ error: 'Event not found' }, { status: 404 });
		}

		if (String(event.organizer._id) !== mongoUser._id) {
			return NextResponse.json(
				{ error: 'Unauthorized: Only event organizer can regenerate QR codes' },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { size = 200, format = 'png' } = body;

		// Get all tickets for the event
		const tickets = await getEventTickets({ eventId });

		if (!tickets || tickets.length === 0) {
			return NextResponse.json(
				{
					success: false,
					message: 'No tickets found for this event',
				},
				{ status: 404 }
			);
		}

		// Regenerate QR codes with specified parameters
		const qrCodes = await Promise.all(
			tickets.map(async (ticket: any) => {
				try {
					const qrCodeDataURL = await QRCode.toDataURL(ticket.entryCode, {
						errorCorrectionLevel: 'M',
						margin: 1,
						color: {
							dark: '#000000',
							light: '#FFFFFF',
						},
						width: size,
					});

					return {
						ticketId: ticket.ticketId,
						entryCode: ticket.entryCode,
						qrCode: qrCodeDataURL,
						regeneratedAt: new Date().toISOString(),
					};
				} catch (qrError) {
					console.error(
						`Error regenerating QR for ticket ${ticket.ticketId}:`,
						qrError
					);
					return {
						ticketId: ticket.ticketId,
						entryCode: ticket.entryCode,
						qrCode: null,
						error: 'Failed to regenerate QR code',
					};
				}
			})
		);

		return NextResponse.json({
			success: true,
			message: `Regenerated QR codes for ${qrCodes.length} tickets`,
			qrCodes,
			parameters: { size, format },
			regeneratedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error regenerating QR codes:', error);
		return NextResponse.json(
			{
				error: 'Failed to regenerate QR codes',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
