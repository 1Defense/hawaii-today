import { NextRequest, NextResponse } from 'next/server';
import { WeatherData, WeatherAlert, DailyForecast } from '@/types';

// NOAA Weather Service API integration
const NOAA_API_BASE = 'https://api.weather.gov';

// Coordinates for Hawaiian islands
const ISLAND_COORDINATES = {
  oahu: { lat: 21.4389, lon: -158.0001 },
  maui: { lat: 20.7984, lon: -156.3319 },
  hawaii: { lat: 19.5429, lon: -155.6659 },
  kauai: { lat: 22.0964, lon: -159.5261 },
  molokai: { lat: 21.1444, lon: -157.0226 },
  lanai: { lat: 20.7984, lon: -156.9292 }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const island = searchParams.get('island') || 'oahu';
    
    if (!ISLAND_COORDINATES[island as keyof typeof ISLAND_COORDINATES]) {
      return NextResponse.json(
        { error: 'Invalid island parameter' },
        { status: 400 }
      );
    }

    const coords = ISLAND_COORDINATES[island as keyof typeof ISLAND_COORDINATES];
    
    // Get weather data from NOAA
    const weatherData = await fetchNOAAWeather(coords.lat, coords.lon);
    
    return NextResponse.json({
      data: weatherData,
      success: true,
      lastUpdated: new Date().toISOString(),
      cached: false
    });

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        success: false,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function fetchNOAAWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    // Get grid points for location
    const gridResponse = await fetch(
      `${NOAA_API_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      {
        headers: {
          'User-Agent': 'HawaiiToday/1.0 (contact@hawaiitoday.com)'
        }
      }
    );

    if (!gridResponse.ok) {
      throw new Error(`NOAA grid API error: ${gridResponse.status}`);
    }

    const gridData = await gridResponse.json();
    const { gridId, gridX, gridY } = gridData.properties;

    // Get current conditions
    const currentResponse = await fetch(
      `${NOAA_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}`,
      {
        headers: {
          'User-Agent': 'HawaiiToday/1.0 (contact@hawaiitoday.com)'
        }
      }
    );

    // Get forecast
    const forecastResponse = await fetch(
      `${NOAA_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
      {
        headers: {
          'User-Agent': 'HawaiiToday/1.0 (contact@hawaiitoday.com)'
        }
      }
    );

    // Get alerts
    const alertsResponse = await fetch(
      `${NOAA_API_BASE}/alerts/active?point=${lat},${lon}`,
      {
        headers: {
          'User-Agent': 'HawaiiToday/1.0 (contact@hawaiitoday.com)'
        }
      }
    );

    const [currentData, forecastData, alertsData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json(),
      alertsResponse.json()
    ]);

    // Parse current conditions
    const current = parseCurrentConditions(currentData);
    
    // Parse forecast
    const forecast = parseForecast(forecastData);
    
    // Parse alerts
    const alerts = parseAlerts(alertsData);

    return {
      current,
      forecast,
      alerts,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('NOAA fetch error:', error);
    
    // Return fallback data if NOAA fails
    return getFallbackWeatherData();
  }
}

function parseCurrentConditions(data: any) {
  const properties = data.properties;
  
  // Extract current conditions from gridpoint data
  // NOAA provides detailed gridpoint data that needs to be processed
  const temperature = properties.temperature?.values?.[0]?.value || 25; // Celsius
  const tempF = Math.round((temperature * 9/5) + 32);
  
  return {
    temperature: tempF,
    feelsLike: tempF + 2, // Simplified calculation
    humidity: properties.relativeHumidity?.values?.[0]?.value || 70,
    windSpeed: Math.round((properties.windSpeed?.values?.[0]?.value || 5) * 2.237), // m/s to mph
    windDirection: getWindDirection(properties.windDirection?.values?.[0]?.value || 45),
    conditions: 'Partly Cloudy', // Would need additional processing
    icon: 'partly-cloudy',
    uvIndex: 8, // Would need UV data
    visibility: 10 // Would need visibility data
  };
}

