import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
  createCertificateTemplate,
  getCertificateTemplates,
} from '@/lib/actions/certificate.action';

/**
 * GET /api/certificates - Get certificate templates for an event
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
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

    const templates = await getCertificateTemplates(eventId);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting certificate templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to get certificate templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates - Create a new certificate template
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      name,
      description,
      templateUrl,
      templateType,
      fields,
    } = body;

    // Validate required fields
    if (!eventId || !name || !templateUrl || !templateType || !fields) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = await createCertificateTemplate({
      eventId,
      name,
      description,
      templateUrl,
      templateType,
      fields,
      createdBy: userId,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error creating certificate template:', error);
    return NextResponse.json(
      {
        error: 'Failed to create certificate template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
