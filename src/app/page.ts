import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Metadata } from 'next';

// Dynamic imports for better performance
const WeatherWidget = dynamic(() => import('@/components/widgets/WeatherWidget'), {
  loading: () => <WidgetSkeleton />,
});

const SurfWidget = dynamic(() => import('@/components/widgets/SurfWidget'), {
  loading: () => <WidgetSkeleton />,
});

const NewsWidget = dynamic(() => import('@/components/widgets/NewsWidget'), {
  loading: () => <WidgetSkeleton />,
});

const EventsWidget = dynamic(() => import('@/components/widgets/EventsWidget'), {
  loading: () => <WidgetSkeleton />,
});

const TrafficWidget = dynamic(() => import('@/components/widgets/TrafficWidget'), {
  loading: () => <WidgetSkeleton />,
});

const FlightsWidget = dynamic(() => import('@/components/widgets/FlightsWidget'), {
  loading: () => <WidgetSkeleton />,
});

const PowerWidget = dynamic(() => import('@/components/widgets/PowerWidget'), {
  loading: () => <WidgetSkeleton />,
});

const JellyfishWidget = dynamic(() => import('@/components/widgets/JellyfishWidget'), {
  loading: () => <WidgetSkeleton />,
});

const ResidentWidget = dynamic(() => import('@/components/widgets/ResidentWidget'), {
  loading: () => <WidgetSkeleton />,
});

const HeroBanner = dynamic(() => import('@/components/layout/HeroBanner'), {
  loading: () => <HeroSkeleton />,
});

const QuickStats = dynamic(() => import('@/components/layout/QuickStats'), {
  loading: () => <QuickStatsSkeleton />,
});

export const metadata: Metadata = {
  title: 'Hawaii Today - Real-Time Hawaii Dashboard',
  description: 'Get real-time weather, surf conditions, local news, events, and traffic updates for all Hawaiian islands. Your 3-minute Hawaii briefing.',
  openGraph: {
    title: 'Hawaii Today - Real-Time Hawaii Dashboard',
    description: 'Your essential daily Hawaii briefing in one place.',
    images: ['/og-dashboard.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hawaii Today Dashboard',
    description: 'Real-time Hawaii information at your fingertips.',
  },
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-sky-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<HeroSkeleton />}>
            <HeroBanner />
          </Suspense>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-4 bg-white/50 backdrop-blur-sm border-y border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<QuickStatsSkeleton />}>
            <QuickStats />
          </Suspense>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Primary Column - Weather & Surf */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Weather Section */}
              <div id="weather" className="scroll-mt-20">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-8 bg-gradient-ocean rounded-full mr-3"></span>
                  Current Conditions
                </h2>
                <Suspense fallback={<WidgetSkeleton className="h-80" />}>
                  <WeatherWidget />
                </Suspense>
              </div>

              {/* Surf Section */}
              <div id="surf" className="scroll-mt-20">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-8 bg-gradient-sunset rounded-full mr-3"></span>
                  Surf Report
                </h2>
                <Suspense fallback={<WidgetSkeleton className="h-80" />}>
                  <SurfWidget />
                </Suspense>
              </div>

              {/* News Section */}
              <div id="news" className="scroll-mt-20">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3"></span>
                  3-Minute Hawaii Update
                </h2>
                <Suspense fallback={<WidgetSkeleton className="h-96" />}>
                  <NewsWidget />
                </Suspense>
              </div>

              {/* Events Section */}
              <div id="events" className="scroll-mt-20">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-r from-tropical-500 to-green-500 rounded-full mr-3"></span>
                  Upcoming Events
                </h2>
                <Suspense fallback={<WidgetSkeleton className="h-96" />}>
                  <EventsWidget />
                </Suspense>
              </div>
            </div>

            {/* Secondary Column - Additional Widgets */}
            <div className="space-y-6">
              
              {/* Traffic & Transportation */}
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-900 mb-3">
                  Traffic & Transit
                </h3>
                <div className="space-y-4">
                  <Suspense fallback={<WidgetSkeleton className="h-48" />}>
                    <TrafficWidget />
                  </Suspense>
                  <Suspense fallback={<WidgetSkeleton className="h-40" />}>
                    <FlightsWidget />
                  </Suspense>
                </div>
              </div>

              {/* Utilities & Safety */}
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-900 mb-3">
                  Utilities & Safety
                </h3>
                <div className="space-y-4">
                  <Suspense fallback={<WidgetSkeleton className="h-32" />}>
                    <PowerWidget />
                  </Suspense>
                  <Suspense fallback={<WidgetSkeleton className="h-32" />}>
                    <JellyfishWidget />
                  </Suspense>
                </div>
              </div>

              {/* Resident Tools */}
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-900 mb-3">
                  Local Tools
                </h3>
                <Suspense fallback={<WidgetSkeleton className="h-64" />}>
                  <ResidentWidget />
                </Suspense>
              </div>

              {/* Ad Space */}
              <div className="widget-compact">
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">Advertisement</p>
                  <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                    <span className="text-gray-400">Ad Space</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-gradient-ocean">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl font-display font-bold mb-4">
              Never Miss Your Hawaii Update
            </h2>
            <p className="text-xl mb-8 text-ocean-100">
              Get your daily briefing delivered to your inbox at 6 AM HST
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-ocean-500"
                required
              />
              <button
                type="submit"
                className="bg-white text-ocean-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-ocean-500"
              >
                Subscribe
              </button>
            </form>
            <p className="text-sm text-ocean-200 mt-4">
              Free daily updates. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Loading skeleton components
function WidgetSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`widget ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="card-hero">
      <div className="animate-pulse">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-32 h-32 bg-gray-200 rounded-full mt-6 lg:mt-0"></div>
        </div>
      </div>
    </div>
  );
}

function QuickStatsSkeleton() {
  return (
    <div className="flex space-x-8 overflow-x-auto">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 animate-pulse">
          <div className="flex items-center space-x-3">
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