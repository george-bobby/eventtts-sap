import React from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { getQRCodeByTicketId } from '@/lib/actions/qrcode.action';
import { dateConverter, timeFormatConverter } from '@/lib/utils';
import Link from 'next/link';

interface VerifyTicketPageProps {
  params: Promise<{ ticketId: string }>;
}

export default async function VerifyTicketPage({ params }: VerifyTicketPageProps) {
  const { ticketId } = await params;

  let qrCode = null;
  let error = null;

  try {
    qrCode = await getQRCodeByTicketId(ticketId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Ticket not found';
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invalid Ticket</CardTitle>
            <CardDescription>
              {error || 'The ticket you are trying to verify was not found.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'used':
        return <CheckCircle className="w-8 h-8 text-blue-600" />;
      case 'expired':
        return <Clock className="w-8 h-8 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isValid = qrCode.status === 'active' && (!qrCode.expiresAt || new Date() <= new Date(qrCode.expiresAt));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {getStatusIcon(qrCode.status)}
          </div>
          <CardTitle className={isValid ? 'text-green-600' : 'text-red-600'}>
            {isValid ? 'Valid Ticket' : 'Invalid Ticket'}
          </CardTitle>
          <CardDescription>
            Ticket verification for {qrCode.event.title}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Ticket Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge className={getStatusColor(qrCode.status)}>
              {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
            </Badge>
          </div>

          {/* Ticket ID */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Ticket ID:</span>
            <span className="font-mono text-sm">{qrCode.ticketId}</span>
          </div>

          {/* Event Details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Event Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Event:</span>
                <span className="font-medium">{qrCode.event.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{dateConverter(qrCode.event.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{timeFormatConverter(qrCode.event.startDate)}</span>
              </div>
              {qrCode.event.location && (
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span>{qrCode.event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attendee Details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Attendee Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-medium">
                  {qrCode.user.firstName} {qrCode.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{qrCode.user.email}</span>
              </div>
            </div>
          </div>

          {/* Ticket Metadata */}
          {qrCode.metadata && Object.keys(qrCode.metadata).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Ticket Information</h3>
              <div className="space-y-2 text-sm">
                {qrCode.metadata.ticketType && (
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{qrCode.metadata.ticketType}</span>
                  </div>
                )}
                {qrCode.metadata.seatNumber && (
                  <div className="flex justify-between">
                    <span>Seat:</span>
                    <span>{qrCode.metadata.seatNumber}</span>
                  </div>
                )}
                {qrCode.metadata.section && (
                  <div className="flex justify-between">
                    <span>Section:</span>
                    <span>{qrCode.metadata.section}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scan Information */}
          {qrCode.scannedAt && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Scan Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Scanned At:</span>
                  <span>{new Date(qrCode.scannedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Expiration */}
          {qrCode.expiresAt && (
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Expires:</span>
                <span className={new Date() > new Date(qrCode.expiresAt) ? 'text-red-600' : 'text-gray-600'}>
                  {new Date(qrCode.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 text-center">
            <Button asChild>
              <Link href={`/event/${qrCode.event._id}`}>View Event</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
