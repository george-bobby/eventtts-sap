// 'use client';
import { SearchParamProps } from '@/types';
import { getEvents } from '@/lib/actions/event.action';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/actions/user.action';
import InteractiveEventsDiscovery from '@/components/shared/InteractiveEventsDiscovery';
import EventStats from '@/components/shared/EventStats';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Explore Events | SAP Hackathon',
    description: 'Discover amazing events, workshops, seminars, and activities happening on campus. Find your perfect event and connect with like-minded students.',
    keywords: ['events', 'university', 'student activities', 'workshops', 'seminars', 'campus events'],
};

export default async function ExploreEventsPage({ searchParams }: SearchParamProps) {
    const { userId } = await auth();
    const resolvedSearchParams = await searchParams;

    // Enhanced search parameters handling
    const page = Number(resolvedSearchParams?.page) || 1;
    const searchText = (resolvedSearchParams?.query as string) || '';
    const category = (resolvedSearchParams?.category as string) || '';
    const sortBy = (resolvedSearchParams?.sort as string) || 'date';
    const dateFilter = (resolvedSearchParams?.date as string) || '';
    const location = (resolvedSearchParams?.location as string) || '';
    const priceMin = Number(resolvedSearchParams?.priceMin) || 0;
    const priceMax = Number(resolvedSearchParams?.priceMax) || 10000;

    // Fetch events and user data in parallel
    const [events, user] = await Promise.all([
        getEvents({
            query: searchText,
            category,
            page,
            limit: 12,
        }),
        userId ? getUserByClerkId(userId) : Promise.resolve(null)
    ]);

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Events Discovery Component */}
            <InteractiveEventsDiscovery
                events={events?.events || []}
                currentUserId={userId}
                totalPages={events?.totalPages || 0}
                page={page}
                user={user}
            />
        </main>
    );
}