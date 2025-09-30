import React from 'react';
import { notFound } from 'next/navigation';
import { getEventById } from '@/lib/actions/event.action';
import { getFeedbackTemplate } from '@/lib/actions/feedback.action';
import FeedbackFormClient from './FeedbackFormClient';

interface FeedbackPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { id } = await params;

  try {
    // Fetch event and feedback template
    const [event, template] = await Promise.all([
      getEventById(id),
      getFeedbackTemplate(id)
    ]);

    if (!event) {
      notFound();
    }

    // Check if feedback is enabled for this event
    if (!event.feedbackEnabled) {
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Feedback Not Available
              </h1>
              <p className="text-gray-600 mb-8">
                Feedback collection is not enabled for this event.
              </p>
              <a
                href={`/event/${id}`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Event
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Check if event has ended (feedback should only be available after event ends)
    const eventEndDate = new Date(event.endDate);
    const now = new Date();
    
    if (now < eventEndDate) {
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Feedback Not Yet Available
              </h1>
              <p className="text-gray-600 mb-8">
                Feedback collection will be available after the event ends on{' '}
                {eventEndDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}.
              </p>
              <a
                href={`/event/${id}`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Event
              </a>
            </div>
          </div>
        </div>
      );
    }

    /*
    // Optional: Check if user has already submitted feedback
    const { userId } = await auth();
    if (userId) {
      const user = await getUserByClerkId(userId);
      if (user) {
        const existingFeedback = await checkExistingFeedback(id, user._id);
        if (existingFeedback) {
          return <AlreadySubmittedMessage />;
        }
      }
    }
    */

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <FeedbackFormClient
          eventId={id}
          eventTitle={event.title}
          eventDate={new Date(event.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          isOnline={event.isOnline}
          customQuestions={template.customQuestions || []}
        />
      </div>
    );

  } catch (error) {
    console.error('Error loading feedback page:', error);
    notFound();
  }
}
