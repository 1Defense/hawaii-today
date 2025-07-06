'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Calendar,
  Info,
  RefreshCw,
  Shield,
  Eye
} from 'lucide-react';
import { JellyfishForecast, Island } from '@/types';
import { formatTime, getRelativeTime, getFriendlyDate } from '@/utils/time';

export default function JellyfishWidget() {
  const [forecasts, setForecasts] = useState<JellyfishForecast[]>([]);
  const [selectedIsland, setSelectedIsland] = useState<Island>('oahu');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJellyfishData();
    
    // Refresh every 6 hours
    const interval = setInterval(fetchJellyfishData, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchJellyfishData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock jellyfish data - in real implementation, this would scrape UH SOEST data
      const mockForecasts: JellyfishForecast[] = [
        {
          island: 'oahu',
          likelihood: 'medium',
          description: 'Box jellyfish may be present along south and west-facing beaches due to recent onshore winds. Peak activity expected 7-10 days after full moon.',
          affectedBeaches: ['Waikiki Beach', 'Ala Moana Beach', 'Sand Island', 'Keeaumoku'],
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          island: 'maui',
          likelihood: 'low',
          description: 'Low probability of box jellyfish. Offshore winds have been pushing jellyfish away from shore.',
          affectedBeaches: [],
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          island: 'hawaii',
          likelihood: 'low',
          description: 'Minimal jellyfish activity expected. Continue normal beach activities with standard precautions.',
          affectedBeaches: [],
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          island: 'kauai',
          likelihood: 'high',
          description: 'High probability of box jellyfish along popular swimming beaches. Recent moon phase and wind patterns favor jellyfish presence.',
          affectedBeaches: ['Poipu Beach', 'Lydgate Beach', 'Salt Pond Beach', 'Brenneckes Beach'],
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      setForecasts(mockForecasts);
    } catch (err) {
      setError('Failed to load jellyfish forecast');
      console.error('Jellyfish fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLikelihoodColor = (likelihood: JellyfishForecast['likelihood']) => {
    switch (likelihood) {
      case 'extreme':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLikelihoodIcon = (likelihood: JellyfishForecast['likelihood']) => {
    switch (likelihood) {
      case 'extreme':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Eye className="w-4 h-4" />;
      case 'low':
        return <Shield className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getEmoji = (likelihood: JellyfishForecast['likelihood']) => {
    switch (likelihood) {
      case 'extreme':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🟡';
      case 'low':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const currentForecast = forecasts.find(f => f.island === selectedIsland);

  if (loading) {
    return (
      <div className="widget-compact">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-compact">
        <div className="text-center py-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">{error}</p>
          <button onClick={fetchJellyfishData} className="text-xs text-blue-600 hover:text-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-compact">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🎐</span>
          <h4 className="font-semibold text-gray-900">Jellyfish Alert</h4>
        </div>
        <button 
          onClick={fetchJellyfishData}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh jellyfish data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Island Selector */}
      <div className="mb-3">
        <select 
          value={selectedIsland}
          onChange={(e) => setSelectedIsland(e.target.value as Island)}
          className="w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="oahu">O'ahu</option>
          <option value="maui">Maui</option>
          <option value="hawaii">Big Island</option>
          <option value="kauai">Kaua'i</option>
        </select>
      </div>

      {/* Current Forecast */}
      {currentForecast && (
        <div className="space-y-3">
          {/* Risk Level */}
          <div className={`rounded-lg p-3 border ${getLikelihoodColor(currentForecast.likelihood)}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getEmoji(currentForecast.likelihood)}</span>
              {getLikelihoodIcon(currentForecast.likelihood)}
              <span className="font-medium capitalize">
                {currentForecast.likelihood} Risk
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {currentForecast.description}
            </p>
          </div>

          {/* Affected Beaches */}
          {currentForecast.affectedBeaches.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Beaches to Watch</span>
              </h5>
              <div className="space-y-1">
                {currentForecast.affectedBeaches.map((beach, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>{beach}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Safety Tips</span>
            </h5>
            <div className="space-y-1 text-xs text-blue-700">
              <div>• Look for translucent box-shaped jellyfish</div>
              <div>• Stay out of water if jellyfish are present</div>
              <div>• If stung, remove tentacles with tweezers</div>
              <div>• Apply vinegar, then ice for pain relief</div>
              <div>• Seek medical attention for severe reactions</div>
            </div>
          </div>

          {/* Moon Phase Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm">🌙</span>
              <span className="text-sm font-medium text-gray-700">Moon Phase Alert</span>
            </div>
            <p className="text-xs text-gray-600">
              Box jellyfish typically arrive 7-10 days after the full moon. 
              Check lunar calendar and beach conditions before swimming.
            </p>
          </div>
        </div>
      )}

      {/* All Islands Summary */}
      <div className="mt-4 space-y-2">
        <h5 className="text-sm font-medium text-gray-700">All Islands</h5>
        <div className="grid grid-cols-2 gap-2">
          {forecasts.map((forecast) => (
            <div 
              key={forecast.island}
              className={`text-center p-2 rounded text-xs cursor-pointer transition-colors ${
                selectedIsland === forecast.island
                  ? 'ring-2 ring-blue-500 ring-opacity-50'
                  : ''
              } ${getLikelihoodColor(forecast.likelihood)}`}
              onClick={() => setSelectedIsland(forecast.island)}
            >
              <div className="font-medium capitalize">
                {forecast.island === 'hawaii' ? 'Big Island' : forecast.island}
              </div>
              <div className="text-xs mt-1 capitalize">
                {getEmoji(forecast.likelihood)} {forecast.likelihood}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-xs text-red-800">
          <div className="font-medium mb-1">Emergency Contact:</div>
          <div>Severe jellyfish sting: Call 911</div>
          <div>Poison Control: 1-800-222-1222</div>
        </div>
      </div>

      {/* Data Attribution */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Data from UH SOEST • Updated: {currentForecast ? getRelativeTime(currentForecast.lastUpdated) : 'Unknown'}
        </p>
      </div>
    </div>
  );
}