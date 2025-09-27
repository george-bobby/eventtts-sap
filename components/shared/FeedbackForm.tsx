'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Heart, MessageCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ICustomQuestion, IFeedbackAnswer } from '@/types';

// Star Rating Component
const StarRating = ({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`p-1 transition-colors ${
              star <= (hoverValue || value)
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            }`}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {value === 1 && 'Poor'}
        {value === 2 && 'Fair'}
        {value === 3 && 'Good'}
        {value === 4 && 'Very Good'}
        {value === 5 && 'Excellent'}
      </p>
    </div>
  );
};

// NPS Rating Component (1-10)
const NPSRating = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
      <div className="grid grid-cols-10 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            type="button"
            className={`p-2 text-sm font-medium rounded transition-colors ${
              score === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
};

const feedbackSchema = z.object({
  overallSatisfaction: z.number().min(1).max(5),
  contentQuality: z.number().min(1).max(5),
  organizationRating: z.number().min(1).max(5),
  venueRating: z.number().min(1).max(5).optional(),
  recommendationScore: z.number().min(1).max(10),
  likedMost: z.string().optional(),
  improvements: z.string().optional(),
  additionalComments: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

interface FeedbackFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  isOnline: boolean;
  customQuestions: ICustomQuestion[];
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export default function FeedbackForm({
  eventId,
  eventTitle,
  eventDate,
  isOnline,
  customQuestions,
  onSubmit,
  isSubmitting
}: FeedbackFormProps) {
  const { toast } = useToast();
  const [customAnswers, setCustomAnswers] = useState<IFeedbackAnswer[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      overallSatisfaction: 0,
      contentQuality: 0,
      organizationRating: 0,
      venueRating: isOnline ? undefined : 0,
      recommendationScore: 0,
      likedMost: '',
      improvements: '',
      additionalComments: '',
      isAnonymous: false,
    },
  });

  const handleCustomAnswer = (questionId: string, questionText: string, questionType: string, answer: any) => {
    setCustomAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, answer }
            : a
        );
      }
      return [...prev, { questionId, questionText, questionType, answer }];
    });
  };

  const handleSubmit = async (values: z.infer<typeof feedbackSchema>) => {
    try {
      await onSubmit({
        ...values,
        customAnswers
      });
      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
            </p>
            <Button onClick={() => window.close()} variant="outline">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Share Your Feedback</h1>
        <div className="space-y-1">
          <h2 className="text-xl text-gray-700">{eventTitle}</h2>
          <p className="text-gray-500">{eventDate}</p>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your feedback helps us create better events. This should take less than 3 minutes to complete.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Rating Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Rate Your Experience
              </CardTitle>
              <CardDescription>
                Please rate different aspects of the event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="overallSatisfaction"
                render={({ field }) => (
                  <FormItem>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      label="Overall satisfaction with the event"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentQuality"
                render={({ field }) => (
                  <FormItem>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      label="Quality of content/presentations"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationRating"
                render={({ field }) => (
                  <FormItem>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      label="Event organization and logistics"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isOnline && (
                <FormField
                  control={form.control}
                  name="venueRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        value={field.value || 0}
                        onChange={field.onChange}
                        label="Venue and facilities"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Recommendation Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Recommendation
              </CardTitle>
              <CardDescription>
                How likely are you to recommend this event to others?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="recommendationScore"
                render={({ field }) => (
                  <FormItem>
                    <NPSRating
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Text Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Tell Us More
              </CardTitle>
              <CardDescription>
                Help us understand what worked well and what we can improve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="likedMost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What did you like most about the event?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us what stood out to you..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="improvements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What could we improve for future events?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your suggestions..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Any additional comments?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Anything else you'd like to share..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom Questions */}
          {customQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Questions</CardTitle>
                <CardDescription>
                  The organizer has some specific questions for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customQuestions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.type === 'rating' && (
                      <StarRating
                        value={customAnswers.find(a => a.questionId === question.id)?.answer as number || 0}
                        onChange={(value) => handleCustomAnswer(question.id, question.question, question.type, value)}
                        label=""
                      />
                    )}
                    
                    {question.type === 'text' && (
                      <Textarea
                        placeholder="Your answer..."
                        value={customAnswers.find(a => a.questionId === question.id)?.answer as string || ''}
                        onChange={(e) => handleCustomAnswer(question.id, question.question, question.type, e.target.value)}
                        className="min-h-[60px]"
                      />
                    )}
                    
                    {question.type === 'yesNo' && (
                      <RadioGroup
                        value={customAnswers.find(a => a.questionId === question.id)?.answer as string || ''}
                        onValueChange={(value) => handleCustomAnswer(question.id, question.question, question.type, value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                          <label htmlFor={`${question.id}-yes`}>Yes</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`${question.id}-no`} />
                          <label htmlFor={`${question.id}-no`}>No</label>
                        </div>
                      </RadioGroup>
                    )}
                    
                    {question.type === 'multipleChoice' && question.options && (
                      <RadioGroup
                        value={customAnswers.find(a => a.questionId === question.id)?.answer as string || ''}
                        onValueChange={(value) => handleCustomAnswer(question.id, question.question, question.type, value)}
                      >
                        {question.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                            <label htmlFor={`${question.id}-${index}`}>{option}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Privacy Option */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Submit feedback anonymously
                      </FormLabel>
                      <FormDescription>
                        Your name won't be associated with this feedback
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="px-8 py-3"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
