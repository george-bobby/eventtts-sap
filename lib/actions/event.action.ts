'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '../dbconnection';
import Category from '../models/category.model';
import Event, { IEvent } from '../models/event.model';
import Tag from '../models/tag.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import { Types, Document, FilterQuery } from 'mongoose';
import { getEventStatistics } from './order.action';
import {
	createFeedbackTemplate,
	scheduleFeedbackEmails,
} from './feedback.action';

// Import related models for cleanup
import {
	PhotoGallery,
	Photo,
	PhotoAccess,
	PhotoComment,
} from '../models/gallery.model';
import { CertificateTemplate, Certificate } from '../models/certificate.model';
import {
	FeedbackTemplate,
	FeedbackResponse,
	EmailSchedule,
} from '../models/feedback.model';
import { Stakeholder } from '../models/stakeholder.model';
import { EventUpdate } from '../models/eventupdate.model';
import { QRCode } from '../models/qrcode.model';

// -------------------------------
// TYPES
// -------------------------------
type EventQuery = FilterQuery<IEvent> & {
	parentEvent?: { $exists: boolean } | Types.ObjectId | string;
};

type GetEventsParams = {
	query?: string;
	category?: string;
	page?: number;
	limit?: number;
};

export type EventWithSubEvents = Omit<IEvent, keyof Document | 'subEvents'> & {
	_id: Types.ObjectId;
	subEvents?: IEvent[];
};

// -------------------------------
// HELPERS
// -------------------------------
const getCategoryByName = async (name: string) => {
	return Category.findOneAndUpdate(
		{ name: { $regex: name, $options: 'i' } },
		{ $setOnInsert: { name } },
		{ new: true, upsert: true }
	);
};

// -------------------------------
// CREATE EVENT (with sub-events)
// -------------------------------
export async function createEvent(eventData: any) {
	try {
		await connectToDatabase();

		let data = { ...eventData };
		// Handle capacity: if no capacity is set or 0, make it unlimited (-1)
		if (!data.totalCapacity || data.totalCapacity === 0) {
			data.totalCapacity = -1; // Unlimited capacity
		}
		data.ticketsLeft = data.totalCapacity;
		// Ensure soldOut is set correctly: unlimited capacity events should never be sold out
		data.soldOut = data.totalCapacity !== -1 && data.totalCapacity <= 0;
		data.eventType = 'main';
		data.status = 'published';

		// Ensure startTime and endTime are provided
		if (!data.startTime || data.startTime.trim() === '') {
			data.startTime = '09:00';
		}
		if (!data.endTime || data.endTime.trim() === '') {
			data.endTime = '17:00';
		}

		const category = await getCategoryByName(data.category);
		data.category = category._id;

		const tagIds = await Promise.all(
			data.tags.map((tag: string) =>
				Tag.findOneAndUpdate(
					{ name: { $regex: tag, $options: 'i' } },
					{ $setOnInsert: { name: tag } },
					{ new: true, upsert: true }
				).then((doc) => doc._id)
			)
		);
		data.tags = tagIds;

		const { subEvents, customQuestions, ...mainEventData } = data;
		const mainEvent = await Event.create(mainEventData);

		// Create feedback template if feedback is enabled
		if (mainEventData.feedbackEnabled && customQuestions) {
			try {
				await createFeedbackTemplate({
					eventId: mainEvent._id.toString(),
					customQuestions: customQuestions || [],
					feedbackHours: mainEventData.feedbackHours || 2,
				});

				// Schedule feedback emails
				await scheduleFeedbackEmails(mainEvent._id.toString());
			} catch (feedbackError) {
				console.error('Error setting up feedback for event:', feedbackError);
				// Don't fail the entire event creation if feedback setup fails
			}
		}

		if (subEvents?.length > 0) {
			const subEventIds = [];
			for (const subEventData of subEvents) {
				const newSubEvent = {
					...subEventData,
					parentEvent: mainEvent._id,
					organizer: mainEvent.organizer,
					category: mainEvent.category,
					photo: subEventData.photo || mainEvent.photo,
					// Sub-events inherit parent's capacity management
					totalCapacity: mainEvent.totalCapacity,
					ticketsLeft: mainEvent.ticketsLeft,
					soldOut: false,
					eventType: 'sub',
					status: 'published',
				};
				const subEvent = await Event.create(newSubEvent);
				subEventIds.push(subEvent._id);
			}
			mainEvent.subEvents = subEventIds;
			await mainEvent.save();
		}

		revalidatePath('/');
		return JSON.parse(JSON.stringify(mainEvent));
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create event');
	}
}

