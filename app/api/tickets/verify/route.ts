import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyTicket } from '@/lib/actions/ticket.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * POST /api/tickets/verify - Verify a ticket using entry code
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
    const { entryCode, eventId } = body;

    if (!entryCode) {
      return NextResponse.json(
        { error: 'Entry code is required' },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const result = await verifyTicket({
      entryCode,
      eventId,
      verifiedBy: mongoUser._id,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        ticket: result.ticket,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        ticket: result.ticket || null,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying ticket:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify ticket',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

