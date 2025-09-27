'use client';

import { useEffect, useState, useRef } from 'react';
import { Calendar, Users, MapPin, Star, TrendingUp, Award } from 'lucide-react';

interface StatItemProps {
  icon: React.ComponentType<any>;
  endValue: number;
  label: string;
  suffix?: string;
  prefix?: string;
  gradient: string;
}

function StatItem({ icon: Icon, endValue, label, suffix = '', prefix = '', gradient }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      let startTime: number;
      const duration = 2000; // 2 seconds

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;

        if (progress < 1) {
          setCount(Math.floor(endValue * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(endValue);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isVisible, endValue]);

  return (
    <div ref={elementRef} className="text-center group">
      <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${gradient} mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
        <Icon className="w-10 h-10 text-white" />
      </div>
      <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-3 group-hover:scale-105 transition-transform duration-300">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xl text-gray-600 font-medium">{label}</div>
    </div>
  );
}

const stats = [
  {
    icon: Calendar,
    endValue: 1250,
    label: 'Total Events Created',
    suffix: '+',
    gradient: 'from-red-500 to-indigo-500'
  },
  {
    icon: Users,
    endValue: 15000,
    label: 'Active Students',
    suffix: '+',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: MapPin,
    endValue: 75,
    label: 'Campus Locations',
    suffix: '+',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Star,
    endValue: 4.9,
    label: 'Average Rating',
    suffix: '/5',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: TrendingUp,
    endValue: 89,
    label: 'Event Success Rate',
    suffix: '%',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    icon: Award,
    endValue: 500,
    label: 'Achievements Earned',
    suffix: '+',
    gradient: 'from-indigo-500 to-red-500'
  }
];

export default function StatsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-red-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Trusted by Students Everywhere
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how our platform is transforming campus life and creating meaningful connections across universities worldwide.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-12 max-w-7xl mx-auto">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>

        {/* Achievement Showcase */}
        <div className="mt-24">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Making Campus Life More Connected
                </h3>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Our platform has facilitated thousands of meaningful connections, helped students discover their passions,
                  and created a more vibrant campus community across multiple universities.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-lg">50+ Universities using our platform</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-lg">99.9% Platform uptime</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-lg">24/7 Student support</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold text-red-400 mb-2">92%</div>
                  <div className="text-sm text-gray-300">Student Satisfaction</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold text-blue-400 mb-2">85%</div>
                  <div className="text-sm text-gray-300">Repeat Attendees</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold text-green-400 mb-2">78%</div>
                  <div className="text-sm text-gray-300">New Friendships</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">95%</div>
                  <div className="text-sm text-gray-300">Event Success</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}