import { lazy, Suspense } from "react";
import { auth } from "@clerk/nextjs";
import EventsHero from "@/components/shared/EventsHero";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { getEvents } from "@/lib/actions/event.action";

// Lazy load components that are not immediately visible  
const FeaturesSection = lazy(() => import("@/components/shared/FeaturesSection"));
const StatsSection = lazy(() => import("@/components/shared/StatsSection"));
const VideoSection = lazy(() => import("@/components/shared/VideoSection"));
const CTASections = lazy(() => import("@/components/shared/CTASections"));

// ✅ This is the definitive fix for the headers/searchParams error
export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ page?: string; q?: string; category?: string; }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  // ✅ Await auth() to avoid header issues in Next.js 15
  const { userId } = await auth();

  // Await searchParams in Next.js 15+
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const searchText = params.q || "";
  const category = params.category || "";

  const result = await getEvents({
    query: searchText,
    category,
    page
  });

  const events = result?.events || [];
  const totalPages = result?.totalPages || 0;

  return (
    <>
      {/* Modern Hero Section */}
      <EventsHero />

      {/* Lazy-loaded sections with loading fallbacks */}
      <Suspense fallback={<LoadingSpinner className="py-24 bg-gray-50" />}>
        <FeaturesSection />
      </Suspense>

      {/* <Suspense fallback={<LoadingSpinner className="py-24 bg-white" />}>
        <StatsSection />
      </Suspense> */}

      {/* <Suspense fallback={<LoadingSpinner className="py-24 bg-gray-50" />}>
        <VideoSection />
      </Suspense> */}

      <Suspense fallback={<LoadingSpinner className="py-24 bg-white" />}>
        <CTASections />
      </Suspense>
    </>
  );
}