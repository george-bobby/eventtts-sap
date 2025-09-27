import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getEventPhotoGalleries } from '@/lib/actions/gallery.action';
import PhotoGalleryManagement from '@/components/gallery/PhotoGalleryManagement';

interface GalleryPageProps {
  params: {
    id: string;
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  try {
    const galleries = await getEventPhotoGalleries(params.id);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Photo Gallery Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage photo galleries for your event participants.
          </p>
        </div>

        <PhotoGalleryManagement
          eventId={params.id}
          galleries={galleries}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading gallery page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Gallery</h1>
          <p className="text-gray-600">
            There was an error loading the photo gallery management page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
