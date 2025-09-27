import Image from "next/image";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dateConverter, timeFormatConverter } from "@/lib/utils";
import Link from "next/link";
import LikeCartButton from "./LikeCartButton";
import RaiseIssueButton from "./RaiseIssueButton";
import { Navigation, AlertTriangle } from "lucide-react";

interface Props {
  event: any;
  currentUserId?: string | null;
}

interface Props {
  event: any;
}

const OrderCard = ({ event, currentUserId }: Props) => {
  // Check if event has navigation capability
  const hasNavigation = event.event.campusLocation;
  const hasReportIssue = currentUserId;
  
  return (
    <div className="border h-auto max-h-[450px] w-96 rounded-md flex flex-col hover:scale-95 transition-all shadow-md relative">
      <Link href={`/event/${event.event._id}`} className="w-full h-48 flex-shrink-0">
        <Image
          src={event.event.photo}
          alt={event.event._id}
          width={1920}
          height={1280}
          className="w-full h-full rounded-t-md hover:opacity-80 transition-all object-cover"
        />
      </Link>
      <Link
        href={`/event/${event.event._id}`}
        className="p-3 flex flex-col items-start gap-2 flex-1 font-medium"
      >
        <div className="w-full flex flex-wrap gap-2 justify-start items-center">
          <Badge variant="default">₹ {event.totalAmount}</Badge>
          <Badge variant="secondary">{`Tickets : ${event.totalTickets}`}</Badge>
          <Badge variant="secondary">
            {event.event.landmark ? event.event.landmark : "Online"}
          </Badge>
        </div>
        <div className="flex flex-col justify-around flex-1">
          <div className="flex flex-wrap gap-1">
            <p className="text-sm">
              {new Date(event.event.endDate) > new Date(event.event.startDate)
                ? `${dateConverter(event.event.startDate)} - ${dateConverter(
                  event.event.endDate
                )} `
                : `${dateConverter(event.event.startDate)}`}
            </p>
            &nbsp;
            <p className="text-sm">
              {timeFormatConverter(event.event.startTime)} -{" "}
              {timeFormatConverter(event.event.endTime)}
            </p>
          </div>
          <h3 className="text-lg font-semibold line-clamp-2">{event.event.title}</h3>
        </div>
      </Link>
      
      {/* Organizer Badge */}
      <div className="px-3 pb-2">
        <Badge
          variant={"secondary"}
          className="w-fit"
        >{`${event.event.organizer.firstName} ${event.event.organizer.lastName}`}</Badge>
      </div>

      {/* Action Buttons Section */}
      <div className="p-2 space-y-2 bg-gray-50 rounded-b-md">
        {/* Navigate Button - only show if event has campus location */}
        {hasNavigation && (
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/track?destination=${encodeURIComponent(event.event.campusLocation)}`}>
              <Navigation className="w-4 h-4 mr-2" />
              Navigate
            </Link>
          </Button>
        )}

        {/* Report Issue Button - available for all booked events */}
        {hasReportIssue && (
          <RaiseIssueButton 
            event={event.event}
            currentUserId={currentUserId}
            size="default"
            variant="outline"
            className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
          />
        )}
      </div>
    </div>
  );
};

export default OrderCard;
