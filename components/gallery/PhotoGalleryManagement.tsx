'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Images, Eye, Download, Share, Lock, Globe, Users } from 'lucide-react';

interface PhotoGalleryManagementProps {
  eventId: string;
  galleries: any[];
}

export default function PhotoGalleryManagement({
  eventId,
  galleries,
}: PhotoGalleryManagementProps) {
  const [activeTab, setActiveTab] = useState('galleries');

  const galleryStats = {
    totalGalleries: galleries.length,
    totalPhotos: galleries.reduce((sum, gallery) => sum + (gallery.photoCount || 0), 0),
    totalViews: galleries.reduce((sum, gallery) => sum + (gallery.viewCount || 0), 0),
    totalDownloads: galleries.reduce((sum, gallery) => sum + (gallery.downloadCount || 0), 0),
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Gallery
            </Button>
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
            <Button disabled={galleries.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
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
