// components/shared/GenerateReportButton.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

const GenerateReportButton = ({ eventId }: { eventId: string }) => {
  return (
    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
      <Link href={`/event/${eventId}/report`}>
        AI Report
      </Link>
    </Button>
  );
};

export default GenerateReportButton;