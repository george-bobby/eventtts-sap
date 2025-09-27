import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { publishEventUpdate } from '@/lib/actions/eventupdate.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * POST /api/event-updates/[updateId]/publish - Publish an event update
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ updateId: string }> }
) {
  const params = await context.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get MongoDB user ID
    const mongoUser = await getUserByClerkId(userId);
    if (!mongoUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const eventUpdate = await publishEventUpdate(params.updateId, mongoUser._id);

    return NextResponse.json({
      success: true,
      data: eventUpdate,
      message: 'Event update published successfully',
    });
  } catch (error) {
    console.error('Error publishing event update:', error);
    return NextResponse.json(
      {
        error: 'Failed to publish event update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
