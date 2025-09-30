import { SearchParamProps } from '@/types';
import { getEvents } from '@/lib/actions/event.action';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/actions/user.action';
import ExploreEventsClient from '@/components/shared/ExploreEventsClient';

// ✅ Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic';

interface ExplorePageProps {
    searchParams: Promise<{ page?: string; query?: string; category?: string }>;
}

export default async function ExploreEventsPage({ searchParams }: ExplorePageProps) {
    // ✅ Await auth() to avoid header issues in Next.js 15
    const { userId: clerkId } = await auth();

    // Await searchParams in Next.js 15+
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const searchText = params.query || '';
    const category = params.category || '';

    // Fetch events and user data on the server
    const [eventsData, userData] = await Promise.all([
        getEvents({
            query: searchText,
            category,
            page,
            limit: 12,
        }),
        clerkId ? getUserByClerkId(clerkId) : Promise.resolve(null)
    ]);

    // Pass data to client component
    return (
        <ExploreEventsClient
            initialEventsData={eventsData}
            userData={userData}
            userId={clerkId}
            initialPage={page}
        />
    );
}