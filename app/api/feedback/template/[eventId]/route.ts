import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	getFeedbackTemplate,
	createFeedbackTemplate,
} from '@/lib/actions/feedback.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { getEventById } from '@/lib/actions/event.action';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params;

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		const template = await getFeedbackTemplate(eventId);

		if (!template) {
			// Return default template structure instead of 404
			const defaultTemplate = {
				_id: null,
				event: eventId,
				customQuestions: [],
				feedbackHours: 2,
				isActive: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			return NextResponse.json({ template: defaultTemplate });
		}

		return NextResponse.json({ template });
	} catch (error) {
		console.error('Error fetching feedback template:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch feedback template' },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/feedback/template/[eventId] - Update feedback template
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const authResult = await auth();
		const { userId } = authResult;
		const { eventId } = await params;

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

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

		// Verify user is the organizer of this event
		const event = await getEventById(eventId);
		if (!event || event.organizer.toString() !== mongoUser._id.toString()) {
			return NextResponse.json(
				{ error: 'Unauthorized: You are not the organizer of this event' },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { customQuestions, feedbackHours } = body;

		// Validate input
		if (feedbackHours && (feedbackHours < 1 || feedbackHours > 168)) {
			return NextResponse.json(
				{ error: 'Feedback hours must be between 1 and 168 (1 week)' },
				{ status: 400 }
			);
		}

		// Update the feedback template
		const updatedTemplate = await createFeedbackTemplate({
			eventId,
			customQuestions: customQuestions || [],
			feedbackHours: feedbackHours || 2,
		});

		return NextResponse.json({
			success: true,
			data: updatedTemplate,
			message: 'Feedback template updated successfully',
		});
	} catch (error) {
		console.error('Error updating feedback template:', error);
		return NextResponse.json(
			{
				error: 'Failed to update feedback template',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
