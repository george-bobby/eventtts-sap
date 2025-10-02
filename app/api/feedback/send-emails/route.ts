import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sendFeedbackEmailsManually } from '@/lib/actions/feedback.action';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get the MongoDB user
		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { eventId } = body;

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		// Verify user is the organizer of this event
		const event = await getEventById(eventId);
		console.log('Event organizer check:', {
			eventId,
			eventFound: !!event,
			eventOrganizer: event?.organizer?.toString(),
			mongoUserId: mongoUser._id.toString(),
			isOrganizer: event?.organizer?.toString() === mongoUser._id.toString(),
		});

		if (!event || event.organizer.toString() !== mongoUser._id.toString()) {
			return NextResponse.json(
				{ error: 'Unauthorized: You are not the organizer of this event' },
				{ status: 403 }
			);
		}

		// Send feedback emails manually
		const result = await sendFeedbackEmailsManually(eventId);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: result.message,
				data: {
					totalEmails: result.totalEmails,
					successfulEmails: result.successfulEmails,
					failedEmails: result.failedEmails,
				},
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.message,
				},
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Error sending feedback emails:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
