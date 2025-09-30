'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Images, Eye, Download, Share, Lock, Globe, Users, Upload, Camera } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryManagementProps {
  eventId: string;
  galleries: any[];
  eventTitle: string;
  organizerId: string;
}

export default function PhotoGalleryManagement({
  eventId,
  galleries,
  eventTitle,
  organizerId,
}: PhotoGalleryManagementProps) {
  const [activeTab, setActiveTab] = useState('galleries');
  const [isCreateGalleryOpen, setIsCreateGalleryOpen] = useState(false);
  const [isUploadPhotosOpen, setIsUploadPhotosOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const { startUpload: startPhotoUpload, isUploading } = useUploadThing(
    'photoGalleryUploader',
    {
      onClientUploadComplete: (res) => {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${res.length} photos`,
        });
        setUploadProgress(0);
        setIsUploadPhotosOpen(false);
        // Refresh the page to show new photos
        window.location.reload();
      },
      onUploadError: (error: Error) => {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        setUploadProgress(0);
      },
      onUploadProgress: (progress) => {
        setUploadProgress(progress);
      },
    }
  );

  const galleryStats = {
    totalGalleries: galleries.length,
    totalPhotos: galleries.reduce((sum, gallery) => sum + (gallery.photoCount || 0), 0),
    totalViews: galleries.reduce((sum, gallery) => sum + (gallery.viewCount || 0), 0),
    totalDownloads: galleries.reduce((sum, gallery) => sum + (gallery.downloadCount || 0), 0),
  };

  const handleCreateGallery = async (formData: FormData) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          name: formData.get('name'),
          description: formData.get('description'),
          visibility: formData.get('visibility'),
          accessPassword: formData.get('accessPassword'),
          allowDownload: formData.get('allowDownload') === 'on',
          allowComments: formData.get('allowComments') === 'on',
          categories: [],
        }),
      });

      if (response.ok) {
        toast({
          title: "Gallery Created",
          description: "Photo gallery created successfully",
        });
        setIsCreateGalleryOpen(false);
        window.location.reload();
      } else {
        throw new Error('Failed to create gallery');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create gallery",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!selectedGallery) {
      toast({
        title: "No Gallery Selected",
        description: "Please select a gallery first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload files to UploadThing
      const uploadedFiles = await startPhotoUpload(files);

      if (uploadedFiles) {
        // Process uploaded files and save to gallery
        const photos = uploadedFiles.map(file => ({
          fileName: file.name,
          originalName: file.name,
          fileUrl: file.url,
          fileSize: file.size,
          mimeType: file.type || 'image/jpeg',
          dimensions: { width: 800, height: 600 }, // Default dimensions
          metadata: {
            caption: '',
            tags: [],
            location: '',
            photographer: '',
            camera: '',
          },
          category: 'general',
        }));

        // Save photos to the selected gallery
        const response = await fetch(`/api/gallery/${selectedGallery}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photos }),
        });

        if (!response.ok) {
          throw new Error('Failed to save photos to gallery');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      case 'restricted': return <Users className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-red-100 text-red-800';
      case 'restricted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Galleries</CardTitle>
            <Images className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{galleryStats.totalGalleries}</div>
            <p className="text-xs text-muted-foreground">
              Photo galleries created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
            <Images className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{galleryStats.totalPhotos}</div>
            <p className="text-xs text-muted-foreground">
              Total photos uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{galleryStats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Gallery views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{galleryStats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Photo downloads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="galleries">Galleries</TabsTrigger>
          <TabsTrigger value="upload">Upload Photos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="galleries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Photo Galleries</h3>
            <Dialog open={isCreateGalleryOpen} onOpenChange={setIsCreateGalleryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gallery
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Gallery</DialogTitle>
                  <DialogDescription>
                    Create a new photo gallery for {eventTitle}
                  </DialogDescription>
                </DialogHeader>
                <form action={handleCreateGallery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Gallery Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter gallery name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Enter gallery description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select name="visibility" defaultValue="public">
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowDownload"
                      name="allowDownload"
                      className="rounded"
                    />
                    <Label htmlFor="allowDownload">Allow downloads</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowComments"
                      name="allowComments"
                      className="rounded"
                    />
                    <Label htmlFor="allowComments">Allow comments</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateGalleryOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Gallery</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleries.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Images className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Galleries Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first photo gallery to start sharing event memories.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Gallery
                  </Button>
                </CardContent>
              </Card>
            ) : (
              galleries.map((gallery) => (
                <Card key={gallery._id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{gallery.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        {getVisibilityIcon(gallery.visibility)}
                      </div>
                    </div>
                    <CardDescription>{gallery.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Photos:</span>
                        <span className="font-medium">{gallery.photoCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Views:</span>
                        <span className="font-medium">{gallery.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getVisibilityColor(gallery.visibility)}>
                          {gallery.visibility}
                        </Badge>
                        <div className="flex gap-1">
                          {gallery.allowDownload && (
                            <Badge variant="outline" className="text-xs">
                              Download
                            </Badge>
                          )}
                          {gallery.allowComments && (
                            <Badge variant="outline" className="text-xs">
                              Comments
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Share className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upload Photos</h3>
            <Dialog open={isUploadPhotosOpen} onOpenChange={setIsUploadPhotosOpen}>
              <DialogTrigger asChild>
                <Button disabled={galleries.length === 0}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Upload Photos</DialogTitle>
                  <DialogDescription>
                    Upload photos to your event gallery using UploadThing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gallery-select">Select Gallery</Label>
                    <Select value={selectedGallery} onValueChange={setSelectedGallery}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a gallery" />
                      </SelectTrigger>
                      <SelectContent>
                        {galleries.map((gallery) => (
                          <SelectItem key={gallery._id} value={gallery._id || `gallery-${gallery.name}`}>
                            {gallery.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Photos</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            handlePhotoUpload(files);
                          }
                        }}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Click to upload photos
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB each (max 50 files)
                        </p>
                      </label>
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {galleries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Images className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Galleries Available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You need to create a gallery before uploading photos.
                </p>
                <Button onClick={() => setActiveTab('galleries')}>
                  Create Gallery
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Photo Upload</CardTitle>
                  <CardDescription>
                    Select a gallery and upload photos with metadata.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Photo upload interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Settings</CardTitle>
              <CardDescription>
                Configure default settings for photo galleries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gallery settings interface will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
