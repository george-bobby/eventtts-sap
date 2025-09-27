'use client';

import { Calendar, Users, MapPin, Star, Share2, Bell, Clock, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Calendar,
    title: "Smart Event Discovery",
    description: "Find events that match your interests with our AI-powered recommendation system. Never miss out on what matters to you.",
    gradient: "from-red-500 to-indigo-500"
  },
  {
    icon: Users,
    title: "Community Building",
    description: "Connect with like-minded students, join study groups, and build lasting friendships through shared experiences.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: MapPin,
    title: "Campus Navigation",
    description: "Get precise directions to event locations with our integrated campus mapping and navigation system.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Star,
    title: "Event Rating System",
    description: "Rate and review events to help others discover quality experiences and improve future campus activities.",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: Share2,
    title: "Social Sharing",
    description: "Share events with friends, create group attendance, and spread the word about amazing campus activities.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get personalized reminders and updates about events you're interested in or attending.",
    gradient: "from-indigo-500 to-red-500"
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Stay informed with live updates about event changes, cancellations, or last-minute announcements.",
    gradient: "from-teal-500 to-blue-500"
  },
  {
    icon: Trophy,
    title: "Achievement System",
    description: "Earn badges and recognition for event participation, community engagement, and campus involvement.",
    gradient: "from-amber-500 to-yellow-500"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Students Love Our Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover powerful features designed to enhance your campus experience and help you make the most of your student life.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {/* <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-red-600 to-indigo-600 rounded-2xl p-8 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Campus Experience?</h3>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of students who are already discovering amazing events and building lasting connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105">
                Start Exploring
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-red-600 transition-all duration-300">
                Create Your First Event
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}