import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { scanQRCode } from '@/lib/actions/qrcode.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

/**
 * POST /api/qrcode/scan - Scan and validate a QR code
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
    const { qrCodeData } = body;

    if (!qrCodeData) {
      return NextResponse.json(
        { error: 'QR code data is required' },
        { status: 400 }
      );
    }

    const result = await scanQRCode({
      qrCodeData,
      scannedBy: mongoUser._id,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.qrCode,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        data: result.qrCode || null,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      {
        error: 'Failed to scan QR code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
