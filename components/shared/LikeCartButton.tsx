"use client";

import React, { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { MdOutlineDoNotDisturbOn, MdOutlineShoppingCart } from "react-icons/md";
import { useToast } from "@/hooks/use-toast";
import { likeEvent } from "@/lib/actions/user.action";
import { getEventById } from "@/lib/actions/event.action";
import { Button } from "@/components/ui/button";
import { checkoutOrder } from "@/lib/actions/order.action";
import { IEvent } from "@/lib/models/event.model";
import type { Types } from "mongoose";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// -------------------------------------------------------------
// Event Type with SubEvent Support
// -------------------------------------------------------------
type EventWithSubEvents = IEvent & {
  subEvents?: IEvent[];
  parentEvent?: string | IEvent | Types.ObjectId | null;
  _id: string | Types.ObjectId;
  startDate: Date | string;
  endDate?: Date | string;
  photo: string;
  title: string;
  ticketsLeft: number;
  totalCapacity?: number;
  soldOut: boolean;
  isFree: boolean;
  price: number;
  organizer?: {
    _id: string | Types.ObjectId;
    firstName?: string;
    lastName?: string;
    username?: string;
    photo?: string;
  };
  category?: {
    _id: string | Types.ObjectId;
    name: string;
  };
  tags?: Array<{
    _id: string | Types.ObjectId;
    name: string;
  }>;
};

// -------------------------------------------------------------
// Checkout Dialog Component
// -------------------------------------------------------------
type CheckoutDialogProps = {
  event: EventWithSubEvents;
  user: any;
  children: React.ReactNode;
};

const CheckoutDialog = ({ event, user, children }: CheckoutDialogProps) => {
  const { toast } = useToast();
  const [totalTickets, setTotalTickets] = useState(1);
  const maxTickets = event.ticketsLeft ?? 1;

  const handleCheckout = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "You must be logged in to book an event.",
      });
      return;
    }

    try {
      // ✅ fetch latest event to avoid overselling
      const currentEvent = await getEventById(event._id.toString());
      if (!currentEvent) throw new Error("Event not found");

      // ✅ pick correct event (parent for sub-events)
      const targetEvent = currentEvent.parentEvent
        ? await getEventById(
          typeof currentEvent.parentEvent === "string"
            ? currentEvent.parentEvent
            : (currentEvent.parentEvent as any)._id
        )
        : currentEvent;

      if (!targetEvent) throw new Error("Event data not available");

      const availableTickets =
        typeof targetEvent.ticketsLeft === "number"
          ? targetEvent.ticketsLeft
          : targetEvent.totalCapacity || 0;

      if (availableTickets <= 0) throw new Error("No tickets available");

      const amount = targetEvent.isFree
        ? 0
        : (targetEvent.price || 0) * totalTickets;

      const order = {
        totalTickets: Math.min(totalTickets, availableTickets),
        totalAmount: amount,
        user: typeof user._id === "string" ? user._id : user._id.toString(),
        event: {
          _id: targetEvent._id?.toString(),
          title: currentEvent.title,
          isFree: targetEvent.isFree || false,
          price: targetEvent.price || 0,
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate,
          photo: currentEvent.photo || targetEvent.photo || "",
          totalCapacity: targetEvent.totalCapacity || 0,
          ticketsLeft: availableTickets,
          ...(currentEvent.parentEvent && {
            subEventId: currentEvent._id?.toString(),
            subEventTitle: currentEvent.title,
          }),
        },
      };

      const { url } = await checkoutOrder(order);
      if (url) window.location.href = url;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Something went wrong during checkout.",
        description: error.message,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Number of Tickets</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col items-center gap-5 mt-4">
              <span className="text-primary text-3xl font-bold">
                ₹{event.price * totalTickets}
              </span>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={maxTickets}
                  value={totalTickets}
                  onChange={(e) =>
                    setTotalTickets(
                      Math.max(1, Math.min(maxTickets, Number(e.target.value)))
                    )
                  }
                  className="w-24 text-center"
                />
                <span className="text-sm text-gray-500">
                  (Max: {maxTickets})
                </span>
              </div>
              <Button onClick={handleCheckout} className="w-full">
                Book Now
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

// -------------------------------------------------------------
// LikeCartButton Component
// -------------------------------------------------------------
interface LikeCartButtonProps {
  event: any; // Accept both IEvent and EventWithSubEvents
  user: any;
  likedEvent: boolean;
  option?: string;
}

const LikeCartButton = ({ event, user, likedEvent, option }: LikeCartButtonProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(likedEvent);

  const isEventPast = new Date(event.startDate) < new Date();
  const areTicketsAvailable = event.ticketsLeft > 0 && !event.soldOut;
  const isCartDisabled = isEventPast || !areTicketsAvailable;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      toast({
        title: "Order placed successfully!",
        description: "You will receive an email confirmation.",
      });
    }
    if (query.get("canceled")) {
      toast({
        title: "Order canceled.",
        description:
          "You can continue to shop around and checkout when you’re ready.",
      });
    }
  }, [toast]);

  const handleLike = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "You must be logged in to like an event.",
      });
      return;
    }

    try {
      await likeEvent(event._id.toString(), user._id);
      setIsLiked((prev) => !prev);

      toast({
        title: !isLiked
          ? "Event added to Liked Events."
          : "Event removed from Liked Events.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Something went wrong.",
        description: error.message,
      });
    }
  };

  if (option === "eventPage") {
    return (
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleLike}
          variant="secondary"
          className="flex gap-1 rounded-full hover:scale-105 transition-all"
        >
          {isLiked ? (
            <FaHeart className="h-5 w-5 text-primary" />
          ) : (
            <FaRegHeart className="h-5 w-5 text-primary" />
          )}
          Like
        </Button>

        {!isCartDisabled ? (
          <CheckoutDialog event={event} user={user}>
            <Button
              variant="secondary"
              className="flex gap-1 rounded-full hover:scale-105 transition-all"
            >
              <MdOutlineShoppingCart className="h-5 w-5 text-primary" />
              Book Now
            </Button>
          </CheckoutDialog>
        ) : (
          <Button
            variant="destructive"
            disabled
            className="flex gap-1 rounded-full"
          >
            <MdOutlineDoNotDisturbOn className="h-5 w-5" />
            Sold Out
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 flex flex-col items-center gap-2">
      <div
        className="border bg-white/80 backdrop-blur-sm rounded-full p-1 h-8 w-8 flex justify-center items-center hover:scale-110 transition-transform cursor-pointer"
        onClick={handleLike}
      >
        {isLiked ? (
          <FaHeart className="text-primary" />
        ) : (
          <FaRegHeart className="text-primary" />
        )}
      </div>

      {!isCartDisabled && (
        <CheckoutDialog event={event} user={user}>
          <div className="border bg-white/80 backdrop-blur-sm rounded-full p-1 h-8 w-8 flex justify-center items-center hover:scale-110 transition-transform cursor-pointer">
            <MdOutlineShoppingCart className="text-primary" />
          </div>
        </CheckoutDialog>
      )}
    </div>
  );
};

export default LikeCartButton;
