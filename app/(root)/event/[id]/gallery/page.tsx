import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getEventById } from '@/lib/actions/event.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import { getEventPhotoGalleries } from '@/lib/actions/gallery.action';
import PhotoGalleryManagement from '@/components/shared/PhotoGalleryManagement';

interface GalleryPageProps {
  params: Promise<{ id: string }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { id } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  const [event, user] = await Promise.all([
    getEventById(id),
    getUserByClerkId(clerkId)
  ]);

  if (!event) {
    redirect('/');
  }

  // Check if user is the organizer
  if (String(event.organizer._id) !== String(user._id)) {
    redirect(`/event/${id}`);
  }

  try {
    const galleries = await getEventPhotoGalleries(id);

    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-purple-500 to-pink-600 py-8">
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
            <h1 className="text-3xl font-bold text-white">Photo Gallery Management</h1>
            <p className="text-purple-100 mt-2">
              Create and manage photo galleries for {event.title}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <PhotoGalleryManagement
            eventId={id}
            galleries={galleries}
            eventTitle={event.title}
            organizerId={user._id}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading gallery page:', error);
    return (
      <div className="bg-gray-50 min-h-screen">
        <section className="bg-gradient-to-r from-purple-500 to-pink-600 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm" className="bg-white text-purple-600 hover:bg-gray-100">
                <Link href={`/event/${id}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">Gallery Error</h1>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Gallery</h1>
            <p className="text-gray-600">
              There was an error loading the photo gallery management page. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
