'use client';

import { Calendar, Users, MapPin, Clock, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EventStatsProps {
    totalEvents: number;
    activeEvents: number;
    totalAttendees: number;
    topCategories: string[];
}

export default function EventStats({
    totalEvents,
    activeEvents,
    totalAttendees,
    topCategories
}: EventStatsProps) {
    const stats = [
        {
            icon: Calendar,
            label: 'Total Events',
            value: totalEvents.toLocaleString(),
            subtext: 'This semester',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            icon: TrendingUp,
            label: 'Active Events',
            value: activeEvents.toLocaleString(),
            subtext: 'Happening now',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            icon: Users,
            label: 'Total Attendees',
            value: totalAttendees.toLocaleString(),
            subtext: 'Students registered',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            icon: Award,
            label: 'Categories',
            value: topCategories.length.toString(),
            subtext: 'Different types',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                    <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                                <p className="text-sm font-medium text-gray-700 mb-1">{stat.label}</p>
                                <p className="text-xs text-gray-500">{stat.subtext}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}