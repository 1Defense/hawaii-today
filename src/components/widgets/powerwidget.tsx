'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { PowerOutage, Island } from '@/types';
import { formatTime, getRelativeTime } from '@/utils/time';

export default function PowerWidget() {
  const [outages, setOutages] = useState<PowerOutage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchPowerData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchPowerData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPowerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock power outage data - in real implementation, this would call HECO API
      const mockOutages: PowerOutage[] = [
        // Currently no active outages for this demo
        // {
        //   id: 'outage-1',
        //   area: 'Kailua-Kona',
        //   customersAffected: 1250,
        //   startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        //   estimatedRestoreTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        //   cause: 'Equipment failure',
        //   island: 'hawaii',
        //   coordinates: [19.6400, -155.9969]
        // }
      ];

      setOutages(mockOutages);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load power outage data');
      console.error('Power fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAffectedCustomers = () => {
    return outages.reduce((total, outage) => total + outage.customersAffected, 0);
  };

  const getOutagesByIsland = () => {
    const byIsland: Record<Island, PowerOutage[]> = {
      oahu: [],
      maui: [],
      hawaii: [],
      kauai: [],
      molokai: [],
      lanai: []
    };

    outages.forEach(outage => {
      byIsland[outage.island].push(outage);
    });

    return byIsland;
  };

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
          <Zap className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">{error}</p>
          <button onClick={fetchPowerData} className="text-xs text-blue-600 hover:text-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const outagesByIsland = getOutagesByIsland();
  const totalAffected = getTotalAffectedCustomers();

  return (
    <div className="widget-compact">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h4 className="font-semibold text-gray-900">Power Status</h4>
        </div>
        <button 
          onClick={fetchPowerData}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh power data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg p-3 mb-3 ${
        outages.length === 0 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          {outages.length === 0 ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">All Systems Normal</div>
                <div className="text-sm text-green-600">No active power outages reported</div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800">
                  {outages.length} Active Outage{outages.length > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-red-600">
                  {totalAffected.toLocaleString()} customers affected
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Outages */}
      {outages.length > 0 && (
        <div className="space-y-2 mb-3">
          {outages.map((outage) => (
            <div key={outage.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-800">{outage.area}</span>
                    </div>
                    <div className="text-sm text-red-600 capitalize mt-1">
                      {outage.island} Island
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-800">
                        {outage.customersAffected.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-red-600">affected</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-xs text-red-600">
                    <Clock className="w-3 h-3" />
                    <span>Started: {getRelativeTime(outage.startTime)}</span>
                  </div>
                  
                  {outage.estimatedRestoreTime && (
                    <div className="flex items-center space-x-1 text-xs text-red-600">
                      <Clock className="w-3 h-3" />
                      <span>
                        Est. restore: {formatTime(new Date(outage.estimatedRestoreTime), 'Pacific/Honolulu', 'h:mm a')}
                      </span>
                    </div>
                  )}
                  
                  {outage.cause && (
                    <div className="text-xs text-red-600">
                      Cause: {outage.cause}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Island Status Summary */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">By Island</h5>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(outagesByIsland).map(([island, islandOutages]) => (
            <div 
              key={island}
              className={`text-center p-2 rounded text-xs ${
                islandOutages.length === 0
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <div className="font-medium capitalize">
                {island === 'hawaii' ? 'Big Island' : island}
              </div>
              <div className="text-xs mt-1">
                {islandOutages.length === 0 ? (
                  <span>✓ Normal</span>
                ) : (
                  <span>
                    {islandOutages.length} outage{islandOutages.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Info */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800">
          <div className="font-medium mb-1">Report Power Outage:</div>
          <div>Call Hawaiian Electric: 1-855-304-1212</div>
          <div>Or visit: hawaiianelectric.com/outages</div>
        </div>
      </div>

      {/* Data Attribution */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Data from Hawaiian Electric • Updated: {getRelativeTime(lastUpdate)}
        </p>
      </div>
    </div>
  );
}