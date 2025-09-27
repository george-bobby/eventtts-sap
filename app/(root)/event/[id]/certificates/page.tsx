import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getCertificateTemplates } from '@/lib/actions/certificate.action';
import { getEventStakeholders } from '@/lib/actions/stakeholder.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import CertificateManagement from '@/components/certificates/CertificateManagement';

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600 mt-2">
            Create templates, generate certificates, and manage distribution for your event.
          </p>
        </div>

        <CertificateManagement
          eventId={id}
          templates={templates}
          stakeholders={stakeholders}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading certificates page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Certificates</h1>
          <p className="text-gray-600">
            There was an error loading the certificate management page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
