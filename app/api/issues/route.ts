import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createIssue } from '@/lib/actions/issue.action';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            eventId,
            category,
            subcategory,
            severity,
            title,
            description,
            attachments
        } = body;

        // Validate required fields
        if (!eventId || !category || !title || !description) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await createIssue({
            eventId,
            reportedBy: userId,
            category,
            subcategory,
            severity,
            title,
            description,
            attachments
        });

        if (result.success) {
            return NextResponse.json(result, { status: 201 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }

    } catch (error) {
        console.error('Error in issue API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json(
                { success: false, error: 'Event ID is required' },
                { status: 400 }
            );
        }

        // Here you could add logic to get issues for an event
        // For now, we'll just return a success response
        return NextResponse.json(
            { success: true, message: 'Issues endpoint ready' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error in issue API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}