'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Eye, 
  Thermometer,
  AlertTriangle,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { WeatherData, DailyForecast, WeatherAlert } from '@/types';
import { formatTime } from '@/utils/time';

interface WeatherWidgetProps {
  selectedIsland?: string;
}

export default function WeatherWidget({ selectedIsland = 'oahu' }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchWeatherData();
  }, [selectedIsland]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call the NOAA API
      // For now, using mock data
      const mockWeatherData: WeatherData = {
        current: {
          temperature: 82,
          feelsLike: 86,
          humidity: 68,
          windSpeed: 12,
          windDirection: 'NE',
          conditions: 'Partly Cloudy',
          icon: 'partly-cloudy',
          uvIndex: 8,
          visibility: 10
        },
        forecast: {
          today: {
            date: new Date().toISOString(),
            high: 84,
            low: 74,
            conditions: 'Partly Cloudy',
            icon: 'partly-cloudy',
            precipitationChance: 20,
            windSpeed: 12,
            windDirection: 'NE'
          },
          tomorrow: {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            high: 83,
            low: 73,
            conditions: 'Mostly Sunny',
            icon: 'sunny',
            precipitationChance: 10,
            windSpeed: 10,
            windDirection: 'E'
          },
          extended: [
            {
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              high: 85,
              low: 75,
              conditions: 'Partly Cloudy',
              icon: 'partly-cloudy',
              precipitationChance: 30,
              windSpeed: 14,
              windDirection: 'NE'
            },
            {
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              high: 81,
              low: 72,
              conditions: 'Light Showers',
              icon: 'rain',
              precipitationChance: 60,
              windSpeed: 16,
              windDirection: 'NE'
            },
            {
              date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
              high: 83,
              low: 74,
              conditions: 'Mostly Sunny',
              icon: 'sunny',
              precipitationChance: 15,
              windSpeed: 11,
              windDirection: 'E'
            }
          ]
        },
        alerts: [
          {
            id: 'alert-1',
            title: 'High Surf Advisory',
            description: 'North and west facing shores may experience surf heights of 8-12 feet.',
            severity: 'moderate',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            areas: ['North Shore', 'West Side']
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      setWeatherData(mockWeatherData);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconType: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
    const iconClass = `${sizeClass} text-ocean-500`;

    switch (iconType) {
      case 'sunny':
        return <Sun className={iconClass} />;
      case 'partly-cloudy':
        return <Cloud className={iconClass} />;
      case 'rain':
        return <CloudRain className={iconClass} />;
      default:
        return <Sun className={iconClass} />;
    }
  };

  const getAlertColor = (severity: WeatherAlert['severity']) => {
    switch (severity) {
      case 'extreme':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'severe':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather Unavailable</h3>
          <p className="text-gray-600 mb-4">{error || 'Unable to load weather data'}</p>
          <button 
            onClick={fetchWeatherData}
            className="btn-primary"
          >
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
          <MapPin className="w-5 h-5 text-gray-500" />
          <h3 className="text-xl font-display font-bold text-gray-900 capitalize">
            {selectedIsland} Weather
          </h3>
        </div>
        <button 
          onClick={fetchWeatherData}
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh weather data"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">
            {formatTime(lastRefresh, 'Pacific/Honolulu')}
          </span>
        </button>
      </div>

      {/* Weather Alerts */}
      {weatherData.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {weatherData.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-sm mt-1">{alert.description}</p>
                  <p className="text-xs mt-1 opacity-75">
                    Areas: {alert.areas.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Temperature & Conditions */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
            {getWeatherIcon(weatherData.current.icon, 'lg')}
            <div>
              <div className="text-4xl font-bold text-gray-900">
                {weatherData.current.temperature}°F
              </div>
              <div className="text-sm text-gray-600">
                Feels like {weatherData.current.feelsLike}°F
              </div>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            {weatherData.current.conditions}
          </p>
          <div className="text-sm text-gray-600">
            Today: {weatherData.forecast.today.high}° / {weatherData.forecast.today.low}°
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Wind className="w-5 h-5 text-ocean-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {weatherData.current.windSpeed} mph
              </div>
              <div className="text-xs text-gray-600">
                {weatherData.current.windDirection}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-ocean-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {weatherData.current.humidity}%
              </div>
              <div className="text-xs text-gray-600">Humidity</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-ocean-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {weatherData.current.visibility} mi
              </div>
              <div className="text-xs text-gray-600">Visibility</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-sunset-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                UV {weatherData.current.uvIndex}
              </div>
              <div className="text-xs text-gray-600">
                {weatherData.current.uvIndex >= 8 ? 'Very High' : 
                 weatherData.current.uvIndex >= 6 ? 'High' : 
                 weatherData.current.uvIndex >= 3 ? 'Moderate' : 'Low'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extended Forecast */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">5-Day Forecast</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Today */}
          <div className="bg-ocean-50 rounded-lg p-3 border border-ocean-100">
            <div className="text-center">
              <div className="text-sm font-medium text-ocean-700 mb-1">Today</div>
              {getWeatherIcon(weatherData.forecast.today.icon, 'sm')}
              <div className="mt-2">
                <div className="text-sm font-semibold text-gray-900">
                  {weatherData.forecast.today.high}°
                </div>
                <div className="text-xs text-gray-600">
                  {weatherData.forecast.today.low}°
                </div>
              </div>
              <div className="text-xs text-ocean-600 mt-1">
                {weatherData.forecast.today.precipitationChance}% rain
              </div>
            </div>
          </div>

          {/* Tomorrow */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-1">Tomorrow</div>
              {getWeatherIcon(weatherData.forecast.tomorrow.icon, 'sm')}
              <div className="mt-2">
                <div className="text-sm font-semibold text-gray-900">
                  {weatherData.forecast.tomorrow.high}°
                </div>
                <div className="text-xs text-gray-600">
                  {weatherData.forecast.tomorrow.low}°
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {weatherData.forecast.tomorrow.precipitationChance}% rain
              </div>
            </div>
          </div>

          {/* Extended Days */}
          {weatherData.forecast.extended.map((day, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    timeZone: 'Pacific/Honolulu'
                  })}
                </div>
                {getWeatherIcon(day.icon, 'sm')}
                <div className="mt-2">
                  <div className="text-sm font-semibold text-gray-900">{day.high}°</div>
                  <div className="text-xs text-gray-600">{day.low}°</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {day.precipitationChance}% rain
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Source Attribution */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Data provided by NOAA National Weather Service • 
          Last updated: {formatTime(new Date(weatherData.lastUpdated), 'Pacific/Honolulu')} HST
        </p>
      </div>
    </div>
  );
}