import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import TicketVerification from '@/components/shared/TicketVerification';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
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
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href={`/event/${id}/manage`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href={`/event/${id}`}>
                View Event Page
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white">Ticket Verification</h1>
          <p className="text-indigo-100 mt-2">
            Verify attendee tickets for {event.title}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <TicketVerification
          eventId={id}
          eventTitle={event.title}
        />
      </div>
    </div>
  );
}

