import React from 'react';
import { notFound } from 'next/navigation';
import { getPhotoGallery, getGalleryPhotos } from '@/lib/actions/gallery.action';
import { getEventById } from '@/lib/actions/event.action';
import PublicFolderView from '@/components/shared/PublicFolderView';

interface PublicGalleryPageProps {
  params: Promise<{ folderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PublicGalleryPage({ 
  params, 
  searchParams 
}: PublicGalleryPageProps) {
  const { folderId } = await params;
  const searchParamsResolved = await searchParams;

  try {
    // Get folder by shareable link
    const folder = await getPhotoGallery(folderId);
    
    if (!folder) {
      notFound();
    }

    // Get the event information
    const event = await getEventById(folder.event.toString());
    
    if (!event) {
      notFound();
    }

    // Get images from this specific folder
    const filters = {
      search: typeof searchParamsResolved.search === 'string' ? searchParamsResolved.search : '',
      category: typeof searchParamsResolved.category === 'string' ? searchParamsResolved.category : 'all',
      page: typeof searchParamsResolved.page === 'string' ? parseInt(searchParamsResolved.page) : 1,
      limit: 20,
    };

    const imagesData = await getGalleryPhotos(folder._id, filters);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">{folder.name}</h1>
              <p className="text-xl text-purple-100 mb-2">{event.title}</p>
              {folder.description && (
                <p className="text-purple-200 max-w-2xl mx-auto">
                  {folder.description}
                </p>
              )}
              <div className="mt-4 flex justify-center items-center gap-4 text-sm text-purple-200">
                <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                <span>📍 {event.isOnline ? 'Online Event' : event.location}</span>
                <span>📸 {imagesData.photos.length} Images</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <PublicFolderView
            folder={folder}
            imagesData={imagesData}
            filters={filters}
            event={event}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading public gallery:', error);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  
  try {
    const folder = await getPhotoGallery(folderId);
    const event = folder ? await getEventById(folder.event.toString()) : null;
    
    if (!folder || !event) {
      return {
        title: 'Gallery Not Found',
        description: 'The requested gallery could not be found.',
      };
    }

    return {
      title: `${folder.name} - ${event.title}`,
      description: folder.description || `View images from ${event.title}`,
      openGraph: {
        title: `${folder.name} - ${event.title}`,
        description: folder.description || `View images from ${event.title}`,
        type: 'website',
        images: folder.coverPhoto ? [folder.coverPhoto] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Gallery Not Found',
      description: 'The requested gallery could not be found.',
    };
  }
}
