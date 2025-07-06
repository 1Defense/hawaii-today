'use client';

import { useState, useEffect } from 'react';
import { 
  Thermometer,
  Waves,
  Wind,
  Car,
  Plane,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface QuickStat {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'alert' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
}

export default function QuickStats() {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      
      // Mock quick stats data - in real app, this would aggregate from various APIs
      const quickStats: QuickStat[] = [
        {
          id: 'temperature',
          label: 'Temperature',
          value: '82°F',
          subValue: 'Feels like 86°',
          icon: <Thermometer className="w-5 h-5" />,
          status: 'good',
          trend: 'stable'
        },
        {
          id: 'surf',
          label: 'Surf Height',
          value: '4-6 ft',
          subValue: 'North Shore',
          icon: <Waves className="w-5 h-5" />,
          status: 'good',
          trend: 'up'
        },
        {
          id: 'wind',
          label: 'Wind Speed',
          value: '12 mph',
          subValue: 'NE Trade Winds',
          icon: <Wind className="w-5 h-5" />,
          status: 'good',
          trend: 'stable'
        },
        {
          id: 'traffic',
          label: 'Traffic',
          value: 'Light',
          subValue: 'H1 Freeway',
          icon: <Car className="w-5 h-5" />,
          status: 'good',
          trend: 'stable'
        },
        {
          id: 'flights',
          label: 'Flight Delays',
          value: '2',
          subValue: 'HNL Airport',
          icon: <Plane className="w-5 h-5" />,
          status: 'warning',
          trend: 'down'
        },
        {
          id: 'power',
          label: 'Power Outages',
          value: '0',
          subValue: 'Statewide',
          icon: <Zap className="w-5 h-5" />,
          status: 'good',
          trend: 'stable'
        },
        {
          id: 'alerts',
          label: 'Weather Alerts',
          value: '1',
          subValue: 'High Surf Advisory',
          icon: <AlertTriangle className="w-5 h-5" />,
          status: 'warning',
          trend: 'stable'
        }
      ];

      setStats(quickStats);
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: QuickStat['status']) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'alert':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: QuickStat['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 animate-pulse">
            <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
      {stats.map((stat) => (
        <div 
          key={stat.id}
          className={`flex-shrink-0 transition-all hover:scale-105 cursor-pointer`}
        >
          <div className={`flex items-center space-x-3 bg-white rounded-lg p-3 border ${getStatusColor(stat.status)} hover:shadow-md transition-shadow`}>
            
            {/* Icon */}
            <div className={`p-2 rounded-lg ${stat.status === 'good' ? 'bg-green-100' : 
                                              stat.status === 'warning' ? 'bg-yellow-100' : 
                                              stat.status === 'alert' ? 'bg-red-100' : 'bg-gray-100'}`}>
              <div className={`${stat.status === 'good' ? 'text-green-600' : 
                               stat.status === 'warning' ? 'text-yellow-600' : 
                               stat.status === 'alert' ? 'text-red-600' : 'text-gray-600'}`}>
                {stat.icon}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-gray-900 text-sm">
                  {stat.value}
                </span>
                {getTrendIcon(stat.trend)}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {stat.label}
              </div>
              {stat.subValue && (
                <div className="text-xs text-gray-500">
                  {stat.subValue}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}