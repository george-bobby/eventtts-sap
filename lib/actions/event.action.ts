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
		data.ticketsLeft = data.totalCapacity;
		data.eventType = 'main';
		data.status = 'published';

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
					totalCapacity: 0,
					ticketsLeft: 0,
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
				event.soldOut = parent.soldOut || event.ticketsLeft <= 0;
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
		await Event.findByIdAndDelete(eventId);
		await Tag.updateMany({ events: eventId }, { $pull: { events: eventId } });
		await User.updateMany(
			{ likedEvents: eventId },
			{ $pull: { likedEvents: eventId } }
		);
		await Order.deleteMany({ event: eventId });
		revalidatePath('/');
		revalidatePath('/profile');
	} catch (error) {
		console.error(error);
		throw new Error('Failed to delete event');
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
