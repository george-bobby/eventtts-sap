'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw } from 'lucide-react';
import CustomQuestionsManager from './CustomQuestionsManager';
import { ICustomQuestion } from '@/types';

interface FeedbackTemplate {
  _id: string;
  event: string;
  customQuestions: ICustomQuestion[];
  feedbackHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackFormEditorProps {
  eventId: string;
  eventTitle: string;
  isOnline: boolean;
}

export default function FeedbackFormEditor({
  eventId,
  eventTitle,
  isOnline,
}: FeedbackFormEditorProps) {
  const [template, setTemplate] = useState<FeedbackTemplate | null>(null);
  const [customQuestions, setCustomQuestions] = useState<ICustomQuestion[]>([]);
  const [feedbackHours, setFeedbackHours] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/template/${eventId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
        setCustomQuestions(data.template.customQuestions || []);
        setFeedbackHours(data.template.feedbackHours || 2);
      } else if (response.status === 404) {
        // No template exists yet, use defaults
        setTemplate(null);
        setCustomQuestions([]);
        setFeedbackHours(2);
      } else {
        throw new Error('Failed to fetch feedback template');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/feedback/template/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customQuestions,
          feedbackHours,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.data);
        toast({
          title: "Success",
          description: data.message || "Feedback form updated successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update feedback form');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update feedback form",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [eventId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading feedback form...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Feedback Form
          </h3>
          <p className="text-gray-600">
            Customize the feedback questions and email timing for {eventTitle}
          </p>
        </div>
        <Button onClick={saveTemplate} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Email Timing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>
            Configure when feedback emails should be sent to attendees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-hours">Send feedback email after</Label>
              <Select
                value={feedbackHours.toString()}
                onValueChange={(value) => setFeedbackHours(parseInt(value))}
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">1 day</SelectItem>
                  <SelectItem value="48">2 days</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                How long after the event ends should feedback emails be sent to attendees
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Questions</CardTitle>
          <CardDescription>
            Add custom questions specific to your event. These will appear in addition to the default feedback questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomQuestionsManager
            questions={customQuestions}
            onQuestionsChange={setCustomQuestions}
          />
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            This is how your feedback form will look to attendees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <h4 className="font-medium">Default Questions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Overall satisfaction with the event (1-5 stars)</li>
                <li>• Content quality rating (1-5 stars)</li>
                <li>• Organization rating (1-5 stars)</li>
                {!isOnline && <li>• Venue rating (1-5 stars)</li>}
                <li>• Recommendation score (1-10)</li>
                <li>• What did you like most? (text)</li>
                <li>• Suggestions for improvement (text)</li>
                <li>• Additional comments (text)</li>
              </ul>
            </div>
            
            {customQuestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Your Custom Questions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {customQuestions.map((question, index) => (
                    <li key={question.id}>
                      • {question.question} ({question.type === 'rating' ? '1-5 stars' : question.type})
                      {question.required && <span className="text-red-500"> *</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
