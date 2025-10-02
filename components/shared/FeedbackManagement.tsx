'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  MessageCircle,
  TrendingUp,
  Users,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IFeedbackAnalytics } from '@/types';
import FeedbackFormManager from './FeedbackFormManager';

interface FeedbackResponse {
  _id: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  isAnonymous: boolean;
  overallSatisfaction: number;
  contentQuality: number;
  organizationRating: number;
  venueRating?: number;
  recommendationScore: number;
  likedMost?: string;
  improvements?: string;
  additionalComments?: string;
  submittedAt: string;
}

interface FeedbackManagementProps {
  eventId: string;
  eventTitle: string;
  isOrganizer: boolean;
  isOnline?: boolean;
}

const StarDisplay = ({ rating, maxStars = 5 }: { rating: number; maxStars?: number }) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(maxStars)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

const NPSBadge = ({ score }: { score: number }) => {
  let color = 'bg-red-100 text-red-800';
  let label = 'Detractor';

  if (score >= 9) {
    color = 'bg-green-100 text-green-800';
    label = 'Promoter';
  } else if (score >= 7) {
    color = 'bg-yellow-100 text-yellow-800';
    label = 'Passive';
  }

  return (
    <Badge className={color}>
      {score}/10 - {label}
    </Badge>
  );
};

export default function FeedbackManagement({
  eventId,
  eventTitle,
  isOrganizer,
  isOnline = false
}: FeedbackManagementProps) {
  const [analytics, setAnalytics] = useState<IFeedbackAnalytics | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const [showFormManager, setShowFormManager] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

  const fetchFeedbackData = async () => {
    if (!isOrganizer) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/feedback/responses/${eventId}?page=${currentPage}&analytics=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feedback data');
      }

      const data = await response.json();
      setResponses(data.responses);
      setAnalytics(data.analytics);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackData();
  }, [eventId, currentPage, isOrganizer]);

  const handleSendFeedbackEmails = async () => {
    setSendingEmails(true);
    try {
      const response = await fetch('/api/feedback/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Failed to send feedback emails');
      }
    } catch (error) {
      console.error('Error sending feedback emails:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send feedback emails",
        variant: "destructive",
      });
    } finally {
      setSendingEmails(false);
    }
  };

  if (!isOrganizer) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">You don't have permission to view feedback for this event.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }



  if (!analytics || analytics.totalResponses === 0) {
    return (
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Feedback Management</h2>
            <p className="text-gray-600">{eventTitle}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchFeedbackData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleSendFeedbackEmails}
              disabled={sendingEmails}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              {sendingEmails ? 'Sending...' : 'Send Feedback Emails'}
            </Button>
            <Button
              onClick={() => setShowFormManager(!showFormManager)}
              variant={showFormManager ? "secondary" : "default"}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showFormManager ? 'View Responses' : 'Configure Form'}
            </Button>
          </div>
        </div>

        {/* No Feedback Message */}
        {!showFormManager && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Yet</h3>
              <p className="text-gray-500 mb-6">
                No feedback responses have been collected for this event yet.
                Configure your feedback form to get started.
              </p>
              <Button onClick={() => setShowFormManager(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Settings className="w-4 h-4 mr-2" />
                Configure Feedback Form
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Form Manager */}
        {showFormManager && (
          <FeedbackFormManager
            eventId={eventId}
            eventTitle={eventTitle}
            isOnline={isOnline}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Management</h2>
          <p className="text-gray-600">{eventTitle}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchFeedbackData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSendFeedbackEmails}
            disabled={sendingEmails}
            variant="outline"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            {sendingEmails ? 'Sending...' : 'Send Feedback Emails'}
          </Button>
          <Button
            onClick={() => setShowFormManager(!showFormManager)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2 text-white" />
            {showFormManager ? 'View Responses' : 'Configure Form'}
          </Button>
        </div>
      </div>

      {/* Form Manager (when toggled) */}
      {showFormManager && (
        <FeedbackFormManager
          eventId={eventId}
          eventTitle={eventTitle}
          isOnline={isOnline}
        />
      )}

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalResponses}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.responseRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={analytics.responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.averageRatings.overallSatisfaction.toFixed(1)}/5
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPS Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.npsScore}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics - Only show when form manager is hidden */}
      {!showFormManager && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">Individual Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Rating Breakdown</CardTitle>
                  <CardDescription>Average ratings across different categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Satisfaction</span>
                    <StarDisplay rating={analytics.averageRatings.overallSatisfaction} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Content Quality</span>
                    <StarDisplay rating={analytics.averageRatings.contentQuality} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Organization</span>
                    <StarDisplay rating={analytics.averageRatings.organizationRating} />
                  </div>
                  {analytics.averageRatings.venueRating && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Venue</span>
                      <StarDisplay rating={analytics.averageRatings.venueRating} />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Recommendation</span>
                    <StarDisplay rating={analytics.averageRatings.recommendationScore} maxStars={10} />
                  </div>
                </CardContent>
              </Card>

              {/* NPS Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Net Promoter Score</CardTitle>
                  <CardDescription>How likely attendees are to recommend your event</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">{analytics.npsScore}</div>
                    <div className="text-sm text-gray-600 mb-4">
                      {analytics.npsScore >= 50 && "Excellent"}
                      {analytics.npsScore >= 0 && analytics.npsScore < 50 && "Good"}
                      {analytics.npsScore < 0 && "Needs Improvement"}
                    </div>
                    <Progress
                      value={Math.max(0, (analytics.npsScore + 100) / 2)}
                      className="mb-2"
                    />
                    <p className="text-xs text-gray-500">
                      NPS ranges from -100 to +100
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            <div className="space-y-4">
              {responses.map((response) => (
                <Card key={response._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">
                          {response.isAnonymous
                            ? 'Anonymous Feedback'
                            : `${response.user?.firstName} ${response.user?.lastName}`
                          }
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(response.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <NPSBadge score={response.recommendationScore} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Overall</p>
                        <StarDisplay rating={response.overallSatisfaction} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Content</p>
                        <StarDisplay rating={response.contentQuality} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Organization</p>
                        <StarDisplay rating={response.organizationRating} />
                      </div>
                      {response.venueRating && (
                        <div>
                          <p className="text-xs text-gray-500">Venue</p>
                          <StarDisplay rating={response.venueRating} />
                        </div>
                      )}
                    </div>

                    {(response.likedMost || response.improvements || response.additionalComments) && (
                      <div className="space-y-2 pt-4 border-t">
                        {response.likedMost && (
                          <div>
                            <p className="text-sm font-medium text-green-700">What they liked:</p>
                            <p className="text-sm text-gray-600">{response.likedMost}</p>
                          </div>
                        )}
                        {response.improvements && (
                          <div>
                            <p className="text-sm font-medium text-orange-700">Suggestions for improvement:</p>
                            <p className="text-sm text-gray-600">{response.improvements}</p>
                          </div>
                        )}
                        {response.additionalComments && (
                          <div>
                            <p className="text-sm font-medium text-blue-700">Additional comments:</p>
                            <p className="text-sm text-gray-600">{response.additionalComments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
