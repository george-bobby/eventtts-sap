import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { 
  getEventTasks, 
  updateTask, 
  updateMultipleTasks, 
  deleteEventTasks 
} from '@/lib/actions/task.action';

// Zod schema for GET request
const getRequestSchema = z.object({
  eventId: z.string(),
});

// Zod schema for PUT request (update task)
const updateRequestSchema = z.object({
  eventId: z.string(),
  taskId: z.string(),
  updates: z.object({
    content: z.string().optional(),
    column: z.enum(['planning', 'developing', 'reviewing', 'finished']).optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    completed: z.boolean().optional(),
    subtasks: z.array(z.object({
      id: z.string(),
      content: z.string(),
      completed: z.boolean(),
    })).optional(),
  }),
});

// Zod schema for PATCH request (bulk update)
const bulkUpdateRequestSchema = z.object({
  eventId: z.string(),
  taskUpdates: z.array(z.object({
    taskId: z.string(),
    updates: z.object({
      column: z.enum(['planning', 'developing', 'reviewing', 'finished']).optional(),
      completed: z.boolean().optional(),
    }),
  })),
});

// Zod schema for DELETE request
const deleteRequestSchema = z.object({
  eventId: z.string(),
});

// GET - Retrieve tasks for an event
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { eventId: validatedEventId } = getRequestSchema.parse({ eventId });

    const result = await getEventTasks(validatedEventId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: result.tasks,
    });

  } catch (error) {
    console.error('Error getting tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to get tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update a single task
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, taskId, updates } = updateRequestSchema.parse(body);

    const result = await updateTask(eventId, userId, taskId, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      task: result.task,
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      {
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update multiple tasks (for drag and drop)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, taskUpdates } = bulkUpdateRequestSchema.parse(body);

    const result = await updateMultipleTasks(eventId, userId, taskUpdates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tasks updated successfully',
    });

  } catch (error) {
    console.error('Error bulk updating tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to update tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete all tasks for an event
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { eventId: validatedEventId } = deleteRequestSchema.parse({ eventId });

    const result = await deleteEventTasks(validatedEventId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All tasks deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
