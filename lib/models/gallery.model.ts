import { Schema, model, models, Document } from 'mongoose';

// Interface for photo gallery
export interface IPhotoGallery extends Document {
  _id: string;
  event: Schema.Types.ObjectId;
  name: string;
  description?: string;
  coverPhoto?: string;
  visibility: 'public' | 'private' | 'restricted';
  accessPassword?: string;
  allowDownload: boolean;
  allowComments: boolean;
  categories: string[];
  shareableLink: string;
  linkExpiry?: Date;
  viewCount: number;
  downloadCount: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for individual photos
export interface IPhoto extends Document {
  _id: string;
  gallery: Schema.Types.ObjectId;
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
  category?: string;
  visibility: 'public' | 'private' | 'restricted';
  downloadCount: number;
  viewCount: number;
  uploadedBy: Schema.Types.ObjectId;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for photo access permissions
export interface IPhotoAccess extends Document {
  _id: string;
  gallery: Schema.Types.ObjectId;
  user?: Schema.Types.ObjectId;
  email?: string;
  accessType: 'view' | 'download' | 'admin';
  grantedBy: Schema.Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
}

// Interface for photo comments
export interface IPhotoComment extends Document {
  _id: string;
  photo: Schema.Types.ObjectId;
  gallery: Schema.Types.ObjectId;
  user?: Schema.Types.ObjectId;
  guestName?: string;
  guestEmail?: string;
  comment: string;
  isApproved: boolean;
  approvedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Photo Gallery Schema
const photoGallerySchema = new Schema<IPhotoGallery>(
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
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    shareableLink: {
      type: String,
      required: true,
      unique: true,
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

// Photo Schema
const photoSchema = new Schema<IPhoto>(
  {
    gallery: {
      type: Schema.Types.ObjectId,
      ref: 'PhotoGallery',
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
    category: {
      type: String,
      trim: true,
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

// Photo Access Schema
const photoAccessSchema = new Schema<IPhotoAccess>(
  {
    gallery: {
      type: Schema.Types.ObjectId,
      ref: 'PhotoGallery',
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

// Photo Comment Schema
const photoCommentSchema = new Schema<IPhotoComment>(
  {
    photo: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true,
    },
    gallery: {
      type: Schema.Types.ObjectId,
      ref: 'PhotoGallery',
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

// Indexes for better performance
photoGallerySchema.index({ event: 1, visibility: 1 });
photoGallerySchema.index({ shareableLink: 1 });
photoSchema.index({ gallery: 1, category: 1 });
photoSchema.index({ event: 1, visibility: 1 });
photoSchema.index({ 'metadata.tags': 1 });
photoAccessSchema.index({ gallery: 1, user: 1 });
photoAccessSchema.index({ gallery: 1, email: 1 });
photoCommentSchema.index({ photo: 1, isApproved: 1 });

// Models
export const PhotoGallery = models.PhotoGallery || model<IPhotoGallery>('PhotoGallery', photoGallerySchema);
export const Photo = models.Photo || model<IPhoto>('Photo', photoSchema);
export const PhotoAccess = models.PhotoAccess || model<IPhotoAccess>('PhotoAccess', photoAccessSchema);
export const PhotoComment = models.PhotoComment || model<IPhotoComment>('PhotoComment', photoCommentSchema);

export default { PhotoGallery, Photo, PhotoAccess, PhotoComment };
