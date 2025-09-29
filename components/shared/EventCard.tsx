import Image from "next/image";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { dateConverter, timeFormatConverter } from "@/lib/utils";
import Link from "next/link";
import LikeCartButton from "./LikeCartButton";
import DeleteEventButton from "./DeleteEventButton";
import RaiseIssueButton from "./RaiseIssueButton";
import { Button } from "@/components/ui/button";
import { EventWithSubEvents } from "@/lib/actions/event.action";
import { Settings, AlertTriangle } from "lucide-react";

interface Props {
  event: EventWithSubEvents;
  currentUserId: string | null;
  page?: string;
  user?: any; // The pre-fetched user data
  likedEvent?: boolean; // Whether this event is liked by the current user
  isBookedEvent?: boolean; // Whether this is a booked event (for tickets section)
}

const EventCard = ({ event, currentUserId, page, user, likedEvent = false, isBookedEvent = false }: Props) => {
  // Check if current user is the organizer of this event
  const isOrganizer = user && String(event.organizer._id) === String(user._id);

  return (
    <div className="group border-0 h-96 w-full max-w-sm rounded-lg flex flex-col hover:shadow-lg shadow-md relative bg-white overflow-hidden">
      {/* Image Container */}
      <Link href={`/event/${event._id}`} className="w-full h-1/2 relative overflow-hidden">
        {event.photo ? (
          <Image
            src={event.photo}
            alt={event.title || "Event image"}
            width={400}
            height={200}
            loading="lazy"
            className="w-full h-full rounded-t-lg object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
            <span className="text-gray-500 font-medium">No image available</span>
          </div>
        )}



        {event.soldOut && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
            Sold Out
          </div>
        )}
      </Link>

      {/* Like button only for non-sub events */}
      {!event.parentEvent && (
        <LikeCartButton
          event={event}
          user={JSON.parse(JSON.stringify(user))}
          likedEvent={likedEvent}
        />
      )}

      {/* Hover overlay for organized events on profile page */}
      {isOrganizer && page === "profile" && !isBookedEvent && (
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-lg z-10">
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg border-2 border-white/20">
            <Link href={`/event/${event._id}/manage`} className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manage Event
            </Link>
          </Button>
        </div>
      )}

      {/* Hover overlay for booked events on profile page */}
      {isBookedEvent && currentUserId && page === "profile" && (
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-lg z-10">
          <RaiseIssueButton
            event={event}
            currentUserId={currentUserId}
            variant="default"
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 shadow-lg border-2 border-white/20"
            showText={true}
          />
        </div>
      )}

      {/* Only show Manage button for organizer on explore events page and event detail pages */}
      {isOrganizer && (page === "explore" || page === "event-detail") && (
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100">
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Link href={`/event/${event._id}/manage`}>Manage</Link>
          </Button>
        </div>
      )}

      <Link
        href={`/event/${event._id}`}
        className="p-4 flex flex-col items-start gap-3 flex-1 font-medium hover:bg-gray-50"
      >
        <div className="w-full flex flex-wrap gap-2 justify-start items-center">
          <Badge variant="default">
            {event.isFree ? "Free" : `₹ ${event.price}`}
          </Badge>
          <Badge variant="secondary">{(event.category as any)?.name || 'Uncategorized'}</Badge>
          {event.subEvents && event.subEvents.length > 0 && (
            <Badge variant="outline">Main Event</Badge>
          )}
          <Badge variant="secondary">
            {event.landmark ? event.landmark : "Online"}
          </Badge>
          {/* Display tags */}
          {event.tags && event.tags.length > 0 && (
            <>
              {event.tags.slice(0, 2).map((tag: any) => (
                <Badge key={tag._id || tag.name} variant="outline" className="text-xs">
                  {typeof tag === 'object' ? tag.name : tag}
                </Badge>
              ))}
              {event.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{event.tags.length - 2}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col justify-around flex-1">
          <div className="flex flex-wrap gap-1">
            <p className="text-sm">
              {new Date(event.endDate) > new Date(event.startDate)
                ? `${dateConverter(
                  event.startDate as unknown as string
                )} - ${dateConverter(event.endDate as unknown as string)}`
                : `${dateConverter(event.startDate as unknown as string)}`}
            </p>
            &nbsp;
            <p className="text-sm">
              {timeFormatConverter(event.startTime)} -{" "}
              {timeFormatConverter(event.endTime)}
            </p>
          </div>
          <h3 className="text-xl font-semibold line-clamp-1">{event.title}</h3>
          <p className="font-normal text-xs line-clamp-2">
            {event.description}
          </p>
        </div>
      </Link>

      <div className="flex justify-between items-center p-2 border-t">
        <Badge variant={"secondary"} className="w-fit">
          {event.organizer
            ? `${(event.organizer as any)?.firstName || ''} ${(event.organizer as any)?.lastName || ''}`
            : "Organizer"}
        </Badge>

        <div className="flex items-center gap-2">
          {/* Show ticket info if available */}
          {event.ticketsLeft !== undefined && event.ticketsLeft !== -1 && event.ticketsLeft > 0 && (
            <span className="text-xs text-gray-500">
              {event.ticketsLeft}{" "}
              {event.ticketsLeft === 1 ? "ticket" : "tickets"} left
            </span>
          )}
          {event.ticketsLeft === -1 && (
            <span className="text-xs text-gray-500">
              Unlimited capacity
            </span>
          )}

          {/* Delete button on non-profile pages only */}
          {page !== "profile" && isOrganizer && <DeleteEventButton eventId={String(event._id)} />}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
