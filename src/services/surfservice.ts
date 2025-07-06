import { SurfData, SurfSpot, SurfForecast, TideData, TideEvent, Island } from '@/types';

interface SurflineSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  island: Island;
}

interface SurflineResponse {
  data: {
    wave: Array<{
      timestamp: number;
      surf: { min: number; max: number; plus: boolean };
      swells: Array<{
        height: number;
        period: number;
        direction: number;
        directionMin: number;
      }>;
    }>;
  };
  associated: {
    units: {
      waveHeight: string;
    };
  };
}

interface TideResponse {
  predictions: Array<{
    t: string; // ISO timestamp
    v: string; // height in feet
    type: 'H' | 'L'; // High or Low
  }>;
}

class SurfService {
  private static instance: SurfService;
  private readonly SURFLINE_BASE_URL = 'https://services.surfline.com/kbyg';
  private readonly NOAA_TIDES_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  private readonly CACHE_TTL_MINUTES = 30;
  private cache = new Map<string, { data: any; timestamp: number }>();

  // Surfline spot IDs for Hawaiian surf breaks
  private readonly SURF_SPOTS: SurflineSpot[] = [
    // O'ahu
    { id: '5842041f4e65fad6a7708876', name: 'Pipeline', lat: 21.6611, lon: -158.0525, island: 'oahu' },
    { id: '5842041f4e65fad6a7708884', name: 'Sunset Beach', lat: 21.6783, lon: -158.0408, island: 'oahu' },
    { id: '5842041f4e65fad6a7708888', name: 'Waikiki', lat: 21.2661, lon: -157.8222, island: 'oahu' },
    { id: '5842041f4e65fad6a770887c', name: 'Ala Moana Bowls', lat: 21.2905, lon: -157.8444, island: 'oahu' },
    { id: '5842041f4e65fad6a7708879', name: 'Diamond Head', lat: 21.2620, lon: -157.8151, island: 'oahu' },
    { id: '5842041f4e65fad6a770888b', name: 'Makaha', lat: 21.4692, lon: -158.2197, island: 'oahu' },
    
    // Maui
    { id: '5842041f4e65fad6a77088a2', name: 'Ho\'okipa', lat: 20.9333, lon: -156.3500, island: 'maui' },
    { id: '5842041f4e65fad6a77088a5', name: 'Honolua Bay', lat: 21.0158, lon: -156.6394, island: 'maui' },
    { id: '5842041f4e65fad6a77088a8', name: 'Lahaina', lat: 20.8783, lon: -156.6825, island: 'maui' },
    { id: '5842041f4e65fad6a77088ab', name: 'Kihei', lat: 20.7614, lon: -156.4497, island: 'maui' },
    
    // Big Island
    { id: '5842041f4e65fad6a77088ae', name: 'Banyan\'s', lat: 19.6197, lon: -155.9969, island: 'hawaii' },
    { id: '5842041f4e65fad6a77088b1', name: 'Lyman\'s', lat: 19.7297, lon: -155.0897, island: 'hawaii' },
    { id: '5842041f4e65fad6a77088b4', name: 'Honoli\'i', lat: 19.7736, lon: -155.0931, island: 'hawaii' },
    
    // Kaua'i
    { id: '5842041f4e65fad6a77088b7', name: 'Hanalei Bay', lat: 22.2097, lon: -159.4997, island: 'kauai' },
    { id: '5842041f4e65fad6a77088ba', name: 'Poipu', lat: 21.8744, lon: -159.4653, island: 'kauai' },
    { id: '5842041f4e65fad6a77088bd', name: 'Pakala', lat: 21.9189, lon: -159.6467, island: 'kauai' }
  ];

  // NOAA tide station IDs for Hawaiian islands
  private readonly TIDE_STATIONS = {
    oahu: '1612340', // Honolulu Harbor
    maui: '1615680', // Kahului Harbor
    hawaii: '1617760', // Hilo Bay
    kauai: '1611400', // Nawiliwili Bay
    molokai: '1612480', // Kaunakakai
    lanai: '1615680'  // Use Maui data for Lanai
  };

  public static getInstance(): SurfService {
    if (!SurfService.instance) {
      SurfService.instance = new SurfService();
    }
    return SurfService.instance;
  }

