import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import QRCode from 'qrcode';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { getUserEventTickets } from '@/lib/actions/ticket.action';

/**
 * POST /api/qrcode/generate - Generate QR code for a ticket
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
		const { entryCode, ticketId, format = 'png', size = 200 } = body;

		if (!entryCode) {
			return NextResponse.json(
				{ error: 'Entry code is required' },
				{ status: 400 }
			);
		}

		// Validate entry code format (6 digits)
		if (!/^\d{6}$/.test(entryCode)) {
			return NextResponse.json(
				{ error: 'Invalid entry code format. Must be 6 digits.' },
				{ status: 400 }
			);
		}

		try {
			// Generate QR code as data URL
			const qrCodeDataURL = await QRCode.toDataURL(entryCode, {
				errorCorrectionLevel: 'M',
				margin: 1,
				color: {
					dark: '#000000',
					light: '#FFFFFF',
				},
				width: size,
			});

			// Generate QR code as SVG if requested
			let qrCodeSVG = null;
			if (format === 'svg' || format === 'both') {
				qrCodeSVG = await QRCode.toString(entryCode, {
					type: 'svg',
					errorCorrectionLevel: 'M',
					margin: 1,
					color: {
						dark: '#000000',
						light: '#FFFFFF',
					},
					width: size,
				});
			}

			const response: any = {
				success: true,
				entryCode,
				qrCode: {
					dataURL: qrCodeDataURL,
					format: 'png',
					size,
				},
				metadata: {
					ticketId: ticketId || null,
					generatedAt: new Date().toISOString(),
					userId: mongoUser._id,
				},
			};

			if (qrCodeSVG) {
				response.qrCode.svg = qrCodeSVG;
				response.qrCode.format = format === 'both' ? 'both' : 'svg';
			}

			return NextResponse.json(response);
		} catch (qrError) {
			console.error('QR code generation error:', qrError);
			return NextResponse.json(
				{ error: 'Failed to generate QR code' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Error generating QR code:', error);
		return NextResponse.json(
			{
				error: 'Failed to generate QR code',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * GET /api/qrcode/generate - Get QR generation info/status
 */
export async function GET() {
	try {
		return NextResponse.json({
			status: 'active',
			message: 'QR code generation service is ready',
			supportedFormats: ['png', 'svg', 'both'],
			defaultSize: 200,
			maxSize: 1000,
			minSize: 50,
			errorCorrectionLevels: ['L', 'M', 'Q', 'H'],
		});
	} catch (error) {
		console.error('Error getting QR generation status:', error);
		return NextResponse.json(
			{ error: 'Failed to get generation status' },
			{ status: 500 }
		);
	}
}
