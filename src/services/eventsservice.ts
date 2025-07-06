import { EventData, EventCategory, Island } from '@/types';

interface EventSource {
  name: string;
  type: 'api' | 'scraper' | 'rss';
  url: string;
  enabled: boolean;
  apiKey?: string;
  categories: EventCategory[];
}

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description: { text: string };
  start: { utc: string; local: string };
  end: { utc: string; local: string };
  venue: {
    name: string;
    address: {
      localized_address_display: string;
      latitude: string;
      longitude: string;
    };
  };
  ticket_availability: {
    minimum_ticket_price: {
      major_value: number;
      currency: string;
    };
  };
  category_id: string;
  subcategory_id: string;
  logo: { url: string };
  url: string;
  organizer: { name: string };
}

interface FacebookEvent {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time?: string;
  place: {
    name: string;
    location: {
      latitude: number;
      longitude: number;
      street: string;
      city: string;
      state: string;
    };
  };
  ticket_uri?: string;
  cover: { source: string };
}

class EventsService {
  private static instance: EventsService;
  private readonly CACHE_TTL_MINUTES = 60; // Cache for 1 hour
  private cache = new Map<string, { data: EventData[]; timestamp: number }>();

  // Event sources configuration
  private readonly EVENT_SOURCES: EventSource[] = [
    {
      name: 'Eventbrite Hawaii',
      type: 'api',
      url: 'https://www.eventbriteapi.com/v3/events/search/',
      enabled: true,
      apiKey: process.env.EVENTBRITE_API_KEY,
      categories: ['music', 'food', 'art', 'outdoor', 'family', 'business', 'education']
    },
    {
      name: 'Facebook Events',
      type: 'api',
      url: 'https://graph.facebook.com/v18.0/',
      enabled: false, // Requires Facebook API approval
      apiKey: process.env.FACEBOOK_ACCESS_TOKEN,
      categories: ['music', 'food', 'culture', 'nightlife', 'art']
    },
    {
      name: 'Hawaii Tourism Authority',
      type: 'scraper',
      url: 'https://www.gohawaii.com/events',
      enabled: true,
      categories: ['culture', 'outdoor', 'family', 'music']
    },
    {
      name: 'Honolulu Magazine Events',
      type: 'scraper',
      url: 'https://www.honolulumagazine.com/events/',
      enabled: true,
      categories: ['food', 'nightlife', 'art', 'culture']
    }
  ];

  // Category mappings for different sources
  private readonly EVENTBRITE_CATEGORIES = {
    '103': 'music',
    '110': 'food',
    '105': 'art',
    '108': 'outdoor',
    '115': 'family',
    '101': 'business',
    '102': 'education'
  };

  // Island location detection keywords
  private readonly ISLAND_KEYWORDS = {
    oahu: ['honolulu', 'waikiki', 'pearl city', 'kaneohe', 'kailua', 'hawaii kai', 'wahiawa', 'laie', 'haleiwa', 'oahu'],
    maui: ['maui', 'lahaina', 'kihei', 'wailea', 'makawao', 'hana', 'kahului', 'paia', 'upcountry'],
    hawaii: ['big island', 'hilo', 'kona', 'waimea', 'volcano', 'pahoa', 'captain cook', 'naalehu', 'hawaii'],
    kauai: ['kauai', 'lihue', 'poipu', 'princeville', 'kapaa', 'hanapepe', 'waimea', 'hanalei'],
    molokai: ['molokai', 'kaunakakai', 'halawa'],
    lanai: ['lanai', 'lanai city']
  };

  public static getInstance(): EventsService {
    if (!EventsService.instance) {
      EventsService.instance = new EventsService();
    }
    return EventsService.instance;
  }

