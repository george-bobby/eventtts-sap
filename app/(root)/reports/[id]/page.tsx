// app/(root)/reports/[id]/page.tsx

"use client";
import { getReportById } from "@/lib/actions/report.action";
import { IReport } from "@/lib/models/report.model";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ReportDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

// A simple component to render markdown-like text
const MarkdownRenderer = ({ text }: { text: string }) => {
  const formatText = (inputText: string) => {
    return inputText
      .split('**').map((part, index) => index % 2 !== 0 ? <strong key={index}>{part}</strong> : part)
      .map((part: any) => typeof part === 'string' ? part.split('\n').map((line, i) => <p key={i}>{line}</p>) : part);
  };

  return <div className="prose lg:prose-xl">{formatText(text)}</div>;
};


const ReportDetailsPage = ({ params }: ReportDetailsPageProps) => {
  const [report, setReport] = useState<IReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      try {
        const reportData = await getReportById(id);
        setReport(reportData);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (loading) {
    return <div className="wrapper text-center">Loading report...</div>;
  }

  if (!report) {
    return <div className="wrapper text-center">Report not found.</div>;
  }

  const handleDownload = () => {
    window.print();
  };

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Event Report: {report.event.title}
        </h3>
      </section>

      <div className="wrapper my-8">
        <div className="flex justify-end gap-3">
          <Button onClick={handleDownload} className="button">Download / Print Report</Button>
        </div>

        <div id="report-content" className="mt-8 bg-white p-8 rounded-lg shadow-md">
          <h1 className="h1-bold mb-6">{report.event.title} - Post-Event Report</h1>
          <MarkdownRenderer text={report.generatedContent} />

          {report.photos && (
            <div className="mt-8">
              <h2 className="h2-bold">Event Photo</h2>
              <img src={report.photos} alt="Event" className="mt-4 rounded-lg w-full max-w-2xl mx-auto" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportDetailsPage;