import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { autoGenerateCertificates } from '@/lib/actions/certificate.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Auto-generate certificates for all attended stakeholders
    const results = await autoGenerateCertificates(eventId, user._id);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in auto-generate certificates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
