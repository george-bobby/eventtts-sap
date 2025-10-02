'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Grid, 
  List, 
  Download, 
  Share, 
  Eye, 
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react';

interface PublicFolderViewProps {
  folder: any;
  imagesData: {
    photos: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  filters: {
    search: string;
    category: string;
    page: number;
    limit: number;
  };
  event: any;
}

export default function PublicFolderView({
  folder,
  imagesData,
  filters,
  event,
}: PublicFolderViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const { photos, pagination } = imagesData;

  const handleImageClick = (image: any) => {
    setSelectedImage(image);
    // Increment view count
    fetch(`/api/gallery/${folder._id}/photos/${image._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    });
  };

  const handleDownload = async (image: any) => {
    try {
      const response = await fetch(image.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.originalName || image.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Increment download count
      fetch(`/api/gallery/${folder._id}/photos/${image._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' }),
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: folder.name,
          text: folder.description,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (searchTerm) {
      url.searchParams.set('search', searchTerm);
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  };

  return (
    <div className="space-y-6">
      {/* Folder Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {folder.visibility}
                </Badge>
                {folder.allowDownload && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Downloads Allowed
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.isOnline ? 'Online Event' : event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{folder.viewCount || 0} views</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid/List */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-semibold mb-2">No Images Found</h3>
            <p className="text-gray-600 text-center">
              {filters.search
                ? 'Try adjusting your search terms.'
                : 'Images will appear here once they are uploaded.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {photos.map((image) => (
            <Card
              key={image._id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}
              onClick={() => handleImageClick(image)}
            >
              <div className={viewMode === 'list' ? 'w-48 h-32' : 'aspect-square'}>
                <img
                  src={image.thumbnailUrl || image.fileUrl}
                  alt={image.metadata?.caption || image.originalName}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
              {viewMode === 'list' && (
                <CardContent className="flex-1 p-4">
                  <h4 className="font-medium mb-2">{image.originalName}</h4>
                  {image.metadata?.caption && (
                    <p className="text-sm text-gray-600 mb-2">{image.metadata.caption}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{(image.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    <span>{image.viewCount || 0} views</span>
                  </div>
                  {folder.allowDownload && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', (pagination.page - 1).toString());
              window.location.href = url.toString();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', (pagination.page + 1).toString());
              window.location.href = url.toString();
            }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.originalName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage.fileUrl}
                  alt={selectedImage.metadata?.caption || selectedImage.originalName}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              {selectedImage.metadata?.caption && (
                <p className="text-center text-gray-600">{selectedImage.metadata.caption}</p>
              )}
              <div className="flex justify-center gap-2">
                {folder.allowDownload && (
                  <Button onClick={() => handleDownload(selectedImage)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
