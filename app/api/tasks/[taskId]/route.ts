import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { headers } from 'next/headers';
import { z } from 'zod';
import { updateTask, deleteTask } from '@/lib/actions/task.action';

// Zod schema for PUT request (edit task)
const editTaskRequestSchema = z.object({
	eventId: z.string(),
	content: z.string().min(1, 'Task content is required'),
	priority: z.enum(['high', 'medium', 'low']).optional(),
	estimatedDuration: z.string().optional(),
});

// Zod schema for DELETE request
const deleteTaskRequestSchema = z.object({
	eventId: z.string(),
});

// PUT - Edit a task
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ taskId: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { taskId } = await params;
		const body = await request.json();
		const { eventId, content, priority, estimatedDuration } =
			editTaskRequestSchema.parse(body);

		const result = await updateTask(eventId, userId, taskId, {
			content,
			priority,
			estimatedDuration,
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		return NextResponse.json({
			success: true,
			task: result.task,
		});
	} catch (error) {
		console.error('Error editing task:', error);
		return NextResponse.json(
			{
				error: 'Failed to edit task',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// DELETE - Delete a single task
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ taskId: string }> }
) {
	try {
		// Await headers() before accessing request.url for Next.js 15 compatibility
		await headers();

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { taskId } = await params;
		const { searchParams } = new URL(request.url);
		const eventId = searchParams.get('eventId');

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		const { eventId: validatedEventId } = deleteTaskRequestSchema.parse({
			eventId,
		});

		const result = await deleteTask(validatedEventId, userId, taskId);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		return NextResponse.json({
			success: true,
			message: 'Task deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting task:', error);
		return NextResponse.json(
			{
				error: 'Failed to delete task',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
