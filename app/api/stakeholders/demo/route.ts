import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createDemoStakeholders } from '@/lib/utils/demo-stakeholders';

/**
 * POST /api/stakeholders/demo - Create demo stakeholders for testing
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const result = await createDemoStakeholders(eventId, userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating demo stakeholders:', error);
    return NextResponse.json(
      {
        error: 'Failed to create demo stakeholders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}