// -------------------------------
// GET EVENTS (only main events)
// -------------------------------
export async function getEvents({
	query = '',
	category = '',
	page = 1,
	limit = 6,
}: GetEventsParams) {
	try {
		await connectToDatabase();
		const skipAmount = (Math.max(1, page) - 1) * limit;

		// Build match conditions for aggregation
		const matchConditions: any = {
			parentEvent: { $exists: false },
		};

		if (query) {
			matchConditions.$or = [
				{ title: { $regex: query, $options: 'i' } },
				{ description: { $regex: query, $options: 'i' } },
				{ location: { $regex: query, $options: 'i' } },
				{ landmark: { $regex: query, $options: 'i' } },
			];
		}

		if (category) {
			const categoryDoc = await Category.findOne({ name: category });
			if (categoryDoc) matchConditions.category = categoryDoc._id;
		}

		// Use aggregation pipeline to handle missing references gracefully
		const pipeline = [
			{ $match: matchConditions },

			// Lookup organizer and filter out events with deleted organizers
			{
				$lookup: {
					from: 'users',
					localField: 'organizer',
					foreignField: '_id',
					as: 'organizerData',
				},
			},
			{
				$match: {
					'organizerData.0': { $exists: true }, // Only include events where organizer exists
				},
			},

			// Lookup category
			{
				$lookup: {
					from: 'categories',
					localField: 'category',
					foreignField: '_id',
					as: 'categoryData',
				},
			},

			// Lookup tags with error handling for invalid ObjectIds
			{
				$lookup: {
					from: 'tags',
					let: { eventTags: '$tags' },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ['$_id', '$$eventTags'],
								},
							},
						},
					],
					as: 'tagsData',
				},
			},

			// Project the final structure
			{
				$project: {
					title: 1,
					description: 1,
					photo: 1,
					imageUrl: 1,
					isOnline: 1,
					location: 1,
					landmark: 1,
					campusLocation: 1,
					startDate: 1,
					endDate: 1,
					startTime: 1,
					endTime: 1,
					duration: 1,
					totalCapacity: 1,
					isFree: 1,
					price: 1,
					ticketsLeft: 1,
					soldOut: 1,
					ageRestriction: 1,
					url: 1,
					eventType: 1,
					status: 1,
					feedbackEnabled: 1,
					feedbackHours: 1,
					createdAt: 1,
					updatedAt: 1,
					category: { $arrayElemAt: ['$categoryData', 0] },
					organizer: {
						$arrayElemAt: ['$organizerData', 0],
					},
					tags: '$tagsData',
				},
			},

			// Sort and paginate
			{ $sort: { createdAt: -1 as -1 } },
			{ $skip: skipAmount },
			{ $limit: limit },
		];

		const events = await Event.aggregate(pipeline);

		// Get total count with the same filtering
		const countPipeline = [
			{ $match: matchConditions },
			{
				$lookup: {
					from: 'users',
					localField: 'organizer',
					foreignField: '_id',
					as: 'organizerData',
				},
			},
			{
				$match: {
					'organizerData.0': { $exists: true },
				},
			},
			{ $count: 'total' },
		];

		const countResult = await Event.aggregate(countPipeline);
		const total = countResult[0]?.total || 0;

		return {
			events: JSON.parse(JSON.stringify(events)),
			totalPages: Math.ceil(total / limit),
		};
	} catch (error) {
		console.error(error);
		throw new Error('Failed to fetch events');
	}
}

