'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FeedbackForm from '@/components/shared/FeedbackForm';
import { ICustomQuestion } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FeedbackFormClientProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  isOnline: boolean;
  customQuestions: ICustomQuestion[];
}

export default function FeedbackFormClient({
  eventId,
  eventTitle,
  eventDate,
  isOnline,
  customQuestions
}: FeedbackFormClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ...data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      toast({
        title: "Success!",
        description: "Your feedback has been submitted successfully.",
      });

      // Optionally redirect after successful submission
      // router.push(`/event/${eventId}`);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      let errorMessage = 'Failed to submit feedback. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('already submitted')) {
          errorMessage = 'You have already submitted feedback for this event.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Re-throw to let the form component handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FeedbackForm
      eventId={eventId}
      eventTitle={eventTitle}
      eventDate={eventDate}
      isOnline={isOnline}
      customQuestions={customQuestions}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
