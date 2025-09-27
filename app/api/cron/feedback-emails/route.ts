import { NextRequest, NextResponse } from 'next/server';
import { processPendingFeedbackEmails } from '@/lib/actions/feedback.action';

export async function POST(request: NextRequest) {
	try {
		// Verify the request is from a cron job (you can add authentication here)
		const authHeader = request.headers.get('authorization');
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('Processing pending feedback emails...');

		const result = await processPendingFeedbackEmails();

		console.log('Feedback email processing completed:', result);

		return NextResponse.json({
			success: result.success,
			message: 'Feedback emails processed successfully',
			processed: result.processed,
		});
	} catch (error) {
		console.error('Error in feedback email cron job:', error);

		return NextResponse.json(
			{
				error: 'Failed to process feedback emails',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// Allow GET for testing purposes (remove in production)
export async function GET(request: NextRequest) {
	if (process.env.NODE_ENV === 'production') {
		return NextResponse.json(
			{ error: 'Method not allowed in production' },
			{ status: 405 }
		);
	}

	return POST(request);
}