// -------------------------------
// GET EVENT BY ID (handles parent/child inheritance)
// -------------------------------
export async function getEventById(
	id: string
): Promise<EventWithSubEvents | null> {
	try {
		await connectToDatabase();

		// Use aggregation to handle missing organizer gracefully
		const eventPipeline = [
			{ $match: { _id: new Types.ObjectId(id) } },

			// Lookup organizer and filter out events with deleted organizers
			{
				$lookup: {
					from: 'users',
					localField: 'organizer',
					foreignField: '_id',
					as: 'organizerData',
				},
			},
			{
				$match: {
					'organizerData.0': { $exists: true }, // Only include events where organizer exists
				},
			},

			// Lookup category
			{
				$lookup: {
					from: 'categories',
					localField: 'category',
					foreignField: '_id',
					as: 'categoryData',
				},
			},

			// Lookup tags with error handling for invalid ObjectIds
			{
				$lookup: {
					from: 'tags',
					let: { eventTags: '$tags' },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ['$_id', '$$eventTags'],
								},
							},
						},
					],
					as: 'tagsData',
				},
			},

			// Project the final structure
			{
				$project: {
					title: 1,
					description: 1,
					photo: 1,
					imageUrl: 1,
					isOnline: 1,
					location: 1,
					landmark: 1,
					campusLocation: 1,
					startDate: 1,
					endDate: 1,
					startTime: 1,
					endTime: 1,
					duration: 1,
					totalCapacity: 1,
					isFree: 1,
					price: 1,
					ticketsLeft: 1,
					soldOut: 1,
					ageRestriction: 1,
					url: 1,
					parentEvent: 1,
					subEvents: 1,
					eventType: 1,
					status: 1,
					feedbackEnabled: 1,
					feedbackHours: 1,
					createdAt: 1,
					updatedAt: 1,
					category: { $arrayElemAt: ['$categoryData', 0] },
					organizer: {
						$let: {
							vars: { org: { $arrayElemAt: ['$organizerData', 0] } },
							in: {
								_id: '$$org._id',
								username: '$$org.username',
								photo: '$$org.photo',
							},
						},
					},
					tags: '$tagsData',
				},
			},
		];

		const eventResult = await Event.aggregate(eventPipeline);
		const event = eventResult[0];

		if (!event) return null;

		if (event.parentEvent) {
			const parent = (await Event.findById(event.parentEvent)
				.select('photo isFree price totalCapacity ticketsLeft soldOut')
				.lean()) as any;
			if (parent) {
				event.photo = parent.photo || event.photo;
				event.ticketsLeft = parent.ticketsLeft ?? event.ticketsLeft ?? 0;
				// Fix: Don't mark unlimited capacity events (-1) as sold out
				event.soldOut =
					parent.soldOut ||
					(event.ticketsLeft !== -1 && event.ticketsLeft <= 0);
				event.price = parent.price;
				event.isFree = parent.isFree;
			}
		} else {
			// Get sub-events using aggregation to handle deleted organizers
			const subEventsPipeline = [
				{ $match: { parentEvent: event._id } },
				{
					$lookup: {
						from: 'users',
						localField: 'organizer',
						foreignField: '_id',
						as: 'organizerData',
					},
				},
				{
					$match: {
						'organizerData.0': { $exists: true },
					},
				},
				{
					$lookup: {
						from: 'categories',
						localField: 'category',
						foreignField: '_id',
						as: 'categoryData',
					},
				},
				{
					$lookup: {
						from: 'tags',
						let: { eventTags: '$tags' },
						pipeline: [
							{
								$match: {
									$expr: {
										$in: ['$_id', '$$eventTags'],
									},
								},
							},
						],
						as: 'tagsData',
					},
				},
				{
					$project: {
						title: 1,
						description: 1,
						photo: 1,
						imageUrl: 1,
						isOnline: 1,
						location: 1,
						landmark: 1,
						campusLocation: 1,
						startDate: 1,
						endDate: 1,
						startTime: 1,
						endTime: 1,
						duration: 1,
						totalCapacity: 1,
						isFree: 1,
						price: 1,
						ticketsLeft: 1,
						soldOut: 1,
						ageRestriction: 1,
						url: 1,
						parentEvent: 1,
						eventType: 1,
						status: 1,
						feedbackEnabled: 1,
						feedbackHours: 1,
						createdAt: 1,
						updatedAt: 1,
						category: { $arrayElemAt: ['$categoryData', 0] },
						organizer: {
							$let: {
								vars: { org: { $arrayElemAt: ['$organizerData', 0] } },
								in: {
									_id: '$$org._id',
									username: '$$org.username',
									photo: '$$org.photo',
								},
							},
						},
						tags: '$tagsData',
					},
				},
			];

			const subEvents = await Event.aggregate(subEventsPipeline);

			event.subEvents = subEvents.map((s: any) => ({
				...s,
				photo: event.photo,
				ticketsLeft: event.ticketsLeft,
				soldOut: event.soldOut,
				price: event.price,
				isFree: event.isFree,
			}));
		}

		return event as EventWithSubEvents;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to fetch event by ID');
	}
}

