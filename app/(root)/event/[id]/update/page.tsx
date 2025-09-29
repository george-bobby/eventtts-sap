// app/event/[id]/update/page.tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EventForm from "@/components/shared/EventForm";
import { getEventById } from "@/lib/actions/event.action";
import { getUserByClerkId } from "@/lib/actions/user.action";

interface UpdateEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

const UpdateEventPage = async ({ params }: UpdateEventPageProps) => {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the current user
  const user = await getUserByClerkId(userId);

  // Get the event data
  const event = await getEventById(id);

  // Check if the current user is the organizer of this event
  if (!event || String(event.organizer._id) !== String(user._id)) {
    redirect("/");
  }

  // Serialize the event to match IEvent interface expected by EventForm
  const serializedEvent = JSON.parse(JSON.stringify(event));

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href={`/event/${id}/manage`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href={`/event/${id}`}>
                View Event Page
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white">Update Event</h1>
          <p className="text-blue-100 mt-2">
            Make changes to your event and keep your community informed
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <EventForm
            userId={user._id}
            type="edit"
            event={serializedEvent}
            eventId={event._id.toString()}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateEventPage;