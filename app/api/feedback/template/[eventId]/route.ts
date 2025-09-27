import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackTemplate } from '@/lib/actions/feedback.action';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const template = await getFeedbackTemplate(eventId);

    if (!template) {
      return NextResponse.json(
        { error: 'Feedback template not found for this event' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching feedback template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback template' },
      { status: 500 }
    );
  }
}
