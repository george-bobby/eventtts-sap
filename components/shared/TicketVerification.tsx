'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2, Search, User, Mail, Calendar, Clock, MapPin, QrCode, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/ui/qr-scanner';

interface TicketVerificationProps {
  eventId: string;
  eventTitle: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
  ticket?: {
    _id: string;
    ticketId: string;
    entryCode: string;
    status: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    event: {
      title: string;
      startDate: string;
      endDate: string;
      location: string;
    };
    verifiedAt?: string;
    metadata?: {
      ticketType?: string;
      additionalInfo?: string;
    };
  };
}

export default function TicketVerification({ eventId, eventTitle }: TicketVerificationProps) {
  const [entryCode, setEntryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState('manual');
  const { toast } = useToast();

  const verifyTicketCode = async (code: string) => {
    if (!code || code.length !== 6) {
      throw new Error('Invalid entry code format');
    }

    const response = await fetch('/api/tickets/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entryCode: code,
        eventId,
      }),
    });

    const data = await response.json();
    setResult(data);

    if (data.success) {
      toast({
        title: 'Ticket Verified! ✅',
        description: `Welcome ${data.ticket?.user.firstName} ${data.ticket?.user.lastName}`,
      });
      return data;
    } else {
      toast({
        title: 'Verification Failed',
        description: data.message,
        variant: 'destructive',
      });
      throw new Error(data.message);
    }
  };

  const handleManualVerify = async () => {
    if (!entryCode || entryCode.length !== 6) {
      toast({
        title: 'Invalid Entry Code',
        description: 'Please enter a 6-digit entry code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      await verifyTicketCode(entryCode);
      setEntryCode(''); // Clear input on success
    } catch (error) {
      console.error('Error verifying ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (scannedData: string) => {
    // Extract 6-digit code from scanned data
    const codeMatch = scannedData.match(/\d{6}/);
    if (!codeMatch) {
      throw new Error('No valid 6-digit code found in QR code');
    }

    const code = codeMatch[0];
    await verifyTicketCode(code);
  };

  const handleQRError = (error: string) => {
    toast({
      title: 'QR Scan Error',
      description: error,
      variant: 'destructive',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualVerify();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'used':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Methods Card */}
      <Card className="border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            Verify Ticket
          </CardTitle>
          <CardDescription>
            Choose your preferred verification method for {eventTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Enter the 6-digit entry code manually</p>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={entryCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEntryCode(value);
                    }}
                    onKeyDown={handleKeyPress}
                    className="text-2xl font-mono tracking-widest text-center"
                    maxLength={6}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleManualVerify}
                    disabled={loading || entryCode.length !== 6}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Scan the QR code from the attendee's ticket</p>
                <QRScanner
                  onScan={handleQRScan}
                  onError={handleQRError}
                  isLoading={loading}
                  title="Scan Ticket QR Code"
                  description="Position the QR code within the camera view"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card className={`border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.success ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-600" />
                </div>
              )}
              <div>
                <CardTitle className={result.success ? 'text-green-900' : 'text-red-900'}>
                  {result.success ? 'Valid Ticket ✓' : 'Invalid Ticket ✗'}
                </CardTitle>
                <CardDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {result.ticket && (
            <CardContent className="space-y-4">
              {/* Ticket Status */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="font-medium text-gray-700">Status:</span>
                <Badge className={`${getStatusColor(result.ticket.status)} border`}>
                  {result.ticket.status.charAt(0).toUpperCase() + result.ticket.status.slice(1)}
                </Badge>
              </div>

              {/* Ticket ID */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="font-medium text-gray-700">Ticket ID:</span>
                <span className="font-mono text-sm text-gray-900">{result.ticket.ticketId}</span>
              </div>

              {/* Attendee Details */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Attendee Details
                </h3>
                <div className="space-y-2 pl-7">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">
                      {result.ticket.user.firstName} {result.ticket.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email:
                    </span>
                    <span className="text-gray-900">{result.ticket.user.email}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Metadata */}
              {result.ticket.metadata && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Ticket Information</h3>
                  <div className="space-y-2">
                    {result.ticket.metadata.ticketType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900">{result.ticket.metadata.ticketType}</span>
                      </div>
                    )}
                    {result.ticket.metadata.additionalInfo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Info:</span>
                        <span className="text-gray-900">{result.ticket.metadata.additionalInfo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Time */}
              {result.ticket.verifiedAt && (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between border border-blue-200">
                  <span className="text-blue-700 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Verified At:
                  </span>
                  <span className="text-blue-900 font-semibold">
                    {new Date(result.ticket.verifiedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}


    </div>
  );
}

