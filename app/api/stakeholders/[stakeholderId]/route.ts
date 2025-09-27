import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	getStakeholder,
	updateStakeholder,
	deleteStakeholder,
} from '@/lib/actions/stakeholder.action';

/**
 * GET /api/stakeholders/[stakeholderId] - Get a specific stakeholder
 */
export async function GET(
	request: NextRequest,
	context: { params: { stakeholderId: string } }
) {
	const { params } = context;
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const stakeholder = await getStakeholder(params.stakeholderId);

		return NextResponse.json({
			success: true,
			data: stakeholder,
		});
	} catch (error) {
		console.error('Error getting stakeholder:', error);
		return NextResponse.json(
			{
				error: 'Failed to get stakeholder',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/stakeholders/[stakeholderId] - Update a stakeholder
 */
export async function PUT(
	request: NextRequest,
	context: { params: { stakeholderId: string } }
) {
	const { params } = context;
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const updates = body;

		const stakeholder = await updateStakeholder({
			stakeholderId: params.stakeholderId,
			updates,
		});

		return NextResponse.json({
			success: true,
			data: stakeholder,
		});
	} catch (error) {
		console.error('Error updating stakeholder:', error);
		return NextResponse.json(
			{
				error: 'Failed to update stakeholder',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/stakeholders/[stakeholderId] - Delete a stakeholder
 */
export async function DELETE(
	request: NextRequest,
	context: { params: { stakeholderId: string } }
) {
	const { params } = context;
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await deleteStakeholder(params.stakeholderId);

		return NextResponse.json({
			success: true,
			message: 'Stakeholder deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting stakeholder:', error);
		return NextResponse.json(
			{
				error: 'Failed to delete stakeholder',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
