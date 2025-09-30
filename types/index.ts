// ====== USER PARAMS
export type CreateUserParams = {
	clerkId: string;
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	photo: string;
};

export type UpdateUserParams = {
	firstName: string;
	lastName: string;
	username: string;
	photo: string;
};

// ====== EVENT PARAMS
export type CreateEventParams = {
	userId: string;
	event: {
		title: string;
		description: string;
		location: string;
		imageUrl: string;
		startDateTime: Date;
		endDateTime: Date;
		categoryId: string;
		price: string;
		isFree: boolean;
		url: string;
	};
	path: string;
};

export type UpdateEventParams = {
	userId: string;
	event: {
		_id: string;
		title: string;
		imageUrl: string;
		description: string;
		location: string;
		startDateTime: Date;
		endDateTime: Date;
		categoryId: string;
		price: string;
		isFree: boolean;
		url: string;
	};
	path: string;
};

export type DeleteEventParams = {
	eventId: string;
	path: string;
};

export type GetAllEventsParams = {
	query: string;
	category: string;
	limit: number;
	page: number;
};

export type GetEventsByUserParams = {
	userId: string;
	limit?: number;
	page: number;
};

export type GetRelatedEventsByCategoryParams = {
	categoryId: string;
	eventId: string;
	limit?: number;
	page: number | string;
};

export type Event = {
	_id: string;
	title: string;
	description: string;
	price: string;
	isFree: boolean;
	imageUrl: string;
	location: string;
	startDateTime: Date;
	endDateTime: Date;
	url: string;
	organizer: {
		_id: string;
		firstName: string;
		lastName: string;
	};
	category: {
		_id: string;
		name: string;
	};
};

// ====== CATEGORY PARAMS
export type CreateCategoryParams = {
	categoryName: string;
};

// ====== ORDER PARAMS
export type CheckoutOrderParams = {
	eventTitle: string;
	eventId: string;
	price: string;
	isFree: boolean;
	buyerId: string;
};

export type CreateOrderParams = {
	stripeId: string;
	eventId: string;
	buyerId: string;
	totalAmount: string;
	createdAt: Date;
};

export type GetOrdersByEventParams = {
	eventId: string;
	searchString: string;
};

export type GetOrdersByUserParams = {
	userId: string | null;
	limit?: number;
	page: string | number | null;
};

// ====== ORDER TYPES
export interface IOrder {
	_id: string;
	stripeId: string;
	totalTickets: number;
	totalAmount: number;
	user: string;
	event: any; // This will be populated with event data
	createdAt: Date;
	updatedAt: Date;
}

// ====== URL QUERY PARAMS
export type UrlQueryParams = {
	params: string;
	key: string;
	value: string | null;
};

export type RemoveUrlQueryParams = {
	params: string;
	keysToRemove: string[];
};

export type SearchParamProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
// types/index.ts

// ... other types

// types/index.ts

// ... other types in your file

export type CreateReportParams = {
	userId: string;
	eventId: string;
	path: string;
	report: {
		preparedBy: string;
		eventPurpose: string;
		keyHighlights: string;
		majorOutcomes: string;
		objective: string;
		targetAudience: string;
		eventGoals: string;
		agenda: string;
		// --- FIX: Make optional fields match the form schema ---
		partners?: string;
		budgetAllocation: string;
		vips?: string;
		keySessions?: string;
		photos?: string;
		budget: string;
		sponsorship?: string;
		actualExpenditure: string;
	};
};

// ====== ATTENDEE MANAGEMENT TYPES
export interface IAttendee {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	photo?: string;
	registrationDate: Date;
	totalTickets: number;
	totalAmount: number;
	paymentStatus: 'completed' | 'pending' | 'failed';
	stripeId: string;
	verifiedTickets?: number; // Number of verified tickets
	totalVerified?: boolean; // Whether all tickets are verified
}

export type GetEventAttendeesParams = {
	eventId: string;
	organizerId: string;
	searchString?: string;
	page?: number;
	limit?: number;
};

export type ExportAttendeesParams = {
	eventId: string;
	organizerId: string;
};

// ====== FEEDBACK SYSTEM TYPES
export interface ICustomQuestion {
	id: string;
	question: string;
	type: 'rating' | 'text' | 'multipleChoice' | 'yesNo';
	required: boolean;
	options?: string[]; // For multiple choice questions
}

export interface IFeedbackAnswer {
	questionId: string;
	questionText: string;
	questionType: string;
	answer: string | number;
}

export type CreateFeedbackTemplateParams = {
	eventId: string;
	customQuestions: ICustomQuestion[];
	feedbackHours: number;
};

export type SubmitFeedbackParams = {
	eventId: string;
	userId?: string; // Optional for anonymous feedback
	isAnonymous: boolean;
	overallSatisfaction: number;
	contentQuality: number;
	organizationRating: number;
	venueRating?: number;
	recommendationScore: number;
	likedMost?: string;
	improvements?: string;
	additionalComments?: string;
	customAnswers: IFeedbackAnswer[];
};

export type GetFeedbackResponsesParams = {
	eventId: string;
	organizerId: string;
	page?: number;
	limit?: number;
};

export interface IFeedbackAnalytics {
	totalResponses: number;
	responseRate: number; // percentage
	averageRatings: {
		overallSatisfaction: number;
		contentQuality: number;
		organizationRating: number;
		venueRating?: number;
		recommendationScore: number;
	};
	npsScore: number; // Net Promoter Score
	sentimentAnalysis?: {
		positive: number;
		neutral: number;
		negative: number;
	};
}

// ... other types in your file
