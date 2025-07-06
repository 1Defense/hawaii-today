'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  Users,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Ticket,
  Music,
  Utensils,
  Camera,
  Waves
} from 'lucide-react';
import { EventData, EventCategory, Island } from '@/types';
import { formatTime, getFriendlyDate, formatTimeRange } from '@/utils/time';

interface EventsWidgetProps {
  selectedIsland?: Island;
  daysToShow?: number;
  maxEvents?: number;
}

export default function EventsWidget({ 
  selectedIsland = 'oahu', 
  daysToShow = 7,
  maxEvents = 12 
}: EventsWidgetProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventsData();
  }, [selectedIsland, daysToShow]);

  const fetchEventsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock events data - in real implementation, this would aggregate from multiple sources
      const mockEvents: EventData[] = [
        {
          id: 'event-1',
          title: 'First Friday Honolulu',
          description: 'Monthly art walk featuring local galleries, food trucks, and live entertainment in downtown Honolulu. Explore over 20 galleries and enjoy local craft vendors.',
          startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
          location: {
            name: 'Downtown Honolulu',
            address: 'Nuuanu Avenue & Hotel Street, Honolulu',
            island: 'oahu',
            coordinates: [21.3099, -157.8581]
          },
          category: 'art',
          price: { free: true, currency: 'USD' },
          organizer: 'Downtown Honolulu Association',
          url: 'https://www.firstfridayhonolulu.com',
          imageUrl: '/images/first-friday.jpg',
          tags: ['art', 'family-friendly', 'monthly']
        },
        {
          id: 'event-2',
          title: 'North Shore Food Truck Festival',
          description: 'Taste the best of Hawaii with over 30 food trucks serving everything from poke to malasadas. Live music and ocean views included.',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Sunset Beach Park',
            address: '59-104 Kamehameha Hwy, Haleiwa',
            island: 'oahu',
            coordinates: [21.6783, -158.0408]
          },
          category: 'food',
          price: { free: false, min: 5, max: 25, currency: 'USD' },
          organizer: 'North Shore Events',
          url: 'https://www.northshorefoodtrucks.com',
          imageUrl: '/images/food-trucks.jpg',
          tags: ['food', 'family-friendly', 'outdoor']
        },
        {
          id: 'event-3',
          title: 'Hawaiian Slack Key Guitar Concert',
          description: 'An intimate evening of traditional Hawaiian music featuring Grammy-winning slack key guitarists at the historic Kawaiahao Church.',
          startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Kawaiahao Church',
            address: '957 Punchbowl St, Honolulu',
            island: 'oahu',
            coordinates: [21.3045, -157.8593]
          },
          category: 'music',
          price: { free: false, min: 35, max: 75, currency: 'USD' },
          organizer: 'Hawaiian Music Society',
          url: 'https://www.hawaiianmusicsociety.org',
          imageUrl: '/images/slack-key.jpg',
          tags: ['music', 'cultural', 'indoor']
        },
        {
          id: 'event-4',
          title: 'Sunrise Yoga at Lanikai Beach',
          description: 'Start your day with beach yoga as the sun rises over the Mokulua Islands. All skill levels welcome. Mats provided.',
          startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Lanikai Beach',
            address: 'Lanikai Beach Access, Kailua',
            island: 'oahu',
            coordinates: [21.3933, -157.7197]
          },
          category: 'outdoor',
          price: { free: false, min: 20, max: 20, currency: 'USD' },
          organizer: 'Kailua Wellness Co.',
          url: 'https://www.kailuawellness.com',
          tags: ['yoga', 'beach', 'morning']
        },
        {
          id: 'event-5',
          title: 'Maui Ocean Center Night Tour',
          description: 'Experience the aquarium after hours with special lighting and marine biologist talks. See how ocean life behaves at night.',
          startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Maui Ocean Center',
            address: '192 Maalaea Rd, Wailuku',
            island: 'maui',
            coordinates: [20.7903, -156.5078]
          },
          category: 'family',
          price: { free: false, min: 45, max: 65, currency: 'USD' },
          organizer: 'Maui Ocean Center',
          url: 'https://www.mauioceancenter.com',
          tags: ['aquarium', 'educational', 'family']
        },
        {
          id: 'event-6',
          title: 'Big Island Volcano Night Walk',
          description: 'Guided night walk to view lava flows and volcanic activity at Hawaii Volcanoes National Park with certified guides.',
          startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Hawaii Volcanoes National Park',
            address: 'Crater Rim Dr, Hawaii National Park',
            island: 'hawaii',
            coordinates: [19.4194, -155.2885]
          },
          category: 'outdoor',
          price: { free: false, min: 125, max: 175, currency: 'USD' },
          organizer: 'Big Island Adventures',
          url: 'https://www.bigislandadventures.com',
          tags: ['volcano', 'guided-tour', 'adventure']
        }
      ];

      setEvents(mockEvents);
    } catch (err) {
      setError('Failed to load events');
      console.error('Events fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'music':
        return <Music className="w-4 h-4" />;
      case 'food':
        return <Utensils className="w-4 h-4" />;
      case 'art':
        return <Camera className="w-4 h-4" />;
      case 'outdoor':
        return <Waves className="w-4 h-4" />;
      case 'family':
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case 'music':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'food':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'art':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'outdoor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'family':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'culture':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'business':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories: Array<EventCategory | 'all'> = [
    'all', 'music', 'food', 'art', 'outdoor', 'family', 'culture', 'business'
  ];

  const filteredEvents = events
    .filter(event => selectedCategory === 'all' || event.category === selectedCategory)
    .filter(event => selectedIsland === 'all' || event.location.island === selectedIsland)
    .slice(0, maxEvents);

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = getFriendlyDate(event.startDate);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, EventData[]>);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Events Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchEventsData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-tropical-500" />
          <h3 className="text-xl font-display font-bold text-gray-900">
            Events This Week
          </h3>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                      selectedCategory === category
                        ? 'bg-tropical-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Events' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events by Date */}
      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No events found for your criteria.</p>
            <button 
              onClick={() => setSelectedCategory('all')}
              className="mt-2 text-tropical-600 hover:text-tropical-700 font-medium"
            >
              Show all events
            </button>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <span className="w-2 h-6 bg-gradient-to-b from-tropical-500 to-green-500 rounded-full"></span>
                <span>{date}</span>
                <span className="text-sm font-normal text-gray-500">
                  ({dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''})
                </span>
              </h4>
              
              <div className="space-y-3">
                {dateEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-tropical-300 hover:bg-tropical-50 transition-all"
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded-full border text-xs font-medium capitalize ${getCategoryColor(event.category)}`}>
                            {getCategoryIcon(event.category)}
                            <span className="ml-1">{event.category}</span>
                          </span>
                          {!event.price.free && (
                            <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded-full text-xs font-medium">
                              <DollarSign className="w-3 h-3 inline mr-1" />
                              {event.price.min === event.price.max 
                                ? `$${event.price.min}`
                                : `$${event.price.min}-${event.price.max}`
                              }
                            </span>
                          )}
                          {event.price.free && (
                            <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                              FREE
                            </span>
                          )}
                        </div>
                        <h5 className="font-semibold text-gray-900 leading-tight">
                          {event.title}
                        </h5>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTimeRange(event.startDate, event.endDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location.name}</span>
                      </div>
                    </div>

                    {/* Event Description */}
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Event Tags */}
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.tags.slice(0, 3).map((tag) => (
                          <span 
                            key={tag}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {event.tags.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            +{event.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Event Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        by {event.organizer}
                      </span>
                      
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-tropical-600 hover:text-tropical-700 text-sm font-medium transition-colors"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Details & Tickets</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View More */}
      {events.length > maxEvents && (
        <div className="mt-6 text-center">
          <button className="text-tropical-600 hover:text-tropical-700 font-medium">
            View All Events →
          </button>
        </div>
      )}

      {/* Data Attribution */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Events from Eventbrite, Facebook Events, and local partners • 
          Updated hourly
        </p>
      </div>
    </div>
  );
}