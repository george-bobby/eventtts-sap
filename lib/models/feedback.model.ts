import { Schema, model, models, Document } from 'mongoose';

// Interface for custom questions
export interface ICustomQuestion {
	id: string;
	question: string;
	type: 'rating' | 'text' | 'multipleChoice' | 'yesNo';
	required: boolean;
	options?: string[]; // For multiple choice questions
}

// Interface for feedback responses
export interface IFeedbackAnswer {
	questionId: string;
	questionText: string;
	questionType: string;
	answer: string | number;
}

// Feedback Template Interface
export interface IFeedbackTemplate extends Document {
	_id: string;
	event: Schema.Types.ObjectId;
	customQuestions: ICustomQuestion[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Feedback Response Interface
export interface IFeedbackResponse extends Document {
	_id: string;
	event: Schema.Types.ObjectId;
	user?: Schema.Types.ObjectId; // Optional for anonymous feedback
	isAnonymous: boolean;

	// Default question responses
	overallSatisfaction: number; // 1-5 rating
	contentQuality: number; // 1-5 rating
	organizationRating: number; // 1-5 rating
	venueRating?: number; // 1-5 rating (optional for online events)
	recommendationScore: number; // 1-10 NPS style

	// Text responses
	likedMost?: string;
	improvements?: string;
	additionalComments?: string;

	// Custom question responses
	customAnswers: IFeedbackAnswer[];

	submittedAt: Date;
	ipAddress?: string; // For spam prevention
}

// Feedback Template Schema
const feedbackTemplateSchema = new Schema<IFeedbackTemplate>(
	{
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
			unique: true,
		},
		customQuestions: [
			{
				id: { type: String, required: true },
				question: { type: String, required: true },
				type: {
					type: String,
					enum: ['rating', 'text', 'multipleChoice', 'yesNo'],
					required: true,
				},
				required: { type: Boolean, default: false },
				options: [{ type: String }], // For multiple choice
			},
		],

		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

// Feedback Response Schema
const feedbackResponseSchema = new Schema<IFeedbackResponse>(
	{
		event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
		user: { type: Schema.Types.ObjectId, ref: 'User' },
		isAnonymous: { type: Boolean, default: false },

		// Default questions
		overallSatisfaction: { type: Number, required: true, min: 1, max: 5 },
		contentQuality: { type: Number, required: true, min: 1, max: 5 },
		organizationRating: { type: Number, required: true, min: 1, max: 5 },
		venueRating: { type: Number, min: 1, max: 5 },
		recommendationScore: { type: Number, required: true, min: 1, max: 10 },

		// Text responses
		likedMost: { type: String, maxlength: 1000 },
		improvements: { type: String, maxlength: 1000 },
		additionalComments: { type: String, maxlength: 2000 },

		// Custom answers
		customAnswers: [
			{
				questionId: { type: String, required: true },
				questionText: { type: String, required: true },
				questionType: { type: String, required: true },
				answer: { type: Schema.Types.Mixed, required: true },
			},
		],

		submittedAt: { type: Date, default: Date.now },
		ipAddress: { type: String },
	},
	{ timestamps: true }
);

// Indexes for better performance
feedbackResponseSchema.index({ event: 1, user: 1 });
feedbackResponseSchema.index({ event: 1, submittedAt: -1 });

// Models
const FeedbackTemplate =
	models.FeedbackTemplate || model('FeedbackTemplate', feedbackTemplateSchema);
const FeedbackResponse =
	models.FeedbackResponse || model('FeedbackResponse', feedbackResponseSchema);

export { FeedbackTemplate, FeedbackResponse };
