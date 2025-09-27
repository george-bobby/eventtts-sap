'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Camera, Settings, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkGPSPermission, type GPSPermissionState } from '@/lib/gps-utils';

export interface PredictionSettings {
  gpsEnabled: boolean;
  aiEnabled: boolean;
  gpsWeight: number;
  aiWeight: number;
}

interface GPSSettingsProps {
  settings: PredictionSettings;
  onSettingsChange: (settings: PredictionSettings) => void;
  onRequestGPSPermission?: () => Promise<void>;
  className?: string;
}

export default function GPSSettings({
  settings,
  onSettingsChange,
  onRequestGPSPermission,
  className
}: GPSSettingsProps) {
  const [gpsPermission, setGpsPermission] = useState<GPSPermissionState>({
    granted: false,
    denied: false,
    prompt: true
  });
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Check GPS permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await checkGPSPermission();
        setGpsPermission(permission);
      } catch (error) {
        console.error('Error checking GPS permission:', error);
        setGpsPermission({ granted: false, denied: true, prompt: false });
      } finally {
        setIsCheckingPermission(false);
      }
    };

    checkPermission();
  }, []);

  // Update weights when individual toggles change
  const handleGPSToggle = (enabled: boolean) => {
    const newSettings = { ...settings, gpsEnabled: enabled };

    // If GPS is disabled, give all weight to AI
    if (!enabled && settings.aiEnabled) {
      newSettings.gpsWeight = 0;
      newSettings.aiWeight = 100;
    }
    // If GPS is enabled and AI is disabled, give all weight to GPS
    else if (enabled && !settings.aiEnabled) {
      newSettings.gpsWeight = 100;
      newSettings.aiWeight = 0;
    }
    // If both are enabled, use default weights
    else if (enabled && settings.aiEnabled) {
      newSettings.gpsWeight = 40;
      newSettings.aiWeight = 60;
    }

    onSettingsChange(newSettings);
  };

  const handleAIToggle = (enabled: boolean) => {
    const newSettings = { ...settings, aiEnabled: enabled };

    // If AI is disabled, give all weight to GPS
    if (!enabled && settings.gpsEnabled) {
      newSettings.gpsWeight = 100;
      newSettings.aiWeight = 0;
    }
    // If AI is enabled and GPS is disabled, give all weight to AI
    else if (enabled && !settings.gpsEnabled) {
      newSettings.gpsWeight = 0;
      newSettings.aiWeight = 100;
    }
    // If both are enabled, use default weights
    else if (enabled && settings.gpsEnabled) {
      newSettings.gpsWeight = 40;
      newSettings.aiWeight = 60;
    }

    onSettingsChange(newSettings);
  };

  const handleWeightChange = (value: number[]) => {
    const gpsWeight = value[0];
    const aiWeight = 100 - gpsWeight;

    onSettingsChange({
      ...settings,
      gpsWeight,
      aiWeight
    });
  };

  const handleRequestPermission = async () => {
    if (onRequestGPSPermission) {
      try {
        await onRequestGPSPermission();
        // Recheck permission after request
        const permission = await checkGPSPermission();
        setGpsPermission(permission);
      } catch (error) {
        console.error('Error requesting GPS permission:', error);
      }
    }
  };

  const getGPSStatusIcon = () => {
    if (isCheckingPermission) return <Settings className="h-4 w-4 animate-spin" />;
    if (gpsPermission.granted) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (gpsPermission.denied) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Info className="h-4 w-4 text-yellow-500" />;
  };

  const getGPSStatusText = () => {
    if (isCheckingPermission) return 'Checking GPS permission...';
    if (gpsPermission.granted) return 'GPS access granted';
    if (gpsPermission.denied) return 'GPS access denied';
    return 'GPS permission required';
  };

  const bothEnabled = settings.gpsEnabled && settings.aiEnabled;
  const neitherEnabled = !settings.gpsEnabled && !settings.aiEnabled;

  return (
    <Card className={className}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Settings className="h-6 w-6" />
          Prediction Settings
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Configure how location predictions are made using GPS and AI technology
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* GPS Permission Status */}
        <div className="flex items-center justify-between p-5 bg-muted/80 rounded-lg border">
          <div className="flex items-center gap-3">
            {getGPSStatusIcon()}
            <span className="font-medium">{getGPSStatusText()}</span>
          </div>
          {(gpsPermission.prompt || gpsPermission.denied) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestPermission}
              disabled={isCheckingPermission}
              className="px-4 py-2"
            >
              Enable GPS
            </Button>
          )}
        </div>

        {/* Prediction Methods */}
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-semibold text-lg">Prediction Methods</h4>
            <p className="text-sm text-muted-foreground mt-1">Choose which technologies to use for location detection</p>
          </div>

          {/* GPS Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div className="space-y-1">
                <Label htmlFor="gps-toggle" className="font-medium text-base">
                  GPS Location
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use device GPS for precise location detection
                </p>
              </div>
            </div>
            <span
              role="button"
              tabIndex={0}
              aria-checked={settings.gpsEnabled}
              onClick={() => gpsPermission.granted && handleGPSToggle(!settings.gpsEnabled)}
              onKeyPress={e => { if ((e.key === 'Enter' || e.key === ' ') && gpsPermission.granted) handleGPSToggle(!settings.gpsEnabled); }}
              className={`px-5 py-2.5 rounded-full font-semibold cursor-pointer transition-colors shadow-sm select-none ${settings.gpsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'} ${!gpsPermission.granted ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="gps-toggle"
            >
              {settings.gpsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-4">
              <Camera className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <Label htmlFor="ai-toggle" className="font-medium text-base">
                  AI Vision
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use camera and AI for intelligent location detection
                </p>
              </div>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={() => handleAIToggle(!settings.aiEnabled)}
              onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') handleAIToggle(!settings.aiEnabled); }}
              className={`px-5 py-2.5 rounded-full font-semibold cursor-pointer transition-colors shadow-sm select-none ${settings.aiEnabled ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
              id="ai-toggle"
            >
              {settings.aiEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Weight Configuration */}
        {bothEnabled && (
          <>
            <Separator className="my-6" />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">Prediction Weights</h4>
                  <p className="text-sm text-muted-foreground mt-1">Adjust the balance between GPS and AI predictions</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="px-3 py-1 font-medium">
                    GPS: {settings.gpsWeight}%
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 font-medium">
                    AI: {settings.aiWeight}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More GPS</span>
                  <span>More AI</span>
                </div>
                <Slider
                  value={[settings.gpsWeight]}
                  onValueChange={handleWeightChange}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-blue-500">GPS {settings.gpsWeight}%</span>
                  <span className="text-green-500">AI {settings.aiWeight}%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Warnings */}
        {neitherEnabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              At least one prediction method must be enabled.
            </AlertDescription>
          </Alert>
        )}

        {settings.gpsEnabled && !gpsPermission.granted && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GPS is enabled but permission is not granted. Click "Enable GPS" to request access.
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• GPS provides accurate location but requires permission</p>
          <p>• AI analyzes camera images to identify locations</p>
          <p>• Combined predictions offer the best accuracy</p>
        </div>
      </CardContent>
    </Card>
  );
}
