import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	sendBulkCertificateEmails,
	sendBulkThankYouEmails,
	CertificateEmailData,
	ThankYouEmailData,
} from '@/lib/email/resend';
import { getEventStakeholders } from '@/lib/actions/stakeholder.action';
import { getEventPhotoGalleries } from '@/lib/actions/gallery.action';
import Event from '@/lib/models/event.model';
import User from '@/lib/models/user.model';
import { connectToDatabase } from '@/lib/dbconnection';

/**
 * POST /api/communications - Send bulk emails to stakeholders
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectToDatabase();

		const body = await request.json();
		const {
			type,
			eventId,
			stakeholderIds,
			includeGalleryLink,
			includeCertificate,
			eventHighlights,
		} = body;

		if (!type || !eventId) {
			return NextResponse.json(
				{ error: 'Type and event ID are required' },
				{ status: 400 }
			);
		}

		// Get event details
		const event = await Event.findById(eventId).populate(
			'organizer',
			'firstName lastName'
		);
		if (!event) {
			return NextResponse.json({ error: 'Event not found' }, { status: 404 });
		}

		// Get organizer info
		const organizer = event.organizer;
		const organizerName = `${organizer.firstName} ${organizer.lastName}`;

		// Get stakeholders
		const stakeholders = stakeholderIds
			? await getEventStakeholders(eventId, {}).then((all: any[]) =>
					all.filter((s: any) => stakeholderIds.includes(s._id))
			  )
			: await getEventStakeholders(eventId);

		if (stakeholders.length === 0) {
			return NextResponse.json(
				{ error: 'No stakeholders found' },
				{ status: 400 }
			);
		}

		// Get gallery link if requested
		let galleryUrl = '';
		if (includeGalleryLink) {
			const galleries = await getEventPhotoGalleries(eventId);
			if (galleries.length > 0) {
				// Use the first public gallery or create a general link
				const publicGallery =
					galleries.find((g: any) => g.visibility === 'public') || galleries[0];
				galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/gallery/${publicGallery.shareableLink}`;
			}
		}

		let results = [];

		if (type === 'certificate') {
			// Send certificate emails
			const certificateEmails: CertificateEmailData[] = stakeholders
				.filter((s: any) => s.certificateGenerated && s.certificateId)
				.map((stakeholder: any) => ({
					eventTitle: event.title,
					eventId: event._id,
					participantName: stakeholder.name,
					participantEmail: stakeholder.email,
					participantRole: stakeholder.role,
					eventDate: event.startDate.toDateString(),
					certificateUrl: stakeholder.certificateId?.certificateUrl || '',
					galleryUrl: galleryUrl || undefined,
					organizerName,
				}));

			if (certificateEmails.length === 0) {
				return NextResponse.json(
					{ error: 'No stakeholders with generated certificates found' },
					{ status: 400 }
				);
			}

			results = await sendBulkCertificateEmails(certificateEmails);

			// Update email sent status
			for (const result of results) {
				if (result.success) {
					const stakeholder = stakeholders.find(
						(s: any) => s.email === result.email
					);
					if (stakeholder) {
						await connectToDatabase();
						await require('@/lib/models/stakeholder.model').Stakeholder.findByIdAndUpdate(
							stakeholder._id,
							{ 'emailsSent.certificate': true }
						);
					}
				}
			}
		} else if (type === 'thankYou') {
			// Send thank you emails
			const thankYouEmails: ThankYouEmailData[] = stakeholders.map(
				(stakeholder: any) => ({
					eventTitle: event.title,
					eventId: event._id,
					participantName: stakeholder.name,
					participantEmail: stakeholder.email,
					participantRole: stakeholder.role,
					eventDate: event.startDate.toDateString(),
					galleryUrl: galleryUrl || undefined,
					certificateUrl:
						includeCertificate && stakeholder.certificateId?.certificateUrl
							? stakeholder.certificateId.certificateUrl
							: undefined,
					organizerName,
					eventHighlights: eventHighlights || [],
				})
			);

			results = await sendBulkThankYouEmails(thankYouEmails);

			// Update email sent status
			for (const result of results) {
				if (result.success) {
					const stakeholder = stakeholders.find(
						(s: any) => s.email === result.email
					);
					if (stakeholder) {
						await connectToDatabase();
						await require('@/lib/models/stakeholder.model').Stakeholder.findByIdAndUpdate(
							stakeholder._id,
							{ 'emailsSent.thankYou': true }
						);
					}
				}
			}
		} else {
			return NextResponse.json(
				{ error: 'Invalid email type. Must be "certificate" or "thankYou"' },
				{ status: 400 }
			);
		}

		const successCount = results.filter((r) => r.success).length;
		const failureCount = results.filter((r) => !r.success).length;

		return NextResponse.json({
			success: true,
			data: {
				results,
				summary: {
					total: results.length,
					successful: successCount,
					failed: failureCount,
				},
			},
		});
	} catch (error) {
		console.error('Error sending bulk emails:', error);
		return NextResponse.json(
			{
				error: 'Failed to send bulk emails',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
