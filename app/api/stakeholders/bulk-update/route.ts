import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { bulkUpdateAttendance } from '@/lib/actions/stakeholder.action';

/**
 * POST /api/stakeholders/bulk-update - Bulk update stakeholder attendance status
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stakeholderIds, attendanceStatus } = body;

    if (!stakeholderIds || !Array.isArray(stakeholderIds) || stakeholderIds.length === 0) {
      return NextResponse.json(
        { error: 'Stakeholder IDs array is required' },
        { status: 400 }
      );
    }

    if (!attendanceStatus || !['registered', 'attended', 'no-show', 'cancelled'].includes(attendanceStatus)) {
      return NextResponse.json(
        { error: 'Valid attendance status is required' },
        { status: 400 }
      );
    }

    const result = await bulkUpdateAttendance(stakeholderIds, attendanceStatus);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error bulk updating stakeholders:', error);
    return NextResponse.json(
      {
        error: 'Failed to bulk update stakeholders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}