import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { exportEventAttendeesToExcel } from '@/lib/actions/order.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

export async function POST(request: NextRequest) {
	try {
		// ✅ Await auth() to avoid header issues in Next.js 15
		const { userId: clerkId } = await auth();

		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { eventId } = await request.json();

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		// Get the MongoDB user ID
		const mongoUser = await getUserByClerkId(clerkId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Export attendees to Excel
		const result = await exportEventAttendeesToExcel({
			eventId,
			organizerId: mongoUser._id,
		});

		// Return the Excel file as a response
		return new NextResponse(result.buffer, {
			status: 200,
			headers: {
				'Content-Type':
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${result.filename}"`,
				'Content-Length': result.buffer.length.toString(),
			},
		});
	} catch (error: any) {
		console.error('Error exporting attendees:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to export attendees' },
			{ status: 500 }
		);
	}
}
