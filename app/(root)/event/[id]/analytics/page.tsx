import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import EventAnalyticsDashboard from '@/components/shared/EventAnalyticsDashboard';

interface EventAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventAnalyticsPage({ params }: EventAnalyticsPageProps) {
  const { id } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  const [event, user] = await Promise.all([
    getEventById(id),
    getUserByClerkId(clerkId)
  ]);

  if (!event) {
    redirect('/');
  }

  // Check if user is the organizer
  if (String(event.organizer._id) !== String(user._id)) {
    redirect(`/event/${id}`);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-cyan-500 to-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm" className="bg-white text-cyan-600 hover:bg-gray-100">
              <Link href={`/event/${id}/manage`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white text-cyan-600 hover:bg-gray-100">
              <Link href={`/event/${id}`}>
                View Event Page
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white">Event Analytics</h1>
          <p className="text-cyan-100 mt-2">
            Comprehensive performance metrics and insights for {event.title}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EventAnalyticsDashboard
          eventId={id}
          event={event}
          organizerId={user._id}
        />
      </div>
    </div>
  );
}
