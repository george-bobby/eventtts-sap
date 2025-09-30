import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Ticket as TicketIcon, Calendar, ArrowRight, Home } from 'lucide-react';
import { getUserByClerkId } from '@/lib/actions/user.action';

interface TicketsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const { userId: clerkId } = await auth();
  const params = await searchParams;

  if (!clerkId) {
    redirect('/sign-in');
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    redirect('/sign-in');
  }

  // Check if this is a success redirect
  const isSuccess = params.success === 'true';
  const sessionId = params.session_id as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Message */}
        {(isSuccess || sessionId) && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-green-800">
                  Booking Successful!
                </CardTitle>
                <CardDescription className="text-green-700 text-lg">
                  Your ticket{sessionId ? 's have' : ' has'} been confirmed and {sessionId ? 'are' : 'is'} ready to use.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-green-700">
                  {sessionId
                    ? 'Payment processed successfully. You will receive a confirmation email shortly with your ticket details and entry codes.'
                    : 'Your free event registration is complete. Check your email for ticket details and entry codes.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <TicketIcon className="w-4 h-4" />
                      View My Tickets
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Link href="/explore" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Explore More Events
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <TicketIcon className="w-10 h-10 text-indigo-600" />
              My Tickets
            </h1>
            <p className="text-xl text-gray-600">
              Manage your event tickets and bookings
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TicketIcon className="w-5 h-5 text-blue-600" />
                  Active Tickets
                </CardTitle>
                <CardDescription>
                  View and manage your upcoming event tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    View Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Explore Events
                </CardTitle>
                <CardDescription>
                  Discover new events and book tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/explore" className="flex items-center gap-2">
                    Browse Events
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="w-5 h-5 text-purple-600" />
                  Home
                </CardTitle>
                <CardDescription>
                  Return to the main page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/" className="flex items-center gap-2">
                    Go Home
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Common questions about your tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Where are my tickets?</h4>
                <p className="text-gray-600">
                  Your tickets are available in your dashboard. Each ticket includes a unique entry code for event access.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How do I use my ticket?</h4>
                <p className="text-gray-600">
                  Present your 6-digit entry code at the event entrance. You can find this code in your ticket details or confirmation email.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I cancel my ticket?</h4>
                <p className="text-gray-600">
                  Yes, you can cancel your tickets from your dashboard. Cancelled tickets will update the event capacity automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
