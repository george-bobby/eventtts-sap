import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Task suggestion interface for the return type

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

export async function generateEventTasks(
	eventType: string,
	eventTitle?: string,
	eventDescription?: string,
	isSubEvent?: boolean,
	eventDetails?: {
		location?: string;
		isOnline?: boolean;
		capacity?: number;
		startDate?: string;
		endDate?: string;
		isFree?: boolean;
		price?: number;
		category?: string;
	}
): Promise<TaskSuggestion[]> {
	try {
		// Build context based on event details for personalization
		let contextInfo = '';
		if (eventDetails) {
			const eventTypeInfo = eventDetails.isFree
				? 'Free Event'
				: `Paid Event ($${eventDetails.price || 'TBD'})`;
			const venueInfo = eventDetails.isOnline
				? 'Online Event'
				: eventDetails.location || 'TBD';

			contextInfo = `
Event Details:
- Type: ${eventTypeInfo}
- Venue: ${venueInfo}
- Capacity: ${eventDetails.capacity || 'Unlimited'} attendees
- Category: ${eventDetails.category || eventType}
- Duration: ${
				eventDetails.startDate && eventDetails.endDate
					? `${new Date(eventDetails.startDate).toDateString()} to ${new Date(
							eventDetails.endDate
					  ).toDateString()}`
					: 'TBD'
			}
			`;
		}

		const prompt = `You are an expert event planner. Generate a comprehensive task list for organizing a ${eventType} event.

Event Information:
- Type: ${eventType}
- Title: ${eventTitle || 'Untitled Event'}
- Description: ${eventDescription || 'No description provided'}
- Is Sub-Event: ${isSubEvent ? 'Yes' : 'No'}
${contextInfo}

Create tasks that cover all phases of event planning:
1. Planning Phase (initial setup, venue booking, permits, etc.)
2. Development Phase (marketing, content creation, logistics setup)
3. Review Phase (final checks, rehearsals, confirmations)
4. Execution Phase (day-of-event tasks)

Each task should be:
- Specific and actionable
- Appropriate for the event type, scale, and budget (${
			eventDetails?.isFree
				? 'free event considerations'
				: 'paid event with revenue management'
		})
- Include realistic time estimates
- Have 2-4 relevant subtasks

Distribute tasks across these columns:
- "planning" (initial setup and preparation)
- "developing" (active development and creation)
- "reviewing" (quality checks and final preparations)
- "finished" (completed or day-of tasks)

Priority levels:
- "high" for critical path items
- "medium" for important but flexible items
- "low" for nice-to-have items

Generate ${
			isSubEvent ? '6-8' : '8-12'
		} tasks total, distributed across the phases appropriately.`;

		// Use Google Generative AI directly to avoid type instantiation issues
		const model = genAI.getGenerativeModel({
			model: 'gemini-2.5-flash',
			generationConfig: {
				responseMimeType: 'application/json',
			},
		});

		const jsonPrompt = `${prompt}

Return the response as a JSON object with this exact structure:
{
  "tasks": [
    {
      "content": "string",
      "column": "planning|developing|reviewing|finished",
      "priority": "high|medium|low",
      "estimatedDuration": "string",
      "subtasks": [
        {
          "content": "string"
        }
      ]
    }
  ],
  "totalTasks": number,
  "eventType": "string"
}`;

		const result = await model.generateContent(jsonPrompt);
		const responseText = result.response.text();
		const parsedResponse = JSON.parse(responseText);

		// Convert structured response to TaskSuggestion format
		const tasks: TaskSuggestion[] = parsedResponse.tasks.map(
			(task: any, index: number) => ({
				id: `task_${Date.now()}_${index}`,
				content: task.content,
				column: task.column,
				priority: task.priority as 'high' | 'medium' | 'low',
				estimatedDuration: task.estimatedDuration,
				subtasks: task.subtasks.map((subtask: any, subIndex: number) => ({
					id: `subtask_${Date.now()}_${index}_${subIndex}`,
					content: subtask.content,
				})),
			})
		);

		return tasks;
	} catch (error) {
		console.error('Error generating event tasks:', error);
		// Return fallback tasks
		return getFallbackTasks(eventType, isSubEvent);
	}
}

