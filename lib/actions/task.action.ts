'use server';

import { connectToDatabase } from '../dbconnection';
import Task, { ITask, ISubtask } from '../models/task.model';
import { getUserByClerkId } from './user.action';

export interface TaskSuggestion {
	id: string;
	content: string;
	column: string;
	priority: 'high' | 'medium' | 'low';
	estimatedDuration: string;
	subtasks: Array<{
		id: string;
		content: string;
	}>;
}

// Get tasks for an event
export async function getEventTasks(eventId: string, userId: string) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		const tasks = await Task.find({
			event: eventId,
			organizer: mongoUser._id,
		}).sort({ createdAt: 1 });

		return {
			success: true,
			tasks: tasks.map((task) => ({
				id: task.id,
				content: task.content,
				column: task.column,
				priority: task.priority,
				estimatedDuration: task.estimatedDuration,
				completed: task.completed,
				subtasks: task.subtasks.map((subtask: any) => ({
					id: subtask.id,
					content: subtask.content,
					completed: subtask.completed,
				})),
			})),
		};
	} catch (error) {
		console.error('Error getting event tasks:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Save tasks to database
export async function saveEventTasks(
	eventId: string,
	userId: string,
	tasks: TaskSuggestion[]
) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		// Delete existing tasks for this event
		await Task.deleteMany({
			event: eventId,
			organizer: mongoUser._id,
		});

		// Create new tasks
		const taskDocuments = tasks.map((task) => ({
			id: task.id,
			content: task.content,
			column: task.column,
			priority: task.priority,
			estimatedDuration: task.estimatedDuration,
			completed: false,
			subtasks: task.subtasks.map((subtask) => ({
				id: subtask.id,
				content: subtask.content,
				completed: false,
			})),
			event: eventId,
			organizer: mongoUser._id,
		}));

		await Task.insertMany(taskDocuments);

		return { success: true };
	} catch (error) {
		console.error('Error saving event tasks:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Update a single task
export async function updateTask(
	eventId: string,
	userId: string,
	taskId: string,
	updates: Partial<{
		content: string;
		column: string;
		priority: string;
		estimatedDuration: string;
		completed: boolean;
		subtasks: ISubtask[];
		updateSubtask: { subtaskId: string; content: string };
	}>
) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		// Handle subtask update separately
		if (updates.updateSubtask) {
			const task = await Task.findOneAndUpdate(
				{
					'id': taskId,
					'event': eventId,
					'organizer': mongoUser._id,
					'subtasks.id': updates.updateSubtask.subtaskId,
				},
				{
					$set: { 'subtasks.$.content': updates.updateSubtask.content },
				},
				{ new: true }
			);

			if (!task) {
				throw new Error('Task or subtask not found');
			}

			return { success: true, task };
		}

		// Remove updateSubtask from updates before regular update
		const { updateSubtask, ...regularUpdates } = updates;

		const task = await Task.findOneAndUpdate(
			{
				id: taskId,
				event: eventId,
				organizer: mongoUser._id,
			},
			regularUpdates,
			{ new: true }
		);

		if (!task) {
			throw new Error('Task not found');
		}

		return { success: true, task };
	} catch (error) {
		console.error('Error updating task:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Update multiple tasks (for drag and drop)
export async function updateMultipleTasks(
	eventId: string,
	userId: string,
	taskUpdates: Array<{
		taskId: string;
		updates: Partial<{
			column: string;
			completed: boolean;
		}>;
	}>
) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		// Update tasks in bulk
		const bulkOps = taskUpdates.map(({ taskId, updates }) => ({
			updateOne: {
				filter: {
					id: taskId,
					event: eventId,
					organizer: mongoUser._id,
				},
				update: updates,
			},
		}));

		await Task.bulkWrite(bulkOps);

		return { success: true };
	} catch (error) {
		console.error('Error updating multiple tasks:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Delete all tasks for an event
export async function deleteEventTasks(eventId: string, userId: string) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		await Task.deleteMany({
			event: eventId,
			organizer: mongoUser._id,
		});

		return { success: true };
	} catch (error) {
		console.error('Error deleting event tasks:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Delete a single task
export async function deleteTask(
	eventId: string,
	userId: string,
	taskId: string
) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		const task = await Task.findOneAndDelete({
			id: taskId,
			event: eventId,
			organizer: mongoUser._id,
		});

		if (!task) {
			throw new Error('Task not found');
		}

		return { success: true };
	} catch (error) {
		console.error('Error deleting task:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Delete a subtask
export async function deleteSubtask(
	eventId: string,
	userId: string,
	taskId: string,
	subtaskId: string
) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		// Debug logging
		console.log('Deleting subtask:', {
			eventId,
			userId,
			taskId,
			subtaskId,
			mongoUserId: mongoUser._id,
		});

		// First, find the task to see if it exists
		const existingTask = await Task.findOne({
			id: taskId,
			event: eventId,
			organizer: mongoUser._id,
		});

		console.log('Existing task found:', existingTask ? 'Yes' : 'No');
		if (existingTask) {
			console.log(
				'Task subtasks:',
				existingTask.subtasks.map((s: any) => s.id)
			);
		}

		const task = await Task.findOneAndUpdate(
			{
				id: taskId,
				event: eventId,
				organizer: mongoUser._id,
			},
			{
				$pull: { subtasks: { id: subtaskId } },
			},
			{ new: true }
		);

		if (!task) {
			console.error('Task not found for deletion:', {
				taskId,
				eventId,
				organizerId: mongoUser._id,
			});
			throw new Error(
				'Task not found or you do not have permission to delete this subtask'
			);
		}

		console.log('Subtask deleted successfully:', {
			taskId,
			subtaskId,
			remainingSubtasks: task.subtasks.length,
		});

		return { success: true, task };
	} catch (error) {
		console.error('Error deleting subtask:', {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
			taskId,
			subtaskId,
			eventId,
			userId,
		});
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Unknown error occurred while deleting subtask',
		};
	}
}

// Check if tasks exist for an event
export async function checkTasksExist(eventId: string, userId: string) {
	try {
		await connectToDatabase();

		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			throw new Error('User not found');
		}

		const count = await Task.countDocuments({
			event: eventId,
			organizer: mongoUser._id,
		});

		return { success: true, exists: count > 0 };
	} catch (error) {
		console.error('Error checking if tasks exist:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
