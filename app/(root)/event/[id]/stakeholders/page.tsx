import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getEventStakeholders, getStakeholderStats } from '@/lib/actions/stakeholder.action';
import StakeholderManagement from '@/components/stakeholders/StakeholderManagement';

interface StakeholdersPageProps {
  params: {
    id: string;
  };
  searchParams: {
    role?: string;
    attendanceStatus?: string;
    search?: string;
  };
}

export default async function StakeholdersPage({ 
  params, 
  searchParams 
}: StakeholdersPageProps) {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Fetch stakeholders and stats in parallel
    const [stakeholders, stats] = await Promise.all([
      getEventStakeholders(params.id, {
        role: searchParams.role,
        attendanceStatus: searchParams.attendanceStatus,
        search: searchParams.search,
      }),
      getStakeholderStats(params.id),
    ]);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stakeholder Management</h1>
          <p className="text-gray-600 mt-2">
            Manage attendees, speakers, volunteers, and other event participants.
          </p>
        </div>

        <StakeholderManagement
          eventId={params.id}
          stakeholders={stakeholders}
          stats={stats}
          filters={{
            role: searchParams.role,
            attendanceStatus: searchParams.attendanceStatus,
            search: searchParams.search,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading stakeholders page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Stakeholders</h1>
          <p className="text-gray-600">
            There was an error loading the stakeholder management page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
