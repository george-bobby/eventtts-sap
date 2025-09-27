import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
  getEventUpdate,
  updateEventUpdate,
  deleteEventUpdate,
  publishEventUpdate,
} from '@/lib/actions/eventupdate.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * GET /api/event-updates/[updateId] - Get a specific event update
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ updateId: string }> }
) {
  const params = await context.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventUpdate = await getEventUpdate(params.updateId);

    return NextResponse.json({
      success: true,
      data: eventUpdate,
    });
  } catch (error) {
    console.error('Error getting event update:', error);
    return NextResponse.json(
      {
        error: 'Failed to get event update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/event-updates/[updateId] - Update an event update
 */
export async function PUT(
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

    const body = await request.json();
    const updates = { ...body, createdBy: mongoUser._id };

    const eventUpdate = await updateEventUpdate({
      updateId: params.updateId,
      updates,
    });

    return NextResponse.json({
      success: true,
      data: eventUpdate,
    });
  } catch (error) {
    console.error('Error updating event update:', error);
    return NextResponse.json(
      {
        error: 'Failed to update event update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/event-updates/[updateId] - Delete an event update
 */
export async function DELETE(
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

    await deleteEventUpdate(params.updateId, mongoUser._id);

    return NextResponse.json({
      success: true,
      message: 'Event update deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event update:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete event update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
