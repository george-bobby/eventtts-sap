'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Plus, Send, Edit, Trash2, Eye, Calendar, Users, Mail, MessageSquare, RefreshCw, BarChart3, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventUpdate {
  _id: string;
  title: string;
  content: string;
  type: 'announcement' | 'schedule_change' | 'location_change' | 'cancellation' | 'reminder' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'scheduled' | 'sent';
  publishedAt?: string;
  scheduledFor?: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  recipients: {
    sendToAll: boolean;
    specificUsers?: string[];
    userRoles?: string[];
  };
  deliveryMethods: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    push: boolean;
  };
  emailStats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface EventUpdatesManagementProps {
  eventId: string;
  eventTitle: string;
  organizerId: string;
}

export default function EventUpdatesManagement({
  eventId,
  eventTitle,
  organizerId,
}: EventUpdatesManagementProps) {
  const [updates, setUpdates] = useState<EventUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<EventUpdate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUpdates = async () => {
    try {
      const response = await fetch(`/api/event-updates?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.data || []);
      } else {
        throw new Error('Failed to fetch updates');
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast({
        title: "Error",
        description: "Failed to load event updates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const publishUpdate = async (updateId: string) => {
    try {
      const response = await fetch(`/api/event-updates/${updateId}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Update published successfully",
        });
        fetchUpdates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish update');
      }
    } catch (error) {
      console.error('Error publishing update:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish update",
        variant: "destructive",
      });
    }
  };

  const deleteUpdate = async (updateId: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      const response = await fetch(`/api/event-updates/${updateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Update deleted successfully",
        });
        fetchUpdates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete update');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete update",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <MessageSquare className="h-4 w-4" />;
      case 'schedule_change':
        return <Calendar className="h-4 w-4" />;
      case 'location_change':
        return <Users className="h-4 w-4" />;
      case 'cancellation':
        return <Trash2 className="h-4 w-4" />;
      case 'reminder':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [eventId]);

  const draftUpdates = updates.filter(u => u.status === 'draft');
  const publishedUpdates = updates.filter(u => u.status === 'published');
  const scheduledUpdates = updates.filter(u => u.status === 'scheduled');
  const sentUpdates = updates.filter(u => u.status === 'sent');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Updates</h2>
          <p className="text-gray-600">Send notifications and updates to attendees of {eventTitle}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchUpdates} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Event Update</DialogTitle>
                <DialogDescription>
                  Send notifications and updates to your event attendees
                </DialogDescription>
              </DialogHeader>
              <CreateUpdateForm
                eventId={eventId}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  fetchUpdates();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Updates</p>
                <p className="text-2xl font-bold">{updates.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{publishedUpdates.length}</p>
              </div>
              <Send className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">{draftUpdates.length}</p>
              </div>
              <Edit className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduledUpdates.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({updates.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftUpdates.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedUpdates.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledUpdates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UpdatesList
            updates={updates}
            onPublish={publishUpdate}
            onEdit={setSelectedUpdate}
            onDelete={deleteUpdate}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getTypeIcon={getTypeIcon}
          />
        </TabsContent>

        <TabsContent value="draft">
          <UpdatesList
            updates={draftUpdates}
            onPublish={publishUpdate}
            onEdit={setSelectedUpdate}
            onDelete={deleteUpdate}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getTypeIcon={getTypeIcon}
          />
        </TabsContent>

        <TabsContent value="published">
          <UpdatesList
            updates={publishedUpdates}
            onPublish={publishUpdate}
            onEdit={setSelectedUpdate}
            onDelete={deleteUpdate}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getTypeIcon={getTypeIcon}
          />
        </TabsContent>

        <TabsContent value="scheduled">
          <UpdatesList
            updates={scheduledUpdates}
            onPublish={publishUpdate}
            onEdit={setSelectedUpdate}
            onDelete={deleteUpdate}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getTypeIcon={getTypeIcon}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface UpdatesListProps {
  updates: EventUpdate[];
  onPublish: (updateId: string) => void;
  onEdit: (update: EventUpdate) => void;
  onDelete: (updateId: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
}

function UpdatesList({
  updates,
  onPublish,
  onEdit,
  onDelete,
  getStatusColor,
  getPriorityColor,
  getTypeIcon
}: UpdatesListProps) {
  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Updates Found</h3>
          <p className="text-gray-600 text-center">
            Create your first event update to communicate with attendees.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <Card key={update._id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(update.type)}
                  <CardTitle className="text-lg">{update.title}</CardTitle>
                  <Badge className={getStatusColor(update.status)}>
                    {update.status}
                  </Badge>
                  <Badge className={getPriorityColor(update.priority)}>
                    {update.priority}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {update.content}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Created: {new Date(update.createdAt).toLocaleDateString()}</p>
                {update.publishedAt && (
                  <p>Published: {new Date(update.publishedAt).toLocaleDateString()}</p>
                )}
                {update.scheduledFor && (
                  <p>Scheduled: {new Date(update.scheduledFor).toLocaleDateString()}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(update)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>

                {update.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => onPublish(update._id)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Publish
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(update._id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface CreateUpdateFormProps {
  eventId: string;
  onSuccess: () => void;
}

function CreateUpdateForm({ eventId, onSuccess }: CreateUpdateFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    sendToAll: true,
    email: true,
    inApp: true,
    sms: false,
    push: false,
    scheduledFor: undefined as Date | undefined,
    scheduledTime: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/event-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          title: formData.title,
          content: formData.content,
          type: formData.type,
          priority: formData.priority,
          recipients: {
            sendToAll: formData.sendToAll,
          },
          deliveryMethods: {
            email: formData.email,
            sms: formData.sms,
            inApp: formData.inApp,
            push: formData.push,
          },
          scheduledFor: formData.scheduledFor && formData.scheduledTime
            ? new Date(`${format(formData.scheduledFor, 'yyyy-MM-dd')}T${formData.scheduledTime}`).toISOString()
            : undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event update created successfully",
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create update');
      }
    } catch (error) {
      console.error('Error creating update:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create update",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter update title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter update content"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="schedule_change">Schedule Change</SelectItem>
              <SelectItem value="location_change">Location Change</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="cancellation">Cancellation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Delivery Methods</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="email"
              checked={formData.email}
              onCheckedChange={(checked) => setFormData({ ...formData, email: checked })}
            />
            <Label htmlFor="email">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="inApp"
              checked={formData.inApp}
              onCheckedChange={(checked) => setFormData({ ...formData, inApp: checked })}
            />
            <Label htmlFor="inApp">In-App Notification</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="sms"
              checked={formData.sms}
              onCheckedChange={(checked) => setFormData({ ...formData, sms: checked })}
            />
            <Label htmlFor="sms">SMS (Coming Soon)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="push"
              checked={formData.push}
              onCheckedChange={(checked) => setFormData({ ...formData, push: checked })}
            />
            <Label htmlFor="push">Push Notification (Coming Soon)</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Schedule For (Optional)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formData.scheduledFor && "text-muted-foreground"
                  )}
                >
                  {formData.scheduledFor ? (
                    format(formData.scheduledFor, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.scheduledFor}
                  onSelect={(date) => setFormData({ ...formData, scheduledFor: date })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledTime">Time</Label>
            <Input
              id="scheduledTime"
              type="time"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Update
        </Button>
      </div>
    </form>
  );
}
