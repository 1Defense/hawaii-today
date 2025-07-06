'use client';

import { useState, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  Waves, 
  Wind,
  MapPin,
  Calendar,
  Thermometer
} from 'lucide-react';
import { getTimeOfDay, formatTime, getHawaiiTime } from '@/utils/time';

interface HeroBannerProps {
  selectedIsland?: string;
}

export default function HeroBanner({ selectedIsland = 'oahu' }: HeroBannerProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeOfDay, setTimeOfDay] = useState<string>('morning');

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      const hawaiiTime = getHawaiiTime();
      setCurrentTime(hawaiiTime);
      setTimeOfDay(getTimeOfDay(hawaiiTime));
    }, 60000);

    // Set initial time
    const hawaiiTime = getHawaiiTime();
    setCurrentTime(hawaiiTime);
    setTimeOfDay(getTimeOfDay(hawaiiTime));

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Aloha';
  };

  const getTimeOfDayEmoji = () => {
    switch (timeOfDay) {
      case 'morning':
        return '🌅';
      case 'midday':
        return '☀️';
      case 'afternoon':
        return '🌤️';
      case 'evening':
        return '🌅';
      case 'night':
        return '🌙';
      default:
        return '🌺';
    }
  };

  const getBackgroundGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400';
      case 'midday':
        return 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600';
      case 'afternoon':
        return 'bg-gradient-to-r from-orange-400 via-red-400 to-pink-400';
      case 'evening':
        return 'bg-gradient-to-r from-purple-400 via-pink-400 to-red-400';
      case 'night':
        return 'bg-gradient-to-r from-gray-700 via-blue-800 to-indigo-900';
      default:
        return 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600';
    }
  };

  // Mock current conditions - in real app, this would come from props or context
  const currentConditions = {
    temperature: 82,
    conditions: 'Partly Cloudy',
    waveHeight: '4-6 ft',
    windSpeed: '12 mph'
  };

  const formatIslandName = (island: string) => {
    const names: Record<string, string> = {
      'oahu': 'O\'ahu',
      'maui': 'Maui',
      'hawaii': 'Big Island',
      'kauai': 'Kaua\'i',
      'molokai': 'Moloka\'i',
      'lanai': 'Lāna\'i'
    };
    return names[island] || island.charAt(0).toUpperCase() + island.slice(1);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background with time-based gradient */}
      <div className={`absolute inset-0 ${getBackgroundGradient()} opacity-10`}></div>
      
      {/* Main content */}
      <div className="relative card-hero">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          
          {/* Left side - Greeting and Info */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-3xl">{getTimeOfDayEmoji()}</span>
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900">
                  {getGreeting()}, Hawaii!
                </h1>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatTime(currentTime, 'Pacific/Honolulu', 'EEEE, MMMM d')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatIslandName(selectedIsland)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">
              Your real-time Hawaii dashboard is ready with the latest weather, surf conditions, 
              local news, and events. Everything you need to know about island life in one place.
            </p>

            {/* Current time display */}
            <div className="flex items-center space-x-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(currentTime, 'Pacific/Honolulu', 'h:mm a')}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Hawaii Standard Time
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Quick conditions */}
          <div className="mt-8 lg:mt-0 lg:ml-8">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Temperature */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Thermometer className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentConditions.temperature}°F
                </div>
                <div className="text-sm text-gray-600">
                  {currentConditions.conditions}
                </div>
              </div>

              {/* Surf */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Waves className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentConditions.waveHeight}
                </div>
                <div className="text-sm text-gray-600">
                  Wave Height
                </div>
              </div>

              {/* Wind */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wind className="w-6 h-6 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentConditions.windSpeed}
                </div>
                <div className="text-sm text-gray-600">
                  Wind Speed
                </div>
              </div>

              {/* Island Selector */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <select 
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-gray-900"
                  value={selectedIsland}
                  onChange={(e) => {
                    // In real app, this would trigger island change
                    console.log('Island changed to:', e.target.value);
                  }}
                >
                  <option value="oahu">O'ahu</option>
                  <option value="maui">Maui</option>
                  <option value="hawaii">Big Island</option>
                  <option value="kauai">Kaua'i</option>
                  <option value="molokai">Moloka'i</option>
                  <option value="lanai">Lāna'i</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  Select Island
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            
            {/* Quick navigation */}
            <div className="flex items-center space-x-6">
              <a 
                href="#weather" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm font-medium">Weather</span>
              </a>
              <a 
                href="#surf" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Waves className="w-4 h-4" />
                <span className="text-sm font-medium">Surf</span>
              </a>
              <a 
                href="#news" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-sm font-medium">News</span>
              </a>
              <a 
                href="#events" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Events</span>
              </a>
            </div>

            {/* Last updated */}
            <div className="text-xs text-gray-500">
              Last updated: {formatTime(currentTime, 'Pacific/Honolulu', 'h:mm a')} HST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}