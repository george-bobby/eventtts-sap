'use client';

import { BarChart3, Users, QrCode, Star, ImageIcon, FileText, Calendar, Award, Bug, UserCheck, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: BarChart3,
    title: "AI-Powered Analytics",
    description: "Get intelligent insights about your events with automated reports on attendance, engagement, and revenue performance.",
    gradient: "from-red-500 to-indigo-500"
  },
  {
    icon: FileText,
    title: "Auto Feedback Collection",
    description: "Automatically collect and analyze attendee feedback with customizable forms and AI-generated insights.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: TrendingUp,
    title: "Revenue Analytics",
    description: "Track ticket sales, monitor revenue streams, and get detailed financial insights for better decision making.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Award,
    title: "Certificate Generation",
    description: "Automatically generate and distribute digital certificates to attendees with customizable templates and branding.",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: Bug,
    title: "Issue Reporting",
    description: "Built-in system for attendees to report issues and for organizers to track and resolve problems efficiently.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: ImageIcon,
    title: "Event Gallery",
    description: "Enable photo sharing with attendees, create collaborative galleries, and showcase your event memories.",
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    icon: Zap,
    title: "AI Event Planning",
    description: "Get AI-generated event plans, schedules, and suggestions to streamline your event organization process.",
    gradient: "from-teal-500 to-blue-500"
  },
  {
    icon: QrCode,
    title: "QR Code Tickets",
    description: "Generate secure QR code tickets for easy check-in, attendance tracking, and enhanced security at your events.",
    gradient: "from-amber-500 to-yellow-500"
  },
  {
    icon: UserCheck,
    title: "Attendee Management",
    description: "Comprehensive attendee tracking, registration management, and communication tools all in one place.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: Users,
    title: "Stakeholder Dashboard",
    description: "Provide stakeholders with real-time event insights, progress reports, and collaborative planning tools.",
    gradient: "from-cyan-500 to-teal-500"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Tools for Event Organizers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your event management with AI-powered features designed to maximize efficiency, engagement, and success.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed text-sm">
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