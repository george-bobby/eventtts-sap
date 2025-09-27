import { Schema, model, models, Document, Types } from 'mongoose';

export interface IEvent extends Document {
	title: string;
	description: string;
	photo: string; // Event cover image
	imageUrl?: string; // Optional alias for photo (compatibility)
	isOnline: boolean;
	location?: string;
	landmark?: string;
	campusLocation?: string; // Campus location for navigation
	startDate: Date;
	endDate: Date;
	startTime: string;
	endTime: string;
	duration?: number;
	totalCapacity: number;
	isFree: boolean;
	price: number;
	category: Types.ObjectId;
	tags: Types.ObjectId[];
	organizer: Types.ObjectId;
	attendees: Types.ObjectId[];
	ticketsLeft: number;
	soldOut: boolean;
	ageRestriction?: number;
	url?: string;
	parentEvent?: Types.ObjectId; // For sub-events
	subEvents: Types.ObjectId[]; // List of sub-events
	eventType?: 'main' | 'sub'; // Event type
	status?: 'draft' | 'published' | 'cancelled';
	createdAt: Date;
	updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
	{
		title: { type: String, required: true },
		description: { type: String, required: true },
		photo: { type: String, required: true },
		imageUrl: { type: String }, // ✅ Extra compatibility field
		isOnline: { type: Boolean, default: false },
		location: { type: String },
		landmark: { type: String, default: 'Virtual' },
		campusLocation: { type: String }, // Campus location for navigation
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		startTime: { type: String, required: true },
		endTime: { type: String, required: true },
		duration: { type: Number },
		totalCapacity: { type: Number, default: 0 },
		isFree: { type: Boolean, default: false },
		price: { type: Number, default: 0 },
		category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
		tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
		organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		ticketsLeft: { type: Number, default: 0 },
		soldOut: { type: Boolean, default: false },
		ageRestriction: { type: Number, default: 0 },
		url: { type: String },
		parentEvent: { type: Schema.Types.ObjectId, ref: 'Event' },
		subEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
		eventType: { type: String, enum: ['main', 'sub'], default: 'main' },
		status: {
			type: String,
			enum: ['draft', 'published', 'cancelled'],
			default: 'published',
		},
	},
	{ timestamps: true }
);

const Event = models.Event || model<IEvent>('Event', eventSchema);

export default Event;
export type EventDocument = IEvent & Document;
