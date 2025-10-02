import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { headers } from 'next/headers';
import { z } from 'zod';
import { updateTask, deleteSubtask } from '@/lib/actions/task.action';

// Zod schema for PUT request (edit subtask)
const editSubtaskRequestSchema = z.object({
	eventId: z.string(),
	content: z.string().min(1, 'Subtask content is required'),
});

// Zod schema for DELETE request
const deleteSubtaskRequestSchema = z.object({
	eventId: z.string(),
});

// PUT - Edit a subtask
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ taskId: string; subtaskId: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { taskId, subtaskId } = await params;
		const body = await request.json();
		const { eventId, content } = editSubtaskRequestSchema.parse(body);

		// Get current task to update subtask
		const result = await updateTask(eventId, userId, taskId, {
			updateSubtask: { subtaskId, content },
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		return NextResponse.json({
			success: true,
			task: result.task,
		});
	} catch (error) {
		console.error('Error editing subtask:', error);
		return NextResponse.json(
			{
				error: 'Failed to edit subtask',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// DELETE - Delete a subtask
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ taskId: string; subtaskId: string }> }
) {
	try {
		// Await headers() before accessing request.url for Next.js 15 compatibility
		await headers();

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { taskId, subtaskId } = await params;
		const { searchParams } = new URL(request.url);
		const eventId = searchParams.get('eventId');

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		const { eventId: validatedEventId } = deleteSubtaskRequestSchema.parse({
			eventId,
		});

		const result = await deleteSubtask(
			validatedEventId,
			userId,
			taskId,
			subtaskId
		);

		if (!result.success) {
			console.error('deleteSubtask action failed:', {
				error: result.error,
				taskId,
				subtaskId,
				eventId: validatedEventId,
				userId,
			});
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		return NextResponse.json({
			success: true,
			message: 'Subtask deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting subtask:', {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
			taskId: (await params).taskId,
			subtaskId: (await params).subtaskId,
		});
		return NextResponse.json(
			{
				error: 'Failed to delete subtask',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
