import Image from "next/image";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { dateConverter, timeFormatConverter } from "@/lib/utils";
import Link from "next/link";
import LikeCartButton from "./LikeCartButton";
import { getUserByClerkId } from "@/lib/actions/user.action";
import DeleteEventButton from "./DeleteEventButton";
import { IEvent } from "@/lib/models/event.model";
import { Button } from "@/components/ui/button";

interface Props {
  event: IEvent;
  currentUserId: string | null;
  page?: string;
  user?: any; // The pre-fetched user data
  likedEvent?: boolean; // Whether this event is liked by the current user
}

const EventCard = ({ event, currentUserId, page, user, likedEvent = false }: Props) => {
  // Check if current user is the organizer of this event
  const isOrganizer = user && event.organizer._id === user._id;

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

      {/* Edit, Attendees, and AI Report buttons for organizer */}
      {isOrganizer && (
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100">
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href={`/event/${event._id}/update`}>Edit</Link>
          </Button>
          <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Link href={`/event/${event._id}/attendees`}>Attendees</Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href={`/event/${event._id}/report`}>AI Report</Link>
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

        {/* Show ticket info if available */}
        {event.ticketsLeft !== undefined && event.ticketsLeft > 0 && (
          <span className="text-xs text-gray-500">
            {event.ticketsLeft}{" "}
            {event.ticketsLeft === 1 ? "ticket" : "tickets"} left
          </span>
        )}

        {/* Delete button on profile page */}
        {page === "profile" && <DeleteEventButton event={event} />}
      </div>
    </div>
  );
};

export default EventCard;
