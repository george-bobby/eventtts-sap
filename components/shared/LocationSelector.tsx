'use client';

import { useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  locations: string[];
  currentLocation: string;
  onSelect: (location: string) => void;
  selectedLocation: string | null;
}

export default function LocationSelector({
  locations,
  currentLocation,
  onSelect,
  selectedLocation
}: LocationSelectorProps) {
  // Filter out the current location from the options
  const destinationOptions = locations.filter(loc => loc !== currentLocation);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h3 className="font-semibold text-xl">Select Your Destination</h3>
        <p className="text-sm text-muted-foreground mt-2">Choose where you'd like to navigate to on campus</p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
        {destinationOptions.map((location) => (
          <div
            key={location}
            className={cn(
              "flex items-center space-x-4 p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedLocation === location
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
            onClick={() => onSelect(location)}
          >
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
              selectedLocation === location ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {selectedLocation === location ? (
                <Check className="h-6 w-6" />
              ) : (
                <MapPin className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="font-medium text-base flex-1">{location}</div>
          </div>
        ))}
      </div>
    </div>
  );
}