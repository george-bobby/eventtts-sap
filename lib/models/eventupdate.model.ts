import { Schema, model, models, Document } from 'mongoose';

// Interface for Event Update
export interface IEventUpdate extends Document {
  _id: string;
  event: Schema.Types.ObjectId;
  title: string;
  content: string;
  type: 'announcement' | 'schedule_change' | 'location_change' | 'cancellation' | 'reminder' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'scheduled' | 'sent';
  publishedAt?: Date;
  scheduledFor?: Date;
  createdBy: Schema.Types.ObjectId;
  recipients: {
    sendToAll: boolean;
    specificUsers?: Schema.Types.ObjectId[];
    userRoles?: string[]; // e.g., ['attendee', 'speaker', 'organizer']
  };
  deliveryMethods: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    push: boolean;
  };
  emailStats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  };
  attachments?: string[]; // URLs to attached files
  metadata: {
    tags?: string[];
    category?: string;
    relatedUpdates?: Schema.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Event Update Schema
const eventUpdateSchema = new Schema<IEventUpdate>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['announcement', 'schedule_change', 'location_change', 'cancellation', 'reminder', 'general'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'sent'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    scheduledFor: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipients: {
      sendToAll: {
        type: Boolean,
        default: true,
      },
      specificUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      userRoles: [{
        type: String,
        enum: ['attendee', 'speaker', 'organizer', 'volunteer'],
      }],
    },
    deliveryMethods: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    emailStats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    attachments: [{
      type: String, // URLs to files
    }],
    metadata: {
      tags: [{
        type: String,
        trim: true,
      }],
      category: {
        type: String,
        trim: true,
      },
      relatedUpdates: [{
        type: Schema.Types.ObjectId,
        ref: 'EventUpdate',
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
eventUpdateSchema.index({ event: 1, status: 1 });
eventUpdateSchema.index({ event: 1, createdAt: -1 });
eventUpdateSchema.index({ status: 1, scheduledFor: 1 });
eventUpdateSchema.index({ createdBy: 1 });
eventUpdateSchema.index({ type: 1, priority: 1 });

// Models
export const EventUpdate = models.EventUpdate || model<IEventUpdate>('EventUpdate', eventUpdateSchema);

export default EventUpdate;
