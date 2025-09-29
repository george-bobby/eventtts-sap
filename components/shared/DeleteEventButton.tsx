"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { deleteEventById } from "@/lib/actions/event.action";
import { Loader2 } from "lucide-react";

interface DeleteEventButtonProps {
  eventId: string;
}

const DeleteEventButton = ({ eventId }: DeleteEventButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);

      const result = await deleteEventById(eventId);

      if (result?.success) {
        toast({
          title: "Event deleted successfully!",
          description: "The event and all related data have been permanently removed.",
        });

        setIsOpen(false);
        // Redirect to profile page after successful deletion
        router.push("/profile");
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (error: any) {
      console.error('Delete event error:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete event",
        description: error.message || "An unexpected error occurred while deleting the event.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size={"sm"}
          className="m-1 h-fit hover:scale-95 p-1"
          disabled={isDeleting}
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription className="flex flex-col gap-4 max-sm:items-center">
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>⚠️ This action cannot be undone.</strong></p>
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Event details and registration data</li>
                <li>All attendee information and tickets</li>
                <li>Photo galleries and uploaded images</li>
                <li>Generated certificates and templates</li>
                <li>Feedback responses and analytics</li>
                <li>Event updates and communications</li>
                <li>QR codes and verification data</li>
              </ul>
              <p className="text-red-600 font-medium">
                📋 Make sure to refund tickets to all customers before deletion to avoid legal issues.
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteEvent(eventId)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Event"
                )}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEventButton;
