// app/event/[id]/update/page.tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
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
    <div className="bg-gradient-to-br from-red-50 via-white to-rose-50 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-6">
            ✨ Update Your Event
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            Update Event
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Make changes to your event and keep your community informed.
          </p>
        </div>

        {/* Form Section */}
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