  async getEvents(
    island?: Island, 
    category?: EventCategory,
    daysAhead: number = 7,
    limit: number = 50
  ): Promise<EventData[]> {
    const cacheKey = `events-${island || 'all'}-${category || 'all'}-${daysAhead}-${limit}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MINUTES * 60 * 1000) {
      return cached.data;
    }

    try {
      // Fetch from all enabled sources
      const allEvents = await this.fetchFromAllSources(daysAhead);
      
      // Filter and sort events
      let filteredEvents = this.filterEvents(allEvents, island, category);
      
      // Sort by date and relevance
      filteredEvents.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });

      // Limit results
      const result = filteredEvents.slice(0, limit);
      
      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      
      // Return cached data if available
      const cached = this.cache.get(cacheKey);
      return cached ? cached.data : this.getFallbackEvents(island);
    }
  }

  private async fetchFromAllSources(daysAhead: number): Promise<EventData[]> {
    const sourcePromises = this.EVENT_SOURCES
      .filter(source => source.enabled)
      .map(source => this.fetchFromSource(source, daysAhead));

    const results = await Promise.allSettled(sourcePromises);
    
    // Flatten all events and remove duplicates
    const allEvents: EventData[] = [];
    const seenEvents = new Set<string>();

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        result.value.forEach(event => {
          const key = `${event.title}-${event.startDate}-${event.location.name}`;
          if (!seenEvents.has(key)) {
            seenEvents.add(key);
            allEvents.push(event);
          }
        });
      }
    });

    return allEvents;
  }

  private async fetchFromSource(source: EventSource, daysAhead: number): Promise<EventData[]> {
    try {
      switch (source.type) {
        case 'api':
          if (source.name === 'Eventbrite Hawaii') {
            return await this.fetchEventbriteEvents(source, daysAhead);
          } else if (source.name === 'Facebook Events') {
            return await this.fetchFacebookEvents(source, daysAhead);
          }
          break;
        case 'scraper':
          return await this.scrapeEvents(source, daysAhead);
        case 'rss':
          return await this.fetchRSSEvents(source, daysAhead);
      }
      return [];
    } catch (error) {
      console.error(`Failed to fetch from ${source.name}:`, error);
      return [];
    }
  }

  private async fetchEventbriteEvents(source: EventSource, daysAhead: number): Promise<EventData[]> {
    if (!source.apiKey) {
      console.warn('Eventbrite API key not configured');
      return [];
    }

    try {
      const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      const url = `${source.url}?location.address=Hawaii&start_date.range_start=${new Date().toISOString()}&start_date.range_end=${endDate.toISOString()}&expand=venue,organizer&token=${source.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseEventbriteEvents(data.events || []);
    } catch (error) {
      console.error('Eventbrite fetch error:', error);
      return [];
    }
  }

  private parseEventbriteEvents(events: EventbriteEvent[]): EventData[] {
    return events.map(event => {
      const island = this.detectIsland(event.venue?.name || '', event.venue?.address?.localized_address_display || '');
      const category = this.mapEventbriteCategory(event.category_id);

      return {
        id: `eventbrite-${event.id}`,
        title: event.name.text,
        description: event.description?.text || '',
        startDate: event.start.utc,
        endDate: event.end?.utc,
        location: {
          name: event.venue?.name || 'TBD',
          address: event.venue?.address?.localized_address_display || '',
          island,
          coordinates: event.venue?.address ? [
            parseFloat(event.venue.address.latitude),
            parseFloat(event.venue.address.longitude)
          ] : undefined
        },
        category,
        price: {
          free: !event.ticket_availability?.minimum_ticket_price,
          min: event.ticket_availability?.minimum_ticket_price?.major_value,
          currency: event.ticket_availability?.minimum_ticket_price?.currency || 'USD'
        },
        organizer: event.organizer?.name || 'Unknown',
        url: event.url,
        imageUrl: event.logo?.url,
        tags: [category, island]
      };
    });
  }

  private async fetchFacebookEvents(source: EventSource, daysAhead: number): Promise<EventData[]> {
    // Facebook Events API requires special permissions and is often restricted
    // This is a placeholder for the implementation
    console.warn('Facebook Events API not implemented - requires special permissions');
    return [];
  }

  private async scrapeEvents(source: EventSource, daysAhead: number): Promise<EventData[]> {
    try {
      // For scraping, we would use a web scraping service or library
      // This is a simplified mock implementation
      
      if (source.name === 'Hawaii Tourism Authority') {
        return await this.scrapeHTAEvents(daysAhead);
      } else if (source.name === 'Honolulu Magazine Events') {
        return await this.scrapeHonoluluMagEvents(daysAhead);
      }
      
      return [];
    } catch (error) {
      console.error(`Scraping error for ${source.name}:`, error);
      return [];
    }
  }

