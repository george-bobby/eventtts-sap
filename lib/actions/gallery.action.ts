'use server';

import { connectToDatabase } from '../dbconnection';
import {
	PhotoGallery,
	Photo,
	PhotoAccess,
	PhotoComment,
	// New folder-based models
	Folder,
	Image,
	FolderAccess,
	ImageComment,
} from '../models/gallery.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

// New folder-based interfaces
export interface CreateFolderParams {
	eventId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private' | 'restricted';
	accessPassword?: string;
	allowDownload: boolean;
	allowComments: boolean;
	createdBy: string;
}

// Keep old interface for backward compatibility
export interface CreatePhotoGalleryParams {
	eventId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private' | 'restricted';
	accessPassword?: string;
	allowDownload: boolean;
	allowComments: boolean;
	categories: string[];
	createdBy: string;
}

// New folder-based upload interface
export interface UploadImagesParams {
	folderId: string;
	images: {
		fileName: string;
		originalName: string;
		fileUrl: string;
		fileSize: number;
		mimeType: string;
		dimensions: { width: number; height: number };
		metadata?: {
			caption?: string;
			tags?: string[];
			location?: string;
			photographer?: string;
			camera?: string;
			dateTaken?: Date;
		};
	}[];
	uploadedBy: string;
}

// Keep old interface for backward compatibility
export interface UploadPhotosParams {
	galleryId: string;
	photos: {
		fileName: string;
		originalName: string;
		fileUrl: string;
		fileSize: number;
		mimeType: string;
		dimensions: { width: number; height: number };
		metadata?: {
			caption?: string;
			tags?: string[];
			location?: string;
			photographer?: string;
			camera?: string;
			dateTaken?: Date;
		};
		category?: string;
	}[];
	uploadedBy: string;
}

export interface UpdatePhotoParams {
	photoId: string;
	updates: {
		metadata?: {
			caption?: string;
			tags?: string[];
			location?: string;
			photographer?: string;
			camera?: string;
			dateTaken?: Date;
		};
		category?: string;
		visibility?: 'public' | 'private' | 'restricted';
	};
}

/**
 * Create a new folder (updated gallery system)
 */