// -------------------------------
// UPDATE / DELETE
// -------------------------------
export async function updateEvent({
	userId,
	event,
	path,
}: {
	userId: string;
	event: any;
	path: string;
}) {
	try {
		await connectToDatabase();

		const eventToUpdate = await Event.findById(event._id);
		if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
			throw new Error('Unauthorized or event not found');
		}

		const category = await getCategoryByName(event.category);
		const tagIds = await Promise.all(
			event.tags.map((tag: string) =>
				Tag.findOneAndUpdate(
					{ name: { $regex: tag, $options: 'i' } },
					{ $setOnInsert: { name: tag } },
					{ new: true, upsert: true }
				).then((doc) => doc._id)
			)
		);

		const updatedEvent = await Event.findByIdAndUpdate(
			event._id,
			{ ...event, category: category._id, tags: tagIds },
			{ new: true }
		);

		revalidatePath(path);
		return JSON.parse(JSON.stringify(updatedEvent));
	} catch (error) {
		console.error(error);
		throw new Error('Failed to update event');
	}
}

export async function deleteEventById(eventId: string) {
	try {
		await connectToDatabase();

		// Validate eventId
		if (!eventId || !Types.ObjectId.isValid(eventId)) {
			throw new Error('Invalid event ID provided');
		}

		// Check if event exists
		const event = await Event.findById(eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		// Convert eventId to ObjectId for queries
		const eventObjectId = new Types.ObjectId(eventId);

		// Delete in proper order to avoid foreign key constraint issues
		console.log(
			`Starting deletion of event ${eventId} and all related data...`
		);

		// 1. Delete photos and photo-related data
		console.log('Deleting photo gallery data...');
		const galleries = await PhotoGallery.find({ event: eventObjectId });
		const galleryIds = galleries.map((g) => g._id);

		if (galleryIds.length > 0) {
			const photos = await Photo.find({ gallery: { $in: galleryIds } });
			const photoIds = photos.map((p) => p._id);

			if (photoIds.length > 0) {
				await PhotoComment.deleteMany({ photo: { $in: photoIds } });
			}
			await PhotoAccess.deleteMany({ gallery: { $in: galleryIds } });
			await Photo.deleteMany({ gallery: { $in: galleryIds } });
			await PhotoGallery.deleteMany({ event: eventObjectId });
		}

		// 2. Delete certificates
		console.log('Deleting certificate data...');
		await Certificate.deleteMany({ event: eventObjectId });
		await CertificateTemplate.deleteMany({ event: eventObjectId });

		// 3. Delete feedback data
		console.log('Deleting feedback data...');
		await FeedbackResponse.deleteMany({ event: eventObjectId });
		await FeedbackTemplate.deleteMany({ event: eventObjectId });
		await EmailSchedule.deleteMany({ event: eventObjectId });

		// 4. Delete stakeholders
		console.log('Deleting stakeholder data...');
		await Stakeholder.deleteMany({ event: eventObjectId });

		// 5. Delete event updates
		console.log('Deleting event updates...');
		await EventUpdate.deleteMany({ event: eventObjectId });

		// 6. Delete QR codes
		console.log('Deleting QR codes...');
		await QRCode.deleteMany({ event: eventObjectId });

		// 7. Delete orders (tickets)
		console.log('Deleting orders...');
		await Order.deleteMany({ event: eventId });

		// 8. Delete sub-events if this is a parent event
		console.log('Deleting sub-events...');
		await Event.deleteMany({ parentEvent: eventObjectId });

		// 9. Remove event references from tags and users
		console.log('Cleaning up references...');
		await Tag.updateMany({ events: eventId }, { $pull: { events: eventId } });
		await User.updateMany(
			{ likedEvents: eventId },
			{ $pull: { likedEvents: eventId } }
		);

		// 10. Finally, delete the main event
		console.log('Deleting main event...');
		await Event.findByIdAndDelete(eventId);

		// Revalidate paths
		revalidatePath('/');
		revalidatePath('/profile');
		revalidatePath('/explore-events');

		console.log(`Event ${eventId} and all related data successfully deleted.`);
		return { success: true };
	} catch (error) {
		console.error('Error deleting event:', error);

		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.message.includes('Event not found')) {
				throw new Error('Event not found or already deleted');
			} else if (error.message.includes('Invalid event ID')) {
				throw new Error('Invalid event ID provided');
			}
		}

		throw new Error(
			'Failed to delete event. Please try again or contact support.'
		);
	}
}

