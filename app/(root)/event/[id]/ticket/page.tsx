import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket as TicketIcon, CheckCircle, QrCode } from 'lucide-react';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { getUserEventTickets } from '@/lib/actions/ticket.action';
import { dateConverter, timeFormatConverter } from '@/lib/utils';
import { ITicket } from '@/lib/models/ticket.model';
import Image from 'next/image';
import { TicketQRCode } from '@/components/ui/qr-code';

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
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

  // Get user's tickets for this event
  const tickets = await getUserEventTickets(user._id, id);

  if (!tickets || tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">No Tickets Found</CardTitle>
            <CardDescription>
              You don't have any tickets for this event.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button asChild>
              <Link href={`/event/${id}`}>View Event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'used':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href={`/event/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TicketIcon className="w-8 h-8" />
            My Ticket{tickets.length > 1 ? 's' : ''}
          </h1>
          <p className="text-indigo-100 mt-2">
            {event.title}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Event Information Card */}
        <Card className="mb-8 overflow-hidden shadow-lg">
          <div className="relative h-48 w-full">
            {event.photo ? (
              <Image
                src={event.photo}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{event.title}</span>
              </div>
            )}
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {event.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{dateConverter(event.startDate as unknown as string)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{timeFormatConverter(event.startTime)} - {timeFormatConverter(event.endTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 md:col-span-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{event.location || 'Online Event'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-indigo-600" />
            Your Ticket{tickets.length > 1 ? 's' : ''} ({tickets.length})
          </h2>

          {tickets.map((ticket: ITicket, index: number) => (
            <Card key={ticket._id} className="overflow-hidden shadow-lg border-2 border-indigo-100 hover:border-indigo-300 transition-all">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Ticket {index + 1}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {ticket.ticketId}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(ticket.status)} border`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Entry Code - Prominent Display with QR Code */}
                <div className="bg-white border-4 border-dashed border-indigo-400 rounded-xl p-6 mb-6">
                  <p className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wide text-center">Entry Code</p>

                  {/* Responsive layout: QR code and text side by side on larger screens, stacked on mobile */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      <TicketQRCode entryCode={ticket.entryCode} size={120} />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        Scan QR Code
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-24 bg-gray-300"></div>
                    <div className="md:hidden w-24 h-px bg-gray-300"></div>

                    {/* Text Code */}
                    <div className="text-center">
                      <p className="text-4xl md:text-5xl font-bold text-indigo-600 tracking-[0.3em] font-mono">
                        {ticket.entryCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Or show this code
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Show either the QR code or entry code at the event entrance
                  </p>
                </div>

                {/* Ticket Details */}
                <div className="space-y-3">
                  {ticket.metadata?.ticketType && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">{ticket.metadata.ticketType}</span>
                    </div>
                  )}
                  {ticket.metadata?.additionalInfo && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Info:</span>
                      <span className="font-medium text-gray-900">{ticket.metadata.additionalInfo}</span>
                    </div>
                  )}
                  {ticket.verifiedAt && (
                    <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded-lg">
                      <span className="text-sm text-blue-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Verified At:
                      </span>
                      <span className="font-medium text-blue-900">
                        {new Date(ticket.verifiedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {ticket.expiresAt && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Expires:</span>
                      <span className={`font-medium ${new Date() > new Date(ticket.expiresAt) ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(ticket.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Information */}
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-900">⚠️ Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-900">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Please save this page or take a screenshot of your ticket{tickets.length > 1 ? 's' : ''}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>You can use either the QR code or entry code for verification at the event entrance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Each entry code can only be used once</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Arrive early to avoid queues at the entrance</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

