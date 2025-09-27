import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateIssueStatus } from '@/lib/actions/issue.action';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const body = await request.json();
		const { status, adminNotes } = body;

		// Validate required fields
		if (!status) {
			return NextResponse.json(
				{ success: false, error: 'Status is required' },
				{ status: 400 }
			);
		}

		const result = await updateIssueStatus(id, status, adminNotes);

		if (result.success) {
			return NextResponse.json(result, { status: 200 });
		} else {
			return NextResponse.json(result, { status: 400 });
		}
	} catch (error) {
		console.error('Error updating issue:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
