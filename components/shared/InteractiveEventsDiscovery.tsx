'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Grid, List, Calendar, MapPin, Users, Clock, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchBar from './SearchBar';
import Categories from './Categories';
import EventCards from './EventCards';
import Pagination from './Pagination';
import EventFilters, { EventFilters as EventFiltersType } from './EventFilters';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';

interface InteractiveEventsDiscoveryProps {
  events: any[];
  currentUserId: string | null;
  totalPages: number;
  page: number;
  user?: any; // Pre-fetched user data
}

interface QuickFilter {
  label: string;
  icon: any;
  count: number;
  filterKey: string;
  action: () => void;
}

export default function InteractiveEventsDiscovery({
  events,
  currentUserId,
  totalPages,
  page,
  user
}: InteractiveEventsDiscoveryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'popularity' | 'name'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [activeFilters, setActiveFilters] = useState<EventFiltersType | null>(null);

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
    if (!events || events.length === 0) {
      return {
        today: 0,
        thisWeek: 0,
        free: 0,
        nearMe: 0,
        popular: 0
      };
    }

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
  }, [events]);

  const quickFilters = [
    { label: 'This Week', icon: Calendar, count: eventCounts.thisWeek, filterKey: 'this-week', action: () => handleQuickFilter('this-week') },
    { label: 'Near Me', icon: MapPin, count: eventCounts.nearMe, filterKey: 'near-me', action: () => handleQuickFilter('near-me') },
    { label: 'Popular', icon: Users, count: eventCounts.popular, filterKey: 'popular', action: () => handleQuickFilter('popular') },
    { label: 'Today', icon: Clock, count: eventCounts.today, filterKey: 'today', action: () => handleQuickFilter('today') },
    { label: 'Free Events', icon: Sparkles, count: eventCounts.free, filterKey: 'free', action: () => handleQuickFilter('free') },
  ];

  // Sort events based on selected sort option
  const sortEvents = (eventsToSort: any[], sortOption: string) => {
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

  // Update filtered events when events, filters, or URL params change
  useEffect(() => {
    if (!events) {
      setFilteredEvents([]);
      return;
    }

    const quickFilter = searchParams.get('quickFilter');
    const urlSortBy = searchParams.get('sort') || 'date';

    setSortBy(urlSortBy as 'date' | 'popularity' | 'name');

    let filtered = applyFilters(events, activeFilters, quickFilter || undefined);
    filtered = sortEvents(filtered, urlSortBy);

    setFilteredEvents(filtered);
  }, [events, activeFilters, searchParams]);

  const applyFilters = (events: any[], filters: EventFiltersType | null, quickFilterType?: string) => {
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

    // Apply advanced filters
    if (filters) {
      // Date range filter
      if (filters.dateRange) {
        const today = new Date();
        switch (filters.dateRange) {
          case 'today':
            filtered = filtered.filter(event => isToday(new Date(event.startDate)));
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filtered = filtered.filter(event =>
              new Date(event.startDate).toDateString() === tomorrow.toDateString()
            );
            break;
          case 'this-week':
            filtered = filtered.filter(event => isThisWeek(new Date(event.startDate)));
            break;
          case 'this-month':
            filtered = filtered.filter(event => {
              const eventDate = new Date(event.startDate);
              return eventDate.getMonth() === today.getMonth() &&
                eventDate.getFullYear() === today.getFullYear();
            });
            break;
        }
      }

      // Price range filter
      if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) {
        filtered = filtered.filter(event => {
          const price = event.isFree ? 0 : (event.price || 0);
          return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });
      }

      // Location filter
      if (filters.location && filters.location.length > 0) {
        filtered = filtered.filter(event =>
          filters.location.some(loc =>
            event.location?.toLowerCase().includes(loc.toLowerCase()) ||
            event.landmark?.toLowerCase().includes(loc.toLowerCase())
          )
        );
      }

      // Event type filter
      if (filters.eventType && filters.eventType.length > 0) {
        filtered = filtered.filter(event =>
          filters.eventType.some(type =>
            event.category?.name?.toLowerCase().includes(type.toLowerCase())
          )
        );
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(event =>
          event.tags && event.tags.some((tag: any) =>
            filters.tags.some(filterTag =>
              tag.name?.toLowerCase().includes(filterTag.toLowerCase())
            )
          )
        );
      }
    }

    return filtered;
  };

  const handleFiltersChange = (filters: EventFiltersType) => {
    setActiveFilters(filters);
    const filtered = applyFilters(events, filters);
    setFilteredEvents(filtered);
  };

  const handleQuickFilter = (filterType: string) => {
    const currentQuickFilter = searchParams.get('quickFilter');

    if (currentQuickFilter === filterType) {
      // Remove filter if already active
      const newUrl = removeKeysFromQuery({
        params: searchParams.toString(),
        keysToRemove: ['quickFilter'],
      });
      router.push(newUrl, { scroll: false });
    } else {
      // Apply new filter
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: 'quickFilter',
        value: filterType,
      });
      router.push(newUrl, { scroll: false });
    }
  };

  return (
    <section id="explore-events" className="py-12 bg-gray-50">
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
                  route="/explore-events"
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
                    const isActive = searchParams.get('quickFilter') === filter.filterKey;

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
                          params: searchParams.toString(),
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
                    Showing {filteredEvents.length} of {events.length} events
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
                currentUserId={currentUserId}
                emptyTitle="No events found"
                emptyStateSubtext="Try adjusting your filters or search terms"
                user={user}
              />
            </div>

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                page={page}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}