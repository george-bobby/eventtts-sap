'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { campusLocations } from '@/lib/campus-data';
import { Upload, Video, ArrowLeft, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getGPSService, requestGPSPermission, type GPSLocationResult } from '@/lib/gps-service';
import { combineGPSAndAIPredictions, type HybridPredictionResult, type AIPrediction } from '@/lib/hybrid-prediction';
import { getBestGPSMatch } from '@/lib/gps-utils';

// 🔁 Dynamically import components to avoid SSR issues
const RealTimeCameraInline = dynamic(() => import('@/components/shared/RealTimeCameraInline'), { ssr: false });
const CameraCapture = dynamic(() => import('@/components/shared/CameraCapture'), { ssr: false });
const ImageUploader = dynamic(() => import('@/components/shared/ImageUploader'), { ssr: false });
const LocationSelector = dynamic(() => import('@/components/shared/LocationSelector'), { ssr: false });
const NavigationMap = dynamic(() => import('@/components/shared/NavigationMap').then(mod => ({ default: mod.default })), { ssr: false });
const GPSSettings = dynamic(() => import('@/components/shared/GPSSettings'), { ssr: false });
const PredictionBreakdown = dynamic(() => import('@/components/shared/PredictionBreakdown'), { ssr: false });
import CameraDiagnostics from '@/components/shared/CameraDiagnostics';
import CampusLocationsSection from '@/components/shared/CampusLocationsSection';

type LocationState = 'detection' | 'destination' | 'navigation';
type DetectionMethod = 'upload' | 'live';

interface PredictionSettings {
  gpsEnabled: boolean;
  aiEnabled: boolean;
  gpsWeight: number;
  aiWeight: number;
}

