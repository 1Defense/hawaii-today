import { NextRequest, NextResponse } from 'next/server';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: ServiceStatus[];
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    performance: {
      ttfb: number; // Time to first byte
      responseTime: number;
    };
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check all external services
    const services = await checkAllServices();
    
    // Calculate overall health
    const overallHealth = calculateOverallHealth(services);
    
    // Get system metrics
    const metrics = getSystemMetrics();
    
    const responseTime = Date.now() - startTime;
    
    const healthReport: SystemHealth = {
      overall: overallHealth,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        ...metrics,
        performance: {
          ...metrics.performance,
          responseTime
        }
      }
    };

    // Return appropriate status code based on health
    const statusCode = overallHealth === 'healthy' ? 200 : 
                      overallHealth === 'degraded' ? 206 : 503;

    return NextResponse.json(healthReport, { status: statusCode });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json({
      overall: 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: 'Failed to perform health check',
      services: [],
      metrics: {
        memory: { used: 0, total: 0, percentage: 0 },
        performance: { ttfb: 0, responseTime: Date.now() - startTime }
      }
    }, { status: 503 });
  }
}

async function checkAllServices(): Promise<ServiceStatus[]> {
  const serviceChecks = [
    checkNOAAService(),
    checkSurflineService(),
    checkNewsServices(),
    checkHECOService(),
    checkDOTService(),
    checkFlightService(),
    checkUpstashRedis()
  ];

  const results = await Promise.allSettled(serviceChecks);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const serviceNames = ['NOAA Weather', 'Surfline', 'News Sources', 'HECO', 'Hawaii DOT', 'Flight Data', 'Redis Cache'];
      return {
        name: serviceNames[index],
        status: 'outage' as const,
        lastChecked: new Date().toISOString(),
        error: result.reason?.message || 'Service check failed'
      };
    }
  });
}

async function checkNOAAService(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.weather.gov/points/21.4389,-158.0001', {
      method: 'HEAD',
      headers: {
        'User-Agent': 'HawaiiToday/1.0 (contact@hawaiitoday.com)'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    return {
      name: 'NOAA Weather Service',
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      name: 'NOAA Weather Service',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkSurflineService(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://services.surfline.com/kbyg/regions/overview?subregionId=58f7ed51dadb30820bb38791', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    return {
      name: 'Surfline API',
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      name: 'Surfline API',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkNewsServices(): Promise<ServiceStatus> {
  const startTime = Date.now();
  const newsUrls = [
    'https://www.hawaiinewsnow.com',
    'https://www.khon2.com',
    'https://www.kitv.com',
    'https://www.staradvertiser.com'
  ];

  try {
    const responses = await Promise.allSettled(
      newsUrls.map(url => 
        fetch(url, { 
          method: 'HEAD', 
          signal: AbortSignal.timeout(5000) 
        })
      )
    );

    const successCount = responses.filter(r => 
      r.status === 'fulfilled' && r.value.ok
    ).length;

    const responseTime = Date.now() - startTime;
    const successRate = successCount / newsUrls.length;

    return {
      name: 'News Sources',
      status: successRate >= 0.75 ? 'operational' : 
              successRate >= 0.5 ? 'degraded' : 'outage',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: successRate < 1 ? `${successCount}/${newsUrls.length} sources available` : undefined
    };
  } catch (error) {
    return {
      name: 'News Sources',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkHECOService(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // HECO outage map endpoint (would need to be verified)
    const response = await fetch('https://www.hawaiianelectric.com/outages', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    return {
      name: 'Hawaiian Electric',
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      name: 'Hawaiian Electric',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkDOTService(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Hawaii DOT traffic data endpoint (would need to be verified)
    const response = await fetch('https://hidot.hawaii.gov', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    return {
      name: 'Hawaii DOT',
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      name: 'Hawaii DOT',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkFlightService(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Mock flight service check - would use actual FlightAware or Aviationstack
    // For now, just checking a placeholder
    const response = await fetch('https://aviationstack.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    return {
      name: 'Flight Data Service',
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      name: 'Flight Data Service',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkUpstashRedis(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Check Redis connection if configured
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: {
          'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
        },
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;

      return {
        name: 'Redis Cache',
        status: response.ok ? 'operational' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } else {
      return {
        name: 'Redis Cache',
        status: 'degraded',
        lastChecked: new Date().toISOString(),
        error: 'Redis not configured'
      };
    }
  } catch (error) {
    return {
      name: 'Redis Cache',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function calculateOverallHealth(services: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
  const operationalCount = services.filter(s => s.status === 'operational').length;
  const totalCount = services.length;
  const operationalRate = operationalCount / totalCount;

  if (operationalRate >= 0.9) return 'healthy';
  if (operationalRate >= 0.7) return 'degraded';
  return 'unhealthy';
}

function getSystemMetrics() {
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    performance: {
      ttfb: 0 // Would be calculated in middleware
    }
  };
}