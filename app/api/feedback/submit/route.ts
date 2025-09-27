import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { submitFeedbackResponse } from '@/lib/actions/feedback.action';
import { getUserByClerkId } from '@/lib/actions/user.action';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    const body = await request.json();

    const {
      eventId,
      isAnonymous,
      overallSatisfaction,
      contentQuality,
      organizationRating,
      venueRating,
      recommendationScore,
      likedMost,
      improvements,
      additionalComments,
      customAnswers
    } = body;

    // Validation
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!overallSatisfaction || !contentQuality || !organizationRating || !recommendationScore) {
      return NextResponse.json(
        { error: 'Required rating fields are missing' },
        { status: 400 }
      );
    }

    // Validate rating ranges
    if (
      overallSatisfaction < 1 || overallSatisfaction > 5 ||
      contentQuality < 1 || contentQuality > 5 ||
      organizationRating < 1 || organizationRating > 5 ||
      recommendationScore < 1 || recommendationScore > 10 ||
      (venueRating && (venueRating < 1 || venueRating > 5))
    ) {
      return NextResponse.json(
        { error: 'Rating values are out of valid range' },
        { status: 400 }
      );
    }

    let mongoUserId = null;

    // Get MongoDB user ID if not anonymous
    if (!isAnonymous && clerkId) {
      const mongoUser = await getUserByClerkId(clerkId);
      if (mongoUser) {
        mongoUserId = mongoUser._id;
      }
    }

    // Submit feedback
    const response = await submitFeedbackResponse({
      eventId,
      userId: mongoUserId,
      isAnonymous: isAnonymous || !mongoUserId,
      overallSatisfaction,
      contentQuality,
      organizationRating,
      venueRating,
      recommendationScore,
      likedMost,
      improvements,
      additionalComments,
      customAnswers: customAnswers || []
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      responseId: response._id
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error instanceof Error && error.message.includes('already submitted')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
