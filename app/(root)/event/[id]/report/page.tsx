// app/(root)/event/[id]/report/page.tsx

import ReportForm from "@/components/shared/ReportForm";
import { getEventById } from "@/lib/actions/event.action";
import { auth } from "@clerk/nextjs";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type ReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const ReportPage = async ({ params }: ReportPageProps) => {
  const { id } = await params;
  const { sessionClaims } = auth();
  const userId = sessionClaims?.userId as string;

  const event = await getEventById(id);

  if (!event) {
    return (
      <div className="wrapper text-center">
        <h1>Event not found</h1>
        <p>The event you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-purple-500 to-purple-600 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href={`/event/${id}/manage`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href={`/event/${id}`}>
                View Event Page
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white">Event Report</h1>
          <p className="text-purple-100 mt-2">
            Generate comprehensive, AI-powered reports for {event.title}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ReportForm eventId={id} userId={userId} event={JSON.parse(JSON.stringify(event))} />
      </div>
    </div>
  );
};

export default ReportPage;