'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Search, 
  Calendar, 
  MapPin, 
  Eye, 
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';

interface PublicGalleryViewProps {
  gallery: any;
  photosData: {
    photos: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  filters: {
    category?: string;
    tags?: string;
    search?: string;
    page?: string;
  };
}

export default function PublicGalleryView({
  gallery,
  photosData,
  filters,
}: PublicGalleryViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');

  const { photos, pagination } = photosData;

  const handlePhotoClick = (photo: any) => {
    setSelectedPhoto(photo);
    // Increment view count
    fetch(`/api/gallery/${gallery._id}/photos/${photo._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    });
  };

  const handleDownload = async (photo: any) => {
    if (!gallery.allowDownload) return;
    
    // Track download
    await fetch(`/api/gallery/${gallery._id}/photos/${photo._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download' }),
    });

    // Download the photo
    const link = document.createElement('a');
    link.href = photo.fileUrl;
    link.download = photo.originalName;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: gallery.name,
          text: gallery.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Gallery link copied to clipboard!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Gallery Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{gallery.name}</h1>
            {gallery.description && (
              <p className="text-gray-600 mb-4">{gallery.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {gallery.allowDownload && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            )}
          </div>
        </div>

        {/* Event Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{gallery.event.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{gallery.viewCount || 0} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{gallery.downloadCount || 0} downloads</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            {gallery.categories && gallery.categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {gallery.categories.map((category: string) => (
                    <SelectItem key={category} value={category || 'uncategorized'}>
                      {category || 'Uncategorized'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {pagination.total} photos
            </span>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Grid/List */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-semibold mb-2">No Photos Found</h3>
            <p className="text-gray-600 text-center">
              {filters.search || filters.category 
                ? 'Try adjusting your search filters.'
                : 'Photos will appear here once they are uploaded.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {photos.map((photo) => (
            <Card 
              key={photo._id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}
              onClick={() => handlePhotoClick(photo)}
            >
              <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <Image
                    src={photo.thumbnailUrl || photo.fileUrl}
                    alt={photo.metadata?.caption || photo.originalName}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              {viewMode === 'list' && (
                <CardContent className="flex-1 p-4">
                  <h4 className="font-medium mb-2">
                    {photo.metadata?.caption || photo.originalName}
                  </h4>
                  {photo.metadata?.photographer && (
                    <p className="text-sm text-gray-600 mb-2">
                      by {photo.metadata.photographer}
                    </p>
                  )}
                  {photo.metadata?.tags && photo.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {photo.metadata.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{photo.viewCount || 0} views</span>
                    {gallery.allowDownload && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
              
              {viewMode === 'grid' && photo.metadata?.caption && (
                <CardContent className="p-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {photo.metadata.caption}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === pagination.page ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('page', page.toString());
                  window.location.href = url.toString();
                }}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="relative">
              <Image
                src={selectedPhoto.fileUrl}
                alt={selectedPhoto.metadata?.caption || selectedPhoto.originalName}
                width={selectedPhoto.dimensions.width}
                height={selectedPhoto.dimensions.height}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <Button
                className="absolute top-4 right-4"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </Button>
            </div>
            {selectedPhoto.metadata?.caption && (
              <div className="p-4">
                <p className="text-gray-800">{selectedPhoto.metadata.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
