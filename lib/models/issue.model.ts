import { Schema, model, models, Document, Types } from 'mongoose';

export interface IIssue extends Document {
    eventId: Types.ObjectId;
    eventTitle: string;
    reportedBy: Types.ObjectId;
    reporterName: string;
    reporterEmail: string;
    category: 'event-info' | 'tickets-registration' | 'event-experience' | 'payments' | 'other';
    subcategory?: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    attachments: string[]; // URLs to uploaded files
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    organizer: Types.ObjectId;
    organizerEmail: string;
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}

const issueSchema = new Schema<IIssue>(
    {
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        eventTitle: { type: String, required: true },
        reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reporterName: { type: String, required: true },
        reporterEmail: { type: String, required: true },
        category: {
            type: String,
            enum: ['event-info', 'tickets-registration', 'event-experience', 'payments', 'other'],
            required: true
        },
        subcategory: { type: String },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true,
            default: 'medium'
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        attachments: [{ type: String }],
        status: {
            type: String,
            enum: ['open', 'in-progress', 'resolved', 'closed'],
            default: 'open'
        },
        organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        organizerEmail: { type: String, required: true },
        adminNotes: { type: String },
        resolvedAt: { type: Date }
    },
    {
        timestamps: true,
    }
);

const Issue = models.Issue || model<IIssue>('Issue', issueSchema);

export default Issue;