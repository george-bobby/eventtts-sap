import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	getFeedbackResponses,
	getFeedbackAnalytics,
} from '@/lib/actions/feedback.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const authResult = await auth();
		const { userId: clerkId } = authResult;
		const { eventId } = await params;

		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		// Get MongoDB user ID
		const mongoUser = await getUserByClerkId(clerkId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const includeAnalytics = searchParams.get('analytics') === 'true';

		// Get feedback responses
		const responsesData = await getFeedbackResponses({
			eventId,
			organizerId: mongoUser._id,
			page,
			limit,
		});

		let analytics = null;
		if (includeAnalytics) {
			analytics = await getFeedbackAnalytics(eventId, mongoUser._id);
		}

		return NextResponse.json({
			...responsesData,
			analytics,
		});
	} catch (error) {
		console.error('Error fetching feedback responses:', error);

		if (error instanceof Error && error.message.includes('Unauthorized')) {
			return NextResponse.json({ error: error.message }, { status: 403 });
		}

		return NextResponse.json(
			{ error: 'Failed to fetch feedback responses' },
			{ status: 500 }
		);
	}
}
