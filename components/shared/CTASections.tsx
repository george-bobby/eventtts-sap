'use client';

import { ArrowRight, Calendar, Users, Star, Zap, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CTASections() {
  return (
    <>
      {/* Event Creators CTA */}
      <section className="py-24 bg-gradient-to-br from-red-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-6">
                  <Zap className="w-4 h-4 mr-2" />
                  For Event Organizers
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Create Events That
                  <span className="block text-red-600">Students Love</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Transform your event ideas into reality with our comprehensive event management tools.
                  Reach thousands of engaged students and create memorable campus experiences.
                </p>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-lg text-gray-700">Easy event creation and management</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-lg text-gray-700">Built-in promotion to relevant students</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-lg text-gray-700">Real-time analytics and feedback</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/create-event">
                    <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold">
                      Start Creating Events
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  {/* <Button variant="outline" size="lg" className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-4 rounded-full text-lg font-semibold">
                    View Success Stories
                  </Button> */}
                </div>
              </div>

              {/* Visual */}
              <div className="relative">
                <div className="bg-gradient-to-br from-red-600 to-red-600 rounded-3xl p-8 text-white relative">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-6">Event Creator Dashboard</h3>
                    <div className="space-y-4">
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Study Group Meetup</span>
                          <span className="text-green-300">85 attendees</span>
                        </div>
                        <div className="text-sm text-white/80">Today, 2:00 PM • Library Hall</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Tech Workshop</span>
                          <span className="text-yellow-300">62 attendees</span>
                        </div>
                        <div className="text-sm text-white/80">Tomorrow, 4:00 PM • Lab 201</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Movie Night</span>
                          <span className="text-blue-300">120 attendees</span>
                        </div>
                        <div className="text-sm text-white/80">Friday, 7:00 PM • Auditorium</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Attendees CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Visual */}
              <div className="relative order-2 lg:order-1">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 text-white relative">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-6">Your Event Feed</h3>
                    <div className="space-y-4">
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">Photography Workshop</span>
                        </div>
                        <div className="text-sm text-white/80 mb-2">Learn advanced photography techniques</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/70">Art Building • 3:00 PM</span>
                          <span className="text-xs bg-green-400 text-green-900 px-2 py-1 rounded-full">Interested</span>
                        </div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">Gaming Tournament</span>
                        </div>
                        <div className="text-sm text-white/80 mb-2">Join the campus esports championship</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/70">Game Center • 6:00 PM</span>
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">Attending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                  <Clock className="w-4 h-4 mr-2" />
                  For Students
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Discover Events
                  <span className="block text-blue-600">You'll Love</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Never miss out on amazing campus experiences again. Get personalized event recommendations
                  based on your interests and connect with like-minded students.
                </p>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-lg text-gray-700">Smart location-based recommendations</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-lg text-gray-700">Connect with friends and meet new people</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-lg text-gray-700">Personalized based on your interests</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/explore-events">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold">
                      Explore Events Now
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  {/* <Button variant="outline" size="lg" className="border-blue-300 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full text-lg font-semibold">
                    Set Preferences
                  </Button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Campus Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join thousands of students who are already making the most of their campus life.
              Whether you're looking to attend amazing events or create your own, we've got you covered.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white px-10 py-5 rounded-full text-xl font-semibold shadow-2xl hover:scale-105 transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>

              {/* <Link href="#features">
                <Button variant="outline" size="lg" className="border-2 border-white/30 text-black hover:bg-white hover:text-gray-900 px-10 py-5 rounded-full text-xl font-semibold transition-all duration-300">
                  Learn More
                </Button>
              </Link> */}
            </div>

            <div className="mt-12 text-gray-400">
              <p>No credit card required • Free forever • Join 15,000+ students</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}