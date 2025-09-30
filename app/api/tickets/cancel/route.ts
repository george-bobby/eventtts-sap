import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { cancelTickets } from '@/lib/actions/ticket.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * POST /api/tickets/cancel - Cancel tickets for an order
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelTickets({
      orderId,
      userId: mongoUser._id,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        cancelledTickets: result.cancelledTickets,
        refundedCapacity: result.refundedCapacity,
      },
    });
  } catch (error) {
    console.error('Error cancelling tickets:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Order not found')) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'You can only cancel your own tickets' },
          { status: 403 }
        );
      }
      if (error.message.includes('Cannot cancel tickets')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to cancel tickets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
