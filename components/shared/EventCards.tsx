import { IEvent } from "@/lib/models/event.model";
// ✅ FIX: Use the correct path alias to find the component
import EventCard from "@/components/shared/EventCard";
import NoResults from "@/components/shared/NoResults";

interface EventCardsProps {
  events: IEvent[];
  currentUserId: string | null;
  emptyTitle: string;
  emptyStateSubtext: string;
  page?: string;
  user?: any; // Pre-fetched user data
}

const EventCards = ({ events, currentUserId, emptyTitle, emptyStateSubtext, page, user }: EventCardsProps) => {
  if (!events || events.length === 0) {
    return (
      <NoResults
        title={emptyTitle}
        desc={emptyStateSubtext}
        link={"/"}
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
          />
        );
      })}
    </div>
  );
};

export default EventCards;