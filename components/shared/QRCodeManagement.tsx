'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Download, Users, Scan, RefreshCw, Eye } from 'lucide-react';
import Image from 'next/image';

interface QRCodeData {
  _id: string;
  ticketId: string;
  qrCodeData: string;
  qrCodeImage: string;
  type: 'ticket' | 'checkin' | 'access';
  status: 'active' | 'used' | 'expired' | 'cancelled';
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  order?: {
    stripeId: string;
    totalTickets: number;
    totalAmount: number;
  };
  metadata: {
    ticketType?: string;
    seatNumber?: string;
    section?: string;
    additionalInfo?: string;
  };
  scannedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface QRCodeManagementProps {
  eventId: string;
  eventTitle: string;
  organizerId: string;
}

export default function QRCodeManagement({
  eventId,
  eventTitle,
  organizerId,
}: QRCodeManagementProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<QRCodeData | null>(null);
  const { toast } = useToast();

  const fetchQRCodes = async () => {
    try {
      const response = await fetch(`/api/qrcode?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setQrCodes(data.data || []);
      } else {
        throw new Error('Failed to fetch QR codes');
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to load QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          generateForEvent: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message || "QR codes generated successfully",
        });
        fetchQRCodes(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate QR codes');
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate QR codes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = (qrCode: QRCodeData) => {
    const link = document.createElement('a');
    link.href = qrCode.qrCodeImage;
    link.download = `${qrCode.ticketId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, [eventId]);

  const activeQRCodes = qrCodes.filter(qr => qr.status === 'active');
  const usedQRCodes = qrCodes.filter(qr => qr.status === 'used');
  const expiredQRCodes = qrCodes.filter(qr => qr.status === 'expired');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
          <p className="text-gray-600">Manage QR codes for {eventTitle}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchQRCodes} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateQRCodes} disabled={generating}>
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            {generating ? 'Generating...' : 'Generate QR Codes'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total QR Codes</p>
                <p className="text-2xl font-bold">{qrCodes.length}</p>
              </div>
              <QrCode className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeQRCodes.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-2xl font-bold text-blue-600">{usedQRCodes.length}</p>
              </div>
              <Scan className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-orange-600">{expiredQRCodes.length}</p>
              </div>
              <QrCode className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Codes List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({qrCodes.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeQRCodes.length})</TabsTrigger>
          <TabsTrigger value="used">Used ({usedQRCodes.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredQRCodes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <QRCodeList qrCodes={qrCodes} onDownload={downloadQRCode} onView={setSelectedQRCode} />
        </TabsContent>
        
        <TabsContent value="active">
          <QRCodeList qrCodes={activeQRCodes} onDownload={downloadQRCode} onView={setSelectedQRCode} />
        </TabsContent>
        
        <TabsContent value="used">
          <QRCodeList qrCodes={usedQRCodes} onDownload={downloadQRCode} onView={setSelectedQRCode} />
        </TabsContent>
        
        <TabsContent value="expired">
          <QRCodeList qrCodes={expiredQRCodes} onDownload={downloadQRCode} onView={setSelectedQRCode} />
        </TabsContent>
      </Tabs>

      {/* QR Code Detail Dialog */}
      <Dialog open={!!selectedQRCode} onOpenChange={() => setSelectedQRCode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Details</DialogTitle>
            <DialogDescription>
              Ticket ID: {selectedQRCode?.ticketId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQRCode && (
            <div className="space-y-4">
              {/* QR Code Image */}
              <div className="flex justify-center">
                <div className="p-4 bg-white border rounded-lg">
                  <Image
                    src={selectedQRCode.qrCodeImage}
                    alt={`QR Code for ${selectedQRCode.ticketId}`}
                    width={200}
                    height={200}
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(selectedQRCode.status)}>
                    {selectedQRCode.status.charAt(0).toUpperCase() + selectedQRCode.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Attendee:</span>
                  <span>{selectedQRCode.user.firstName} {selectedQRCode.user.lastName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{selectedQRCode.user.email}</span>
                </div>

                {selectedQRCode.metadata.ticketType && (
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{selectedQRCode.metadata.ticketType}</span>
                  </div>
                )}

                {selectedQRCode.scannedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium">Scanned:</span>
                    <span className="text-sm">{new Date(selectedQRCode.scannedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => downloadQRCode(selectedQRCode)} 
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(selectedQRCode.qrCodeData, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface QRCodeListProps {
  qrCodes: QRCodeData[];
  onDownload: (qrCode: QRCodeData) => void;
  onView: (qrCode: QRCodeData) => void;
}

function QRCodeList({ qrCodes, onDownload, onView }: QRCodeListProps) {
  if (qrCodes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <QrCode className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No QR Codes Found</h3>
          <p className="text-gray-600 text-center">
            Generate QR codes for your event attendees to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {qrCodes.map((qrCode) => (
        <Card key={qrCode._id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium">
                  {qrCode.user.firstName} {qrCode.user.lastName}
                </CardTitle>
                <CardDescription className="text-xs">
                  {qrCode.ticketId}
                </CardDescription>
              </div>
              <Badge className={`text-xs ${getStatusColor(qrCode.status)}`}>
                {qrCode.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex justify-center mb-3">
              <Image
                src={qrCode.qrCodeImage}
                alt={`QR Code for ${qrCode.ticketId}`}
                width={80}
                height={80}
                className="w-20 h-20 border rounded"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onView(qrCode)}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                onClick={() => onDownload(qrCode)}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'used':
      return 'bg-blue-100 text-blue-800';
    case 'expired':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
