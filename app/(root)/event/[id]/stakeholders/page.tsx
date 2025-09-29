import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getEventStakeholders, getStakeholderStats } from '@/lib/actions/stakeholder.action';
import StakeholderManagement from '@/components/stakeholders/StakeholderManagement';

interface StakeholdersPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    role?: string;
    attendanceStatus?: string;
    search?: string;
  }>;
}

export default async function StakeholdersPage({
  params,
  searchParams
}: StakeholdersPageProps) {
  const { id } = await params;
  const searchFilters = await searchParams;
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Fetch stakeholders and stats in parallel
    const [stakeholders, stats] = await Promise.all([
      getEventStakeholders(id, {
        role: searchFilters.role,
        attendanceStatus: searchFilters.attendanceStatus,
        search: searchFilters.search,
      }),
      getStakeholderStats(id),
    ]);

    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-teal-500 to-teal-600 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm" className="bg-white text-teal-600 hover:bg-gray-100">
                <Link href={`/event/${id}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-white text-teal-600 hover:bg-gray-100">
                <Link href={`/event/${id}`}>
                  View Event Page
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">Stakeholder Management</h1>
            <p className="text-teal-100 mt-2">
              Manage attendees, speakers, volunteers, and other event participants
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <StakeholderManagement
            eventId={id}
            stakeholders={stakeholders}
            stats={stats}
            filters={{
              role: searchFilters.role,
              attendanceStatus: searchFilters.attendanceStatus,
              search: searchFilters.search,
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading stakeholders page:', error);
    return (
      <div className="bg-gray-50 min-h-screen">
        <section className="bg-gradient-to-r from-teal-500 to-teal-600 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm" className="bg-white text-teal-600 hover:bg-gray-100">
                <Link href={`/event/${id}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">Stakeholder Error</h1>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Stakeholders</h1>
            <p className="text-gray-600">
              There was an error loading the stakeholder management page. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
