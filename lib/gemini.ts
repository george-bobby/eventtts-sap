import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
  }
): Promise<TaskSuggestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const eventTypeText = isSubEvent ? `sub-event within a larger ${eventType}` : eventType;
    const contextInfo = eventDetails ? `
      Event Context:
      - Location: ${eventDetails.isOnline ? 'Online Event' : eventDetails.location || 'Not specified'}
      - Capacity: ${eventDetails.capacity || 'Not specified'}
      - Duration: ${eventDetails.startDate && eventDetails.endDate ? 
          `${new Date(eventDetails.startDate).toDateString()} to ${new Date(eventDetails.endDate).toDateString()}` : 
          'Not specified'}
    ` : '';

    const prompt = `
    Generate a comprehensive list of tasks for organizing a "${eventTypeText}"${eventTitle ? ` titled "${eventTitle}"` : ''}${eventDescription ? ` with description: "${eventDescription}"` : ''}.

    ${contextInfo}

    ${isSubEvent ? `
    IMPORTANT: This is a SUB-EVENT, so focus on tasks that are specific to this component rather than the overall event infrastructure. 
    Assume the main event setup (venue, registration, general logistics) is handled by the parent event.
    Focus on: content preparation, specific logistics for this sub-event, coordination with main event, and sub-event specific requirements.
    ` : ''}

    Please provide tasks in the following categories:
    1. Planning phase tasks${isSubEvent ? ' (coordination and preparation)' : ''}
    2. Development/Setup phase tasks${isSubEvent ? ' (content and specific setup)' : ''}
    3. Review/Testing phase tasks${isSubEvent ? ' (rehearsal and final checks)' : ''}
    4. Final preparation tasks${isSubEvent ? ' (day-of coordination)' : ''}

    For each task, provide:
    - Main task description
    - 2-4 relevant subtasks
    - Priority level (high/medium/low)
    - Estimated duration
    - Phase (planning/developing/reviewing/finished)

    Event type specific requirements:
    ${getEventTypeSpecificRequirements(eventType, isSubEvent)}

    Please format the response as a JSON array with the following structure:
    [
      {
        "content": "Task description",
        "column": "planning|developing|reviewing|finished",
        "priority": "high|medium|low",
        "estimatedDuration": "2 hours|1 day|etc",
        "subtasks": [
          {"content": "Subtask 1"},
          {"content": "Subtask 2"}
        ]
      }
    ]

    Generate ${isSubEvent ? '6-8' : '8-12'} tasks total, distributed across the phases appropriately.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const tasksData = JSON.parse(jsonMatch[0]);
    
    // Add unique IDs to tasks and subtasks
    const tasks: TaskSuggestion[] = tasksData.map((task: any, index: number) => ({
      id: `task_${Date.now()}_${index}`,
      content: task.content,
      column: task.column,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration,
      subtasks: task.subtasks.map((subtask: any, subIndex: number) => ({
        id: `subtask_${Date.now()}_${index}_${subIndex}`,
        content: subtask.content
      }))
    }));

    return tasks;
  } catch (error) {
    console.error('Error generating event tasks:', error);
    // Return fallback tasks
    return getFallbackTasks(eventType, isSubEvent);
  }
}

function getEventTypeSpecificRequirements(eventType: string, isSubEvent?: boolean): string {
  const baseRequirements: Record<string, string> = {
    hackathons: `
      ${isSubEvent ? 'Sub-event specific:' : 'Main event:'}
      ${isSubEvent ? 
        '- Specific challenge/theme setup\n      - Mentorship for this track\n      - Judging criteria for sub-category\n      - Resource allocation for participants\n      - Integration with main hackathon timeline' :
        '- WiFi setup and network capacity planning\n      - Extension cords and power strips\n      - Projection equipment and screens\n      - Registration and check-in system\n      - Food and beverage arrangements\n      - Judging criteria and panel setup\n      - Prize procurement and distribution\n      - Mentorship coordination\n      - Technical support team\n      - Venue security and access control'
      }
    `,
    workshops: `
      ${isSubEvent ? 'Sub-workshop specific:' : 'Main workshop:'}
      ${isSubEvent ? 
        '- Workshop-specific material preparation\n      - Facilitator briefing and coordination\n      - Session content and timing\n      - Participant grouping for this session\n      - Equipment needs for this workshop' :
        '- Material and supplies procurement\n      - Handout and resource preparation\n      - Equipment setup and testing\n      - Participant registration management\n      - Facilitator coordination\n      - Feedback collection system\n      - Certificate preparation\n      - Follow-up communication plan'
      }
    `,
    seminars: `
      ${isSubEvent ? 'Sub-session specific:' : 'Main seminar:'}
      ${isSubEvent ? 
        '- Speaker preparation and briefing\n      - Content coordination with main agenda\n      - Session timing and transitions\n      - Q&A session planning\n      - Specific presentation setup' :
        '- Speaker coordination and briefing\n      - Audio-visual equipment setup\n      - Seating arrangement planning\n      - Registration and attendance tracking\n      - Q&A session management\n      - Recording equipment setup\n      - Networking session organization\n      - Follow-up material distribution'
      }
    `,
    sports: `
      ${isSubEvent ? 'Sub-competition specific:' : 'Main sports event:'}
      ${isSubEvent ? 
        '- Specific game/match setup\n      - Team coordination for this event\n      - Equipment for specific sport\n      - Scoring system for sub-event\n      - Integration with main tournament' :
        '- Venue booking and preparation\n      - Equipment procurement and setup\n      - Referee and official coordination\n      - Participant registration and grouping\n      - Safety and medical arrangements\n      - Scorekeeping and timing systems\n      - Awards and trophy preparation\n      - Weather contingency planning'
      }
    `,
    theatre: `
      ${isSubEvent ? 'Performance segment specific:' : 'Main theatre production:'}
      ${isSubEvent ? 
        '- Scene/act specific preparation\n      - Costume and prop coordination\n      - Lighting cues for this segment\n      - Cast coordination and timing\n      - Rehearsal scheduling for this part' :
        '- Script preparation and rehearsal scheduling\n      - Costume and makeup coordination\n      - Set design and construction\n      - Lighting and sound setup\n      - Ticket sales and seating management\n      - Cast and crew coordination\n      - Program booklet preparation\n      - Dress rehearsal organization'
      }
    `,
    exhibitions: `
      ${isSubEvent ? 'Exhibition section specific:' : 'Main exhibition:'}
      ${isSubEvent ? 
        '- Specific display setup\n      - Exhibitor coordination for section\n      - Thematic arrangement\n      - Section-specific materials\n      - Visitor flow for this area' :
        '- Booth design and setup\n      - Exhibitor coordination and communication\n      - Display material preparation\n      - Visitor registration and management\n      - Information desk setup\n      - Catalog and brochure preparation\n      - Feedback collection system\n      - Networking event organization'
      }
    `,
    quizzes: `
      ${isSubEvent ? 'Quiz round specific:' : 'Main quiz event:'}
      ${isSubEvent ? 
        '- Round-specific questions preparation\n      - Scoring system for this round\n      - Team management for segment\n      - Time allocation and pacing\n      - Integration with main competition' :
        '- Question preparation and verification\n      - Scoring system setup\n      - Team registration and organization\n      - Buzzer or response system setup\n      - Prize arrangement\n      - Moderation and time management\n      - Result tabulation system\n      - Audience engagement activities'
      }
    `,
    social: `
      ${isSubEvent ? 'Social activity specific:' : 'Main social event:'}
      ${isSubEvent ? 
        '- Activity-specific setup\n      - Entertainment for this segment\n      - Group coordination\n      - Timeline integration\n      - Specific material needs' :
        '- Venue decoration and ambiance setup\n      - Catering and refreshment arrangements\n      - Music and entertainment coordination\n      - Photography and videography setup\n      - Guest list management\n      - RSVP tracking system\n      - Transportation arrangements\n      - Safety and security measures'
      }
    `,
    marketing: `
      ${isSubEvent ? 'Campaign component specific:' : 'Main marketing campaign:'}
      ${isSubEvent ? 
        '- Specific channel strategy\n      - Content for this component\n      - Target audience for segment\n      - Budget allocation for this part\n      - Coordination with main campaign' :
        '- Campaign strategy development\n      - Content creation and approval\n      - Channel selection and setup\n      - Budget allocation and tracking\n      - Target audience identification\n      - Performance metrics definition\n      - Promotional material design\n      - Influencer and partnership coordination'
      }
    `,
    training: `
      ${isSubEvent ? 'Training module specific:' : 'Main training program:'}
      ${isSubEvent ? 
        '- Module content preparation\n      - Trainer briefing for session\n      - Participant materials for module\n      - Assessment for this section\n      - Integration with main curriculum' :
        '- Curriculum development and approval\n      - Trainer selection and briefing\n      - Training material preparation\n      - Assessment and certification setup\n      - Participant prerequisite verification\n      - Practical exercise planning\n      - Progress tracking system\n      - Post-training support setup'
      }
    `
  };

  return baseRequirements[eventType.toLowerCase()] || baseRequirements['others'] || `
    ${isSubEvent ? 'Sub-event specific:' : 'Main event:'}
    ${isSubEvent ? 
      '- Component-specific planning and coordination\n    - Integration with main event timeline\n    - Specific resource allocation\n    - Content preparation for this segment\n    - Coordination with main event team' :
      '- General event planning and coordination\n    - Venue setup and management\n    - Participant registration and communication\n    - Resource and material procurement\n    - Staff coordination and briefing\n    - Quality assurance and testing\n    - Contingency planning\n    - Post-event evaluation and cleanup'
    }
  `;
}

function getFallbackTasks(eventType: string, isSubEvent?: boolean): TaskSuggestion[] {
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
          { id: `fallback_sub_${baseId}_1_1`, content: 'Review main event timeline' },
          { id: `fallback_sub_${baseId}_1_2`, content: 'Align sub-event objectives' },
          { id: `fallback_sub_${baseId}_1_3`, content: 'Confirm resource allocation' }
        ]
      },
      {
        id: `fallback_${baseId}_2`,
        content: 'Prepare sub-event specific content',
        column: 'planning',
        priority: 'high',
        estimatedDuration: '3 hours',
        subtasks: [
          { id: `fallback_sub_${baseId}_2_1`, content: 'Develop content outline' },
          { id: `fallback_sub_${baseId}_2_2`, content: 'Prepare materials and resources' },
          { id: `fallback_sub_${baseId}_2_3`, content: 'Create participant guidelines' }
        ]
      },
      {
        id: `fallback_${baseId}_3`,
        content: 'Setup sub-event logistics',
        column: 'developing',
        priority: 'medium',
        estimatedDuration: '2 hours',
        subtasks: [
          { id: `fallback_sub_${baseId}_3_1`, content: 'Arrange specific equipment needs' },
          { id: `fallback_sub_${baseId}_3_2`, content: 'Setup dedicated space/area' },
          { id: `fallback_sub_${baseId}_3_3`, content: 'Test integration with main event' }
        ]
      },
      {
        id: `fallback_${baseId}_4`,
        content: 'Final coordination check',
        column: 'reviewing',
        priority: 'high',
        estimatedDuration: '1 hour',
        subtasks: [
          { id: `fallback_sub_${baseId}_4_1`, content: 'Confirm timing with main event' },
          { id: `fallback_sub_${baseId}_4_2`, content: 'Brief team on sub-event flow' }
        ]
      }
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
        { id: `fallback_sub_${baseId}_1_1`, content: 'Set clear goals and success metrics' },
        { id: `fallback_sub_${baseId}_1_2`, content: 'Define target audience' },
        { id: `fallback_sub_${baseId}_1_3`, content: 'Create event timeline' }
      ]
    },
    {
      id: `fallback_${baseId}_2`,
      content: 'Venue selection and booking',
      column: 'planning',
      priority: 'high',
      estimatedDuration: '1 day',
      subtasks: [
        { id: `fallback_sub_${baseId}_2_1`, content: 'Research suitable venues' },
        { id: `fallback_sub_${baseId}_2_2`, content: 'Visit and evaluate options' },
        { id: `fallback_sub_${baseId}_2_3`, content: 'Negotiate and book venue' }
      ]
    },
    {
      id: `fallback_${baseId}_3`,
      content: 'Setup event infrastructure',
      column: 'developing',
      priority: 'high',
      estimatedDuration: '4 hours',
      subtasks: [
        { id: `fallback_sub_${baseId}_3_1`, content: 'Arrange seating and layout' },
        { id: `fallback_sub_${baseId}_3_2`, content: 'Test audio-visual equipment' },
        { id: `fallback_sub_${baseId}_3_3`, content: 'Setup registration area' }
      ]
    },
    {
      id: `fallback_${baseId}_4`,
      content: 'Final quality check',
      column: 'reviewing',
      priority: 'medium',
      estimatedDuration: '2 hours',
      subtasks: [
        { id: `fallback_sub_${baseId}_4_1`, content: 'Review all arrangements' },
        { id: `fallback_sub_${baseId}_4_2`, content: 'Conduct rehearsal if needed' }
      ]
    }
  ];
}