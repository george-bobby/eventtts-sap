import { Schema, model, models, Document } from 'mongoose';

// Interface for folder (renamed from photo gallery for hierarchical structure)
export interface IFolder extends Document {
	_id: string;
	event: Schema.Types.ObjectId;
	name: string;
	description?: string;
	coverPhoto?: string;
	visibility: 'public' | 'private' | 'restricted';
	accessPassword?: string;
	allowDownload: boolean;
	allowComments: boolean;
	shareableLink: string;
	linkExpiry?: Date;
	viewCount: number;
	downloadCount: number;
	createdBy: Schema.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

// Keep the old interface for backward compatibility during transition
export interface IPhotoGallery extends IFolder {}

// Interface for individual images (updated to use folder instead of gallery)
export interface IImage extends Document {
	_id: string;
	folder: Schema.Types.ObjectId;
	event: Schema.Types.ObjectId;
	fileName: string;
	originalName: string;
	fileUrl: string;
	thumbnailUrl?: string;
	fileSize: number;
	mimeType: string;
	dimensions: {
		width: number;
		height: number;
	};
	metadata: {
		caption?: string;
		tags: string[];
		location?: string;
		photographer?: string;
		camera?: string;
		dateTaken?: Date;
	};
	visibility: 'public' | 'private' | 'restricted';
	downloadCount: number;
	viewCount: number;
	uploadedBy: Schema.Types.ObjectId;
	uploadedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Keep the old interface for backward compatibility during transition
export interface IPhoto extends IImage {
	gallery: Schema.Types.ObjectId; // Keep for backward compatibility
}

// Interface for folder access control (updated from photo access)
export interface IFolderAccess extends Document {
	_id: string;
	folder: Schema.Types.ObjectId;
	user?: Schema.Types.ObjectId;
	email?: string;
	accessType: 'view' | 'download' | 'admin';
	grantedBy: Schema.Types.ObjectId;
	expiresAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Keep the old interface for backward compatibility during transition
export interface IPhotoAccess extends IFolderAccess {
	gallery: Schema.Types.ObjectId; // Keep for backward compatibility
}

// Interface for image comments (updated from photo comments)
export interface IImageComment extends Document {
	_id: string;
	image: Schema.Types.ObjectId;
	folder: Schema.Types.ObjectId;
	user?: Schema.Types.ObjectId;
	guestName?: string;
	guestEmail?: string;
	comment: string;
	isApproved: boolean;
	approvedBy?: Schema.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

// Keep the old interface for backward compatibility during transition
export interface IPhotoComment extends IImageComment {
	photo: Schema.Types.ObjectId; // Keep for backward compatibility
	gallery: Schema.Types.ObjectId; // Keep for backward compatibility
}

// Folder Schema (renamed from Photo Gallery for hierarchical structure)
const folderSchema = new Schema<IFolder>(
	{
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		coverPhoto: {
			type: String,
		},
		visibility: {
			type: String,
			enum: ['public', 'private', 'restricted'],
			default: 'public',
		},
		accessPassword: {
			type: String,
		},
		allowDownload: {
			type: Boolean,
			default: true,
		},
		allowComments: {
			type: Boolean,
			default: true,
		},
		shareableLink: {
			type: String,
			required: true,
		},
		linkExpiry: {
			type: Date,
		},
		viewCount: {
			type: Number,
			default: 0,
		},
		downloadCount: {
			type: Number,
			default: 0,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Keep the old schema name for backward compatibility
const photoGallerySchema = folderSchema;

// Image Schema (renamed from Photo for hierarchical structure)
const imageSchema = new Schema<IImage>(
	{
		folder: {
			type: Schema.Types.ObjectId,
			ref: 'Folder',
			required: true,
		},
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		fileName: {
			type: String,
			required: true,
		},
		originalName: {
			type: String,
			required: true,
		},
		fileUrl: {
			type: String,
			required: true,
		},
		thumbnailUrl: {
			type: String,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
		dimensions: {
			width: { type: Number, required: true },
			height: { type: Number, required: true },
		},
		metadata: {
			caption: { type: String, trim: true },
			tags: [{ type: String, trim: true }],
			location: { type: String, trim: true },
			photographer: { type: String, trim: true },
			camera: { type: String, trim: true },
			dateTaken: { type: Date },
		},
		visibility: {
			type: String,
			enum: ['public', 'private', 'restricted'],
			default: 'public',
		},
		downloadCount: {
			type: Number,
			default: 0,
		},
		viewCount: {
			type: Number,
			default: 0,
		},
		uploadedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Keep the old schema name for backward compatibility
const photoSchema = new Schema<IPhoto>(
	{
		folder: {
			type: Schema.Types.ObjectId,
			ref: 'Folder',
			required: true,
		},
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		fileName: {
			type: String,
			required: true,
		},
		originalName: {
			type: String,
			required: true,
		},
		fileUrl: {
			type: String,
			required: true,
		},
		thumbnailUrl: {
			type: String,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
		dimensions: {
			width: { type: Number, required: true },
			height: { type: Number, required: true },
		},
		metadata: {
			caption: { type: String, trim: true },
			tags: [{ type: String, trim: true }],
			location: { type: String, trim: true },
			photographer: { type: String, trim: true },
			camera: { type: String, trim: true },
			dateTaken: { type: Date },
		},
		visibility: {
			type: String,
			enum: ['public', 'private', 'restricted'],
			default: 'public',
		},
		downloadCount: {
			type: Number,
			default: 0,
		},
		viewCount: {
			type: Number,
			default: 0,
		},
		uploadedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
		gallery: {
			type: Schema.Types.ObjectId,
			ref: 'PhotoGallery',
		},
	},
	{
		timestamps: true,
	}
);

// Folder Access Schema (renamed from Photo Access)
const folderAccessSchema = new Schema<IFolderAccess>(
	{
		folder: {
			type: Schema.Types.ObjectId,
			ref: 'Folder',
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		accessType: {
			type: String,
			enum: ['view', 'download', 'admin'],
			required: true,
		},
		grantedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		expiresAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

// Keep the old schema name for backward compatibility
const photoAccessSchema = new Schema<IPhotoAccess>(
	{
		folder: {
			type: Schema.Types.ObjectId,
			ref: 'Folder',
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		accessType: {
			type: String,
			enum: ['view', 'download', 'admin'],
			required: true,
		},
		grantedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		expiresAt: {
			type: Date,
		},
		gallery: {
			type: Schema.Types.ObjectId,
			ref: 'PhotoGallery',
		},
	},
	{
		timestamps: true,
	}
);

// Image Comment Schema (renamed from Photo Comment)
const imageCommentSchema = new Schema<IImageComment>(
	{
		image: {
			type: Schema.Types.ObjectId,
			ref: 'Image',
			required: true,
		},
		folder: {
			type: Schema.Types.ObjectId,
			ref: 'Folder',
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		guestName: {
			type: String,
			trim: true,
		},
		guestEmail: {
			type: String,
			lowercase: true,
			trim: true,
		},
		comment: {
			type: String,
			required: true,
			trim: true,
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
		approvedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	}
);

// Keep the old schema name for backward compatibility
const photoCommentSchema = new Schema<IPhotoComment>(
	{
		image: {
			type: Schema.Types.ObjectId,
			ref: 'Image',
			required: true,
		},
		folder: {
			type: Schema.Types.ObjectId,
			ref: 'Folder',
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		guestName: {
			type: String,
			trim: true,
		},
		guestEmail: {
			type: String,
			lowercase: true,
			trim: true,
		},
		comment: {
			type: String,
			required: true,
			trim: true,
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
		approvedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		photo: {
			type: Schema.Types.ObjectId,
			ref: 'Photo',
		},
		gallery: {
			type: Schema.Types.ObjectId,
			ref: 'PhotoGallery',
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
folderSchema.index({ event: 1, visibility: 1 });
folderSchema.index({ shareableLink: 1 });
imageSchema.index({ folder: 1 });
imageSchema.index({ event: 1, visibility: 1 });
imageSchema.index({ 'metadata.tags': 1 });
folderAccessSchema.index({ folder: 1, user: 1 });
folderAccessSchema.index({ folder: 1, email: 1 });
imageCommentSchema.index({ image: 1, isApproved: 1 });

// Note: Old schemas (photoGallerySchema, photoSchema, etc.) are just references to the same schema objects above,
// so they don't need separate index declarations to avoid duplicates

// New Models with updated names
export const Folder = models.Folder || model<IFolder>('Folder', folderSchema);
export const Image = models.Image || model<IImage>('Image', imageSchema);
export const FolderAccess =
	models.FolderAccess ||
	model<IFolderAccess>('FolderAccess', folderAccessSchema);
export const ImageComment =
	models.ImageComment ||
	model<IImageComment>('ImageComment', imageCommentSchema);

// Keep old models for backward compatibility during transition
export const PhotoGallery =
	models.PhotoGallery ||
	model<IPhotoGallery>('PhotoGallery', photoGallerySchema);
export const Photo = models.Photo || model<IPhoto>('Photo', photoSchema);
export const PhotoAccess =
	models.PhotoAccess || model<IPhotoAccess>('PhotoAccess', photoAccessSchema);
export const PhotoComment =
	models.PhotoComment ||
	model<IPhotoComment>('PhotoComment', photoCommentSchema);

export default {
	// New models
	Folder,
	Image,
	FolderAccess,
	ImageComment,
	// Old models for compatibility
	PhotoGallery,
	Photo,
	PhotoAccess,
	PhotoComment,
};