  private async scrapeHTAEvents(daysAhead: number): Promise<EventData[]> {
    // Mock HTA events - in production, this would scrape their events page
    const mockEvents: EventData[] = [
      {
        id: 'hta-1',
        title: 'Honolulu Festival',
        description: 'Annual celebration of Pacific Rim cultures featuring parades, performances, and cultural demonstrations.',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          name: 'Waikiki Beach Walk',
          address: 'Waikiki Beach Walk, Honolulu, HI',
          island: 'oahu'
        },
        category: 'culture',
        price: { free: true, currency: 'USD' },
        organizer: 'Honolulu Festival Foundation',
        url: 'https://www.honolulufestival.com',
        tags: ['culture', 'festival', 'free', 'family-friendly']
      }
    ];

    return mockEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      return eventDate <= cutoffDate;
    });
  }

  private async scrapeHonoluluMagEvents(daysAhead: number): Promise<EventData[]> {
    // Mock Honolulu Magazine events
    return [];
  }

  private async fetchRSSEvents(source: EventSource, daysAhead: number): Promise<EventData[]> {
    // RSS event feeds implementation
    return [];
  }

  private filterEvents(events: EventData[], island?: Island, category?: EventCategory): EventData[] {
    return events.filter(event => {
      // Filter by island
      if (island && event.location.island !== island) {
        return false;
      }

      // Filter by category
      if (category && event.category !== category) {
        return false;
      }

      // Filter out past events
      const eventDate = new Date(event.startDate);
      if (eventDate < new Date()) {
        return false;
      }

      return true;
    });
  }

  private detectIsland(venueName: string, address: string): Island {
    const text = (venueName + ' ' + address).toLowerCase();
    
    for (const [island, keywords] of Object.entries(this.ISLAND_KEYWORDS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return island as Island;
      }
    }
    
    // Default to Oahu if no match
    return 'oahu';
  }

  private mapEventbriteCategory(categoryId: string): EventCategory {
    return this.EVENTBRITE_CATEGORIES[categoryId as keyof typeof this.EVENTBRITE_CATEGORIES] || 'culture';
  }

  // Utility methods
  async getFeaturedEvents(limit: number = 6): Promise<EventData[]> {
    try {
      const allEvents = await this.getEvents(undefined, undefined, 14, 100);
      
      // Score events based on various factors
      const scoredEvents = allEvents.map(event => ({
        event,
        score: this.calculateEventScore(event)
      }));

      // Sort by score and return top events
      scoredEvents.sort((a, b) => b.score - a.score);
      
      return scoredEvents.slice(0, limit).map(item => item.event);
    } catch (error) {
      console.error('Failed to get featured events:', error);
      return [];
    }
  }

  private calculateEventScore(event: EventData): number {
    let score = 0;

    // Boost score for free events
    if (event.price.free) score += 2;

    // Boost score for certain categories
    if (['music', 'food', 'culture'].includes(event.category)) score += 1;

    // Boost score for events with images
    if (event.imageUrl) score += 1;

    // Boost score for weekend events
    const eventDate = new Date(event.startDate);
    const dayOfWeek = eventDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) score += 1; // Sunday or Saturday

    // Boost score for events in the next 3 days
    const hoursFromNow = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursFromNow <= 72) score += 2;

    return score;
  }

  async searchEvents(query: string, island?: Island): Promise<EventData[]> {
    try {
      const allEvents = await this.getEvents(island, undefined, 30, 200);
      const lowerQuery = query.toLowerCase();

      return allEvents.filter(event => {
        return event.title.toLowerCase().includes(lowerQuery) ||
               event.description.toLowerCase().includes(lowerQuery) ||
               event.location.name.toLowerCase().includes(lowerQuery) ||
               event.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      });
    } catch (error) {
      console.error('Failed to search events:', error);
      return [];
    }
  }

  private getFallbackEvents(island?: Island): EventData[] {
    // Return some default events when all sources fail
    const defaultEvents: EventData[] = [
      {
        id: 'default-1',
        title: 'Weekly Farmers Market',
        description: 'Fresh local produce, prepared foods, and artisan crafts from Hawaiian vendors.',
        startDate: this.getNextSaturday().toISOString(),
        location: {
          name: 'KCC Farmers Market',
          address: 'Kapiolani Community College, Honolulu',
          island: 'oahu'
        },
        category: 'food',
        price: { free: true, currency: 'USD' },
        organizer: 'KCC',
        tags: ['food', 'market', 'local', 'weekly']
      }
    ];

    return island ? defaultEvents.filter(event => event.location.island === island) : defaultEvents;
  }

  private getNextSaturday(): Date {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (daysUntilSaturday || 7));
    nextSaturday.setHours(8, 0, 0, 0); // 8 AM
    return nextSaturday;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const eventsService = EventsService.getInstance();