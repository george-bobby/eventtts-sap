import { EventWithSubEvents } from "@/lib/actions/event.action";
// ✅ FIX: Use the correct path alias to find the component
import EventCard from "@/components/shared/EventCard";
import NoResults from "@/components/shared/NoResults";

interface EventCardsProps {
  events: EventWithSubEvents[];
  currentUserId: string | null;
  emptyTitle: string;
  emptyStateSubtext: string;
  page?: string;
  user?: any; // Pre-fetched user data
  isBookedEvent?: boolean; // Whether these are booked events
}

const EventCards = ({ events, currentUserId, emptyTitle, emptyStateSubtext, page, user, isBookedEvent = false }: EventCardsProps) => {
  if (!events || events.length === 0) {
    return (
      <NoResults
        title={emptyTitle}
        desc={emptyStateSubtext}
        link={"/explore"}
        linkTitle={"Explore All Events"}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
      {events.map((event) => {
        // Check if this event is liked by the current user
        const likedEvent = user?.likedEvents ? user.likedEvents.includes(event._id) : false;

        return (
          <EventCard
            key={event._id?.toString()}
            event={event}
            currentUserId={currentUserId}
            user={user}
            likedEvent={likedEvent}
            page={page}
            isBookedEvent={isBookedEvent}
          />
        );
      })}
    </div>
  );
};

export default EventCards;