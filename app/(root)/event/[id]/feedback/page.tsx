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
    // Get event details
    const event = await getEventById(id);
    if (!event) {
      notFound();
    }

    // Get feedback template
    const template = await getFeedbackTemplate(id);
    if (!template) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Feedback Not Available
            </h1>
            <p className="text-gray-600 mb-6">
              Feedback collection is not enabled for this event, or the feedback period has ended.
            </p>
            <a
              href={`/event/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Back to Event
            </a>
          </div>
        </div>
      );
    }

    // Check if event has ended (optional - you might want to allow feedback before event ends too)
    const eventEndTime = new Date(event.endDate);
    const now = new Date();
    
    // For now, allow feedback submission regardless of event status
    // You can uncomment this if you want to restrict feedback to after the event
    /*
    if (now < eventEndTime) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Feedback Not Yet Available
            </h1>
            <p className="text-gray-600 mb-6">
              Feedback collection will be available after the event ends.
            </p>
            <a
              href={`/event/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Back to Event
            </a>
          </div>
        </div>
      );
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

// Generate metadata for the page
export async function generateMetadata({ params }: FeedbackPageProps) {
  const { id } = await params;
  
  try {
    const event = await getEventById(id);
    if (!event) {
      return {
        title: 'Event Not Found',
      };
    }

    return {
      title: `Feedback - ${event.title}`,
      description: `Share your feedback about ${event.title}`,
    };
  } catch (error) {
    return {
      title: 'Event Feedback',
    };
  }
}
