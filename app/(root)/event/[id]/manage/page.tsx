import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Users, BarChart3, MessageSquare, UserCheck, Camera, AlertTriangle, Trash2, FileText, Award, Flag, Bell, QrCode, Target } from 'lucide-react';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { dateConverter, timeFormatConverter } from '@/lib/utils';
import DeleteEventButton from '@/components/shared/DeleteEventButton';

interface EventManagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EventManagePage({ params }: EventManagePageProps) {
  const { id } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  const [event, user] = await Promise.all([
    getEventById(id),
    getUserByClerkId(clerkId)
  ]);

  if (!event) {
    redirect('/');
  }

  // Check if user is the organizer
  if (String(event.organizer._id) !== String(user._id)) {
    redirect(`/event/${id}`);
  }

  const managementOptions = [
    {
      title: 'Plan Event',
      description: 'AI-powered task planning and management board',
      icon: Target,
      href: `/event/${id}/plan`,
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Edit Event',
      description: 'Update event details, description, and settings',
      icon: Edit,
      href: `/event/${id}/update`,
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Manage Attendees',
      description: 'View registered attendees and export data',
      icon: Users,
      href: `/event/${id}/attendees`,
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600'
    },
    {
      title: 'AI Report',
      description: 'Generate comprehensive event reports',
      icon: FileText,
      href: `/event/${id}/report`,
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-600'
    },
    {
      title: 'View Issues',
      description: 'Review and manage submitted issues',
      icon: AlertTriangle,
      href: `/event/${id}/issues`,
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Feedback Management',
      description: 'View feedback responses and analytics',
      icon: MessageSquare,
      href: `/event/${id}/feedback-management`,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Stakeholders',
      description: 'Manage speakers, volunteers, and participants',
      icon: UserCheck,
      href: `/event/${id}/stakeholders`,
      color: 'bg-teal-500 hover:bg-teal-600',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Photo Gallery',
      description: 'Manage event photos and galleries',
      icon: Camera,
      href: `/event/${id}/gallery`,
      color: 'bg-pink-500 hover:bg-pink-600',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Event Analytics',
      description: 'View comprehensive event performance metrics',
      icon: BarChart3,
      href: `/event/${id}/analytics`,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      iconColor: 'text-cyan-600'
    },
    {
      title: 'Certificates',
      description: 'Generate and manage event certificates',
      icon: Award,
      href: `/event/${id}/certificates`,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      iconColor: 'text-yellow-600'
    },
    // {
    //   title: 'Report Issues',
    //   description: 'Report technical or event-related issues',
    //   icon: Flag,
    //   href: `/event/${id}/report-issue`,
    //   color: 'bg-red-500 hover:bg-red-600',
    //   iconColor: 'text-red-600'
    // },
    {
      title: 'Event Updates',
      description: 'Send notifications and updates to attendees',
      icon: Bell,
      href: `/event/${id}/updates`,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'QR Code',
      description: 'Generate QR codes for event check-in',
      icon: QrCode,
      href: `/event/${id}/qr-code`,
      color: 'bg-slate-500 hover:bg-slate-600',
      iconColor: 'text-slate-600'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href={`/event/${id}`}>
                View Event Page
              </Link>
            </Button>
          </div>

          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">Event Management Dashboard</h1>
            <p className="text-indigo-100 text-lg mb-6">
              Manage all aspects of your event from this central dashboard
            </p>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <CardDescription className="text-base mb-4">
                  {event.description}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="default">
                    {event.isFree ? "Free" : `₹ ${event.price}`}
                  </Badge>
                  <Badge variant="secondary">{(event.category as any)?.name || 'Uncategorized'}</Badge>
                  <Badge variant="outline">
                    {event.isOnline ? 'Online' : event.location || 'Physical Event'}
                  </Badge>
                  {event.subEvents && event.subEvents.length > 0 && (
                    <Badge variant="outline">Main Event ({event.subEvents.length} sub-events)</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-1">
                    <strong>Date:</strong> {dateConverter(event.startDate as unknown as string)} - {dateConverter(event.endDate as unknown as string)}
                  </p>
                  <p className="mb-1">
                    <strong>Time:</strong> {timeFormatConverter(event.startTime)} - {timeFormatConverter(event.endTime)}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {event.totalCapacity} attendees
                    {event.ticketsLeft !== undefined && (
                      <span className="ml-2">({event.ticketsLeft} tickets remaining)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="ml-6">
                {event.photo && (
                  <img
                    src={event.photo}
                    alt={event.title}
                    className="w-32 h-24 object-cover rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Management Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {managementOptions.map((option, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <Link href={option.href}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${option.color.replace('hover:', '')} bg-opacity-10 mr-4`}>
                      <option.icon className={`w-6 h-6 ${option.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-indigo-600 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {option.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-red-800">Delete Event</h4>
                <p className="text-sm text-red-600">
                  Permanently delete this event and all associated data
                </p>
              </div>
              <DeleteEventButton event={event} />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
