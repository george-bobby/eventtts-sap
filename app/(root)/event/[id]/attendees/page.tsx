import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import AttendeeManagement from '@/components/shared/AttendeeManagement';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AttendeePageProps {
  params: Promise<{ id: string }>;
}

export default async function AttendeePage({ params }: AttendeePageProps) {
  const { userId: clerkId } = auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  const { id: eventId } = await params;

  // Get the event and verify ownership
  const event = await getEventById(eventId);
  if (!event) {
    redirect('/');
  }

  // Get the current user
  const mongoUser = await getUserByClerkId(clerkId);
  if (!mongoUser) {
    redirect('/sign-in');
  }

  // Check if the current user is the organizer of this event
  if (String(event.organizer._id) !== String(mongoUser._id)) {
    redirect(`/event/${eventId}`);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-red-500 to-red-600 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm" className="bg-white text-red-600 hover:bg-gray-100">
              <Link href={`/event/${eventId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white">Attendee Management</h1>
          <p className="text-red-100 mt-2">
            Manage registrations and export attendee data for your event
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AttendeeManagement
          eventId={eventId}
          organizerId={mongoUser._id}
          eventTitle={event.title}
        />
      </div>
    </div>
  );
}
