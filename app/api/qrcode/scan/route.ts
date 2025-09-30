import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { verifyTicket } from '@/lib/actions/ticket.action';

/**
 * POST /api/qrcode/scan - Scan and verify a QR code ticket
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
    const { qrData, eventId } = body;

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR code data is required' },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Extract entry code from QR data
    // The QR code should contain the 6-digit entry code
    const entryCodeMatch = qrData.match(/\d{6}/);
    if (!entryCodeMatch) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid QR code format',
          message: 'No valid 6-digit entry code found in QR code'
        },
        { status: 400 }
      );
    }

    const entryCode = entryCodeMatch[0];

    // Verify the ticket using the existing verification logic
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
        method: 'qr_scan'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        ticket: result.ticket || null,
        method: 'qr_scan'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan QR code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/qrcode/scan - Get QR scanner status/info
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'active',
      message: 'QR code scanner is ready',
      supportedFormats: [
        'qr_code',
        'micro_qr_code',
        'rm_qr_code',
        'maxi_code',
        'pdf417',
        'aztec',
        'data_matrix'
      ]
    });
  } catch (error) {
    console.error('Error getting QR scanner status:', error);
    return NextResponse.json(
      { error: 'Failed to get scanner status' },
      { status: 500 }
    );
  }
}
