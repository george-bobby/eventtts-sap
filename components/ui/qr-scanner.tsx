'use client';

import { useState, useCallback } from "react";
import {
  Scanner,
  useDevices,
  outline,
  boundingBox,
  centerText,
} from "@yudiel/react-qr-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Scan, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (data: string) => Promise<void>;
  onError?: (error: string) => void;
  className?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function QRScanner({
  onScan,
  onError,
  className,
  title = "QR Code Scanner",
  description = "Position the QR code within the camera view to scan",
  isLoading = false,
}: QRScannerProps) {
  const [deviceId, setDeviceId] = useState<string>('default');
  const [tracker, setTracker] = useState<string>("centerText");
  const [pause, setPause] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [lastScannedData, setLastScannedData] = useState<string>('');

  const devices = useDevices();

  function getTracker() {
    switch (tracker) {
      case "outline":
        return outline;
      case "boundingBox":
        return boundingBox;
      case "centerText":
        return centerText;
      case "none":
        return undefined;
      default:
        return centerText;
    }
  }

  const handleScan = useCallback(async (data: string) => {
    if (pause || isLoading || data === lastScannedData) return;

    setPause(true);
    setScanStatus('scanning');
    setLastScannedData(data);

    try {
      await onScan(data);
      setScanStatus('success');
      // Resume scanning after 2 seconds
      setTimeout(() => {
        setPause(false);
        setScanStatus('idle');
      }, 2000);
    } catch (error) {
      setScanStatus('error');
      onError?.(error instanceof Error ? error.message : 'Scan failed');
      // Resume scanning after 3 seconds
      setTimeout(() => {
        setPause(false);
        setScanStatus('idle');
      }, 3000);
    }
  }, [onScan, onError, pause, isLoading, lastScannedData]);

  const handleScanError = useCallback((error: unknown) => {
    console.error('QR Scanner error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown scanner error';
    onError?.(errorMessage);
  }, [onError]);

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          <Select value={deviceId} onValueChange={setDeviceId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Camera</SelectItem>
              {devices.map((device, index) => (
                <SelectItem key={index} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tracker} onValueChange={setTracker}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="centerText">Center</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="boundingBox">Box</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Badge */}
        {scanStatus !== 'idle' && (
          <div className="flex justify-center">
            <Badge
              variant={scanStatus === 'success' ? 'default' : scanStatus === 'error' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {scanStatus === 'scanning' && <Camera className="w-3 h-3 animate-pulse" />}
              {scanStatus === 'success' && <CheckCircle className="w-3 h-3" />}
              {scanStatus === 'error' && <AlertCircle className="w-3 h-3" />}
              {scanStatus === 'scanning' && 'Processing...'}
              {scanStatus === 'success' && 'Success!'}
              {scanStatus === 'error' && 'Error'}
            </Badge>
          </div>
        )}

        {/* Scanner */}
        <div className="relative">
          <Scanner
            formats={[
              "qr_code",
              "micro_qr_code",
              "rm_qr_code",
              "maxi_code",
              "pdf417",
              "aztec",
              "data_matrix",
            ]}
            constraints={{
              deviceId: deviceId === 'default' ? undefined : deviceId,
            }}
            onScan={(detectedCodes) => {
              if (detectedCodes.length > 0) {
                handleScan(detectedCodes[0].rawValue);
              }
            }}
            onError={handleScanError}
            styles={{
              container: {
                height: "300px",
                width: "100%",
                borderRadius: "8px",
                overflow: "hidden"
              }
            }}
            components={{
              onOff: true,
              torch: true,
              zoom: true,
              finder: true,
              tracker: getTracker(),
            }}
            allowMultiple={false}
            scanDelay={1000}
            paused={pause || isLoading}
          />

          {/* Loading overlay */}
          {(isLoading || scanStatus === 'scanning') && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600">
          <p>Point your camera at a QR code to scan it</p>
          {devices.length === 0 && (
            <p className="text-red-500 mt-1">No cameras detected. Please check your camera permissions.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
