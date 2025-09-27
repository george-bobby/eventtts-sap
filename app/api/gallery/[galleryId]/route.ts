import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
	getPhotoGallery,
	getGalleryPhotos,
	uploadPhotos,
	incrementGalleryViewCount,
} from '@/lib/actions/gallery.action';

/**
 * GET /api/gallery/[galleryId] - Get a specific photo gallery and its photos
 */
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ galleryId: string }> }
) {
	const params = await context.params;
	try {
		const { userId } = await auth();
		const { searchParams } = new URL(request.url);

		const category = searchParams.get('category');
		const tags = searchParams.get('tags')?.split(',').filter(Boolean);
		const search = searchParams.get('search');
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const photosOnly = searchParams.get('photosOnly') === 'true';

		if (photosOnly) {
			// Get only photos
			const photos = await getGalleryPhotos(params.galleryId, {
				category: category || undefined,
				tags,
				search: search || undefined,
				page,
				limit,
			});

			return NextResponse.json({
				success: true,
				data: photos,
			});
		} else {
			// Get gallery info
			const gallery = await getPhotoGallery(
				params.galleryId,
				userId || undefined
			);

			// Increment view count
			await incrementGalleryViewCount(params.galleryId);

			return NextResponse.json({
				success: true,
				data: gallery,
			});
		}
	} catch (error) {
		console.error('Error getting photo gallery:', error);
		return NextResponse.json(
			{
				error: 'Failed to get photo gallery',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/gallery/[galleryId] - Upload photos to a gallery
 */
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ galleryId: string }> }
) {
	const params = await context.params;
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { photos } = body;

		if (!photos || !Array.isArray(photos) || photos.length === 0) {
			return NextResponse.json(
				{ error: 'Photos array is required' },
				{ status: 400 }
			);
		}

		// Validate photo objects
		for (const photo of photos) {
			if (
				!photo.fileName ||
				!photo.originalName ||
				!photo.fileUrl ||
				!photo.fileSize ||
				!photo.mimeType ||
				!photo.dimensions
			) {
				return NextResponse.json(
					{ error: 'Invalid photo object. Missing required fields.' },
					{ status: 400 }
				);
			}
		}

		const uploadedPhotos = await uploadPhotos({
			galleryId: params.galleryId,
			photos,
			uploadedBy: userId,
		});

		return NextResponse.json({
			success: true,
			data: uploadedPhotos,
		});
	} catch (error) {
		console.error('Error uploading photos:', error);
		return NextResponse.json(
			{
				error: 'Failed to upload photos',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
