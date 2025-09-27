import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	createQRCode,
	getQRCodes,
	generateQRCodesForEvent,
} from '@/lib/actions/qrcode.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * GET /api/qrcode - Get QR codes for an event
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await auth();
		const { userId } = authResult;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const eventId = searchParams.get('eventId');
		const status = searchParams.get('status') as
			| 'active'
			| 'used'
			| 'expired'
			| 'cancelled'
			| null;
		const type = searchParams.get('type') as
			| 'ticket'
			| 'checkin'
			| 'access'
			| null;

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		// Get MongoDB user ID
		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const qrCodes = await getQRCodes({
			eventId,
			userId: mongoUser._id,
			status: status || undefined,
			type: type || undefined,
		});

		return NextResponse.json({
			success: true,
			data: qrCodes,
		});
	} catch (error) {
		console.error('Error getting QR codes:', error);
		return NextResponse.json(
			{
				error: 'Failed to get QR codes',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/qrcode - Create a new QR code or generate for entire event
 */
export async function POST(request: NextRequest) {
	try {
		const authResult = await auth();
		const { userId } = authResult;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get MongoDB user ID
		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const {
			eventId,
			orderId,
			type,
			metadata,
			expiresAt,
			generateForEvent, // Flag to generate QR codes for all attendees
		} = body;

		// Validate required fields
		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		if (generateForEvent) {
			// Generate QR codes for all attendees of the event
			const qrCodes = await generateQRCodesForEvent(eventId, mongoUser._id);

			return NextResponse.json({
				success: true,
				data: qrCodes,
				message: `Generated ${qrCodes.length} QR codes for event attendees`,
			});
		} else {
			// Create a single QR code
			const qrCode = await createQRCode({
				eventId,
				userId: mongoUser._id,
				orderId,
				type: type || 'ticket',
				metadata,
				expiresAt: expiresAt ? new Date(expiresAt) : undefined,
			});

			return NextResponse.json({
				success: true,
				data: qrCode,
			});
		}
	} catch (error) {
		console.error('Error creating QR code:', error);
		return NextResponse.json(
			{
				error: 'Failed to create QR code',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
