'use client';

import { useState, useEffect } from 'react';
import { 
  Home,
  School,
  DollarSign,
  Sun,
  Wind,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { ResidentWidget as ResidentWidgetData } from '@/types';
import { formatTime, getSunTimes, getHawaiiTime } from '@/utils/time';

interface LocalTool {
  id: string;
  title: string;
  icon: React.ReactNode;
  data: any;
  lastUpdated: string;
  enabled: boolean;
}

export default function ResidentWidget() {
  const [tools, setTools] = useState<LocalTool[]>([]);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set(['sunrise-sunset']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResidentData();
    
    // Refresh every hour
    const interval = setInterval(fetchResidentData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchResidentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hawaiiTime = getHawaiiTime();
      const sunTimes = getSunTimes(hawaiiTime);
      
      // Mock resident data - in real implementation, these would call various APIs/scrapers
      const mockTools: LocalTool[] = [
        {
          id: 'doe-lunch',
          title: 'DOE School Lunch Menu',
          icon: <School className="w-4 h-4" />,
          data: {
            today: {
              elementary: 'Chicken Katsu, Rice, Mixed Vegetables, Fresh Fruit',
              middle: 'Teriyaki Beef, Steamed Rice, Broccoli, Milk',
              high: 'Local Style Plate Lunch, Macaroni Salad, Fresh Pineapple'
            },
            tomorrow: {
              elementary: 'Fish Tacos, Brown Rice, Corn Salad, Orange Slices',
              middle: 'Spam Musubi, Edamame, Miso Soup, Apple',
              high: 'Hamburger Steak, Mashed Potatoes, Green Beans, Banana'
            }
          },
          lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          enabled: true
        },
        {
          id: 'costco-gas',
          title: 'Costco Gas Prices',
          icon: <DollarSign className="w-4 h-4" />,
          data: {
            locations: [
              { name: 'Kapolei', regular: 4.45, premium: 4.75, updated: '15 min ago' },
              { name: 'Iwilei', regular: 4.48, premium: 4.78, updated: '22 min ago' },
              { name: 'Waipio', regular: 4.46, premium: 4.76, updated: '18 min ago' }
            ],
            stateAverage: { regular: 4.89, premium: 5.19 }
          },
          lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          enabled: true
        },
        {
          id: 'sunrise-sunset',
          title: 'Sun Times',
          icon: <Sun className="w-4 h-4" />,
          data: {
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset,
            dayLength: Math.floor((sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / (1000 * 60 * 60 * 100)) / 100,
            moonPhase: 'Waxing Crescent (32%)'
          },
          lastUpdated: new Date().toISOString(),
          enabled: true
        },
        {
          id: 'air-quality',
          title: 'Air Quality Index',
          icon: <Wind className="w-4 h-4" />,
          data: {
            overall: { aqi: 42, level: 'Good', color: 'green' },
            locations: [
              { name: 'Honolulu', aqi: 38, level: 'Good' },
              { name: 'Pearl City', aqi: 45, level: 'Good' },
              { name: 'Kaneohe', aqi: 41, level: 'Good' },
              { name: 'Kapolei', aqi: 47, level: 'Good' }
            ],
            pollutants: {
              pm25: 12,
              pm10: 18,
              ozone: 35,
              no2: 15
            }
          },
          lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          enabled: true
        }
      ];

      setTools(mockTools);
    } catch (err) {
      setError('Failed to load resident tools');
      console.error('Resident tools fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (toolId: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
    }
    setExpandedTools(newExpanded);
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-700 bg-green-50 border-green-200';
    if (aqi <= 100) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (aqi <= 150) return 'text-orange-700 bg-orange-50 border-orange-200';
    if (aqi <= 200) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-purple-700 bg-purple-50 border-purple-200';
  };

  if (loading) {
    return (
      <div className="widget-compact">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <Home className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">{error}</p>
          <button onClick={fetchResidentData} className="text-xs text-blue-600 hover:text-blue-700">
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
          <Home className="w-5 h-5 text-purple-500" />
          <h4 className="font-semibold text-gray-900">Local Tools</h4>
        </div>
        <button 
          onClick={fetchResidentData}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tools List */}
      <div className="space-y-2">
        {tools.map((tool) => (
          <div key={tool.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Tool Header */}
            <button
              onClick={() => toggleTool(tool.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {tool.icon}
                <span className="font-medium text-gray-900 text-sm">{tool.title}</span>
              </div>
              {expandedTools.has(tool.id) ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Tool Content */}
            {expandedTools.has(tool.id) && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                {tool.id === 'doe-lunch' && (
                  <div className="space-y-3">
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Today's Menu</h6>
                      <div className="space-y-2">
                        <div className="text-xs">
                          <div className="font-medium">Elementary:</div>
                          <div className="text-gray-600">{tool.data.today.elementary}</div>
                        </div>
                        <div className="text-xs">
                          <div className="font-medium">Middle School:</div>
                          <div className="text-gray-600">{tool.data.today.middle}</div>
                        </div>
                        <div className="text-xs">
                          <div className="font-medium">High School:</div>
                          <div className="text-gray-600">{tool.data.today.high}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Tomorrow's Menu</h6>
                      <div className="space-y-2">
                        <div className="text-xs">
                          <div className="font-medium">Elementary:</div>
                          <div className="text-gray-600">{tool.data.tomorrow.elementary}</div>
                        </div>
                        <div className="text-xs">
                          <div className="font-medium">Middle School:</div>
                          <div className="text-gray-600">{tool.data.tomorrow.middle}</div>
                        </div>
                        <div className="text-xs">
                          <div className="font-medium">High School:</div>
                          <div className="text-gray-600">{tool.data.tomorrow.high}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tool.id === 'costco-gas' && (
                  <div className="space-y-3">
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Costco Locations</h6>
                      <div className="space-y-2">
                        {tool.data.locations.map((location: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <div>
                              <div className="font-medium">{location.name}</div>
                              <div className="text-gray-500">{location.updated}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${location.regular.toFixed(2)}</div>
                              <div className="text-gray-500">Premium: ${location.premium.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="text-xs text-gray-600">
                        <div>State Average - Regular: ${tool.data.stateAverage.regular.toFixed(2)}</div>
                        <div>State Average - Premium: ${tool.data.stateAverage.premium.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {tool.id === 'sunrise-sunset' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg">🌅</div>
                        <div className="text-sm font-medium">Sunrise</div>
                        <div className="text-xs text-gray-600">
                          {formatTime(tool.data.sunrise, 'Pacific/Honolulu', 'h:mm a')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg">🌇</div>
                        <div className="text-sm font-medium">Sunset</div>
                        <div className="text-xs text-gray-600">
                          {formatTime(tool.data.sunset, 'Pacific/Honolulu', 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2 text-xs text-gray-600 text-center">
                      <div>Day Length: {tool.data.dayLength} hours</div>
                      <div>Moon Phase: {tool.data.moonPhase}</div>
                    </div>
                  </div>
                )}

                {tool.id === 'air-quality' && (
                  <div className="space-y-3">
                    <div className={`text-center p-2 rounded border ${getAQIColor(tool.data.overall.aqi)}`}>
                      <div className="text-lg font-bold">{tool.data.overall.aqi}</div>
                      <div className="text-sm font-medium">{tool.data.overall.level}</div>
                      <div className="text-xs">Overall AQI</div>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">By Location</h6>
                      <div className="grid grid-cols-2 gap-2">
                        {tool.data.locations.map((location: any, index: number) => (
                          <div key={index} className="text-center text-xs">
                            <div className="font-medium">{location.name}</div>
                            <div className={`inline-block px-2 py-1 rounded mt-1 ${getAQIColor(location.aqi)}`}>
                              {location.aqi}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <h6 className="text-xs font-medium text-gray-700 mb-1">Pollutant Levels (μg/m³)</h6>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>PM2.5: {tool.data.pollutants.pm25}</div>
                        <div>PM10: {tool.data.pollutants.pm10}</div>
                        <div>Ozone: {tool.data.pollutants.ozone}</div>
                        <div>NO₂: {tool.data.pollutants.no2}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated: {formatTime(new Date(tool.lastUpdated), 'Pacific/Honolulu', 'h:mm a')}</span>
                    {(tool.id === 'doe-lunch' || tool.id === 'air-quality') && (
                      <ExternalLink className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Attribution */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Data from DOE, Hawaii DOH, GasBuddy • Updated hourly
        </p>
      </div>
    </div>
  );
}