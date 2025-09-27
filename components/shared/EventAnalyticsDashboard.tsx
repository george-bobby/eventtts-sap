'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface EventAnalyticsDashboardProps {
  eventId: string;
  event: any;
  organizerId: string;
}

interface EventStats {
  totalTicketsSold: number;
  totalRevenue: number;
}

interface FeedbackAnalytics {
  totalResponses: number;
  responseRate: number;
  averageRatings: {
    overallSatisfaction: number;
    contentQuality: number;
    organizationRating: number;
    venueRating?: number;
    recommendationScore: number;
  };
  satisfactionDistribution: {
    [key: number]: number;
  };
}

interface IssueAnalytics {
  totalIssues: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    [key: string]: number;
  };
  resolutionRate: number;
  avgResolutionTime: number;
}

export default function EventAnalyticsDashboard({ eventId, event, organizerId }: EventAnalyticsDashboardProps) {
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [issueAnalytics, setIssueAnalytics] = useState<IssueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all analytics in parallel
      const [eventStatsResponse, feedbackResponse, issueResponse] = await Promise.all([
        import('@/lib/actions/order.action').then(module => module.getEventStatistics(eventId)),
        fetch(`/api/feedback/responses/${eventId}?analytics=true`).then(res => res.json()),
        import('@/lib/actions/issue.action').then(module => module.getIssueAnalytics(eventId))
      ]);

      setEventStats(eventStatsResponse);

      if (feedbackResponse.analytics) {
        setFeedbackAnalytics(feedbackResponse.analytics);
      }

      if (issueResponse.success && issueResponse.analytics) {
        setIssueAnalytics(issueResponse.analytics);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  // Calculate derived metrics
  const attendanceRate = event.totalCapacity > 0 ?
    ((eventStats?.totalTicketsSold || 0) / event.totalCapacity * 100) : 0;

  const ticketsRemaining = event.totalCapacity - (eventStats?.totalTicketsSold || 0);

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">Comprehensive insights for your event performance</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-gray-900">{eventStats?.totalTicketsSold || 0}</p>
                <p className="text-sm text-gray-500">of {event.totalCapacity} capacity</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <Progress value={attendanceRate} className="mt-3" />
            <p className="text-xs text-gray-500 mt-1">{attendanceRate.toFixed(1)}% capacity filled</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{eventStats?.totalRevenue || 0}</p>
                <p className="text-sm text-gray-500">
                  {event.isFree ? 'Free Event' : `₹${event.price} per ticket`}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feedback Responses</p>
                <p className="text-3xl font-bold text-gray-900">{feedbackAnalytics?.totalResponses || 0}</p>
                <p className="text-sm text-gray-500">
                  {feedbackAnalytics?.responseRate?.toFixed(1) || 0}% response rate
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
            {feedbackAnalytics && (
              <Progress value={feedbackAnalytics.responseRate} className="mt-3" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues Reported</p>
                <p className="text-3xl font-bold text-gray-900">{issueAnalytics?.totalIssues || 0}</p>
                <p className="text-sm text-gray-500">
                  {issueAnalytics?.resolutionRate?.toFixed(1) || 0}% resolved
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            {issueAnalytics && (
              <Progress value={issueAnalytics.resolutionRate} className="mt-3" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Breakdown</CardTitle>
                <CardDescription>Ticket sales and capacity utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tickets Sold</span>
                    <span className="text-sm font-bold">{eventStats?.totalTicketsSold || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tickets Remaining</span>
                    <span className="text-sm font-bold">{ticketsRemaining}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Capacity</span>
                    <span className="text-sm font-bold">{event.totalCapacity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="text-sm font-bold">{attendanceRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={attendanceRate} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
                <CardDescription>Financial performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-sm font-bold">₹{eventStats?.totalRevenue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Price per Ticket</span>
                    <span className="text-sm font-bold">
                      {event.isFree ? 'Free' : `₹${event.price}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Potential Revenue</span>
                    <span className="text-sm font-bold">
                      ₹{event.isFree ? 0 : event.totalCapacity * event.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue Rate</span>
                    <span className="text-sm font-bold">
                      {event.isFree ? 'N/A' :
                        `${((eventStats?.totalRevenue || 0) / (event.totalCapacity * event.price) * 100).toFixed(1)}%`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {feedbackAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Ratings</CardTitle>
                  <CardDescription>Average ratings across different aspects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Satisfaction</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold">
                          {feedbackAnalytics.averageRatings.overallSatisfaction.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <Progress value={feedbackAnalytics.averageRatings.overallSatisfaction * 20} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Content Quality</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold">
                          {feedbackAnalytics.averageRatings.contentQuality.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <Progress value={feedbackAnalytics.averageRatings.contentQuality * 20} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Organization</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold">
                          {feedbackAnalytics.averageRatings.organizationRating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <Progress value={feedbackAnalytics.averageRatings.organizationRating * 20} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Recommendation Score</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold">
                          {feedbackAnalytics.averageRatings.recommendationScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    <Progress value={feedbackAnalytics.averageRatings.recommendationScore * 10} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Overview</CardTitle>
                  <CardDescription>Feedback collection metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Responses</span>
                      <span className="text-sm font-bold">{feedbackAnalytics.totalResponses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Response Rate</span>
                      <span className="text-sm font-bold">{feedbackAnalytics.responseRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={feedbackAnalytics.responseRate} />
                    <div className="text-xs text-gray-500 mt-2">
                      Based on {eventStats?.totalTicketsSold || 0} ticket holders
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Data</h3>
                <p className="text-gray-600">No feedback responses have been collected yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          {issueAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issue Status</CardTitle>
                  <CardDescription>Current status of reported issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Open</span>
                      <Badge variant="destructive">{issueAnalytics.byStatus.open}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">In Progress</span>
                      <Badge variant="default">{issueAnalytics.byStatus.inProgress}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Resolved</span>
                      <Badge variant="secondary">{issueAnalytics.byStatus.resolved}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Closed</span>
                      <Badge variant="outline">{issueAnalytics.byStatus.closed}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Issue Severity</CardTitle>
                  <CardDescription>Priority distribution of issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">High Priority</span>
                      <Badge variant="destructive">{issueAnalytics.bySeverity.high}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Medium Priority</span>
                      <Badge variant="default">{issueAnalytics.bySeverity.medium}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Low Priority</span>
                      <Badge variant="secondary">{issueAnalytics.bySeverity.low}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution Metrics</CardTitle>
                  <CardDescription>Issue resolution performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Resolution Rate</span>
                      <span className="text-sm font-bold">{issueAnalytics.resolutionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={issueAnalytics.resolutionRate} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg. Resolution Time</span>
                      <span className="text-sm font-bold">
                        {issueAnalytics.avgResolutionTime > 0
                          ? `${issueAnalytics.avgResolutionTime}h`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Reported</h3>
                <p className="text-gray-600">Great! No issues have been reported for this event.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance Score</CardTitle>
                <CardDescription>Composite score based on all metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {calculateOverallScore(attendanceRate, feedbackAnalytics, issueAnalytics).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600">Overall Event Performance</p>
                  <Progress
                    value={calculateOverallScore(attendanceRate, feedbackAnalytics, issueAnalytics)}
                    className="mt-4"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Performance highlights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generateInsights(attendanceRate, feedbackAnalytics, issueAnalytics, event).map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${insight.type === 'positive' ? 'bg-green-500' : insight.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <p className="text-sm text-gray-700">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function calculateOverallScore(attendanceRate: number, feedbackAnalytics: FeedbackAnalytics | null, issueAnalytics: IssueAnalytics | null): number {
  let score = 0;
  let factors = 0;

  // Attendance score (40% weight)
  score += attendanceRate * 0.4;
  factors += 0.4;

  // Feedback score (40% weight)
  if (feedbackAnalytics) {
    const avgSatisfaction = feedbackAnalytics.averageRatings.overallSatisfaction;
    score += (avgSatisfaction / 5) * 100 * 0.4;
    factors += 0.4;
  }

  // Issue resolution score (20% weight)
  if (issueAnalytics && issueAnalytics.totalIssues > 0) {
    score += issueAnalytics.resolutionRate * 0.2;
    factors += 0.2;
  } else if (issueAnalytics && issueAnalytics.totalIssues === 0) {
    // No issues is a good thing
    score += 100 * 0.2;
    factors += 0.2;
  }

  return factors > 0 ? score / factors : 0;
}

function generateInsights(attendanceRate: number, feedbackAnalytics: FeedbackAnalytics | null, issueAnalytics: IssueAnalytics | null, event: any) {
  const insights = [];

  // Attendance insights
  if (attendanceRate >= 90) {
    insights.push({ type: 'positive', message: 'Excellent attendance rate! Your event is highly popular.' });
  } else if (attendanceRate >= 70) {
    insights.push({ type: 'positive', message: 'Good attendance rate. Consider strategies to reach full capacity.' });
  } else if (attendanceRate < 50) {
    insights.push({ type: 'negative', message: 'Low attendance rate. Review marketing and pricing strategies.' });
  }

  // Feedback insights
  if (feedbackAnalytics) {
    if (feedbackAnalytics.averageRatings.overallSatisfaction >= 4.5) {
      insights.push({ type: 'positive', message: 'Outstanding satisfaction ratings from attendees!' });
    } else if (feedbackAnalytics.averageRatings.overallSatisfaction < 3.5) {
      insights.push({ type: 'warning', message: 'Consider improving event experience based on feedback.' });
    }

    if (feedbackAnalytics.responseRate < 30) {
      insights.push({ type: 'warning', message: 'Low feedback response rate. Consider incentivizing feedback.' });
    }
  }

  // Issue insights
  if (issueAnalytics) {
    if (issueAnalytics.totalIssues === 0) {
      insights.push({ type: 'positive', message: 'No issues reported - excellent event execution!' });
    } else if (issueAnalytics.resolutionRate >= 80) {
      insights.push({ type: 'positive', message: 'Good issue resolution rate. Keep up the responsive support!' });
    } else if (issueAnalytics.byStatus.open > 0) {
      insights.push({ type: 'warning', message: `${issueAnalytics.byStatus.open} open issues need attention.` });
    }
  }

  return insights.length > 0 ? insights : [{ type: 'positive', message: 'Event analytics are being collected. Check back for more insights!' }];
}
