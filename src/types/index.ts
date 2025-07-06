// Core data types for Hawaii Today application

export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    conditions: string;
    icon: string;
    uvIndex: number;
    visibility: number;
  };
  forecast: {
    today: DailyForecast;
    tomorrow: DailyForecast;
    extended: DailyForecast[];
  };
  alerts: WeatherAlert[];
  lastUpdated: string;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  conditions: string;
  icon: string;
  precipitationChance: number;
  windSpeed: number;
  windDirection: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  startTime: string;
  endTime: string;
  areas: string[];
}

export interface SurfData {
  spots: SurfSpot[];
  tides: TideData[];
  lastUpdated: string;
}

export interface SurfSpot {
  id: string;
  name: string;
  location: {
    island: Island;
    coordinates: [number, number];
  };
  current: {
    waveHeight: {
      min: number;
      max: number;
      unit: 'ft' | 'm';
    };
    period: number;
    direction: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  forecast: SurfForecast[];
}

export interface SurfForecast {
  date: string;
  waveHeight: {
    min: number;
    max: number;
    unit: 'ft' | 'm';
  };
  period: number;
  direction: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface TideData {
  island: Island;
  tides: TideEvent[];
}

export interface TideEvent {
  time: string;
  type: 'high' | 'low';
  height: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  originalUrl: string;
  publisher: NewsPublisher;
  publishedAt: string;
  category: NewsCategory;
  imageUrl?: string;
  relevanceScore: number;
}

export interface NewsPublisher {
  name: string;
  logoUrl: string;
  domain: string;
}

export type NewsCategory = 
  | 'breaking'
  | 'local'
  | 'weather'
  | 'traffic'
  | 'business'
  | 'sports'
  | 'culture'
  | 'environment';

export interface EventData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address: string;
    island: Island;
    coordinates?: [number, number];
  };
  category: EventCategory;
  price: {
    free: boolean;
    min?: number;
    max?: number;
    currency: string;
  };
  organizer: string;
  url?: string;
  imageUrl?: string;
  tags: string[];
}

export type EventCategory =
  | 'music'
  | 'food'
  | 'culture'
  | 'outdoor'
  | 'family'
  | 'nightlife'
  | 'art'
  | 'sports'
  | 'business'
  | 'education';

export type Island = 
  | 'oahu'
  | 'maui'
  | 'hawaii'
  | 'kauai'
  | 'molokai'
  | 'lanai';

export interface TrafficData {
  cameras: TrafficCamera[];
  incidents: TrafficIncident[];
  driveTimeBestRoutes: Route[];
  lastUpdated: string;
}

export interface TrafficCamera {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  imageUrl: string;
  isActive: boolean;
}

export interface TrafficIncident {
  id: string;
  type: 'accident' | 'construction' | 'closure' | 'hazard';
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  startTime: string;
  estimatedClearTime?: string;
}

export interface Route {
  name: string;
  from: string;
  to: string;
  distance: number;
  normalDriveTime: number;
  currentDriveTime: number;
  status: 'clear' | 'slow' | 'heavy' | 'blocked';
}

export interface PowerOutage {
  id: string;
  area: string;
  customersAffected: number;
  startTime: string;
  estimatedRestoreTime?: string;
  cause?: string;
  island: Island;
  coordinates?: [number, number];
}

export interface FlightData {
  airport: Airport;
  arrivals: Flight[];
  departures: Flight[];
  lastUpdated: string;
}

export interface Airport {
  code: string;
  name: string;
  island: Island;
}

export interface Flight {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  scheduledTime: string;
  estimatedTime?: string;
  actualTime?: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived';
  gate?: string;
  terminal?: string;
}

export interface JellyfishForecast {
  island: Island;
  likelihood: 'low' | 'medium' | 'high' | 'extreme';
  description: string;
  affectedBeaches: string[];
  lastUpdated: string;
}

export interface ResidentWidget {
  id: string;
  title: string;
  data: any;
  lastUpdated: string;
  enabled: boolean;
}

export interface DashboardConfig {
  widgets: {
    weather: boolean;
    surf: boolean;
    news: boolean;
    events: boolean;
    traffic: boolean;
    flights: boolean;
    power: boolean;
    jellyfish: boolean;
    resident: boolean;
  };
  preferences: {
    island: Island;
    tempUnit: 'F' | 'C';
    waveUnit: 'ft' | 'm';
    timeFormat: '12h' | '24h';
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  lastUpdated: string;
  cached: boolean;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}