export default function LocationDetection() {
  const searchParams = useSearchParams();
  const destinationParam = searchParams.get('destination');

  const [locationState, setLocationState] = useState<LocationState>('detection');
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<string | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod>('upload');
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Modal state for camera capture
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // GPS and prediction settings
  const [showSettings, setShowSettings] = useState(false);
  const [predictionSettings, setPredictionSettings] = useState<PredictionSettings>({
    gpsEnabled: false,
    aiEnabled: true,
    gpsWeight: 40,
    aiWeight: 60
  });
  const [currentGPSLocation, setCurrentGPSLocation] = useState<GPSLocationResult | null>(null);
  const [hybridResult, setHybridResult] = useState<HybridPredictionResult | null>(null);

  const { toast } = useToast();
  const gpsService = getGPSService();

  // Handle deep linking from ticket navigation
  useEffect(() => {
    if (destinationParam && campusLocations.some(loc => loc.name === destinationParam)) {
      setDestinationLocation(destinationParam);
      // If we have a destination from deep linking, we still need to detect current location
      // but we'll skip the destination selection step
    }
  }, [destinationParam]);

  // GPS location monitoring
  useEffect(() => {
    // Add a small delay to prevent conflicts with camera initialization
    const timeoutId = setTimeout(() => {
      if (predictionSettings.gpsEnabled) {
        gpsService.updateOptions({
          onLocationUpdate: (result) => {
            setCurrentGPSLocation(result);
          },
          onError: (error) => {
            console.error('GPS error:', error);
            toast({
              title: 'GPS Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        });

        gpsService.startWatching();
      } else {
        gpsService.stopWatching();
        setCurrentGPSLocation(null);
      }
    }, 100); // Small delay to prevent race conditions

    return () => {
      clearTimeout(timeoutId);
      gpsService.stopWatching();
    };
  }, [predictionSettings.gpsEnabled, gpsService, toast]);

  // Handle image upload (from ImageUploader)
  const handleImageUpload = async (imageDataUrl: string, detectedLocation: string) => {
    setUploadedImage(imageDataUrl);

    // If hybrid prediction is enabled, combine with GPS
    if (predictionSettings.gpsEnabled && currentGPSLocation?.bestMatch) {
      const aiPrediction: AIPrediction = {
        predicted_class: detectedLocation,
        confidence: 1.0,
        probabilities: { [detectedLocation]: 1.0 }
      };

      const hybrid = combineGPSAndAIPredictions(
        currentGPSLocation.bestMatch,
        aiPrediction,
        { gpsWeight: predictionSettings.gpsWeight, aiWeight: predictionSettings.aiWeight }
      );

      setHybridResult(hybrid);
      setCurrentLocation(hybrid.finalLocation);
      setDetectionConfidence(hybrid.finalConfidence);

      toast({
        title: 'Location Detected!',
        description: `Found: ${hybrid.finalLocation} (${Math.round(hybrid.finalConfidence * 100)}% confidence) via hybrid prediction`,
      });
    } else {
      setCurrentLocation(detectedLocation);
      setDetectionConfidence(1.0);

      toast({
        title: 'Location Detected!',
        description: `Found: ${detectedLocation} via image upload`,
      });
    }

    // If we have a destination from deep linking, skip to navigation
    if (destinationParam && campusLocations.some(loc => loc.name === destinationParam)) {
      setLocationState('navigation');
    } else {
      setLocationState('destination');
    }
  };

  // Send image to backend for prediction with optional GPS data
  const predictImageLocation = async (imageDataUrl: string) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      // Add GPS data if available and enabled
      if (predictionSettings.gpsEnabled && currentGPSLocation?.coordinates) {
        formData.append('gps_lat', currentGPSLocation.coordinates.latitude.toString());
        formData.append('gps_lng', currentGPSLocation.coordinates.longitude.toString());
        formData.append('gps_weight', predictionSettings.gpsWeight.toString());
        formData.append('ai_weight', predictionSettings.aiWeight.toString());
      }

      // Use Next.js API route
      const res = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to process image');
      }

      const data = await res.json();

      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.message || data.error);
      }

      // Check if we have a valid prediction
      if (!data.predicted_class) {
        throw new Error('No location could be detected from this image');
      }

      // Handle hybrid prediction response
      if (data.hybrid_prediction) {
        setHybridResult(data.hybrid_prediction);
        return {
          predicted_class: data.hybrid_prediction.final_location,
          confidence: data.hybrid_prediction.final_confidence,
          method: data.method,
          gpsData: data.gps_data,
          aiData: data.ai_data
        };
      }

      return {
        predicted_class: data.predicted_class,
        confidence: data.confidence || data.probabilities?.[data.predicted_class] || 0.5,
        method: data.method || 'ai-only'
      };
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: 'Prediction Failed',
        description: 'Failed to detect location. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Handle camera capture (from CameraCapture)
  const handleCameraCapture = async (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    setIsCameraOpen(false);

    // Send to backend for prediction
    const prediction = await predictImageLocation(imageDataUrl);
    if (prediction) {
      setCurrentLocation(prediction.predicted_class);
      setDetectionConfidence(prediction.confidence);
      // If we have a destination from deep linking, skip to navigation
      if (destinationParam && campusLocations.some(loc => loc.name === destinationParam)) {
        setLocationState('navigation');
      } else {
        setLocationState('destination');
      }

      toast({
        title: 'Location Detected!',
        description: `Found: ${prediction.predicted_class} (${Math.round(prediction.confidence * 100)}% confidence) via camera`,
      });
    }
  };

  // Handle live detection (from RealTimeCameraCapture)
  const handleLiveLocationDetected = (location: string, confidence: number) => {
    setCurrentLocation(location);
    setDetectionConfidence(confidence);
    // If we have a destination from deep linking, skip to navigation
    if (destinationParam && campusLocations.some(loc => loc.name === destinationParam)) {
      setLocationState('navigation');
    } else {
      setLocationState('destination');
    }

    toast({
      title: 'Location Detected!',
      description: `Found: ${location} (${Math.round(confidence * 100)}% confidence) via live detection`,
    });
  };

  // Open camera for photo capture
  const openCamera = () => {
    setIsCameraOpen(true);
  };

  const handleDestinationSelect = (location: string) => {
    setDestinationLocation(location);
  };

  const handleProceedToNavigation = () => {
    if (!destinationLocation) {
      toast({
        title: "Please select a destination",
        description: "You need to select where you want to go",
        variant: "destructive",
      });
      return;
    }
    setLocationState('navigation');
  };

  // Handle GPS permission request
  const handleGPSPermissionRequest = async () => {
    try {
      const granted = await requestGPSPermission();
      if (granted) {
        setPredictionSettings(prev => ({ ...prev, gpsEnabled: true }));
        toast({
          title: 'GPS Enabled',
          description: 'GPS location access granted successfully',
        });
      } else {
        toast({
          title: 'GPS Permission Denied',
          description: 'GPS access is required for location-based predictions',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'GPS Error',
        description: 'Failed to request GPS permission',
        variant: 'destructive',
      });
    }
  };

  // Handle settings change
  const handleSettingsChange = async (newSettings: PredictionSettings) => {
    // If GPS is being enabled, request permission
    if (newSettings.gpsEnabled && !predictionSettings.gpsEnabled) {
      const granted = await requestGPSPermission();
      if (!granted) {
        setPredictionSettings(prev => ({ ...prev, gpsEnabled: false }));
        toast({
          title: 'GPS Permission Denied',
          description: 'GPS access is required for location-based predictions',
          variant: 'destructive',
        });
        return;
      } else {
        toast({
          title: 'GPS Enabled',
          description: 'GPS location access granted successfully',
        });
      }
    }
    setPredictionSettings(newSettings);
    // Validate that at least one method is enabled
    if (!newSettings.gpsEnabled && !newSettings.aiEnabled) {
      setPredictionSettings(prev => ({ ...prev, aiEnabled: true }));
      toast({
        title: 'Invalid Settings',
        description: 'At least one prediction method must be enabled',
        variant: 'destructive',
      });
    }
  }

  const resetProcess = () => {
    setLocationState('detection');
    setCurrentLocation(null);
    setDestinationLocation(null);
    setDetectionConfidence(0);
    setUploadedImage(null);
    setIsCameraOpen(false);
    setDetectionMethod('upload');
    setHybridResult(null);
    setShowSettings(false);
  };

  // Handle detection method change
  const handleValueChange = (value: string) => {
    setDetectionMethod(value as DetectionMethod);
  };

  return (
    <section id="location-detection" className="py-20 px-6 container">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">
            Find Your Way Around Campus
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use advanced AI and GPS technology to navigate around campus with ease
          </p>
        </div>

        <Card className="w-full shadow-lg border-2">
          <CardHeader className="pb-8">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Campus Navigation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {locationState === 'detection' && (destinationParam ? `Navigating to ${destinationParam} - First, detect your current location` : "Choose your preferred method to detect your current location")}
                  {locationState === 'destination' && "Select where you want to go"}
                  {locationState === 'navigation' && (destinationParam ? `Navigating to ${destinationParam} from your ticket` : "Follow the route to your destination")}
                </CardDescription>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-9"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" onClick={resetProcess} className="h-9">
                  Start Over
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-8 space-y-8">
            {/* Settings Panel */}
            {showSettings && (
              <div className="p-6 bg-muted/50 rounded-lg border">
                <GPSSettings
                  settings={predictionSettings}
                  onSettingsChange={handleSettingsChange}
                  onRequestGPSPermission={handleGPSPermissionRequest}
                />
              </div>
            )}

            {/* GPS Status Display - always show when GPS enabled, even if not granted yet */}
            {predictionSettings.gpsEnabled && (
              <div className="p-6 bg-blue-50 dark:bg-blue-950/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 text-lg">GPS Status</h4>
                {currentGPSLocation ? (
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                    <p className="font-medium">Coordinates: {currentGPSLocation.coordinates.latitude.toFixed(6)}, {currentGPSLocation.coordinates.longitude.toFixed(6)}</p>
                    {currentGPSLocation.bestMatch && (
                      <p className="font-medium">Nearest: {currentGPSLocation.bestMatch.name} ({Math.round(currentGPSLocation.bestMatch.distance)}m away)</p>
                    )}
                    <p className="font-medium">On Campus: <span className={currentGPSLocation.isOnCampus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{currentGPSLocation.isOnCampus ? 'Yes' : 'No'}</span></p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
                    <span className="font-medium">GPS access granted. Waiting for location...</span>
                  </div>
                )}
              </div>
            )}

            {locationState === 'detection' && (
              <div className="space-y-8">
                <Tabs value={detectionMethod} onValueChange={handleValueChange} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/80 border">
                    <TabsTrigger value="upload" className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </TabsTrigger>
                    <TabsTrigger value="live" className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Video className="h-4 w-4" />
                      Live Detection
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-8 space-y-6 p-6 bg-muted/30 rounded-lg border">
                    <div className="text-center space-y-3">
                      <h3 className="text-xl font-semibold">Upload an Image</h3>
                      <p className="text-base text-muted-foreground max-w-md mx-auto">
                        Select or drag an image of your surroundings, or take a photo to detect your location
                      </p>
                    </div>
                    <ImageUploader onImageUpload={handleImageUpload} />
                  </TabsContent>

                  <TabsContent value="live" className="mt-8 space-y-6 p-6 bg-muted/30 rounded-lg border">
                    <div className="text-center space-y-3">
                      <h3 className="text-xl font-semibold">Live Detection</h3>
                      <p className="text-base text-muted-foreground max-w-md mx-auto">
                        Real-time location detection using your camera feed
                      </p>
                    </div>
                    <RealTimeCameraInline
                      onLocationDetected={handleLiveLocationDetected}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {locationState === 'destination' && (
              <div className="space-y-8">
                <div className="p-6 bg-green-50 dark:bg-green-950/50 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <h3 className="font-semibold mb-4 text-lg text-green-900 dark:text-green-100">Your Current Location</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mb-3">{currentLocation}</p>
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Detection Confidence: {Math.round(detectionConfidence * 100)}%</span>
                  </div>

                  {/* Hybrid Prediction Details */}
                  {hybridResult && (
                    <div className="mt-6 p-4 bg-background rounded-lg border space-y-3">
                      <h4 className="text-base font-semibold mb-3">Prediction Details</h4>
                      <div className="text-sm space-y-2">
                        <p><span className="font-medium">Method:</span> {hybridResult.method}</p>
                        {hybridResult.method === 'hybrid' && (
                          <>
                            <p><span className="font-medium">GPS Contribution:</span> {Math.round(hybridResult.gpsContribution)}%</p>
                            <p><span className="font-medium">AI Contribution:</span> {Math.round(hybridResult.aiContribution)}%</p>
                          </>
                        )}
                        {hybridResult.gpsData && (
                          <p><span className="font-medium">GPS Distance:</span> {Math.round(hybridResult.gpsData.distance)}m</p>
                        )}
                      </div>
                    </div>
                  )}

                  {uploadedImage && (
                    <div className="mt-6 p-4 bg-background rounded-lg border">
                      <h4 className="text-base font-semibold mb-3">Captured Image</h4>
                      <img
                        src={uploadedImage}
                        alt="Captured location"
                        className="max-h-[200px] rounded-md object-contain mx-auto border"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <LocationSelector
                    locations={campusLocations.map(loc => loc.name)}
                    currentLocation={currentLocation || ''}
                    onSelect={handleDestinationSelect}
                    selectedLocation={destinationLocation}
                  />

                  {/* Prediction Analysis */}
                  {hybridResult && (
                    <PredictionBreakdown hybridResult={hybridResult} />
                  )}
                </div>
              </div>
            )}

            {locationState === 'navigation' && currentLocation && destinationLocation && (
              <div className="space-y-8">
                <div className="p-6 bg-blue-50 dark:bg-blue-950/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold mb-6 text-blue-900 dark:text-blue-100">Navigation Route</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300">Starting Point</h4>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{currentLocation}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300">Destination</h4>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{destinationLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background rounded-lg border-2 shadow-sm">
                  <div className="h-[500px] w-full rounded-lg overflow-hidden border">
                    <NavigationMap
                      startLocation={currentLocation}
                      endLocation={destinationLocation}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-8 pb-6 flex justify-end border-t bg-muted/30">
            {locationState === 'destination' && (
              <Button
                onClick={handleProceedToNavigation}
                size="lg"
                className="px-8 py-3 text-base font-semibold"
              >
                Get Directions
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Camera Capture Modal */}
        <CameraCapture
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
        />
      </div>

      <div className="mt-16 pt-8 border-t">
        <CampusLocationsSection />
      </div>
    </section>

  );
}
