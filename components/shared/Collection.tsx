// components/shared/Collection.tsx

import React from 'react';
import { IEvent } from '@/lib/models/event.model';
import Card from './Card';
import NoResults from './NoResults';
// ❌ REMOVE THE AUTH IMPORT - We no longer need it here
// import { auth } from '@clerk/nextjs'; 

type PopulatedEvent = IEvent & {
  category: { _id: string; name: string };
  organizer: { _id: string; firstName: string; lastName: string; clerkId: string; };
};

type CollectionProps = {
  data: PopulatedEvent[],
  emptyTitle: string,
  emptyStateSubtext: string,
  collectionType?: 'Events_Organized' | 'My_Tickets' | 'All_Events',
  limit: number,
  page: number | string,
  totalPages?: number,
  // ✅ ADD currentUserId TO THE PROPS
  currentUserId: string;
}

const Collection = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  collectionType,
  currentUserId, // <-- Receive it here
}: CollectionProps) => {
  // ❌ REMOVE THESE LINES
  // const { sessionClaims } = auth();
  // const currentUserId = sessionClaims?.userId as string;

  if (!data || data.length === 0) {
    return (
      <NoResults
        title={emptyTitle}
        desc={emptyStateSubtext}
        link="/"
        linkTitle="Explore Events"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
      {data.map((event) => {
        // This comparison will now work correctly
        const isOrganizer = currentUserId === event.organizer.clerkId;

        return (
          <div key={event._id?.toString()} className="flex justify-center">
            <Card
              event={event}
              isOrganizer={collectionType === 'Events_Organized' && isOrganizer}
            />
          </div>
        )
      })}
    </div>
  )
}

export default Collection;