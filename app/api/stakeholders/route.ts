import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	createStakeholder,
	getEventStakeholders,
	bulkImportStakeholders,
	getStakeholderStats,
} from '@/lib/actions/stakeholder.action';

/**
 * GET /api/stakeholders - Get stakeholders for an event
 */
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const eventId = searchParams.get('eventId');
		const role = searchParams.get('role');
		const attendanceStatus = searchParams.get('attendanceStatus');
		const search = searchParams.get('search');
		const getStats = searchParams.get('stats') === 'true';

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		if (getStats) {
			const stats = await getStakeholderStats(eventId);
			return NextResponse.json({
				success: true,
				data: stats,
			});
		}

		const filters: any = {};
		if (role) filters.role = role;
		if (attendanceStatus) filters.attendanceStatus = attendanceStatus;
		if (search) filters.search = search;

		const stakeholders = await getEventStakeholders(eventId, filters);

		return NextResponse.json({
			success: true,
			data: stakeholders,
		});
	} catch (error) {
		console.error('Error getting stakeholders:', error);
		return NextResponse.json(
			{
				error: 'Failed to get stakeholders',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/stakeholders - Create a new stakeholder or bulk import
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { type, eventId } = body;

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		if (type === 'single') {
			// Create single stakeholder
			const { name, email, role, attendanceStatus, additionalInfo } = body;

			if (!name || !email || !role) {
				return NextResponse.json(
					{ error: 'Name, email, and role are required' },
					{ status: 400 }
				);
			}

			const stakeholder = await createStakeholder({
				eventId,
				name,
				email,
				role,
				attendanceStatus,
				additionalInfo,
				importedBy: userId,
			});

			return NextResponse.json({
				success: true,
				data: stakeholder,
			});
		} else if (type === 'bulk') {
			// Bulk import stakeholders
			const { fileUrl, fileName } = body;

			if (!fileUrl || !fileName) {
				return NextResponse.json(
					{ error: 'File URL and file name are required for bulk import' },
					{ status: 400 }
				);
			}

			const importRecord = await bulkImportStakeholders({
				eventId,
				fileUrl,
				fileName,
				importedBy: userId,
			});

			return NextResponse.json({
				success: true,
				data: importRecord,
			});
		} else {
			return NextResponse.json(
				{ error: 'Invalid type. Must be "single" or "bulk"' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Error creating/importing stakeholders:', error);
		return NextResponse.json(
			{
				error: 'Failed to create/import stakeholders',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
