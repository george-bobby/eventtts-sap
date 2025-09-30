'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCode, TicketQRCode } from '@/components/ui/qr-code';
import { QRScanner } from '@/components/ui/qr-scanner';
import { useToast } from '@/hooks/use-toast';

export default function TestQRPage() {
  const [entryCode, setEntryCode] = useState('123456');
  const [scannedData, setScannedData] = useState('');
  const { toast } = useToast();

  const handleScan = async (data: string) => {
    setScannedData(data);
    toast({
      title: 'QR Code Scanned!',
      description: `Data: ${data}`,
    });
  };

  const handleScanError = (error: string) => {
    toast({
      title: 'Scan Error',
      description: error,
      variant: 'destructive',
    });
  };

  const generateRandomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setEntryCode(code);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Test Page</h1>
          <p className="text-gray-600">Test QR code generation and scanning functionality</p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate QR Code</TabsTrigger>
            <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Generator</CardTitle>
                <CardDescription>
                  Generate QR codes for 6-digit entry codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={entryCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEntryCode(value);
                    }}
                    className="text-2xl font-mono tracking-widest text-center"
                    maxLength={6}
                  />
                  <Button onClick={generateRandomCode}>
                    Random Code
                  </Button>
                </div>

                {entryCode.length === 6 && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Standard QR Code */}
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">Standard QR Code</h3>
                      <div className="flex justify-center">
                        <QRCode
                          data={entryCode}
                          size={200}
                          level="M"
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <p className="text-sm text-gray-600">Basic QR code component</p>
                    </div>

                    {/* Ticket QR Code */}
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">Ticket QR Code</h3>
                      <div className="flex justify-center">
                        <TicketQRCode
                          entryCode={entryCode}
                          size={200}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Styled ticket QR code with label</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>
                  Scan QR codes using your device camera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRScanner
                  onScan={handleScan}
                  onError={handleScanError}
                  title="Test QR Scanner"
                  description="Scan any QR code to test the scanner"
                />
              </CardContent>
            </Card>

            {scannedData && (
              <Card>
                <CardHeader>
                  <CardTitle>Scanned Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="font-mono text-sm break-all">{scannedData}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <strong>Length:</strong> {scannedData.length} characters
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Contains 6-digit code:</strong> {/\d{6}/.test(scannedData) ? 'Yes' : 'No'}
                    </p>
                    {/\d{6}/.test(scannedData) && (
                      <p className="text-sm text-gray-600">
                        <strong>Extracted code:</strong> {scannedData.match(/\d{6}/)?.[0]}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Use the "Generate QR Code" tab to create QR codes from 6-digit entry codes</li>
              <li>Use the "Scan QR Code" tab to test scanning functionality</li>
              <li>Try scanning the generated QR codes to verify the round-trip works</li>
              <li>The scanner will extract 6-digit codes from any scanned QR code</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
