'use client';

import { useState, useEffect } from 'react';
import { 
  Waves, 
  TrendingUp, 
  TrendingDown, 
  Wind, 
  Clock,
  Star,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';
import { SurfData, SurfSpot, TideData, Island } from '@/types';
import { formatTime } from '@/utils/time';

interface SurfWidgetProps {
  selectedIsland?: Island;
}

export default function SurfWidget({ selectedIsland = 'oahu' }: SurfWidgetProps) {
  const [surfData, setSurfData] = useState<SurfData | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSurfData();
  }, [selectedIsland]);

  const fetchSurfData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock surf data - in real implementation, this would call Surfline API
      const mockSurfData: SurfData = {
        spots: [
          {
            id: 'pipeline',
            name: 'Pipeline',
            location: {
              island: 'oahu',
              coordinates: [21.6611, -158.0525]
            },
            current: {
              waveHeight: { min: 4, max: 6, unit: 'ft' },
              period: 12,
              direction: 315,
              quality: 'excellent'
            },
            forecast: [
              {
                date: new Date().toISOString(),
                waveHeight: { min: 4, max: 6, unit: 'ft' },
                period: 12,
                direction: 315,
                quality: 'excellent'
              },
              {
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                waveHeight: { min: 3, max: 5, unit: 'ft' },
                period: 11,
                direction: 320,
                quality: 'good'
              }
            ]
          },
          {
            id: 'waikiki',
            name: 'Waikiki',
            location: {
              island: 'oahu',
              coordinates: [21.2661, -157.8222]
            },
            current: {
              waveHeight: { min: 2, max: 3, unit: 'ft' },
              period: 8,
              direction: 180,
              quality: 'good'
            },
            forecast: [
              {
                date: new Date().toISOString(),
                waveHeight: { min: 2, max: 3, unit: 'ft' },
                period: 8,
                direction: 180,
                quality: 'good'
              },
              {
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                waveHeight: { min: 2, max: 4, unit: 'ft' },
                period: 9,
                direction: 175,
                quality: 'good'
              }
            ]
          },
          {
            id: 'sunset',
            name: 'Sunset Beach',
            location: {
              island: 'oahu',
              coordinates: [21.6783, -158.0408]
            },
            current: {
              waveHeight: { min: 6, max: 8, unit: 'ft' },
              period: 14,
              direction: 310,
              quality: 'excellent'
            },
            forecast: [
              {
                date: new Date().toISOString(),
                waveHeight: { min: 6, max: 8, unit: 'ft' },
                period: 14,
                direction: 310,
                quality: 'excellent'
              },
              {
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                waveHeight: { min: 5, max: 7, unit: 'ft' },
                period: 13,
                direction: 315,
                quality: 'good'
              }
            ]
          }
        ],
        tides: [
          {
            island: 'oahu',
            tides: [
              { time: '2024-01-01T06:23:00Z', type: 'low', height: 0.2 },
              { time: '2024-01-01T12:45:00Z', type: 'high', height: 2.1 },
              { time: '2024-01-01T18:56:00Z', type: 'low', height: 0.4 },
              { time: '2024-01-02T01:12:00Z', type: 'high', height: 1.9 }
            ]
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      setSurfData(mockSurfData);
      
      // Set default selected spot to the first one with excellent quality, or first one
      const excellentSpot = mockSurfData.spots.find(spot => spot.current.quality === 'excellent');
      setSelectedSpot(excellentSpot?.id || mockSurfData.spots[0]?.id || '');
      
    } catch (err) {
      setError('Failed to load surf data');
      console.error('Surf fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-tropical-100 text-tropical-800 border-tropical-200';
      case 'good':
        return 'bg-ocean-100 text-ocean-800 border-ocean-200';
      case 'fair':
        return 'bg-sunset-100 text-sunset-800 border-sunset-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQualityStars = (quality: string) => {
    const stars = quality === 'excellent' ? 5 : 
                 quality === 'good' ? 4 : 
                 quality === 'fair' ? 3 : 2;
    
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getDirectionName = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getNextTide = (tides: TideData[]) => {
    const currentTime = new Date();
    const todayTides = tides.find(t => t.island === selectedIsland)?.tides || [];
    
    const nextTide = todayTides.find(tide => new Date(tide.time) > currentTime);
    return nextTide;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !surfData) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <Waves className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Surf Data Unavailable</h3>
          <p className="text-gray-600 mb-4">{error || 'Unable to load surf conditions'}</p>
          <button onClick={fetchSurfData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentSpot = surfData.spots.find(spot => spot.id === selectedSpot) || surfData.spots[0];
  const nextTide = getNextTide(surfData.tides);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Waves className="w-6 h-6 text-ocean-500" />
          <h3 className="text-xl font-display font-bold text-gray-900 capitalize">
            {selectedIsland} Surf Report
          </h3>
        </div>
        <button 
          onClick={fetchSurfData}
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh surf data"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">
            {formatTime(new Date(surfData.lastUpdated), 'Pacific/Honolulu')}
          </span>
        </button>
      </div>

      {/* Spot Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {surfData.spots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => setSelectedSpot(spot.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSpot === spot.id
                  ? 'bg-ocean-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {spot.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current Conditions for Selected Spot */}
      {currentSpot && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-ocean-50 to-blue-50 rounded-xl p-6 border border-ocean-100">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-ocean-500" />
                    <span>{currentSpot.name}</span>
                  </h4>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium mt-2 ${getQualityColor(currentSpot.current.quality)}`}>
                    <div className="flex items-center space-x-1">
                      {getQualityStars(currentSpot.current.quality)}
                    </div>
                    <span className="capitalize">{currentSpot.current.quality}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-ocean-600">
                      {currentSpot.current.waveHeight.min}-{currentSpot.current.waveHeight.max}
                      <span className="text-sm font-normal ml-1">{currentSpot.current.waveHeight.unit}</span>
                    </div>
                    <div className="text-sm text-gray-600">Wave Height</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {currentSpot.current.period}s
                    </div>
                    <div className="text-sm text-gray-600">Period</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-gray-900 flex items-center space-x-1">
                      <Wind className="w-4 h-4" />
                      <span>{getDirectionName(currentSpot.current.direction)}</span>
                    </div>
                    <div className="text-sm text-gray-600">Direction</div>
                  </div>

                  {nextTide && (
                    <div>
                      <div className="flex items-center space-x-1">
                        {nextTide.type === 'high' ? (
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-lg font-semibold text-gray-900">
                          {formatTime(new Date(nextTide.time), 'Pacific/Honolulu', 'h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Next {nextTide.type} tide
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl">🏄‍♂️</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Spots Summary */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
          <span>All Spots</span>
          <Info className="w-4 h-4 text-gray-400" />
        </h4>
        
        {surfData.spots.map((spot) => (
          <div 
            key={spot.id}
            className={`border rounded-lg p-4 transition-all cursor-pointer ${
              selectedSpot === spot.id 
                ? 'border-ocean-300 bg-ocean-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedSpot(spot.id)}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-gray-900">{spot.name}</h5>
                  <div className="flex items-center space-x-1">
                    {getQualityStars(spot.current.quality)}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {spot.current.waveHeight.min}-{spot.current.waveHeight.max}{spot.current.waveHeight.unit} • 
                  {spot.current.period}s • 
                  {getDirectionName(spot.current.direction)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-ocean-600">
                  {spot.current.waveHeight.max}{spot.current.waveHeight.unit}
                </div>
                <div className={`text-xs px-2 py-1 rounded capitalize ${getQualityColor(spot.current.quality)}`}>
                  {spot.current.quality}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tide Information */}
      {surfData.tides.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Today's Tides</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {surfData.tides.find(t => t.island === selectedIsland)?.tides.slice(0, 4).map((tide, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  {tide.type === 'high' ? (
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-sm font-medium capitalize">{tide.type}</span>
                </div>
                <div className="text-sm text-gray-900">
                  {formatTime(new Date(tide.time), 'Pacific/Honolulu', 'h:mm a')}
                </div>
                <div className="text-xs text-gray-600">
                  {tide.height.toFixed(1)} ft
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Attribution */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Surf data provided by Surfline • 
          Last updated: {formatTime(new Date(surfData.lastUpdated), 'Pacific/Honolulu')} HST
        </p>
      </div>
    </div>
  );
}