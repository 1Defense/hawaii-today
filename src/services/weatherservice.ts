import { WeatherData, WeatherAlert, DailyForecast, Island } from '@/types';

// Cache management
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, ttlMinutes: number = 15): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

class WeatherService {
  private static instance: WeatherService;
  private cache = new Cache<WeatherData>();
  private readonly NOAA_BASE_URL = 'https://api.weather.gov';
  private readonly USER_AGENT = 'HawaiiToday/1.0 (contact@hawaiitoday.com)';
  private readonly CACHE_TTL_MINUTES = 15;

  // Island coordinates for NOAA API
  private readonly ISLAND_COORDINATES = {
    oahu: { lat: 21.4389, lon: -158.0001, name: "O'ahu" },
    maui: { lat: 20.7984, lon: -156.3319, name: "Maui" },
    hawaii: { lat: 19.5429, lon: -155.6659, name: "Big Island" },
    kauai: { lat: 22.0964, lon: -159.5261, name: "Kaua'i" },
    molokai: { lat: 21.1444, lon: -157.0226, name: "Moloka'i" },
    lanai: { lat: 20.7984, lon: -156.9292, name: "Lāna'i" }
  };

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getWeatherData(island: Island): Promise<WeatherData> {
    const cacheKey = `weather-${island}`;
    
    // Check cache first
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const coords = this.ISLAND_COORDINATES[island];
      if (!coords) {
        throw new Error(`Invalid island: ${island}`);
      }

      const weatherData = await this.fetchNOAAWeather(coords.lat, coords.lon);
      
      // Cache the result
      this.cache.set(cacheKey, weatherData, this.CACHE_TTL_MINUTES);
      
      return weatherData;
    } catch (error) {
      console.error(`Failed to fetch weather for ${island}:`, error);
      
      // Return fallback data
      return this.getFallbackWeatherData(island);
    }
  }

  private async fetchNOAAWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      // Step 1: Get grid points for the location
      const gridData = await this.fetchWithTimeout(
        `${this.NOAA_BASE_URL}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { 'User-Agent': this.USER_AGENT } }
      );

      const { gridId, gridX, gridY } = gridData.properties;
      const forecastUrl = gridData.properties.forecast;
      const alertsUrl = `${this.NOAA_BASE_URL}/alerts/active?point=${lat},${lon}`;

      // Step 2: Fetch all data in parallel
      const [gridResponse, forecastResponse, alertsResponse] = await Promise.allSettled([
        this.fetchWithTimeout(`${this.NOAA_BASE_URL}/gridpoints/${gridId}/${gridX},${gridY}`, {
          headers: { 'User-Agent': this.USER_AGENT }
        }),
        this.fetchWithTimeout(forecastUrl, {
          headers: { 'User-Agent': this.USER_AGENT }
        }),
        this.fetchWithTimeout(alertsUrl, {
          headers: { 'User-Agent': this.USER_AGENT }
        })
      ]);

      // Process results
      const gridData_result = gridResponse.status === 'fulfilled' ? gridResponse.value : null;
      const forecastData = forecastResponse.status === 'fulfilled' ? forecastResponse.value : null;
      const alertsData = alertsResponse.status === 'fulfilled' ? alertsResponse.value : null;

      // Parse the data
      const current = gridData_result ? this.parseCurrentConditions(gridData_result) : this.getDefaultCurrent();
      const forecast = forecastData ? this.parseForecast(forecastData) : this.getDefaultForecast();
      const alerts = alertsData ? this.parseAlerts(alertsData) : [];

      return {
        current,
        forecast,
        alerts,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('NOAA API error:', error);
      throw error;
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseCurrentConditions(gridData: any): WeatherData['current'] {
    const props = gridData.properties;
    
    // Extract latest values from time series data
    const getLatestValue = (series: any[], defaultValue: number = 0) => {
      if (!series || !Array.isArray(series) || series.length === 0) return defaultValue;
      const latest = series[0];
      return latest?.value || defaultValue;
    };

    const temperatureC = getLatestValue(props.temperature?.values, 25);
    const temperature = Math.round((temperatureC * 9/5) + 32); // Convert to Fahrenheit
    
    const humidity = getLatestValue(props.relativeHumidity?.values, 70);
    const windSpeedMs = getLatestValue(props.windSpeed?.values, 5);
    const windSpeed = Math.round(windSpeedMs * 2.237); // Convert m/s to mph
    const windDirectionDegrees = getLatestValue(props.windDirection?.values, 45);
    
    return {
      temperature,
      feelsLike: this.calculateFeelsLike(temperature, humidity, windSpeed),
      humidity: Math.round(humidity),
      windSpeed,
      windDirection: this.degreesToCardinal(windDirectionDegrees),
      conditions: this.determineConditions(props),
      icon: this.getWeatherIcon(props),
      uvIndex: 8, // Would need additional data source
      visibility: 10 // Would need additional data source
    };
  }

  private parseForecast(forecastData: any): WeatherData['forecast'] {
    const periods = forecastData.properties?.periods || [];
    
    const today = this.parseForecastPeriod(periods[0], periods[1]);
    const tomorrow = this.parseForecastPeriod(periods[2], periods[3]);
    
    // Extended forecast (next 5 days)
    const extended: DailyForecast[] = [];
    for (let i = 4; i < Math.min(periods.length, 14); i += 2) {
      const dayPeriod = periods[i];
      const nightPeriod = periods[i + 1];
      if (dayPeriod) {
        extended.push(this.parseForecastPeriod(dayPeriod, nightPeriod));
      }
    }

    return { today, tomorrow, extended };
  }

  private parseForecastPeriod(dayPeriod: any, nightPeriod?: any): DailyForecast {
    if (!dayPeriod) return this.getDefaultForecastDay();

    const high = this.extractTemperature(dayPeriod.temperature, dayPeriod.temperatureUnit);
    const low = nightPeriod ? this.extractTemperature(nightPeriod.temperature, nightPeriod.temperatureUnit) : high - 10;

    return {
      date: dayPeriod.startTime || new Date().toISOString(),
      high: Math.max(high, low), // Ensure high is actually higher
      low: Math.min(high, low),   // Ensure low is actually lower
      conditions: dayPeriod.shortForecast || 'Partly Cloudy',
      icon: this.getIconFromForecast(dayPeriod.shortForecast),
      precipitationChance: this.extractPrecipitation(dayPeriod.detailedForecast),
      windSpeed: this.extractWindSpeed(dayPeriod.windSpeed),
      windDirection: this.extractWindDirection(dayPeriod.windDirection)
    };
  }

  private parseAlerts(alertsData: any): WeatherAlert[] {
    const features = alertsData.features || [];
    
    return features.map((feature: any) => {
      const props = feature.properties;
      return {
        id: props.id || Math.random().toString(36),
        title: props.headline || props.event || 'Weather Alert',
        description: props.description || '',
        severity: this.mapAlertSeverity(props.severity),
        startTime: props.onset || new Date().toISOString(),
        endTime: props.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        areas: props.areaDesc ? [props.areaDesc] : []
      };
    });
  }

  // Helper methods
  private calculateFeelsLike(temp: number, humidity: number, windSpeed: number): number {
    // Simplified heat index calculation
    if (temp >= 80) {
      const hi = -42.379 + 2.04901523 * temp + 10.14333127 * humidity 
        - 0.22475541 * temp * humidity - 0.00683783 * temp * temp
        - 0.05481717 * humidity * humidity + 0.00122874 * temp * temp * humidity
        + 0.00085282 * temp * humidity * humidity - 0.00000199 * temp * temp * humidity * humidity;
      return Math.round(hi);
    }
    
    // For cooler temperatures, factor in wind chill
    if (temp <= 50 && windSpeed > 3) {
      const wc = 35.74 + 0.6215 * temp - 35.75 * Math.pow(windSpeed, 0.16) + 0.4275 * temp * Math.pow(windSpeed, 0.16);
      return Math.round(wc);
    }
    
    return temp;
  }

  private degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  private determineConditions(props: any): string {
    // This would analyze multiple weather parameters to determine conditions
    // For now, return a default based on available data
    const cloudCover = props.skyCover?.values?.[0]?.value || 0;
    
    if (cloudCover < 25) return 'Sunny';
    if (cloudCover < 75) return 'Partly Cloudy';
    return 'Cloudy';
  }

  private getWeatherIcon(props: any): string {
    const conditions = this.determineConditions(props);
    return this.getIconFromForecast(conditions);
  }

  private getIconFromForecast(forecast: string): string {
    const lower = forecast?.toLowerCase() || '';
    if (lower.includes('sunny') || lower.includes('clear')) return 'sunny';
    if (lower.includes('rain') || lower.includes('shower')) return 'rain';
    if (lower.includes('cloud')) return 'partly-cloudy';
    if (lower.includes('storm')) return 'rain';
    return 'partly-cloudy';
  }

  private extractTemperature(temp: number, unit: string): number {
    if (unit === 'F') return temp;
    return Math.round((temp * 9/5) + 32); // Convert C to F
  }

  private extractPrecipitation(text: string): number {
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 20;
  }

  private extractWindSpeed(windText: string): number {
    const match = windText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
  }

  private extractWindDirection(windText: string): string {
    const match = windText?.match(/([NSEW]+)/);
    return match ? match[1] : 'E';
  }

  private mapAlertSeverity(severity: string): WeatherAlert['severity'] {
    switch (severity?.toLowerCase()) {
      case 'extreme': return 'extreme';
      case 'severe': return 'severe';
      case 'moderate': return 'moderate';
      default: return 'minor';
    }
  }

  // Default data methods
  private getDefaultCurrent(): WeatherData['current'] {
    return {
      temperature: 82,
      feelsLike: 86,
      humidity: 68,
      windSpeed: 12,
      windDirection: 'NE',
      conditions: 'Partly Cloudy',
      icon: 'partly-cloudy',
      uvIndex: 8,
      visibility: 10
    };
  }

  private getDefaultForecast(): WeatherData['forecast'] {
    const today = this.getDefaultForecastDay();
    const tomorrow = { ...today, date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), high: 83, low: 73 };
    const extended = [
      { ...today, date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), high: 85, low: 75 }
    ];

    return { today, tomorrow, extended };
  }

  private getDefaultForecastDay(): DailyForecast {
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

  private getFallbackWeatherData(island: Island): WeatherData {
    return {
      current: this.getDefaultCurrent(),
      forecast: this.getDefaultForecast(),
      alerts: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const weatherService = WeatherService.getInstance();