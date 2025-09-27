import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
  getCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from '@/lib/actions/certificate.action';

/**
 * GET /api/certificates/[templateId] - Get a specific certificate template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await getCertificateTemplate(params.templateId);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error getting certificate template:', error);
    return NextResponse.json(
      {
        error: 'Failed to get certificate template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/certificates/[templateId] - Update a certificate template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = body;

    const template = await updateCertificateTemplate(params.templateId, updates);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return NextResponse.json(
      {
        error: 'Failed to update certificate template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/[templateId] - Delete a certificate template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteCertificateTemplate(params.templateId);

    return NextResponse.json({
      success: true,
      message: 'Certificate template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete certificate template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