// -------------------------------
// RELATED EVENTS & SALES REPORT
// -------------------------------
export async function getRelatedEvents(id: string) {
	try {
		await connectToDatabase();
		const event = await Event.findById(id);
		if (!event) throw new Error('Event not found');

		// Use aggregation to handle missing organizers gracefully
		const pipeline = [
			{
				$match: {
					_id: { $ne: event._id },
					$or: [{ category: event.category }, { tags: { $in: event.tags } }],
				},
			},

			// Lookup organizer and filter out events with deleted organizers
			{
				$lookup: {
					from: 'users',
					localField: 'organizer',
					foreignField: '_id',
					as: 'organizerData',
				},
			},
			{
				$match: {
					'organizerData.0': { $exists: true }, // Only include events where organizer exists
				},
			},

			// Lookup category
			{
				$lookup: {
					from: 'categories',
					localField: 'category',
					foreignField: '_id',
					as: 'categoryData',
				},
			},

			// Lookup tags with error handling for invalid ObjectIds
			{
				$lookup: {
					from: 'tags',
					let: { eventTags: '$tags' },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ['$_id', '$$eventTags'],
								},
							},
						},
					],
					as: 'tagsData',
				},
			},

			// Project the final structure
			{
				$project: {
					title: 1,
					description: 1,
					photo: 1,
					imageUrl: 1,
					isOnline: 1,
					location: 1,
					landmark: 1,
					campusLocation: 1,
					startDate: 1,
					endDate: 1,
					startTime: 1,
					endTime: 1,
					duration: 1,
					totalCapacity: 1,
					isFree: 1,
					price: 1,
					ticketsLeft: 1,
					soldOut: 1,
					ageRestriction: 1,
					url: 1,
					eventType: 1,
					status: 1,
					feedbackEnabled: 1,
					feedbackHours: 1,
					createdAt: 1,
					updatedAt: 1,
					category: { $arrayElemAt: ['$categoryData', 0] },
					organizer: {
						$let: {
							vars: { org: { $arrayElemAt: ['$organizerData', 0] } },
							in: {
								_id: '$$org._id',
								firstName: '$$org.firstName',
								lastName: '$$org.lastName',
								email: '$$org.email',
							},
						},
					},
					tags: '$tagsData',
				},
			},

			{ $limit: 3 },
		];

		const related = await Event.aggregate(pipeline);

		return JSON.parse(JSON.stringify(related));
	} catch (error) {
		console.error(error);
		throw new Error('Failed to fetch related events');
	}
}

export async function getEventsByUserId({
	userId,
	page = 1,
	limit = 6,
}: {
	userId: string;
	page?: number;
	limit?: number;
}) {
	try {
		await connectToDatabase();
		const skip = (Math.max(1, page) - 1) * limit;

		const events = await Event.find({ organizer: userId })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate('category', 'name')
			.populate({
				path: 'organizer',
				model: 'User',
				select: '_id firstName lastName clerkId',
			})
			.populate('tags', 'name');

		const count = await Event.countDocuments({ organizer: userId });
		return {
			data: JSON.parse(JSON.stringify(events)),
			totalPages: Math.ceil(count / limit),
		};
	} catch (error) {
		console.error(error);
		throw new Error('Failed to fetch user events');
	}
}

export async function generateSalesReport(eventId: string) {
	try {
		return await getEventStatistics(eventId);
	} catch (error) {
		console.error(error);
		throw new Error('Failed to generate sales report');
	}
}

// Function to fix existing events with 0 capacity to unlimited
export async function fixEventCapacities() {
	try {
		await connectToDatabase();

		// Update all events with totalCapacity 0 to unlimited (-1)
		const result1 = await Event.updateMany(
			{ totalCapacity: 0 },
			{
				$set: {
					totalCapacity: -1,
					ticketsLeft: -1,
					soldOut: false,
				},
			}
		);

		// Fix events that have unlimited capacity (-1) but are marked as sold out
		const result2 = await Event.updateMany(
			{
				$or: [
					{ ticketsLeft: -1, soldOut: true },
					{ totalCapacity: -1, soldOut: true },
				],
			},
			{
				$set: {
					soldOut: false,
				},
			}
		);

		// Fix inconsistent data: events with limited totalCapacity but unlimited ticketsLeft
		const result3 = await Event.updateMany(
			{
				totalCapacity: { $gt: 0 },
				ticketsLeft: -1,
			},
			[
				{
					$set: {
						ticketsLeft: '$totalCapacity',
					},
				},
			]
		);

		console.log(`Fixed ${result1.modifiedCount} events with 0 capacity`);
		console.log(
			`Fixed ${result2.modifiedCount} unlimited capacity events marked as sold out`
		);
		console.log(
			`Fixed ${result3.modifiedCount} events with inconsistent capacity data`
		);
		return { result1, result2, result3 };
	} catch (error) {
		console.log(error);
		throw error;
	}
}
