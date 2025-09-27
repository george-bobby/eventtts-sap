import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import EventCards from "@/components/shared/EventCards";
import EventCreatorDashboard from "@/components/shared/EventCreatorDashboard";
import { getEventsByUserId } from "@/lib/actions/event.action";
import { getOrdersByUserId } from "@/lib/actions/order.action";
import { IOrder } from "@/types";
import { getUserByClerkId } from "@/lib/actions/user.action";

// ✅ This is the definitive fix for the headers/searchParams error
export const dynamic = 'force-dynamic';

interface ProfilePageProps {
  searchParams: Promise<{ page?: string }>;
}

const ProfilePage = async ({ searchParams }: ProfilePageProps) => {
  // ✅ Await auth() to avoid header issues in Next.js 15
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const mongoUser = await getUserByClerkId(clerkId);
  // Await searchParams in Next.js 15+
  const params = await searchParams;
  const organizedEventsPage = Number(params.page) || 1;

  const organizedEventsPromise = getEventsByUserId({ userId: mongoUser._id, page: organizedEventsPage });
  const ordersPromise = getOrdersByUserId({ userId: mongoUser._id });

  const [organizedEvents, orders] = await Promise.all([
    organizedEventsPromise,
    ordersPromise,
  ]);

  const myTickets = orders?.data.map((order: IOrder) => order.event) || [];
  const myOrganizedEvents = organizedEvents?.data || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Event Creator Dashboard - Only show if user has organized events */}
        {myOrganizedEvents.length > 0 && (
          <section className="mb-12">
            <EventCreatorDashboard events={myOrganizedEvents} />
          </section>
        )}

        {/* Events Organized Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Events Organized</h3>
              <Button asChild size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-semibold hidden sm:flex">
                <Link href="/create-event">Create New Event</Link>
              </Button>
            </div>
          </div>
          <div className="p-8">
            <EventCards
              events={myOrganizedEvents}
              currentUserId={clerkId}
              emptyTitle="No events have been created yet"
              emptyStateSubtext="Go create some now!"
              page="profile"
              user={mongoUser}
            />
          </div>
        </section>

        {/* My Tickets Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">My Tickets</h3>
              <Button asChild size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-semibold hidden sm:flex">
                <Link href="/explore-events">Explore More Events</Link>
              </Button>
            </div>
          </div>
          <div className="p-8">
            <EventCards
              events={myTickets}
              currentUserId={clerkId}
              emptyTitle="No event tickets purchased yet"
              emptyStateSubtext="No worries - plenty of exciting events to explore!"
              user={mongoUser}
            />
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProfilePage;