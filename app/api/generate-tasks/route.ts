import { NextRequest, NextResponse } from 'next/server';
import { generateEventTasks } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { eventType, eventTitle, eventDescription, isSubEvent, eventDetails } = await request.json();

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Pass additional context for more specific task generation
    const tasks = await generateEventTasks(
      eventType, 
      eventTitle, 
      eventDescription,
      isSubEvent,
      eventDetails
    );
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error generating event tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}