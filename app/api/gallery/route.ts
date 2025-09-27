import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	createPhotoGallery,
	getEventPhotoGalleries,
	uploadPhotos,
} from '@/lib/actions/gallery.action';

/**
 * GET /api/gallery - Get photo galleries for an event
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

		const galleries = await getEventPhotoGalleries(eventId);

		return NextResponse.json({
			success: true,
			data: galleries,
		});
	} catch (error) {
		console.error('Error getting photo galleries:', error);
		return NextResponse.json(
			{
				error: 'Failed to get photo galleries',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/gallery - Create a new photo gallery
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const {
			eventId,
			name,
			description,
			visibility,
			accessPassword,
			allowDownload,
			allowComments,
			categories,
		} = body;

		// Validate required fields
		if (!eventId || !name || !visibility) {
			return NextResponse.json(
				{ error: 'Event ID, name, and visibility are required' },
				{ status: 400 }
			);
		}

		const gallery = await createPhotoGallery({
			eventId,
			name,
			description,
			visibility,
			accessPassword,
			allowDownload: allowDownload ?? true,
			allowComments: allowComments ?? true,
			categories: categories || [],
			createdBy: userId,
		});

		return NextResponse.json({
			success: true,
			data: gallery,
		});
	} catch (error) {
		console.error('Error creating photo gallery:', error);
		return NextResponse.json(
			{
				error: 'Failed to create photo gallery',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
