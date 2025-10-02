'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Folder, Eye, Share, Upload, Globe, Lock, Users } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { useToast } from '@/hooks/use-toast';

interface FolderGalleryManagementProps {
  eventId: string;
  folders: any[];
  eventTitle: string;
  organizerId: string;
}

export default function FolderGalleryManagement({
  eventId,
  folders,
  eventTitle,
  organizerId,
}: FolderGalleryManagementProps) {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadImagesOpen, setIsUploadImagesOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const { startUpload: startImageUpload, isUploading } = useUploadThing(
    'photoGalleryUploader',
    {
      onClientUploadComplete: (res) => {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${res.length} images`,
        });
        setUploadProgress(0);
        setIsUploadImagesOpen(false);
        // Use router.refresh() to reload the server-side data
        router.refresh();
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

  const folderStats = {
    totalFolders: folders.length,
    totalImages: folders.reduce((sum, folder) => sum + (folder.imageCount || 0), 0),
    totalViews: folders.reduce((sum, folder) => sum + (folder.viewCount || 0), 0),
  };

  const handleCreateFolder = async (formData: FormData) => {
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
          allowDownload: formData.get('allowDownload') === 'on',
          allowComments: formData.get('allowComments') === 'on',
        }),
      });

      if (response.ok) {
        toast({
          title: "Folder Created",
          description: "Folder created successfully",
        });
        setIsCreateFolderOpen(false);
        // Use router.refresh() to reload the server-side data
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create folder');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (!selectedFolder) {
      toast({
        title: "No Folder Selected",
        description: "Please select a folder first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload files to UploadThing
      const uploadedFiles = await startImageUpload(files);

      if (uploadedFiles) {
        // Process uploaded files and save to folder
        const images = uploadedFiles.map(file => ({
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
        }));

        // Save images to the selected folder
        const response = await fetch(`/api/gallery/${selectedFolder}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photos: images }),
        });

        if (!response.ok) {
          throw new Error('Failed to save images to folder');
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

  const handleShareFolder = (folder: any) => {
    const shareUrl = `${window.location.origin}/gallery/${folder.shareableLink}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Shareable link copied to clipboard",
    });
  };

  const handleViewFolder = (folder: any) => {
    window.open(`/gallery/${folder.shareableLink}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folderStats.totalFolders}</div>
            <p className="text-xs text-muted-foreground">
              Image folders created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folderStats.totalImages}</div>
            <p className="text-xs text-muted-foreground">
              Total images uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folderStats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Folder views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header with Create Folder and Upload Images buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Event Folders</h3>
        <div className="flex gap-2">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new image folder for {eventTitle}
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateFolder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Folder Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter folder name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter folder description"
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
                    defaultChecked
                  />
                  <Label htmlFor="allowDownload">Allow downloads</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowComments"
                    name="allowComments"
                    className="rounded"
                    defaultChecked
                  />
                  <Label htmlFor="allowComments">Allow comments</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Folder</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadImagesOpen} onOpenChange={setIsUploadImagesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={folders.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload Images</DialogTitle>
                <DialogDescription>
                  Upload images to a folder using UploadThing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-select">Select Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder._id} value={folder._id || `folder-${folder.name}`}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          handleImageUpload(files);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Click to upload images
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 8MB each (max 50 files)
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
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Folders Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first folder to start organizing event images.
              </p>
              <Button onClick={() => setIsCreateFolderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </CardContent>
          </Card>
        ) : (
          folders.map((folder) => (
            <Card key={folder._id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {folder.name}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    {getVisibilityIcon(folder.visibility)}
                  </div>
                </div>
                <CardDescription>{folder.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Images:</span>
                    <span className="font-medium">{folder.imageCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Views:</span>
                    <span className="font-medium">{folder.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getVisibilityColor(folder.visibility)}>
                      {folder.visibility}
                    </Badge>
                    <div className="flex gap-1">
                      {folder.allowDownload && (
                        <Badge variant="outline" className="text-xs">
                          Download
                        </Badge>
                      )}
                      {folder.allowComments && (
                        <Badge variant="outline" className="text-xs">
                          Comments
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewFolder(folder)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Folder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleShareFolder(folder)}
                    >
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
    </div>
  );
}
