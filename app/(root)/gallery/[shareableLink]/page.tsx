import { getPhotoGallery, getGalleryPhotos } from '@/lib/actions/gallery.action';
import { notFound } from 'next/navigation';
import PublicGalleryView from '@/components/shared/PublicGalleryView';

interface PublicGalleryPageProps {
  params: Promise<{
    shareableLink: string;
  }>;
  searchParams: Promise<{
    category?: string;
    tags?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function PublicGalleryPage({
  params,
  searchParams
}: PublicGalleryPageProps) {
  const { shareableLink } = await params;
  const searchFilters = await searchParams;
  try {
    // First, find the gallery by shareable link
    const { PhotoGallery } = await import('@/lib/models/gallery.model');
    await import('@/lib/dbconnection').then(db => db.connectToDatabase());

    const gallery = await PhotoGallery.findOne({
      shareableLink: shareableLink
    }).populate('event', 'title description startDate endDate');

    if (!gallery) {
      notFound();
    }

    // Check if gallery is accessible
    if (gallery.visibility === 'private') {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">
              This gallery is private and cannot be accessed.
            </p>
          </div>
        </div>
      );
    }

    // Get photos with filters
    const page = parseInt(searchFilters.page || '1');
    const tags = searchFilters.tags?.split(',').filter(Boolean);

    const photosData = await getGalleryPhotos(gallery._id, {
      category: searchFilters.category,
      tags,
      search: searchFilters.search,
      page,
      limit: 24,
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <PublicGalleryView
          gallery={JSON.parse(JSON.stringify(gallery))}
          photosData={photosData}
          filters={{
            category: searchFilters.category,
            tags: searchFilters.tags,
            search: searchFilters.search,
            page: searchFilters.page,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading public gallery:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Gallery</h1>
          <p className="text-gray-600">
            There was an error loading the photo gallery. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
