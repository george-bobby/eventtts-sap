'use client';
import { EventWithSubEvents } from '@/lib/actions/event.action';
import EventCards from '@/components/shared/EventCards';
import SearchBar from '@/components/shared/SearchBar';
import Categories from '@/components/shared/Categories';
import Pagination from '@/components/shared/Pagination';
import EventFilters, { EventFilters as EventFiltersType } from '@/components/shared/EventFilters';
import { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, Clock, SlidersHorizontal, Sparkles, Grid, List } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';

interface ExploreEventsClientProps {
    initialEventsData: { events: EventWithSubEvents[]; totalPages: number };
    userData: any;
    userId: string | null;
    initialPage: number;
}

export default function ExploreEventsClient({
    initialEventsData,
    userData,
    userId,
    initialPage
}: ExploreEventsClientProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'date' | 'popularity' | 'name'>('date');
    const [showFilters, setShowFilters] = useState(false);
    const [filteredEvents, setFilteredEvents] = useState<EventWithSubEvents[]>(initialEventsData?.events || []);
    const [activeFilters, setActiveFilters] = useState<EventFiltersType | null>(null);

    const router = useRouter();
    const searchParamsHook = useSearchParams();

    // Helper functions for date calculations
    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isThisWeek = (date: Date) => {
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        return date >= startOfWeek && date <= endOfWeek;
    };

    // Calculate dynamic counts based on actual events
    const eventCounts = useMemo(() => {
        if (!initialEventsData?.events || initialEventsData.events.length === 0) {
            return {
                today: 0,
                thisWeek: 0,
                free: 0,
                nearMe: 0,
                popular: 0
            };
        }

        const events = initialEventsData.events;
        const todayCount = events.filter(event =>
            event.startDate && isToday(new Date(event.startDate))
        ).length;

        const thisWeekCount = events.filter(event =>
            event.startDate && isThisWeek(new Date(event.startDate))
        ).length;

        const freeCount = events.filter(event =>
            event.isFree === true || event.price === 0
        ).length;

        const nearMeCount = events.filter(event =>
            !event.isOnline && event.location
        ).length;

        const popularCount = events.filter(event =>
            (event.attendees && event.attendees.length > 10) ||
            (event.totalCapacity && event.ticketsLeft && (event.totalCapacity - event.ticketsLeft) > 10)
        ).length;

        return {
            today: todayCount,
            thisWeek: thisWeekCount,
            free: freeCount,
            nearMe: nearMeCount,
            popular: popularCount
        };
    }, [initialEventsData]);

    const quickFilters = [
        { label: 'This Week', icon: Calendar, count: eventCounts.thisWeek, filterKey: 'this-week', action: () => handleQuickFilter('this-week') },
        { label: 'Near Me', icon: MapPin, count: eventCounts.nearMe, filterKey: 'near-me', action: () => handleQuickFilter('near-me') },
        { label: 'Popular', icon: Users, count: eventCounts.popular, filterKey: 'popular', action: () => handleQuickFilter('popular') },
        { label: 'Today', icon: Clock, count: eventCounts.today, filterKey: 'today', action: () => handleQuickFilter('today') },
        { label: 'Free Events', icon: Sparkles, count: eventCounts.free, filterKey: 'free', action: () => handleQuickFilter('free') },
    ];

    const sortEvents = (eventsToSort: EventWithSubEvents[], sortOption: string) => {
        if (!eventsToSort || eventsToSort.length === 0) return [];

        const sorted = [...eventsToSort];

        switch (sortOption) {
            case 'date':
                return sorted.sort((a, b) => {
                    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                    return dateB - dateA;
                });
            case 'popularity':
                return sorted.sort((a, b) => {
                    const aPopularity = (a.attendees?.length || 0) + (a.ticketsLeft ? (a.totalCapacity - a.ticketsLeft) : 0);
                    const bPopularity = (b.attendees?.length || 0) + (b.ticketsLeft ? (b.totalCapacity - b.ticketsLeft) : 0);
                    return bPopularity - aPopularity;
                });
            case 'name':
                return sorted.sort((a, b) => {
                    const titleA = a.title || '';
                    const titleB = b.title || '';
                    return titleA.localeCompare(titleB);
                });
            default:
                return sorted;
        }
    };

    const applyFilters = (events: EventWithSubEvents[], filters: EventFiltersType | null, quickFilterType?: string) => {
        if (!events || events.length === 0) return [];

        let filtered = [...events];

        // Apply quick filters
        if (quickFilterType) {
            switch (quickFilterType) {
                case 'today':
                    filtered = filtered.filter(event =>
                        event.startDate && isToday(new Date(event.startDate))
                    );
                    break;
                case 'this-week':
                    filtered = filtered.filter(event =>
                        event.startDate && isThisWeek(new Date(event.startDate))
                    );
                    break;
                case 'free':
                    filtered = filtered.filter(event =>
                        event.isFree === true || event.price === 0
                    );
                    break;
                case 'near-me':
                    filtered = filtered.filter(event =>
                        !event.isOnline && event.location
                    );
                    break;
                case 'popular':
                    filtered = filtered.filter(event =>
                        (event.attendees && event.attendees.length > 10) ||
                        (event.totalCapacity && event.ticketsLeft && (event.totalCapacity - event.ticketsLeft) > 10)
                    );
                    break;
            }
        }

        return filtered;
    };

    const handleFiltersChange = (filters: EventFiltersType) => {
        setActiveFilters(filters);
        if (initialEventsData?.events) {
            const filtered = applyFilters(initialEventsData.events, filters);
            setFilteredEvents(filtered);
        }
    };

    const handleQuickFilter = (filterType: string) => {
        const currentQuickFilter = searchParamsHook.get('quickFilter');

        if (currentQuickFilter === filterType) {
            // Remove filter if already active
            const newUrl = removeKeysFromQuery({
                params: searchParamsHook.toString(),
                keysToRemove: ['quickFilter'],
            });
            router.push(newUrl, { scroll: false });
        } else {
            // Apply new filter
            const newUrl = formUrlQuery({
                params: searchParamsHook.toString(),
                key: 'quickFilter',
                value: filterType,
            });
            router.push(newUrl, { scroll: false });
        }
    };

    // Update filtered events when events, filters, or URL params change
    useEffect(() => {
        if (!initialEventsData?.events) {
            setFilteredEvents([]);
            return;
        }

        const quickFilter = searchParamsHook.get('quickFilter');
        const urlSortBy = searchParamsHook.get('sort') || 'date';

        setSortBy(urlSortBy as 'date' | 'popularity' | 'name');

        let filtered = applyFilters(initialEventsData.events, activeFilters, quickFilter || undefined);
        filtered = sortEvents(filtered, urlSortBy);

        setFilteredEvents(filtered);
    }, [initialEventsData, activeFilters, searchParamsHook]);

    return (
        <main className="min-h-screen bg-gray-50">
            <section id="explore" className="py-12 bg-gray-50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Desktop Filters Sidebar */}
                        <div className="hidden lg:block">
                            <EventFilters
                                onFiltersChange={handleFiltersChange}
                                isOpen={true}
                                onToggle={() => { }}
                            />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Enhanced Header */}
                            <div className="mb-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                                {filteredEvents.length} Events Found
                                            </div>
                                            {activeFilters && (
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                                    Filters Active
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            All Events
                                        </h2>
                                    </div>

                                    {/* Mobile Filter Toggle */}
                                    <div className="lg:hidden">
                                        <EventFilters
                                            onFiltersChange={handleFiltersChange}
                                            isOpen={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Search and Quick Filters */}
                            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                                {/* Search Bar */}
                                <div className="mb-6">
                                    <SearchBar
                                        route="/explore"
                                        placeholder="Search events, organizers, locations..."
                                        otherClasses="w-full"
                                    />
                                </div>

                                {/* Quick Filters */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4" />
                                        Quick Filters
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {quickFilters.map((filter, index) => {
                                            const IconComponent = filter.icon;
                                            const isActive = searchParamsHook.get('quickFilter') === filter.filterKey;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={filter.action}
                                                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors group ${isActive
                                                        ? 'border-red-500 bg-red-50 text-red-700'
                                                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                                                        }`}
                                                >
                                                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-red-600'
                                                        }`} />
                                                    <span className={`text-sm font-medium ${isActive ? 'text-red-700' : 'text-gray-700 group-hover:text-red-700'
                                                        }`}>
                                                        {filter.label}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${isActive
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-600 group-hover:bg-red-100 group-hover:text-red-700'
                                                        }`}>
                                                        {filter.count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100">
                                    {/* View Mode Toggle */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">View:</span>
                                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => setViewMode('grid')}
                                                    className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'grid'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <Grid className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Grid</span>
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('list')}
                                                    className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'list'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <List className="w-4 h-4" />
                                                    <span className="hidden sm:inline">List</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sort Options */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Sort by:</span>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => {
                                                    const newSortBy = e.target.value;
                                                    setSortBy(newSortBy as any);
                                                    const newUrl = formUrlQuery({
                                                        params: searchParamsHook.toString(),
                                                        key: 'sort',
                                                        value: newSortBy,
                                                    });
                                                    router.push(newUrl, { scroll: false });
                                                }}
                                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            >
                                                <option value="date">Latest First</option>
                                                <option value="popularity">Most Popular</option>
                                                <option value="name">Alphabetical</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Results count and advanced filters toggle */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">
                                            Showing {filteredEvents.length} of {initialEventsData?.events?.length || 0} events
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="mb-8">
                                <Categories />
                            </div>

                            {/* Events Grid/List */}
                            <div className="mb-8">
                                <EventCards
                                    events={filteredEvents}
                                    currentUserId={userId}
                                    emptyTitle="No events found"
                                    emptyStateSubtext="Try adjusting your filters or search terms"
                                    user={userData}
                                    page="explore"
                                />
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-center">
                                <Pagination
                                    page={initialPage}
                                    totalPages={initialEventsData?.totalPages || 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
