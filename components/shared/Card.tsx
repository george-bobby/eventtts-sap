// components/shared/Card.tsx
"use client"

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { IEvent } from '@/lib/models/event.model';
import { generateSalesReport } from '@/lib/actions/event.action';
import { Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

type PopulatedEvent = IEvent & {
  category: { _id: string; name: string };
  organizer: { _id: string; firstName: string; lastName: string; clerkId: string; };
};

type CardProps = {
  event: PopulatedEvent;
  isOrganizer?: boolean;
}

type ReportData = {
  totalTicketsSold: number;
  totalRevenue: number;
} | null;

const Card = ({ event, isOrganizer }: CardProps) => {
  const [reportData, setReportData] = useState<ReportData>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleReportClick = async () => {
    setIsReportLoading(true);
    try {
      const stats = await generateSalesReport((event._id as any)?.toString());
      setReportData(stats);
    } catch (error) {
      console.error("Failed to generate sales report:", error);
    } finally {
      setIsReportLoading(false);
    }
  };

  const formattedDate = isMounted
    ? new Date(event.startDate).toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
    : '...';

  return (
    <div className="group relative flex min-h-[420px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg">
      <div
        style={{ backgroundImage: `url(${event.imageUrl})` }}
        className="h-48 w-full bg-gray-200 bg-cover bg-center"
      />

      {/* ✅ FIX: This will now render correctly when isOrganizer is true */}
      {isOrganizer && (
        <div className="absolute right-2 top-2 flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm transition-all">
          <Link href={`/events/${event._id}/update`}>
            <Edit size={20} className="text-gray-500 hover:text-primary" />
          </Link>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5 md:gap-4">
        <div className="flex gap-2">
          {/* ✅ FIX: This logic handles all price cases: free, priced, or undefined */}
          <span className="p-semibold-14 w-min rounded-full bg-green-100 px-4 py-1 text-green-60">
            {event.price === 0 ? 'FREE' : event.price ? `₹${event.price}` : 'N/A'}
          </span>
          <p className="p-semibold-14 w-min rounded-full bg-grey-500/10 px-4 py-1 text-grey-500 line-clamp-1">
            {event.category.name}
          </p>
        </div>

        <p className="p-medium-16 md:p-medium-18 text-grey-500">
          {formattedDate}
        </p>

        <Link href={`/events/${event._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black hover:underline">{event.title}</p>
        </Link>

        <div className="flex-between w-full mt-auto">
          <p className="p-medium-14 md:p-medium-16 text-grey-600">
            {event.organizer.firstName} {event.organizer.lastName}
          </p>

          {/* ✅ FIX: This button will now render correctly when isOrganizer is true */}
          {isOrganizer && (
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={handleReportClick} size="sm" className="bg-primary hover:bg-primary-dark">
                  {isReportLoading ? 'Generating...' : 'Report'}
                </Button>
              </DialogTrigger>
              {reportData && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sales Report for "{event.title}"</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-2 text-lg">
                    <p><strong>Total Tickets Sold:</strong> {reportData.totalTicketsSold}</p>
                    <p><strong>Total Revenue:</strong> ₹{reportData.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}

export default Card;