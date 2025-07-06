'use client';

import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Star
} from 'lucide-react';
import { NewsArticle, NewsCategory } from '@/types';
import { formatTime, getRelativeTime, getFriendlyDate } from '@/utils/time';

interface NewsWidgetProps {
  maxArticles?: number;
  showCategories?: boolean;
}

export default function NewsWidget({ maxArticles = 8, showCategories = true }: NewsWidgetProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchNewsData();
    
    // Refresh every 15 minutes
    const interval = setInterval(fetchNewsData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock news data - in real implementation, this would call the news API
      const mockArticles: NewsArticle[] = [
        {
          id: 'news-1',
          title: 'Hawaii Legislature Passes Historic Climate Resilience Bill',
          summary: 'The Hawaii State Legislature unanimously passed comprehensive climate resilience legislation, allocating $500M for coastal protection and renewable energy infrastructure. The bill includes funding for sea wall construction, solar panel installations, and electric vehicle charging networks across all islands.',
          originalUrl: 'https://www.staradvertiser.com/climate-bill',
          publisher: {
            name: 'Honolulu Star-Advertiser',
            logoUrl: '/logos/star-advertiser.png',
            domain: 'staradvertiser.com'
          },
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          category: 'local',
          relevanceScore: 0.95,
          imageUrl: '/images/legislature.jpg'
        },
        {
          id: 'news-2',
          title: 'North Shore Experiences Record Surf Heights',
          summary: 'Professional surfers and spectators flocked to Pipeline and Sunset Beach as wave heights reached 25-30 feet, marking the largest surf of the winter season. The Eddie Aikau competition remains on hold pending further evaluation of conditions by WSL officials.',
          originalUrl: 'https://www.hawaiinewsnow.com/surf-record',
          publisher: {
            name: 'Hawaii News Now',
            logoUrl: '/logos/hawaii-news-now.png',
            domain: 'hawaiinewsnow.com'
          },
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          category: 'weather',
          relevanceScore: 0.88
        },
        {
          id: 'news-3',
          title: 'New Direct Flight Route Connects Maui to Tokyo',
          summary: 'Hawaiian Airlines announced a new direct flight service between Kahului Airport and Tokyo Narita, beginning March 2024. The service will operate three times weekly using Airbus A330 aircraft, reducing travel time by 4 hours compared to current connecting flights.',
          originalUrl: 'https://www.khon2.com/maui-tokyo-flight',
          publisher: {
            name: 'KHON2',
            logoUrl: '/logos/khon2.png',
            domain: 'khon2.com'
          },
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          category: 'business',
          relevanceScore: 0.82
        },
        {
          id: 'news-4',
          title: 'Honolulu Rail Project Reaches Ala Moana Milestone',
          summary: 'HART announced successful completion of rail line testing to Ala Moana Center, marking a major milestone in the $12B transit project. Revenue service to downtown Honolulu is expected to begin in Q3 2024, with full airport connection by 2025.',
          originalUrl: 'https://www.kitv.com/rail-milestone',
          publisher: {
            name: 'KITV4',
            logoUrl: '/logos/kitv.png',
            domain: 'kitv.com'
          },
          publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          category: 'local',
          relevanceScore: 0.79
        },
        {
          id: 'news-5',
          title: 'Hawaiian Monk Seal Population Shows Continued Recovery',
          summary: 'NOAA researchers report Hawaiian monk seal population has increased to approximately 1,570 individuals, representing a 3% annual growth. Conservation efforts including beach protection and marine debris removal continue to support species recovery across the Northwestern Hawaiian Islands.',
          originalUrl: 'https://www.hawaiinewsnow.com/monk-seals',
          publisher: {
            name: 'Hawaii News Now',
            logoUrl: '/logos/hawaii-news-now.png',
            domain: 'hawaiinewsnow.com'
          },
          publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
          category: 'environment',
          relevanceScore: 0.75
        },
        {
          id: 'news-6',
          title: 'University of Hawaii Receives $50M Research Grant',
          summary: 'UH Manoa secured a landmark $50M federal research grant to study ocean acidification and coral reef resilience. The five-year project will establish the Pacific Climate Research Institute and create 200 new research positions across marine science disciplines.',
          originalUrl: 'https://www.staradvertiser.com/uh-research-grant',
          publisher: {
            name: 'Honolulu Star-Advertiser',
            logoUrl: '/logos/star-advertiser.png',
            domain: 'staradvertiser.com'
          },
          publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          category: 'education',
          relevanceScore: 0.71
        }
      ];

      setArticles(mockArticles);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load news updates');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: NewsCategory) => {
    switch (category) {
      case 'breaking':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'weather':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'business':
        return <Star className="w-4 h-4 text-green-500" />;
      default:
        return <Newspaper className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: NewsCategory) => {
    switch (category) {
      case 'breaking':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'weather':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'business':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'local':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'environment':
        return 'bg-tropical-100 text-tropical-800 border-tropical-200';
      case 'culture':
        return 'bg-sunset-100 text-sunset-800 border-sunset-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories: Array<NewsCategory | 'all'> = [
    'all', 'breaking', 'local', 'weather', 'business', 'environment', 'culture'
  ];

  const filteredArticles = selectedCategory === 'all' 
    ? articles.slice(0, maxArticles)
    : articles.filter(article => article.category === selectedCategory).slice(0, maxArticles);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">News Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchNewsData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-display font-bold text-gray-900">
            3-Minute Hawaii Update
          </h3>
        </div>
        <button 
          onClick={fetchNewsData}
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh news"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">
            {getRelativeTime(lastUpdate)}
          </span>
        </button>
      </div>

      {/* Category Filter */}
      {showCategories && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  selectedCategory === category
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Stories' : category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No articles found for this category.</p>
          </div>
        ) : (
          filteredArticles.map((article, index) => (
            <article 
              key={article.id}
              className={`border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition-all ${
                index === 0 ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              {/* Article Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {index === 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      TOP STORY
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full border text-xs font-medium capitalize ${getCategoryColor(article.category)}`}>
                    {getCategoryIcon(article.category)}
                    <span className="ml-1">{article.category}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{getRelativeTime(article.publishedAt)}</span>
                </div>
              </div>

              {/* Article Content */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 leading-tight">
                  {article.title}
                </h4>
                
                <p className="text-gray-700 text-sm leading-relaxed">
                  {article.summary}
                </p>

                {/* Publisher & Link */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded flex-shrink-0"></div>
                    <span className="text-xs text-gray-600 font-medium">
                      {article.publisher.name}
                    </span>
                  </div>
                  
                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                  >
                    <span>Read Full Story</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Load More / View All */}
      {articles.length > maxArticles && (
        <div className="mt-6 text-center">
          <button className="flex items-center space-x-2 mx-auto text-red-600 hover:text-red-700 font-medium transition-colors">
            <span>View All Stories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>AI-Generated Summaries:</strong> These summaries are created using artificial intelligence for your convenience. 
            For complete and verified information, please visit the original publisher's website by clicking "Read Full Story."
          </p>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Stories from Hawaii News Now, KHON2, KITV4, Star-Advertiser • 
          Last updated: {formatTime(lastUpdate)} HST
        </p>
      </div>
    </div>
  );
}