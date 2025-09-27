// app/(root)/event/[id]/report/page.tsx

import ReportForm from "@/components/shared/ReportForm";
import { getEventById } from "@/lib/actions/event.action";
import { auth } from "@clerk/nextjs";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/90 via-primary to-primary/80 py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dotted-pattern opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>

        <div className="wrapper relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium">✨ AI-Powered</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Generate Event Report
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Create comprehensive, professional reports for <span className="font-semibold text-white">{event.title}</span> with AI assistance
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span>📊</span>
                <span>Automated Data Analysis</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span>🎯</span>
                <span>Professional Formatting</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span>📄</span>
                <span>PDF Export Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-20">
        <div className="wrapper">
          <ReportForm eventId={id} userId={userId} event={JSON.parse(JSON.stringify(event))} />
        </div>
      </section>
    </div>
  );
};

export default ReportPage;