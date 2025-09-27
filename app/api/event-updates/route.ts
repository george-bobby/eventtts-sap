import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
  createEventUpdate,
  getEventUpdates,
} from '@/lib/actions/eventupdate.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * GET /api/event-updates - Get event updates for an event
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status') as 'draft' | 'published' | 'scheduled' | 'sent' | null;
    const type = searchParams.get('type') as 'announcement' | 'schedule_change' | 'location_change' | 'cancellation' | 'reminder' | 'general' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const result = await getEventUpdates({
      eventId,
      status: status || undefined,
      type: type || undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.updates,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting event updates:', error);
    return NextResponse.json(
      {
        error: 'Failed to get event updates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/event-updates - Create a new event update
 */
export async function POST(request: NextRequest) {
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
    const {
      eventId,
      title,
      content,
      type,
      priority,
      recipients,
      deliveryMethods,
      scheduledFor,
      attachments,
      metadata,
    } = body;

    // Validate required fields
    if (!eventId || !title || !content) {
      return NextResponse.json(
        { error: 'Event ID, title, and content are required' },
        { status: 400 }
      );
    }

    const eventUpdate = await createEventUpdate({
      eventId,
      title,
      content,
      type,
      priority,
      createdBy: mongoUser._id,
      recipients,
      deliveryMethods,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      attachments,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: eventUpdate,
    });
  } catch (error) {
    console.error('Error creating event update:', error);
    return NextResponse.json(
      {
        error: 'Failed to create event update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