  async getSurfData(island: Island): Promise<SurfData> {
    const cacheKey = `surf-${island}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MINUTES * 60 * 1000) {
      return cached.data;
    }

    try {
      // Get spots for the island
      const islandSpots = this.SURF_SPOTS.filter(spot => spot.island === island);
      
      // Fetch surf data for all spots in parallel
      const spotPromises = islandSpots.map(spot => this.fetchSpotData(spot));
      const spotResults = await Promise.allSettled(spotPromises);
      
      // Process successful results
      const spots: SurfSpot[] = spotResults
        .filter((result): result is PromiseFulfilledResult<SurfSpot> => result.status === 'fulfilled')
        .map(result => result.value);

      // Fetch tide data
      const tides = await this.fetchTideData(island);

      const surfData: SurfData = {
        spots,
        tides,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: surfData, timestamp: Date.now() });
      
      return surfData;
    } catch (error) {
      console.error(`Failed to fetch surf data for ${island}:`, error);
      return this.getFallbackSurfData(island);
    }
  }

  private async fetchSpotData(spot: SurflineSpot): Promise<SurfSpot> {
    try {
      // Fetch wave forecast from Surfline
      const waveUrl = `${this.SURFLINE_BASE_URL}/spots/forecasts/wave?spotId=${spot.id}&days=5&intervalHours=1`;
      
      const response = await fetch(waveUrl, {
        headers: {
          'User-Agent': 'HawaiiToday/1.0',
        }
      });

      if (!response.ok) {
        throw new Error(`Surfline API error: ${response.status}`);
      }

      const data: SurflineResponse = await response.json();
      
      return this.parseSurflineData(spot, data);
    } catch (error) {
      console.error(`Failed to fetch data for ${spot.name}:`, error);
      return this.getFallbackSpotData(spot);
    }
  }

  private parseSurflineData(spot: SurflineSpot, data: SurflineResponse): SurfSpot {
    const waveData = data.data.wave || [];
    const currentWave = waveData[0];
    
    if (!currentWave) {
      return this.getFallbackSpotData(spot);
    }

    // Parse current conditions
    const current = {
      waveHeight: {
        min: currentWave.surf.min || 2,
        max: currentWave.surf.max || 4,
        unit: 'ft' as const
      },
      period: this.calculateAveragePeriod(currentWave.swells),
      direction: this.calculateDominantDirection(currentWave.swells),
      quality: this.assessWaveQuality(currentWave)
    };

    // Parse forecast
    const forecast: SurfForecast[] = waveData.slice(0, 120) // 5 days * 24 hours
      .filter((_, index) => index % 6 === 0) // Every 6 hours
      .map(wave => ({
        date: new Date(wave.timestamp * 1000).toISOString(),
        waveHeight: {
          min: wave.surf.min || 2,
          max: wave.surf.max || 4,
          unit: 'ft' as const
        },
        period: this.calculateAveragePeriod(wave.swells),
        direction: this.calculateDominantDirection(wave.swells),
        quality: this.assessWaveQuality(wave)
      }));

    return {
      id: spot.id,
      name: spot.name,
      location: {
        island: spot.island,
        coordinates: [spot.lat, spot.lon]
      },
      current,
      forecast
    };
  }

  private calculateAveragePeriod(swells: any[]): number {
    if (!swells || swells.length === 0) return 10;
    
    const totalPeriod = swells.reduce((sum, swell) => sum + (swell.period || 10), 0);
    return Math.round(totalPeriod / swells.length);
  }

  private calculateDominantDirection(swells: any[]): number {
    if (!swells || swells.length === 0) return 315; // NW default
    
    // Find the swell with the largest height
    const dominantSwell = swells.reduce((max, swell) => 
      (swell.height || 0) > (max.height || 0) ? swell : max, swells[0]);
    
    return dominantSwell.direction || 315;
  }

  private assessWaveQuality(wave: any): 'poor' | 'fair' | 'good' | 'excellent' {
    const height = Math.max(wave.surf.min || 0, wave.surf.max || 0);
    const hasSwells = wave.swells && wave.swells.length > 0;
    
    if (!hasSwells || height < 1) return 'poor';
    if (height < 3) return 'fair';
    if (height < 6) return 'good';
    return 'excellent';
  }

  private async fetchTideData(island: Island): Promise<TideData[]> {
    try {
      const stationId = this.TIDE_STATIONS[island];
      if (!stationId) {
        return [];
      }

      // Get predictions for the next 2 days
      const beginDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');

      const url = `${this.NOAA_TIDES_URL}?product=predictions&application=HawaiiToday&begin_date=${beginDate}&end_date=${endDate}&datum=MLLW&station=${stationId}&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`);
      }

      const data: TideResponse = await response.json();
      
      return this.parseTideData(island, data);
    } catch (error) {
      console.error(`Failed to fetch tide data for ${island}:`, error);
      return this.getFallbackTideData(island);
    }
  }

  private parseTideData(island: Island, data: TideResponse): TideData[] {
    if (!data.predictions || !Array.isArray(data.predictions)) {
      return this.getFallbackTideData(island);
    }

    const tides: TideEvent[] = data.predictions.map(pred => ({
      time: pred.t,
      type: pred.type === 'H' ? 'high' : 'low',
      height: parseFloat(pred.v)
    }));

    return [{
      island,
      tides
    }];
  }

  // Utility methods
  async getTopSurfSpots(island?: Island, limit: number = 5): Promise<SurfSpot[]> {
    try {
      const surfData = island ? 
        await this.getSurfData(island) : 
        await this.getAllIslandsSurfData();

      const allSpots = Array.isArray(surfData) ? 
        surfData.flatMap(data => data.spots) : 
        surfData.spots;

      // Sort by wave quality and height
      const sortedSpots = allSpots.sort((a, b) => {
        const qualityScore = (quality: string) => {
          switch (quality) {
            case 'excellent': return 4;
            case 'good': return 3;
            case 'fair': return 2;
            default: return 1;
          }
        };

        const scoreA = qualityScore(a.current.quality) + a.current.waveHeight.max;
        const scoreB = qualityScore(b.current.quality) + b.current.waveHeight.max;
        
        return scoreB - scoreA;
      });

      return sortedSpots.slice(0, limit);
    } catch (error) {
      console.error('Failed to get top surf spots:', error);
      return [];
    }
  }

  private async getAllIslandsSurfData(): Promise<SurfData[]> {
    const islands: Island[] = ['oahu', 'maui', 'hawaii', 'kauai'];
    const promises = islands.map(island => this.getSurfData(island));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<SurfData> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  async getNextTide(island: Island): Promise<TideEvent | null> {
    try {
      const surfData = await this.getSurfData(island);
      const tideData = surfData.tides.find(t => t.island === island);
      
      if (!tideData) return null;

      const now = new Date();
      const nextTide = tideData.tides.find(tide => new Date(tide.time) > now);
      
      return nextTide || null;
    } catch (error) {
      console.error(`Failed to get next tide for ${island}:`, error);
      return null;
    }
  }

  // Fallback data methods
  private getFallbackSpotData(spot: SurflineSpot): SurfSpot {
    return {
      id: spot.id,
      name: spot.name,
      location: {
        island: spot.island,
        coordinates: [spot.lat, spot.lon]
      },
      current: {
        waveHeight: { min: 2, max: 4, unit: 'ft' },
        period: 10,
        direction: 315,
        quality: 'fair'
      },
      forecast: [
        {
          date: new Date().toISOString(),
          waveHeight: { min: 2, max: 4, unit: 'ft' },
          period: 10,
          direction: 315,
          quality: 'fair'
        }
      ]
    };
  }

  private getFallbackSurfData(island: Island): SurfData {
    const spots = this.SURF_SPOTS
      .filter(spot => spot.island === island)
      .map(spot => this.getFallbackSpotData(spot));

    return {
      spots,
      tides: this.getFallbackTideData(island),
      lastUpdated: new Date().toISOString()
    };
  }

  private getFallbackTideData(island: Island): TideData[] {
    // Generate mock tide data for the next 24 hours
    const now = new Date();
    const tides: TideEvent[] = [];
    
    for (let i = 0; i < 8; i++) {
      const time = new Date(now.getTime() + i * 3 * 60 * 60 * 1000); // Every 3 hours
      tides.push({
        time: time.toISOString(),
        type: i % 2 === 0 ? 'high' : 'low',
        height: i % 2 === 0 ? 2.1 + Math.random() * 0.5 : 0.3 + Math.random() * 0.4
      });
    }

    return [{
      island,
      tides
    }];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const surfService = SurfService.getInstance();