function getFallbackTasks(
	_eventType: string,
	isSubEvent?: boolean
): TaskSuggestion[] {
	const baseId = Date.now();

	if (isSubEvent) {
		return [
			{
				id: `fallback_${baseId}_1`,
				content: 'Coordinate with main event team',
				column: 'planning',
				priority: 'high',
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
				content: 'Prepare sub-event specific content',
				column: 'planning',
				priority: 'high',
				estimatedDuration: '3 hours',
				subtasks: [
					{
						id: `fallback_sub_${baseId}_2_1`,
						content: 'Develop content outline',
					},
					{
						id: `fallback_sub_${baseId}_2_2`,
						content: 'Prepare materials and resources',
					},
					{
						id: `fallback_sub_${baseId}_2_3`,
						content: 'Create participant guidelines',
					},
				],
			},
			{
				id: `fallback_${baseId}_3`,
				content: 'Setup sub-event logistics',
				column: 'developing',
				priority: 'medium',
				estimatedDuration: '2 hours',
				subtasks: [
					{
						id: `fallback_sub_${baseId}_3_1`,
						content: 'Arrange specific equipment needs',
					},
					{
						id: `fallback_sub_${baseId}_3_2`,
						content: 'Setup dedicated space/area',
					},
					{
						id: `fallback_sub_${baseId}_3_3`,
						content: 'Test integration with main event',
					},
				],
			},
			{
				id: `fallback_${baseId}_4`,
				content: 'Final coordination check',
				column: 'reviewing',
				priority: 'high',
				estimatedDuration: '1 hour',
				subtasks: [
					{
						id: `fallback_sub_${baseId}_4_1`,
						content: 'Confirm timing with main event',
					},
					{
						id: `fallback_sub_${baseId}_4_2`,
						content: 'Brief team on sub-event flow',
					},
				],
			},
		];
	}

	return [
		{
			id: `fallback_${baseId}_1`,
			content: 'Define event objectives and scope',
			column: 'planning',
			priority: 'high',
			estimatedDuration: '2 hours',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_1_1`,
					content: 'Set clear goals and success metrics',
				},
				{ id: `fallback_sub_${baseId}_1_2`, content: 'Define target audience' },
				{ id: `fallback_sub_${baseId}_1_3`, content: 'Create event timeline' },
			],
		},
		{
			id: `fallback_${baseId}_2`,
			content: 'Venue selection and booking',
			column: 'planning',
			priority: 'high',
			estimatedDuration: '1 day',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_2_1`,
					content: 'Research suitable venues',
				},
				{
					id: `fallback_sub_${baseId}_2_2`,
					content: 'Visit and evaluate options',
				},
				{
					id: `fallback_sub_${baseId}_2_3`,
					content: 'Negotiate and book venue',
				},
			],
		},
		{
			id: `fallback_${baseId}_3`,
			content: 'Setup event infrastructure',
			column: 'developing',
			priority: 'high',
			estimatedDuration: '4 hours',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_3_1`,
					content: 'Arrange seating and layout',
				},
				{
					id: `fallback_sub_${baseId}_3_2`,
					content: 'Test audio-visual equipment',
				},
				{
					id: `fallback_sub_${baseId}_3_3`,
					content: 'Setup registration area',
				},
			],
		},
		{
			id: `fallback_${baseId}_4`,
			content: 'Final quality check',
			column: 'reviewing',
			priority: 'medium',
			estimatedDuration: '2 hours',
			subtasks: [
				{
					id: `fallback_sub_${baseId}_4_1`,
					content: 'Review all arrangements',
				},
				{
					id: `fallback_sub_${baseId}_4_2`,
					content: 'Conduct rehearsal if needed',
				},
			],
		},
	];
}
