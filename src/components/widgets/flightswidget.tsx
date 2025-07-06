'use client';

import { useState, useEffect } from 'react';
import { 
  Plane, 
  Clock, 
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { FlightData, Airport } from '@/types';
import { formatTime, getRelativeTime } from '@/utils/time';

export default function FlightsWidget() {
  const [flightData, setFlightData] = useState<FlightData[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<string>('HNL');
  const [viewType, setViewType] = useState<'arrivals' | 'departures'>('arrivals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const airports: Airport[] = [
    { code: 'HNL', name: 'Honolulu International', island: 'oahu' },
    { code: 'OGG', name: 'Kahului Airport', island: 'maui' },
    { code: 'KOA', name: 'Kona International', island: 'hawaii' },
    { code: 'LIH', name: 'Lihue Airport', island: 'kauai' }
  ];

  useEffect(() => {
    fetchFlightData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchFlightData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedAirport]);

  const fetchFlightData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock flight data - in real implementation, this would call FlightAware or Aviationstack API
      const mockFlightData: FlightData[] = [
        {
          airport: airports.find(a => a.code === selectedAirport)!,
          arrivals: [
            {
              flightNumber: 'HA 125',
              airline: 'Hawaiian Airlines',
              origin: 'LAX',
              destination: selectedAirport,
              scheduledTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
              estimatedTime: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
              status: 'delayed',
              gate: 'A12',
              terminal: '1'
            },
            {
              flightNumber: 'AS 870',
              airline: 'Alaska Airlines',
              origin: 'SEA',
              destination: selectedAirport,
              scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              status: 'on-time',
              gate: 'B8',
              terminal: '1'
            },
            {
              flightNumber: 'UA 1205',
              airline: 'United Airlines',
              origin: 'SFO',
              destination: selectedAirport,
              scheduledTime: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
              status: 'on-time',
              gate: 'C4',
              terminal: '2'
            },
            {
              flightNumber: 'SW 1823',
              airline: 'Southwest Airlines',
              origin: 'PHX',
              destination: selectedAirport,
              scheduledTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
              status: 'boarding',
              gate: 'A15',
              terminal: '1'
            }
          ],
          departures: [
            {
              flightNumber: 'HA 124',
              airline: 'Hawaiian Airlines',
              origin: selectedAirport,
              destination: 'LAX',
              scheduledTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
              status: 'boarding',
              gate: 'A10',
              terminal: '1'
            },
            {
              flightNumber: 'DL 485',
              airline: 'Delta Airlines',
              origin: selectedAirport,
              destination: 'ATL',
              scheduledTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
              status: 'on-time',
              gate: 'B12',
              terminal: '1'
            },
            {
              flightNumber: 'HA 285',
              airline: 'Hawaiian Airlines',
              origin: selectedAirport,
              destination: 'NRT',
              scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              status: 'on-time',
              gate: 'C8',
              terminal: '2'
            }
          ],
          lastUpdated: new Date().toISOString()
        }
      ];

      setFlightData(mockFlightData);
    } catch (err) {
      setError('Failed to load flight data');
      console.error('Flight fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-time':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delayed':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'boarding':
        return <Plane className="w-4 h-4 text-blue-500" />;
      case 'departed':
        return <Plane className="w-4 h-4 text-gray-500" />;
      case 'arrived':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'text-green-700 bg-green-50';
      case 'delayed':
        return 'text-yellow-700 bg-yellow-50';
      case 'cancelled':
        return 'text-red-700 bg-red-50';
      case 'boarding':
        return 'text-blue-700 bg-blue-50';
      case 'departed':
        return 'text-gray-700 bg-gray-50';
      case 'arrived':
        return 'text-green-700 bg-green-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const currentAirportData = flightData.find(data => data.airport.code === selectedAirport);
  const flights = currentAirportData ? currentAirportData[viewType] : [];

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

  if (error) {
    return (
      <div className="widget-compact">
        <div className="text-center py-6">
          <Plane className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">{error}</p>
          <button onClick={fetchFlightData} className="text-xs text-blue-600 hover:text-blue-700">
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
          <Plane className="w-5 h-5 text-blue-500" />
          <h4 className="font-semibold text-gray-900">Flights</h4>
        </div>
        <button 
          onClick={fetchFlightData}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh flight data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Airport and View Selector */}
      <div className="space-y-2 mb-4">
        <select 
          value={selectedAirport}
          onChange={(e) => setSelectedAirport(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {airports.map((airport) => (
            <option key={airport.code} value={airport.code}>
              {airport.code} - {airport.name}
            </option>
          ))}
        </select>

        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('arrivals')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewType === 'arrivals'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Arrivals
          </button>
          <button
            onClick={() => setViewType('departures')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewType === 'departures'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Departures
          </button>
        </div>
      </div>

      {/* Flight List */}
      <div className="space-y-2">
        {flights.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No {viewType} scheduled</p>
          </div>
        ) : (
          flights.slice(0, 4).map((flight) => (
            <div key={flight.flightNumber} className="border border-gray-200 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900">
                    {flight.flightNumber}
                  </span>
                  <span className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(flight.status)}`}>
                    {getStatusIcon(flight.status)}
                    <span className="capitalize">{flight.status.replace('-', ' ')}</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {viewType === 'arrivals' ? `From ${flight.origin}` : `To ${flight.destination}`}
                    </span>
                  </div>
                  {flight.gate && (
                    <span className="text-gray-500">
                      Gate {flight.gate}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {formatTime(new Date(flight.scheduledTime), 'Pacific/Honolulu', 'h:mm a')}
                    </span>
                    {flight.estimatedTime && flight.estimatedTime !== flight.scheduledTime && (
                      <span className="text-yellow-600">
                        → {formatTime(new Date(flight.estimatedTime), 'Pacific/Honolulu', 'h:mm a')}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">
                    {flight.airline}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Data Attribution */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Flight data from FAA • Updated: {currentAirportData ? getRelativeTime(currentAirportData.lastUpdated) : 'Unknown'}
        </p>
      </div>
    </div>
  );
}