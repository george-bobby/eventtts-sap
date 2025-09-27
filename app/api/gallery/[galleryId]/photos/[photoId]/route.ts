import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	updatePhoto,
	deletePhoto,
	incrementPhotoDownloadCount,
} from '@/lib/actions/gallery.action';

/**
 * PUT /api/gallery/[galleryId]/photos/[photoId] - Update photo metadata
 */
export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ galleryId: string; photoId: string }> }
) {
	const params = await context.params;
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const updates = body;

		const photo = await updatePhoto({
			photoId: params.photoId,
			updates,
		});

		return NextResponse.json({
			success: true,
			data: photo,
		});
	} catch (error) {
		console.error('Error updating photo:', error);
		return NextResponse.json(
			{
				error: 'Failed to update photo',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/gallery/[galleryId]/photos/[photoId] - Delete a photo
 */
export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ galleryId: string; photoId: string }> }
) {
	const params = await context.params;
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await deletePhoto(params.photoId);

		return NextResponse.json({
			success: true,
			message: 'Photo deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting photo:', error);
		return NextResponse.json(
			{
				error: 'Failed to delete photo',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/gallery/[galleryId]/photos/[photoId] - Track photo download
 */
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ galleryId: string; photoId: string }> }
) {
	const params = await context.params;
	try {
		const body = await request.json();
		const { action } = body;

		if (action === 'download') {
			await incrementPhotoDownloadCount(params.photoId);

			return NextResponse.json({
				success: true,
				message: 'Download count updated',
			});
		}

		return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error tracking photo action:', error);
		return NextResponse.json(
			{
				error: 'Failed to track photo action',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
