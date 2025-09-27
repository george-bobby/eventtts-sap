import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	generateCertificate,
	bulkGenerateCertificates,
	getEventCertificates,
} from '@/lib/actions/certificate.action';

/**
 * GET /api/certificates/generate - Get generated certificates for an event
 */
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const eventId = searchParams.get('eventId');

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		const certificates = await getEventCertificates(eventId);

		return NextResponse.json({
			success: true,
			data: certificates,
		});
	} catch (error) {
		console.error('Error getting event certificates:', error);
		return NextResponse.json(
			{
				error: 'Failed to get event certificates',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/certificates/generate - Generate certificates
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const {
			type,
			templateId,
			stakeholderId,
			stakeholderIds,
			fieldValues,
			defaultFieldValues,
		} = body;

		if (!templateId) {
			return NextResponse.json(
				{ error: 'Template ID is required' },
				{ status: 400 }
			);
		}

		if (type === 'single') {
			// Generate single certificate
			if (!stakeholderId || !fieldValues) {
				return NextResponse.json(
					{
						error:
							'Stakeholder ID and field values are required for single generation',
					},
					{ status: 400 }
				);
			}

			const certificate = await generateCertificate({
				templateId,
				stakeholderId,
				fieldValues,
			});

			return NextResponse.json({
				success: true,
				data: certificate,
			});
		} else if (type === 'bulk') {
			// Generate bulk certificates
			if (!stakeholderIds || !Array.isArray(stakeholderIds)) {
				return NextResponse.json(
					{ error: 'Stakeholder IDs array is required for bulk generation' },
					{ status: 400 }
				);
			}

			const results = await bulkGenerateCertificates({
				templateId,
				stakeholderIds,
				defaultFieldValues,
			});

			return NextResponse.json({
				success: true,
				data: results,
			});
		} else {
			return NextResponse.json(
				{ error: 'Invalid generation type. Must be "single" or "bulk"' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Error generating certificates:', error);
		return NextResponse.json(
			{
				error: 'Failed to generate certificates',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
