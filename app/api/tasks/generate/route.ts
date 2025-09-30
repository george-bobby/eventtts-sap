import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { z } from 'zod';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { saveEventTasks, checkTasksExist } from '@/lib/actions/task.action';

// Zod schema for request body
const requestSchema = z.object({
	eventType: z.string(),
	eventTitle: z.string().optional(),
	eventDescription: z.string().optional(),
	isSubEvent: z.boolean().optional(),
	eventDetails: z
		.object({
			location: z.string().optional(),
			isOnline: z.boolean().optional(),
			capacity: z.number().optional(),
			startDate: z.string().optional(),
			endDate: z.string().optional(),
			isFree: z.boolean().optional(),
			price: z.number().optional(),
			category: z.string().optional(),
		})
		.optional(),
	eventId: z.string(),
	forceRegenerate: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
	// Declare variables outside try block to make them accessible in catch
	let mongoUser: any = null;
	let eventId: string = '';
	let isSubEvent: boolean = false;

	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get MongoDB user ID
		mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const {
			eventType,
			eventTitle,
			eventDescription,
			isSubEvent: parsedIsSubEvent,
			eventDetails,
			eventId: parsedEventId,
			forceRegenerate,
		} = requestSchema.parse(body);

		// Assign to variables accessible in catch block
		isSubEvent = parsedIsSubEvent || false;
		eventId = parsedEventId;

		// Check if tasks already exist for this event
		if (!forceRegenerate) {
			const existingTasksResult = await checkTasksExist(eventId, userId);
			if (existingTasksResult.success && existingTasksResult.exists) {
				return NextResponse.json({
					success: true,
					message: 'Tasks already exist for this event',
					tasksExist: true,
				});
			}
		}

		// Build context for AI generation
		const eventContext = eventDetails
			? `
      Event Details:
      - Location: ${
				eventDetails.isOnline ? 'Online Event' : eventDetails.location || 'TBD'
			}
      - Capacity: ${eventDetails.capacity || 'Unlimited'}
      - Duration: ${
				eventDetails.startDate && eventDetails.endDate
					? `${new Date(
							eventDetails.startDate
					  ).toLocaleDateString()} to ${new Date(
							eventDetails.endDate
					  ).toLocaleDateString()}`
					: 'TBD'
			}
      - Pricing: ${
				eventDetails.isFree
					? 'Free Event'
					: `₹${eventDetails.price || 0} per ticket`
			}
      - Category: ${eventDetails.category || 'General'}
    `
			: '';

		// Build the task count string
		const taskCount = isSubEvent ? '6-8' : '8-12';

		const prompt = `You are an expert event planner. Generate a comprehensive task list for organizing a ${eventType} event.

    ${eventTitle ? `Event Title: ${eventTitle}` : ''}
    ${eventDescription ? `Event Description: ${eventDescription}` : ''}
    ${eventContext}

    ${
			isSubEvent
				? 'This is a sub-event that is part of a larger main event.'
				: 'This is a standalone main event.'
		}

    Create tasks that cover all aspects of event planning including:
    - Initial planning and conceptualization
    - Venue/platform setup and logistics
    - Marketing and promotion
    - Registration and ticketing
    - Content and program development
    - Vendor and stakeholder coordination
    - Day-of-event execution
    - Post-event activities

    Distribute tasks across these columns:
    - "planning" (initial setup and preparation)
    - "developing" (active development and creation)
    - "reviewing" (quality checks and final preparations)
    - "finished" (completed or day-of tasks)

    Priority levels:
    - "high" for critical path items
    - "medium" for important but flexible items
    - "low" for nice-to-have items

    Generate ${taskCount} tasks total, distributed across the phases appropriately.
    Each task should have 2-4 relevant subtasks.
    Estimated duration should be realistic (e.g., "2 hours", "1 day", "3 days", "1 week").

    Make tasks specific and actionable, considering the event type and details provided.`;

		// Generate tasks using AI SDK with text generation
		let tasksData: { tasks: any[] };
		try {
			const result = await generateText({
				model: google('gemini-2.0-flash-exp'),
				prompt:
					prompt +
					'\n\nReturn ONLY a valid JSON object with this structure: {"tasks": [...]}',
			});

			// Parse the JSON response
			tasksData = JSON.parse(result.text);

			// Validate the structure
			if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
				throw new Error('Invalid response structure');
			}
		} catch (aiError) {
			console.error('AI generation failed:', aiError);
			throw new Error('Failed to generate tasks with AI');
		}

		// Transform tasks to include IDs
		const tasksWithIds = tasksData.tasks.map((task: any, index: number) => {
			const baseId = Date.now();
			return {
				id: `task_${baseId}_${index}`,
				content: task.content,
				column: task.column,
				priority: task.priority,
				estimatedDuration: task.estimatedDuration,
				subtasks: (task.subtasks || []).map(
					(subtask: any, subIndex: number) => ({
						id: `subtask_${baseId}_${index}_${subIndex}`,
						content: subtask.content,
					})
				),
			};
		});

		// Save tasks to database
		const saveResult = await saveEventTasks(
			eventId,
			mongoUser._id.toString(),
			tasksWithIds
		);
		if (!saveResult.success) {
			throw new Error(saveResult.error || 'Failed to save tasks');
		}

		return NextResponse.json({
			success: true,
			tasks: tasksWithIds,
			message: 'Tasks generated and saved successfully',
		});
	} catch (error) {
		console.error('Error generating tasks:', error);

		// Return fallback tasks in case of AI failure
		const fallbackTasks = getFallbackTasks(isSubEvent || false);

		if (mongoUser && eventId) {
			try {
				await saveEventTasks(eventId, mongoUser._id.toString(), fallbackTasks);
				return NextResponse.json({
					success: true,
					tasks: fallbackTasks,
					message: 'Fallback tasks generated due to AI service error',
					fallback: true,
				});
			} catch (saveError) {
				return NextResponse.json(
					{
						error: 'Failed to generate and save fallback tasks',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		return NextResponse.json(
			{
				error: 'Failed to generate tasks',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// Fallback tasks function
function getFallbackTasks(isSubEvent?: boolean) {
	const baseId = Date.now();

	if (isSubEvent) {
		return [
			{
				id: `fallback_${baseId}_1`,
				content: 'Coordinate with main event team',
				column: 'planning',
				priority: 'high' as const,
				estimatedDuration: '1 hour',
				subtasks: [
					{
						id: `fallback_sub_${baseId}_1_1`,
						content: 'Review main event timeline',
					},
					{
						id: `fallback_sub_${baseId}_1_2`,
						content: 'Align sub-event objectives',
					},
					{
						id: `fallback_sub_${baseId}_1_3`,
						content: 'Confirm resource allocation',
					},
				],
			},
			{
				id: `fallback_${baseId}_2`,
				content: 'Plan sub-event logistics',
				column: 'planning',
				priority: 'high' as const,
				estimatedDuration: '2 hours',
				subtasks: [
					{
						id: `fallback_sub_${baseId}_2_1`,
						content: 'Define space requirements',
					},
					{ id: `fallback_sub_${baseId}_2_2`, content: 'Schedule setup time' },
				],
			},
			{
				id: `fallback_${baseId}_3`,
				content: 'Develop content and materials',
				column: 'developing',
				priority: 'medium' as const,
				estimatedDuration: '1 day',
				subtasks: [
					{
						id: `fallback_sub_${baseId}_3_1`,
						content: 'Create presentation materials',
					},
					{ id: `fallback_sub_${baseId}_3_2`, content: 'Prepare handouts' },
				],
			},
			{
				id: `fallback_${baseId}_4`,
				content: 'Final preparations',
				column: 'reviewing',
				priority: 'high' as const,
				estimatedDuration: '2 hours',
				subtasks: [
					{ id: `fallback_sub_${baseId}_4_1`, content: 'Test equipment' },
					{ id: `fallback_sub_${baseId}_4_2`, content: 'Brief team members' },
				],
			},
		];
	}

	return [
		{
			id: `fallback_${baseId}_1`,
			content: 'Define event concept and objectives',
			column: 'planning',
			priority: 'high' as const,
			estimatedDuration: '2 hours',
			subtasks: [
				{ id: `fallback_sub_${baseId}_1_1`, content: 'Set clear event goals' },
				{ id: `fallback_sub_${baseId}_1_2`, content: 'Define target audience' },
				{ id: `fallback_sub_${baseId}_1_3`, content: 'Create event theme' },
			],
		},
		{
			id: `fallback_${baseId}_2`,
			content: 'Secure venue and logistics',
			column: 'planning',
			priority: 'high' as const,
			estimatedDuration: '1 week',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_2_1`,
					content: 'Research and book venue',
				},
				{ id: `fallback_sub_${baseId}_2_2`, content: 'Arrange catering' },
				{ id: `fallback_sub_${baseId}_2_3`, content: 'Plan transportation' },
			],
		},
		{
			id: `fallback_${baseId}_3`,
			content: 'Develop marketing strategy',
			column: 'developing',
			priority: 'medium' as const,
			estimatedDuration: '3 days',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_3_1`,
					content: 'Create promotional materials',
				},
				{
					id: `fallback_sub_${baseId}_3_2`,
					content: 'Set up social media campaigns',
				},
				{
					id: `fallback_sub_${baseId}_3_3`,
					content: 'Reach out to media contacts',
				},
			],
		},
		{
			id: `fallback_${baseId}_4`,
			content: 'Coordinate speakers and content',
			column: 'developing',
			priority: 'high' as const,
			estimatedDuration: '1 week',
			subtasks: [
				{ id: `fallback_sub_${baseId}_4_1`, content: 'Confirm speaker lineup' },
				{
					id: `fallback_sub_${baseId}_4_2`,
					content: 'Prepare presentation materials',
				},
				{ id: `fallback_sub_${baseId}_4_3`, content: 'Schedule rehearsals' },
			],
		},
		{
			id: `fallback_${baseId}_5`,
			content: 'Final event preparations',
			column: 'reviewing',
			priority: 'high' as const,
			estimatedDuration: '2 days',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_5_1`,
					content: 'Conduct final venue walkthrough',
				},
				{ id: `fallback_sub_${baseId}_5_2`, content: 'Brief all team members' },
				{ id: `fallback_sub_${baseId}_5_3`, content: 'Test all equipment' },
			],
		},
		{
			id: `fallback_${baseId}_6`,
			content: 'Execute event day',
			column: 'finished',
			priority: 'high' as const,
			estimatedDuration: '1 day',
			subtasks: [
				{ id: `fallback_sub_${baseId}_6_1`, content: 'Set up venue' },
				{ id: `fallback_sub_${baseId}_6_2`, content: 'Manage event flow' },
				{ id: `fallback_sub_${baseId}_6_3`, content: 'Handle any issues' },
			],
		},
	];
}
