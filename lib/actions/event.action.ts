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

		const { subEvents, ...mainEventData } = data;
		const mainEvent = await Event.create(mainEventData);

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

		const searchQuery: EventQuery = {};
		if (query) {
			searchQuery.$or = [
				{ title: { $regex: query, $options: 'i' } },
				{ description: { $regex: query, $options: 'i' } },
				{ location: { $regex: query, $options: 'i' } },
				{ landmark: { $regex: query, $options: 'i' } },
			];
		}
		if (category) {
			const categoryDoc = await Category.findOne({ name: category });
			if (categoryDoc) searchQuery.category = categoryDoc._id;
		}
		searchQuery.parentEvent = { $exists: false };

		const events = await Event.find(searchQuery)
			.populate('category', 'name')
			.populate('organizer', 'firstName lastName email')
			.populate('tags', 'name')
			.sort({ createdAt: -1 })
			.skip(skipAmount)
			.limit(limit)
			.lean<IEvent[]>();

		const total = await Event.countDocuments(searchQuery);
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

		const event = (await Event.findById(id)
			.populate('organizer', 'username photo')
			.populate('category', 'name')
			.populate('tags', 'name')
			.lean()) as any;

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
			const subEvents = (await Event.find({ parentEvent: event._id })
				.populate('organizer', 'username photo')
				.populate('category', 'name')
				.populate('tags', 'name')
				.lean()) as any[];

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

		const related = await Event.find({
			_id: { $ne: event._id },
			$or: [{ category: event.category }, { tags: { $in: event.tags } }],
		})
			.limit(3)
			.populate('category', 'name')
			.populate('organizer', 'firstName lastName email')
			.populate('tags', 'name');

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
