'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { X, Loader2 } from 'lucide-react';

interface CancelTicketButtonProps {
  orderId: string;
  eventTitle: string;
  totalTickets: number;
}

const CancelTicketButton = ({ orderId, eventTitle, totalTickets }: CancelTicketButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCancelTickets = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/tickets/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel tickets');
      }

      toast({
        title: 'Tickets Cancelled Successfully',
        description: data.message,
        variant: 'default',
      });

      setIsOpen(false);
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling tickets:', error);
      toast({
        title: 'Failed to Cancel Tickets',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 shadow-lg"
        >
          <X className="w-3 h-3" />
          Cancel Ticket{totalTickets > 1 ? 's' : ''}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Ticket{totalTickets > 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Are you sure you want to cancel your {totalTickets} ticket{totalTickets > 1 ? 's' : ''} for{' '}
              <span className="font-semibold">{eventTitle}</span>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The event capacity will be updated to allow other attendees to book.
            </p>
            <p className="text-sm text-orange-600 font-medium">
              Note: You can only cancel tickets up to 1 hour before the event starts.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Keep Tickets
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelTickets}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Cancel Ticket{totalTickets > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelTicketButton;
