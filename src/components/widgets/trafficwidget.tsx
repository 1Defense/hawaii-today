'use client';

import { useState, useEffect } from 'react';
import { 
  Car, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Camera,
  RefreshCw,
  Navigation,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { TrafficData, TrafficCamera, TrafficIncident, Route } from '@/types';
import { formatTime, getRelativeTime } from '@/utils/time';

export default function TrafficWidget() {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrafficData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrafficData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrafficData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock traffic data - in real implementation, this would call GoAkamai and DOT APIs
      const mockTrafficData: TrafficData = {
        cameras: [
          {
            id: 'cam-h1-pearl-city',
            name: 'H-1 Pearl City',
            location: 'H-1 Freeway at Pearl City',
            coordinates: [21.3979, -157.9751],
            imageUrl: '/api/traffic/camera/h1-pearl-city.jpg',
            isActive: true
          },
          {
            id: 'cam-h1-kalihi',
            name: 'H-1 Kalihi',
            location: 'H-1 Freeway at Kalihi Street',
            coordinates: [21.3256, -157.8956],
            imageUrl: '/api/traffic/camera/h1-kalihi.jpg',
            isActive: true
          },
          {
            id: 'cam-h3-kaneohe',
            name: 'H-3 Kaneohe',
            location: 'H-3 Freeway at Kaneohe',
            coordinates: [21.4097, -157.7983],
            imageUrl: '/api/traffic/camera/h3-kaneohe.jpg',
            isActive: false
          },
          {
            id: 'cam-pali-highway',
            name: 'Pali Highway',
            location: 'Pali Highway at Nuuanu',
            coordinates: [21.3262, -157.8442],
            imageUrl: '/api/traffic/camera/pali-highway.jpg',
            isActive: true
          }
        ],
        incidents: [
          {
            id: 'incident-1',
            type: 'construction',
            location: 'H-1 Westbound near Stadium',
            description: 'Lane closure for roadwork, expect delays',
            severity: 'medium',
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            estimatedClearTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'incident-2',
            type: 'accident',
            location: 'Kalanianaole Highway near Hawaii Kai',
            description: 'Minor fender-bender blocking right lane',
            severity: 'low',
            startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            estimatedClearTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          }
        ],
        driveTimeBestRoutes: [
          {
            name: 'Airport to Waikiki',
            from: 'HNL Airport',
            to: 'Waikiki Beach',
            distance: 8.5,
            normalDriveTime: 18,
            currentDriveTime: 22,
            status: 'slow'
          },
          {
            name: 'Downtown to Pearl Harbor',
            from: 'Downtown Honolulu',
            to: 'Pearl Harbor',
            distance: 12.2,
            normalDriveTime: 25,
            currentDriveTime: 25,
            status: 'clear'
          },
          {
            name: 'Kaneohe to Honolulu',
            from: 'Kaneohe',
            to: 'Downtown Honolulu',
            distance: 15.8,
            normalDriveTime: 35,
            currentDriveTime: 42,
            status: 'slow'
          },
          {
            name: 'North Shore to Honolulu',
            from: 'Haleiwa',
            to: 'Downtown Honolulu',
            distance: 28.5,
            normalDriveTime: 50,
            currentDriveTime: 48,
            status: 'clear'
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      setTrafficData(mockTrafficData);
      
      // Set default camera to the first active one
      const firstActiveCamera = mockTrafficData.cameras.find(cam => cam.isActive);
      if (firstActiveCamera) {
        setSelectedCamera(firstActiveCamera.id);
      }
      
    } catch (err) {
      setError('Failed to load traffic data');
      console.error('Traffic fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIncidentIcon = (type: TrafficIncident['type']) => {
    switch (type) {
      case 'accident':
        return <Car className="w-4 h-4 text-red-500" />;
      case 'construction':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'closure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getIncidentColor = (severity: TrafficIncident['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRouteStatusColor = (status: Route['status']) => {
    switch (status) {
      case 'clear':
        return 'text-green-600 bg-green-50';
      case 'slow':
        return 'text-yellow-600 bg-yellow-50';
      case 'heavy':
        return 'text-red-600 bg-red-50';
      case 'blocked':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRouteStatusIcon = (status: Route['status']) => {
    switch (status) {
      case 'clear':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'slow':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'heavy':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Car className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="widget-compact">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trafficData) {
    return (
      <div className="widget-compact">
        <div className="text-center py-6">
          <Car className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">{error || 'Traffic data unavailable'}</p>
          <button onClick={fetchTrafficData} className="text-xs text-blue-600 hover:text-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-compact">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Car className="w-5 h-5 text-blue-500" />
          <h4 className="font-semibold text-gray-900">Traffic</h4>
        </div>
        <button 
          onClick={fetchTrafficData}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh traffic data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Popular Routes */}
      <div className="space-y-3 mb-4">
        <h5 className="text-sm font-medium text-gray-700">Drive Times</h5>
        {trafficData.driveTimeBestRoutes.slice(0, 3).map((route) => (
          <div key={route.name} className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="text-sm font-medium text-gray-900">
                {route.from} → {route.to}
              </div>
              <div className="text-xs text-gray-600">
                {route.distance} mi • Usually {route.normalDriveTime} min
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getRouteStatusColor(route.status)}`}>
              {getRouteStatusIcon(route.status)}
              <span>{route.currentDriveTime} min</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Incidents */}
      {trafficData.incidents.length > 0 && (
        <div className="space-y-2 mb-4">
          <h5 className="text-sm font-medium text-gray-700">Active Incidents</h5>
          {trafficData.incidents.map((incident) => (
            <div 
              key={incident.id}
              className={`p-2 rounded border text-xs ${getIncidentColor(incident.severity)}`}
            >
              <div className="flex items-start space-x-2">
                {getIncidentIcon(incident.type)}
                <div className="flex-1">
                  <div className="font-medium capitalize">{incident.type}</div>
                  <div className="text-xs opacity-90 mt-1">{incident.description}</div>
                  <div className="text-xs opacity-75 mt-1">
                    📍 {incident.location}
                  </div>
                  {incident.estimatedClearTime && (
                    <div className="text-xs opacity-75 mt-1">
                      Est. clear: {formatTime(new Date(incident.estimatedClearTime), 'Pacific/Honolulu', 'h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Traffic Cameras */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
          <Camera className="w-4 h-4" />
          <span>Live Cameras</span>
        </h5>
        
        {/* Camera selector */}
        <select 
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {trafficData.cameras.map((camera) => (
            <option key={camera.id} value={camera.id} disabled={!camera.isActive}>
              {camera.name} {!camera.isActive ? '(Offline)' : ''}
            </option>
          ))}
        </select>

        {/* Camera feed */}
        {selectedCamera && (
          <div className="relative">
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              {trafficData.cameras.find(cam => cam.id === selectedCamera)?.isActive ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Live Camera Feed</p>
                    <p className="text-xs text-gray-400">
                      {trafficData.cameras.find(cam => cam.id === selectedCamera)?.location}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Camera Offline</p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Live
            </div>
          </div>
        )}
      </div>

      {/* Data Attribution */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Data from Hawaii DOT • Updated: {getRelativeTime(trafficData.lastUpdated)}
        </p>
      </div>
    </div>
  );
}