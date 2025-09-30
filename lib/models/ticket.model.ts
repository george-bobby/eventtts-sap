import { Schema, model, models, Document } from 'mongoose';

// Interface for Ticket
export interface ITicket extends Document {
	_id: string;
	event: Schema.Types.ObjectId;
	user: Schema.Types.ObjectId;
	order?: Schema.Types.ObjectId;
	ticketId: string; // Unique ticket identifier
	entryCode: string; // 6-digit entry code for verification
	status: 'active' | 'used' | 'expired' | 'cancelled';
	verifiedAt?: Date;
	verifiedBy?: Schema.Types.ObjectId;
	expiresAt?: Date;
	metadata: {
		ticketType?: string;
		seatNumber?: string;
		section?: string;
		additionalInfo?: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

// Ticket Schema
const ticketSchema = new Schema<ITicket>(
	{
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		order: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
		},
		ticketId: {
			type: String,
			required: true,
		},
		entryCode: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ['active', 'used', 'expired', 'cancelled'],
			default: 'active',
		},
		verifiedAt: {
			type: Date,
		},
		verifiedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		expiresAt: {
			type: Date,
		},
		metadata: {
			ticketType: { type: String },
			seatNumber: { type: String },
			section: { type: String },
			additionalInfo: { type: String },
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
ticketSchema.index({ event: 1, user: 1 });
ticketSchema.index({ ticketId: 1 }, { unique: true });
ticketSchema.index({ entryCode: 1, event: 1 }); // Composite index for verification
ticketSchema.index({ status: 1 });
ticketSchema.index({ expiresAt: 1 });

// Models
export const Ticket = models.Ticket || model<ITicket>('Ticket', ticketSchema);

export default Ticket;