function parseForecast(data: any): WeatherData['forecast'] {
  const periods = data.properties?.periods || [];
  
  const today = periods[0] ? {
    date: new Date().toISOString(),
    high: extractTemperature(periods[0].temperature, periods[0].temperatureUnit),
    low: periods[1] ? extractTemperature(periods[1].temperature, periods[1].temperatureUnit) : 70,
    conditions: periods[0].shortForecast || 'Partly Cloudy',
    icon: getWeatherIcon(periods[0].shortForecast),
    precipitationChance: extractPrecipChance(periods[0].detailedForecast),
    windSpeed: extractWindSpeed(periods[0].windSpeed),
    windDirection: extractWindDirection(periods[0].windDirection)
  } : getDefaultForecast();

  const tomorrow = periods[2] ? {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    high: extractTemperature(periods[2].temperature, periods[2].temperatureUnit),
    low: periods[3] ? extractTemperature(periods[3].temperature, periods[3].temperatureUnit) : 70,
    conditions: periods[2].shortForecast || 'Partly Cloudy',
    icon: getWeatherIcon(periods[2].shortForecast),
    precipitationChance: extractPrecipChance(periods[2].detailedForecast),
    windSpeed: extractWindSpeed(periods[2].windSpeed),
    windDirection: extractWindDirection(periods[2].windDirection)
  } : getDefaultForecast();

  const extended = periods.slice(4, 14).filter((_, i) => i % 2 === 0).map((period, index) => ({
    date: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000).toISOString(),
    high: extractTemperature(period.temperature, period.temperatureUnit),
    low: periods[5 + index * 2] ? extractTemperature(periods[5 + index * 2].temperature, periods[5 + index * 2].temperatureUnit) : 70,
    conditions: period.shortForecast || 'Partly Cloudy',
    icon: getWeatherIcon(period.shortForecast),
    precipitationChance: extractPrecipChance(period.detailedForecast),
    windSpeed: extractWindSpeed(period.windSpeed),
    windDirection: extractWindDirection(period.windDirection)
  }));

  return { today, tomorrow, extended };
}

function parseAlerts(data: any): WeatherAlert[] {
  const features = data.features || [];
  
  return features.map((feature: any) => {
    const props = feature.properties;
    return {
      id: props.id || '',
      title: props.headline || props.event || '',
      description: props.description || '',
      severity: mapAlertSeverity(props.severity),
      startTime: props.onset || new Date().toISOString(),
      endTime: props.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      areas: props.areaDesc ? [props.areaDesc] : []
    };
  });
}

// Helper functions
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function extractTemperature(temp: number, unit: string): number {
  if (unit === 'F') return temp;
  return Math.round((temp * 9/5) + 32); // Convert C to F
}

function extractPrecipChance(text: string): number {
  const match = text?.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 20;
}

function extractWindSpeed(windText: string): number {
  const match = windText?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 10;
}

function extractWindDirection(windText: string): string {
  const match = windText?.match(/([NSEW]+)/);
  return match ? match[1] : 'E';
}

function getWeatherIcon(conditions: string): string {
  const lower = conditions?.toLowerCase() || '';
  if (lower.includes('sunny') || lower.includes('clear')) return 'sunny';
  if (lower.includes('cloud')) return 'partly-cloudy';
  if (lower.includes('rain') || lower.includes('shower')) return 'rain';
  return 'partly-cloudy';
}

function mapAlertSeverity(severity: string): WeatherAlert['severity'] {
  switch (severity?.toLowerCase()) {
    case 'extreme': return 'extreme';
    case 'severe': return 'severe';
    case 'moderate': return 'moderate';
    default: return 'minor';
  }
}

function getDefaultForecast(): DailyForecast {
  return {
    date: new Date().toISOString(),
    high: 84,
    low: 74,
    conditions: 'Partly Cloudy',
    icon: 'partly-cloudy',
    precipitationChance: 20,
    windSpeed: 12,
    windDirection: 'NE'
  };
}

function getFallbackWeatherData(): WeatherData {
  return {
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
      today: getDefaultForecast(),
      tomorrow: {
        ...getDefaultForecast(),
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        high: 83,
        low: 73
      },
      extended: [
        {
          ...getDefaultForecast(),
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          high: 85,
          low: 75
        }
      ]
    },
    alerts: [],
    lastUpdated: new Date().toISOString()
  };
}