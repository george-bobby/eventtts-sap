import { Schema, model, models, Document } from 'mongoose';

// Interface for stakeholder
export interface IStakeholder extends Document {
  _id: string;
  event: Schema.Types.ObjectId;
  name: string;
  email: string;
  role: 'attendee' | 'speaker' | 'volunteer' | 'organizer' | 'sponsor';
  attendanceStatus: 'registered' | 'attended' | 'no-show' | 'cancelled';
  user?: Schema.Types.ObjectId; // Link to existing user if they have an account
  additionalInfo?: {
    company?: string;
    title?: string;
    phone?: string;
    notes?: string;
  };
  certificateGenerated: boolean;
  certificateId?: Schema.Types.ObjectId;
  emailsSent: {
    welcome: boolean;
    reminder: boolean;
    thankYou: boolean;
    certificate: boolean;
  };
  importedAt: Date;
  importedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for bulk import tracking
export interface IStakeholderImport extends Document {
  _id: string;
  event: Schema.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: {
    row: number;
    field: string;
    value: string;
    error: string;
  }[];
  status: 'processing' | 'completed' | 'failed';
  importedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Stakeholder Schema
const stakeholderSchema = new Schema<IStakeholder>(
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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['attendee', 'speaker', 'volunteer', 'organizer', 'sponsor'],
      required: true,
      default: 'attendee',
    },
    attendanceStatus: {
      type: String,
      enum: ['registered', 'attended', 'no-show', 'cancelled'],
      default: 'registered',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    additionalInfo: {
      company: { type: String, trim: true },
      title: { type: String, trim: true },
      phone: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
    certificateGenerated: {
      type: Boolean,
      default: false,
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
    },
    emailsSent: {
      welcome: { type: Boolean, default: false },
      reminder: { type: Boolean, default: false },
      thankYou: { type: Boolean, default: false },
      certificate: { type: Boolean, default: false },
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Stakeholder Import Schema
const stakeholderImportSchema = new Schema<IStakeholderImport>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    totalRecords: {
      type: Number,
      required: true,
    },
    successfulImports: {
      type: Number,
      default: 0,
    },
    failedImports: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        row: { type: Number, required: true },
        field: { type: String, required: true },
        value: { type: String },
        error: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
stakeholderSchema.index({ event: 1, email: 1 }, { unique: true });
stakeholderSchema.index({ event: 1, role: 1 });
stakeholderSchema.index({ event: 1, attendanceStatus: 1 });
stakeholderSchema.index({ user: 1 });
stakeholderImportSchema.index({ event: 1, status: 1 });

// Models
export const Stakeholder = models.Stakeholder || model<IStakeholder>('Stakeholder', stakeholderSchema);
export const StakeholderImport = models.StakeholderImport || model<IStakeholderImport>('StakeholderImport', stakeholderImportSchema);

export default { Stakeholder, StakeholderImport };