export async function createFolder(params: CreateFolderParams) {
	try {
		await connectToDatabase();

		// Verify event exists
		const event = await Event.findById(params.eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		// Generate unique shareable link
		const shareableLink = nanoid(12);

		const folder = await Folder.create({
			...params,
			event: params.eventId,
			shareableLink,
		});

		revalidatePath(`/event/${params.eventId}/gallery`);
		return JSON.parse(JSON.stringify(folder));
	} catch (error) {
		console.error('Error creating folder:', error);
		throw error;
	}
}

/**
 * Create a new photo gallery (backward compatibility)
 */
export async function createPhotoGallery(params: CreatePhotoGalleryParams) {
	try {
		await connectToDatabase();

		// Verify event exists
		const event = await Event.findById(params.eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		// Generate unique shareable link
		const shareableLink = nanoid(12);

		const gallery = await PhotoGallery.create({
			...params,
			event: params.eventId,
			shareableLink,
		});

		revalidatePath(`/event/${params.eventId}/gallery`);
		return JSON.parse(JSON.stringify(gallery));
	} catch (error) {
		console.error('Error creating photo gallery:', error);
		throw error;
	}
}

/**
 * Get photo galleries for an event
 */
export async function getEventPhotoGalleries(eventId: string) {
	try {
		await connectToDatabase();

		const galleries = await PhotoGallery.find({ event: eventId })
			.populate('createdBy', 'firstName lastName email')
			.sort({ createdAt: -1 });

		// Get photo counts for each gallery
		const galleriesWithCounts = await Promise.all(
			galleries.map(async (gallery) => {
				const photoCount = await Photo.countDocuments({ gallery: gallery._id });
				return {
					...gallery.toObject(),
					photoCount,
				};
			})
		);

		return JSON.parse(JSON.stringify(galleriesWithCounts));
	} catch (error) {
		console.error('Error getting event photo galleries:', error);
		throw error;
	}
}

/**
 * Get a specific photo gallery by ID or shareable link
 */
export async function getPhotoGallery(
	galleryIdOrLink: string,
	userId?: string
) {
	try {
		await connectToDatabase();

		// Try to find by shareable link first (for public access)
		let gallery = await PhotoGallery.findOne({ shareableLink: galleryIdOrLink })
			.populate('event', 'title description startDate endDate')
			.populate('createdBy', 'firstName lastName email');

		// If not found by shareable link, try by ID (for internal access)
		if (!gallery) {
			gallery = await PhotoGallery.findById(galleryIdOrLink)
				.populate('event', 'title description startDate endDate')
				.populate('createdBy', 'firstName lastName email');
		}

		// Also try the new Folder model
		if (!gallery) {
			gallery = await Folder.findOne({ shareableLink: galleryIdOrLink })
				.populate('event', 'title description startDate endDate')
				.populate('createdBy', 'firstName lastName email');
		}

		if (!gallery) {
			gallery = await Folder.findById(galleryIdOrLink)
				.populate('event', 'title description startDate endDate')
				.populate('createdBy', 'firstName lastName email');
		}

		if (!gallery) {
			throw new Error('Photo gallery not found');
		}

		// Check access permissions
		if (
			gallery.visibility === 'private' &&
			gallery.createdBy._id.toString() !== userId
		) {
			throw new Error('Access denied');
		}

		if (gallery.visibility === 'restricted') {
			// Check if user has access
			const hasAccess = await PhotoAccess.findOne({
				gallery: galleryId,
				$or: [
					{ user: userId },
					{ email: userId }, // If userId is actually an email
				],
			});

			if (!hasAccess && gallery.createdBy._id.toString() !== userId) {
				throw new Error('Access denied');
			}
		}

		return JSON.parse(JSON.stringify(gallery));
	} catch (error) {
		console.error('Error getting photo gallery:', error);
		throw error;
	}
}

/**
 * Upload photos to a gallery
 */
export async function uploadPhotos(params: UploadPhotosParams) {
	try {
		await connectToDatabase();

		const gallery = await PhotoGallery.findById(params.galleryId);
		if (!gallery) {
			throw new Error('Photo gallery not found');
		}

		const photos = await Photo.insertMany(
			params.photos.map((photo) => ({
				...photo,
				gallery: params.galleryId,
				event: gallery.event,
				uploadedBy: params.uploadedBy,
				metadata: {
					caption: photo.metadata?.caption || '',
					tags: photo.metadata?.tags || [],
					location: photo.metadata?.location || '',
					photographer: photo.metadata?.photographer || '',
					camera: photo.metadata?.camera || '',
					dateTaken: photo.metadata?.dateTaken,
				},
			}))
		);

		revalidatePath(`/gallery/${params.galleryId}`);
		return JSON.parse(JSON.stringify(photos));
	} catch (error) {
		console.error('Error uploading photos:', error);
		throw error;
	}
}

/**
 * Get photos from a gallery
 */
export async function getGalleryPhotos(
	galleryId: string,
	filters?: {
		category?: string;
		tags?: string[];
		search?: string;
		page?: number;
		limit?: number;
	}
) {
	try {
		await connectToDatabase();

		const page = filters?.page || 1;
		const limit = filters?.limit || 20;
		const skip = (page - 1) * limit;

		let query: any = { gallery: galleryId };

		if (filters?.category) {
			query.category = filters.category;
		}

		if (filters?.tags && filters.tags.length > 0) {
			query['metadata.tags'] = { $in: filters.tags };
		}

		if (filters?.search) {
			query.$or = [
				{ 'metadata.caption': { $regex: filters.search, $options: 'i' } },
				{ 'metadata.tags': { $regex: filters.search, $options: 'i' } },
				{ 'metadata.photographer': { $regex: filters.search, $options: 'i' } },
			];
		}

		const photos = await Photo.find(query)
			.populate('uploadedBy', 'firstName lastName')
			.sort({ uploadedAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Photo.countDocuments(query);

		return {
			photos: JSON.parse(JSON.stringify(photos)),
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		};
	} catch (error) {
		console.error('Error getting gallery photos:', error);
		throw error;
	}
}

/**
 * Update photo metadata
 */
export async function updatePhoto(params: UpdatePhotoParams) {
	try {
		await connectToDatabase();

		const photo = await Photo.findByIdAndUpdate(
			params.photoId,
			params.updates,
			{ new: true }
		);

		if (!photo) {
			throw new Error('Photo not found');
		}

		revalidatePath(`/gallery/${photo.gallery}`);
		return JSON.parse(JSON.stringify(photo));
	} catch (error) {
		console.error('Error updating photo:', error);
		throw error;
	}
}

/**
 * Delete photo
 */
export async function deletePhoto(photoId: string) {
	try {
		await connectToDatabase();

		const photo = await Photo.findByIdAndDelete(photoId);
		if (!photo) {
			throw new Error('Photo not found');
		}

		// Delete associated comments
		await PhotoComment.deleteMany({ photo: photoId });

		revalidatePath(`/gallery/${photo.gallery}`);
		return { success: true };
	} catch (error) {
		console.error('Error deleting photo:', error);
		throw error;
	}
}

/**
 * Grant access to a gallery
 */
export async function grantGalleryAccess(
	galleryId: string,
	userEmail: string,
	accessType: 'view' | 'download' | 'admin',
	grantedBy: string,
	expiresAt?: Date
) {
	try {
		await connectToDatabase();

		// Check if user exists
		const user = await User.findOne({ email: userEmail });

		const access = await PhotoAccess.create({
			gallery: galleryId,
			user: user?._id,
			email: userEmail,
			accessType,
			grantedBy,
			expiresAt,
		});

		return JSON.parse(JSON.stringify(access));
	} catch (error) {
		console.error('Error granting gallery access:', error);
		throw error;
	}
}

/**
 * Get gallery access list
 */
export async function getGalleryAccess(galleryId: string) {
	try {
		await connectToDatabase();

		const accessList = await PhotoAccess.find({ gallery: galleryId })
			.populate('user', 'firstName lastName email')
			.populate('grantedBy', 'firstName lastName email')
			.sort({ createdAt: -1 });

		return JSON.parse(JSON.stringify(accessList));
	} catch (error) {
		console.error('Error getting gallery access:', error);
		throw error;
	}
}

/**
 * Add comment to photo
 */
export async function addPhotoComment(
	photoId: string,
	comment: string,
	userId?: string,
	guestName?: string,
	guestEmail?: string
) {
	try {
		await connectToDatabase();

		const photo = await Photo.findById(photoId);
		if (!photo) {
			throw new Error('Photo not found');
		}

		const photoComment = await PhotoComment.create({
			photo: photoId,
			gallery: photo.gallery,
			user: userId,
			guestName,
			guestEmail,
			comment,
			isApproved: !!userId, // Auto-approve for logged-in users
		});

		revalidatePath(`/gallery/${photo.gallery}`);
		return JSON.parse(JSON.stringify(photoComment));
	} catch (error) {
		console.error('Error adding photo comment:', error);
		throw error;
	}
}

/**
 * Get photo comments
 */
export async function getPhotoComments(photoId: string) {
	try {
		await connectToDatabase();

		const comments = await PhotoComment.find({
			photo: photoId,
			isApproved: true,
		})
			.populate('user', 'firstName lastName photo')
			.sort({ createdAt: -1 });

		return JSON.parse(JSON.stringify(comments));
	} catch (error) {
		console.error('Error getting photo comments:', error);
		throw error;
	}
}

/**
 * Update gallery view count
 */
export async function incrementGalleryViewCount(galleryId: string) {
	try {
		await connectToDatabase();

		await PhotoGallery.findByIdAndUpdate(galleryId, {
			$inc: { viewCount: 1 },
		});

		return { success: true };
	} catch (error) {
		console.error('Error incrementing gallery view count:', error);
		throw error;
	}
}

/**
 * Update photo download count
 */
export async function incrementPhotoDownloadCount(photoId: string) {
	try {
		await connectToDatabase();

		await Photo.findByIdAndUpdate(photoId, {
			$inc: { downloadCount: 1 },
		});

		return { success: true };
	} catch (error) {
		console.error('Error incrementing photo download count:', error);
		throw error;
	}
}
