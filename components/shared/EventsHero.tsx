'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users, MapPin, Sparkles, BarChart3, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function EventsHero() {
  const { userId } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-500 pt-16">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
              <Settings className="w-4 h-4 mr-2 text-blue-400" />
              Professional Event Organization Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Create & Manage
              <span className="block bg-gradient-to-r from-red-400 via-red-400 to-red-400 bg-clip-text text-transparent">
                Your Events
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Everything you need to organize successful events - from planning to execution,
              attendee management to analytics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/create">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold">
                  Create New Event
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="bg-white/20 border-white/30 text-white hover:bg-white/30 px-8 py-4 rounded-full text-lg font-semibold">
                  Manage My Events
                </Button>
              </Link>
            </div>

            {/* Stats - Organizer Focused */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-white/20 rounded-xl p-4 border border-white/30">
                  <Calendar className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">500+</div>
                  <div className="text-white/80 text-sm">Events Created</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-xl p-4 border border-white/30">
                  <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">95%</div>
                  <div className="text-white/80 text-sm">Success Rate</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-xl p-4 border border-white/30">
                  <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">10K+</div>
                  <div className="text-white/80 text-sm">Total Attendees</div>
                </div>
              </div>
            </div>

            {/* Key Features for Organizers */}
            {/* <div className="mt-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <Calendar className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Event Planning</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Attendee Management</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <BarChart3 className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Analytics Dashboard</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <Settings className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">Full Control</div>
                </div>
              </div>
            </div> */}

          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}