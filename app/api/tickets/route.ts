import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getTickets, getUserEventTickets } from '@/lib/actions/ticket.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * GET /api/tickets - Get tickets for an event or user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth();
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status') as
      | 'active'
      | 'used'
      | 'expired'
      | 'cancelled'
      | null;

    // Get MongoDB user ID
    const mongoUser = await getUserByClerkId(userId);
    if (!mongoUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let tickets;

    if (eventId) {
      // Get user's tickets for a specific event
      tickets = await getUserEventTickets(mongoUser._id, eventId);
    } else {
      // Get all tickets for the user
      tickets = await getTickets({
        userId: mongoUser._id,
        status: status || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    return NextResponse.json(
      {
        error: 'Failed to get tickets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

