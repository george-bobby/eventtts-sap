'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertTriangle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Issue {
  _id: string;
  eventTitle: string;
  reporterName: string;
  reporterEmail: string;
  category: string;
  subcategory?: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface IssueManagementProps {
  eventId: string;
  eventTitle: string;
  organizerId: string;
}

export default function IssueManagement({ eventId, eventTitle, organizerId }: IssueManagementProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/issues?eventId=${eventId}`);
      const data = await response.json();

      if (data.success) {
        setIssues(data.issues || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load issues",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast({
        title: "Error",
        description: "Failed to load issues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [eventId]);

  const updateIssueStatus = async (issueId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const { updateIssueStatus } = await import('@/lib/actions/issue.action');

      const result = await updateIssueStatus(issueId, newStatus, adminNotes);

      if (result.success) {
        toast({
          title: "Success",
          description: "Issue status updated successfully",
        });
        fetchIssues(); // Refresh the list
        setSelectedIssue(null);
        setAdminNotes('');
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update issue status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast({
        title: "Error",
        description: "Failed to update issue status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.reporterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { variant: 'destructive' as const, label: 'Open' },
      'in-progress': { variant: 'default' as const, label: 'In Progress' },
      'resolved': { variant: 'secondary' as const, label: 'Resolved' },
      'closed': { variant: 'outline' as const, label: 'Closed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      'low': { variant: 'secondary' as const, label: 'Low' },
      'medium': { variant: 'default' as const, label: 'Medium' },
      'high': { variant: 'destructive' as const, label: 'High' }
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const issueStats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading issues...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{issueStats.total}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{issueStats.open}</div>
            <div className="text-sm text-gray-600">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{issueStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{issueStats.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{issueStats.closed}</div>
            <div className="text-sm text-gray-600">Closed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{issueStats.high}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{issueStats.medium}</div>
            <div className="text-sm text-gray-600">Medium Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{issueStats.low}</div>
            <div className="text-sm text-gray-600">Low Priority</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
            <Button onClick={fetchIssues} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="event-info">Event Info</SelectItem>
                <SelectItem value="tickets-registration">Tickets & Registration</SelectItem>
                <SelectItem value="event-experience">Event Experience</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredIssues.length} of {issues.length} issues
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-600">
                {issues.length === 0
                  ? "No issues have been reported for this event yet."
                  : "No issues match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card key={issue._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(issue.status)}
                      <h3 className="text-lg font-semibold">{issue.title}</h3>
                      {getStatusBadge(issue.status)}
                      {getSeverityBadge(issue.severity)}
                      <Badge variant="outline">{issue.category.replace('-', ' ')}</Badge>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {issue.reporterName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </div>
                      {issue.subcategory && (
                        <Badge variant="secondary" className="text-xs">
                          {issue.subcategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setAdminNotes(issue.adminNotes || '');
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getStatusIcon(issue.status)}
                            Issue Details
                          </DialogTitle>
                          <DialogDescription>
                            Manage and update the status of this issue
                          </DialogDescription>
                        </DialogHeader>

                        {selectedIssue && (
                          <div className="space-y-6">
                            {/* Issue Information */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Issue Title</h4>
                                <p className="text-gray-700">{selectedIssue.title}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Description</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedIssue.description}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Reporter</h4>
                                  <p className="text-gray-700">{selectedIssue.reporterName}</p>
                                  <p className="text-sm text-gray-500">{selectedIssue.reporterEmail}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Reported On</h4>
                                  <p className="text-gray-700">
                                    {new Date(selectedIssue.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Category</h4>
                                  <Badge variant="outline">{selectedIssue.category.replace('-', ' ')}</Badge>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Severity</h4>
                                  {getSeverityBadge(selectedIssue.severity)}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Status</h4>
                                  {getStatusBadge(selectedIssue.status)}
                                </div>
                              </div>

                              {selectedIssue.subcategory && (
                                <div>
                                  <h4 className="font-semibold mb-2">Subcategory</h4>
                                  <p className="text-gray-700">{selectedIssue.subcategory}</p>
                                </div>
                              )}
                            </div>

                            {/* Admin Notes */}
                            <div>
                              <h4 className="font-semibold mb-2">Admin Notes</h4>
                              <Textarea
                                placeholder="Add notes about this issue..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            {/* Status Update Actions */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t">
                              <Button
                                onClick={() => updateIssueStatus(selectedIssue._id, 'in-progress')}
                                disabled={updatingStatus || selectedIssue.status === 'in-progress'}
                                variant="default"
                                size="sm"
                              >
                                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Mark In Progress
                              </Button>
                              <Button
                                onClick={() => updateIssueStatus(selectedIssue._id, 'resolved')}
                                disabled={updatingStatus || selectedIssue.status === 'resolved'}
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Mark Resolved
                              </Button>
                              <Button
                                onClick={() => updateIssueStatus(selectedIssue._id, 'closed')}
                                disabled={updatingStatus || selectedIssue.status === 'closed'}
                                variant="outline"
                                size="sm"
                              >
                                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Close Issue
                              </Button>
                              {selectedIssue.status !== 'open' && (
                                <Button
                                  onClick={() => updateIssueStatus(selectedIssue._id, 'open')}
                                  disabled={updatingStatus}
                                  variant="outline"
                                  size="sm"
                                >
                                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                  Reopen
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
