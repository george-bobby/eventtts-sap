import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fixEventCapacities } from '@/lib/actions/event.action';

/**
 * POST /api/fix-events - Fix events that are incorrectly marked as sold out
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the fix function
    const result = await fixEventCapacities();

    return NextResponse.json({
      success: true,
      message: 'Events fixed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error fixing events:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
