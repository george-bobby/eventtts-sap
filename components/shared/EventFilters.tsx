'use client';

import { useState } from 'react';
import { Calendar, MapPin, DollarSign, Users, Clock, X, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface EventFiltersProps {
    onFiltersChange: (filters: EventFilters) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export interface EventFilters {
    dateRange: string;
    priceRange: [number, number];
    location: string[];
    eventType: string[];
    capacity: string;
    duration: string[];
    tags: string[];
}

const initialFilters: EventFilters = {
    dateRange: '',
    priceRange: [0, 1000],
    location: [],
    eventType: [],
    capacity: '',
    duration: [],
    tags: []
};

export default function EventFilters({ onFiltersChange, isOpen, onToggle }: EventFiltersProps) {
    const [filters, setFilters] = useState<EventFilters>(initialFilters);
    const [activeFilters, setActiveFilters] = useState(0);

    const dateOptions = [
        { value: 'today', label: 'Today' },
        { value: 'tomorrow', label: 'Tomorrow' },
        { value: 'this-week', label: 'This Week' },
        { value: 'this-month', label: 'This Month' },
        { value: 'next-month', label: 'Next Month' }
    ];

    const locationOptions = [
        'Main Campus',
        'Library',
        'Auditorium',
        'Sports Complex',
        'Student Center',
        'Cafeteria',
        'Computer Lab',
        'Online'
    ];

    const eventTypeOptions = [
        'Workshop',
        'Seminar',
        'Conference',
        'Cultural Event',
        'Sports Event',
        'Academic Event',
        'Social Event',
        'Competition',
        'Career Fair',
        'Club Activity'
    ];

    const durationOptions = [
        { value: '1-2', label: '1-2 hours' },
        { value: '2-4', label: '2-4 hours' },
        { value: '4-8', label: '4-8 hours' },
        { value: '1-day', label: 'Full Day' },
        { value: 'multi-day', label: 'Multi-day' }
    ];

    const updateFilter = (key: keyof EventFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange(newFilters);

        // Update active filters count
        const count = Object.values(newFilters).reduce((acc, val) => {
            if (Array.isArray(val)) return acc + val.length;
            if (typeof val === 'string') return acc + (val ? 1 : 0);
            return acc;
        }, 0);
        setActiveFilters(count);
    };

    const clearAllFilters = () => {
        setFilters(initialFilters);
        setActiveFilters(0);
        onFiltersChange(initialFilters);
    };

    const toggleArrayFilter = (key: keyof EventFilters, value: string) => {
        const currentArray = filters[key] as string[];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        updateFilter(key, newArray);
    };

    if (!isOpen) {
        return (
            <Button
                onClick={onToggle}
                variant="outline"
                className="fixed top-4 right-4 z-50 lg:hidden"
            >
                <Filter className="w-4 h-4 mr-2" />
                Filters {activeFilters > 0 && `(${activeFilters})`}
            </Button>
        );
    }

    return (
        <div className="w-full lg:w-80 bg-white rounded-lg shadow-sm border p-6 h-fit">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    {activeFilters > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {activeFilters}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFilters > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-red-600 hover:text-red-700"
                        >
                            Clear All
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className="lg:hidden"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Date Range */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        When
                    </Label>
                    <div className="space-y-2">
                        {dateOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`date-${option.value}`}
                                    checked={filters.dateRange === option.value}
                                    onCheckedChange={() => updateFilter('dateRange',
                                        filters.dateRange === option.value ? '' : option.value
                                    )}
                                />
                                <Label htmlFor={`date-${option.value}`} className="text-sm">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Location */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {locationOptions.map((location) => (
                            <div key={location} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`location-${location}`}
                                    checked={filters.location.includes(location)}
                                    onCheckedChange={() => toggleArrayFilter('location', location)}
                                />
                                <Label htmlFor={`location-${location}`} className="text-sm">
                                    {location}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Price Range
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="Min"
                            value={filters.priceRange[0]}
                            onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
                            className="w-20"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                            type="number"
                            placeholder="Max"
                            value={filters.priceRange[1]}
                            onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
                            className="w-20"
                        />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                    </div>
                </div>

                <Separator />

                {/* Event Type */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Event Type
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {eventTypeOptions.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`type-${type}`}
                                    checked={filters.eventType.includes(type)}
                                    onCheckedChange={() => toggleArrayFilter('eventType', type)}
                                />
                                <Label htmlFor={`type-${type}`} className="text-sm">
                                    {type}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Duration */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration
                    </Label>
                    <div className="space-y-2">
                        {durationOptions.map((duration) => (
                            <div key={duration.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`duration-${duration.value}`}
                                    checked={filters.duration.includes(duration.value)}
                                    onCheckedChange={() => toggleArrayFilter('duration', duration.value)}
                                />
                                <Label htmlFor={`duration-${duration.value}`} className="text-sm">
                                    {duration.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}