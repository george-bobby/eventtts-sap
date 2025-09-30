import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getCertificateTemplates } from '@/lib/actions/certificate.action';
import { getEventStakeholders } from '@/lib/actions/stakeholder.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import CertificateManagement from '@/components/shared/CertificateManagement';

interface CertificatesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificatesPage({ params }: CertificatesPageProps) {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Get user for default template creation
    const user = await getUserByClerkId(userId);

    // Fetch certificate templates and stakeholders in parallel
    const [templates, stakeholders] = await Promise.all([
      getCertificateTemplates(id, user?._id),
      getEventStakeholders(id),
    ]);

    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm" className="bg-white text-yellow-600 hover:bg-gray-100">
                <Link href={`/event/${id}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-white text-yellow-600 hover:bg-gray-100">
                <Link href={`/event/${id}`}>
                  View Event Page
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">Certificate Management</h1>
            <p className="text-yellow-100 mt-2">
              Create templates, generate certificates, and manage distribution for your event
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <CertificateManagement
            eventId={id}
            templates={templates}
            stakeholders={stakeholders}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading certificates page:', error);
    return (
      <div className="bg-gray-50 min-h-screen">
        <section className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm" className="bg-white text-yellow-600 hover:bg-gray-100">
                <Link href={`/event/${id}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">Certificate Error</h1>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Certificates</h1>
            <p className="text-gray-600">
              There was an error loading the certificate management page. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
