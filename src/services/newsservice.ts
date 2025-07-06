import { NewsArticle, NewsCategory, NewsPublisher } from '@/types';
import RSSParser from 'rss-parser';

interface RSSFeed {
  url: string;
  publisher: NewsPublisher;
  category: NewsCategory;
  enabled: boolean;
}

interface AIResponse {
  summary: string;
  category: NewsCategory;
  relevanceScore: number;
}

class NewsService {
  private static instance: NewsService;
  private rssParser = new RSSParser();
  private readonly CACHE_TTL_MINUTES = 15;
  private cache = new Map<string, { data: NewsArticle[]; timestamp: number }>();

  // Hawaii news sources RSS feeds
  private readonly RSS_FEEDS: RSSFeed[] = [
    {
      url: 'https://www.hawaiinewsnow.com/content/news/?format=rss',
      publisher: {
        name: 'Hawaii News Now',
        logoUrl: '/logos/hawaii-news-now.png',
        domain: 'hawaiinewsnow.com'
      },
      category: 'local',
      enabled: true
    },
    {
      url: 'https://www.khon2.com/feed/',
      publisher: {
        name: 'KHON2',
        logoUrl: '/logos/khon2.png',
        domain: 'khon2.com'
      },
      category: 'local',
      enabled: true
    },
    {
      url: 'https://www.kitv.com/news/?format=rss',
      publisher: {
        name: 'KITV4',
        logoUrl: '/logos/kitv.png',
        domain: 'kitv.com'
      },
      category: 'local',
      enabled: true
    },
    {
      url: 'https://www.staradvertiser.com/feed/',
      publisher: {
        name: 'Honolulu Star-Advertiser',
        logoUrl: '/logos/star-advertiser.png',
        domain: 'staradvertiser.com'
      },
      category: 'local',
      enabled: true
    },
    {
      url: 'https://www.civilbeat.org/feed/',
      publisher: {
        name: 'Honolulu Civil Beat',
        logoUrl: '/logos/civil-beat.png',
        domain: 'civilbeat.org'
      },
      category: 'local',
      enabled: true
    }
  ];

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async getLatestNews(category?: NewsCategory, limit: number = 20): Promise<NewsArticle[]> {
    const cacheKey = `news-${category || 'all'}-${limit}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MINUTES * 60 * 1000) {
      return cached.data;
    }

    try {
      // Fetch from all RSS feeds
      const articles = await this.fetchAllFeeds();
      
      // Filter by category if specified
      let filteredArticles = category ? 
        articles.filter(article => article.category === category) : 
        articles;

      // Sort by relevance score and publish date
      filteredArticles.sort((a, b) => {
        const scoreA = a.relevanceScore || 0;
        const scoreB = b.relevanceScore || 0;
        if (scoreA !== scoreB) return scoreB - scoreA; // Higher score first
        
        // If scores are equal, sort by date
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      // Limit results
      const result = filteredArticles.slice(0, limit);
      
      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Failed to fetch news:', error);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey);
      return cached ? cached.data : this.getFallbackNews();
    }
  }

  private async fetchAllFeeds(): Promise<NewsArticle[]> {
    const feedPromises = this.RSS_FEEDS
      .filter(feed => feed.enabled)
      .map(feed => this.fetchFeed(feed));

    const results = await Promise.allSettled(feedPromises);
    
    // Flatten all articles and remove duplicates
    const allArticles: NewsArticle[] = [];
    const seenUrls = new Set<string>();

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        result.value.forEach(article => {
          if (!seenUrls.has(article.originalUrl)) {
            seenUrls.add(article.originalUrl);
            allArticles.push(article);
          }
        });
      }
    });

    return allArticles;
  }

  private async fetchFeed(feed: RSSFeed): Promise<NewsArticle[]> {
    try {
      const rssData = await this.rssParser.parseURL(feed.url);
      const articles: NewsArticle[] = [];

      for (const item of rssData.items.slice(0, 10)) { // Limit per feed
        if (!item.title || !item.link) continue;

        // Skip old articles (older than 48 hours)
        const publishDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const hoursOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 48) continue;

        // Create article with AI summary
        const article = await this.processArticle({
          title: item.title,
          originalUrl: item.link,
          content: item.contentSnippet || item.content || '',
          publishedAt: publishDate.toISOString(),
          publisher: feed.publisher
        });

        if (article) {
          articles.push(article);
        }
      }

      return articles;
    } catch (error) {
      console.error(`Failed to fetch feed ${feed.url}:`, error);
      return [];
    }
  }

  private async processArticle(rawArticle: {
    title: string;
    originalUrl: string;
    content: string;
    publishedAt: string;
    publisher: NewsPublisher;
  }): Promise<NewsArticle | null> {
    try {
      // Check if article is Hawaii-relevant
      const relevanceScore = this.calculateRelevanceScore(rawArticle.title, rawArticle.content);
      
      // Skip low-relevance articles
      if (relevanceScore < 0.3) {
        return null;
      }

      // Generate AI summary and categorization
      const aiResponse = await this.generateAISummary(rawArticle.title, rawArticle.content);

      return {
        id: this.generateArticleId(rawArticle.originalUrl),
        title: rawArticle.title,
        summary: aiResponse.summary,
        originalUrl: rawArticle.originalUrl,
        publisher: rawArticle.publisher,
        publishedAt: rawArticle.publishedAt,
        category: aiResponse.category,
        relevanceScore: Math.max(relevanceScore, aiResponse.relevanceScore),
        imageUrl: this.extractImageUrl(rawArticle.content)
      };
    } catch (error) {
      console.error('Failed to process article:', error);
      return null;
    }
  }

  private async generateAISummary(title: string, content: string): Promise<AIResponse> {
    try {
      // In a real implementation, this would call OpenAI GPT-4
      // For now, we'll simulate the AI response
      
      const prompt = this.buildSummaryPrompt(title, content);
      
      // Mock AI response - in production, replace with actual OpenAI API call
      const mockResponse = await this.mockAICall(title, content);
      
      return mockResponse;
    } catch (error) {
      console.error('AI summarization failed:', error);
      
      // Fallback to simple text processing
      return this.generateFallbackSummary(title, content);
    }
  }

  private buildSummaryPrompt(title: string, content: string): string {
    return `
You are a Hawaii news summarizer. Create a concise, factual 75-word summary of this article.

Requirements:
- Exactly 75 words in bullet point format
- Neutral, journalistic tone
- Include key facts, numbers, and outcomes
- Mention specific Hawaii locations when relevant
- Cite the original source inline
- Categorize as: breaking, local, weather, traffic, business, sports, culture, or environment

Article Title: ${title}
Article Content: ${content.substring(0, 1000)}...

Respond in JSON format:
{
  "summary": "75-word bullet summary here",
  "category": "category_name",
  "relevanceScore": 0.85
}`;
  }

  private async mockAICall(title: string, content: string): Promise<AIResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate mock summary based on title/content keywords
    const category = this.inferCategory(title, content);
    const summary = this.generateMockSummary(title, content);
    const relevanceScore = this.calculateRelevanceScore(title, content);

    return {
      summary,
      category,
      relevanceScore
    };
  }

  private generateMockSummary(title: string, content: string): string {
    // Create a simplified summary based on the title and first sentences
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    const firstSentences = sentences.slice(0, 3).join('. ');
    
    // Truncate to approximately 75 words
    const words = firstSentences.split(' ').slice(0, 75);
    return words.join(' ') + (words.length === 75 ? '...' : '.');
  }

  private inferCategory(title: string, content: string): NewsCategory {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('breaking') || text.includes('urgent') || text.includes('alert')) {
      return 'breaking';
    }
    if (text.includes('weather') || text.includes('storm') || text.includes('hurricane') || text.includes('rain')) {
      return 'weather';
    }
    if (text.includes('traffic') || text.includes('highway') || text.includes('freeway') || text.includes('construction')) {
      return 'traffic';
    }
    if (text.includes('business') || text.includes('economy') || text.includes('company') || text.includes('investment')) {
      return 'business';
    }
    if (text.includes('sport') || text.includes('game') || text.includes('team') || text.includes('championship')) {
      return 'sports';
    }
    if (text.includes('culture') || text.includes('festival') || text.includes('music') || text.includes('art')) {
      return 'culture';
    }
    if (text.includes('environment') || text.includes('ocean') || text.includes('coral') || text.includes('conservation')) {
      return 'environment';
    }
    
    return 'local';
  }

  private calculateRelevanceScore(title: string, content: string): number {
    const text = (title + ' ' + content).toLowerCase();
    let score = 0;

    // Hawaii-specific keywords
    const hawaiiKeywords = [
      'hawaii', 'hawaiian', 'honolulu', 'oahu', 'maui', 'kauai', 'big island', 'molokai', 'lanai',
      'waikiki', 'pearl harbor', 'diamond head', 'haleakala', 'kilauea', 'volcano',
      'aloha', 'mahalo', 'ohana', 'poke', 'spam musubi', 'shave ice',
      'pipeline', 'north shore', 'south shore', 'windward', 'leeward',
      'heco', 'hawaiian electric', 'hart', 'honolulu rail', 'uh', 'university of hawaii'
    ];

    hawaiiKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.1;
      }
    });

    // Local relevance indicators
    if (text.includes('local') || text.includes('island') || text.includes('state')) score += 0.05;
    if (text.includes('resident') || text.includes('community')) score += 0.05;
    
    // Recent/urgent content gets higher score
    if (text.includes('today') || text.includes('yesterday') || text.includes('breaking')) score += 0.1;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private generateFallbackSummary(title: string, content: string): AIResponse {
    return {
      summary: this.generateMockSummary(title, content),
      category: this.inferCategory(title, content),
      relevanceScore: this.calculateRelevanceScore(title, content)
    };
  }

  private extractImageUrl(content: string): string | undefined {
    // Simple regex to find image URLs in content
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    return imgMatch ? imgMatch[1] : undefined;
  }

  private generateArticleId(url: string): string {
    // Create a consistent ID from the URL
    return Buffer.from(url).toString('base64').replace(/[^A-Za-z0-9]/g, '').substring(0, 16);
  }

  private getFallbackNews(): NewsArticle[] {
    // Return some default news articles when all else fails
    return [
      {
        id: 'fallback-1',
        title: 'Hawaii Today News Service Temporarily Unavailable',
        summary: 'We are currently experiencing technical difficulties with our news feeds. Please check back shortly for the latest Hawaii news updates.',
        originalUrl: '#',
        publisher: {
          name: 'Hawaii Today',
          logoUrl: '/logos/hawaii-today.png',
          domain: 'hawaiitoday.com'
        },
        publishedAt: new Date().toISOString(),
        category: 'local',
        relevanceScore: 0.5
      }
    ];
  }

  // Admin methods for managing feeds
  async addCustomFeed(feedUrl: string, publisher: NewsPublisher, category: NewsCategory): Promise<boolean> {
    try {
      // Validate the RSS feed
      await this.rssParser.parseURL(feedUrl);
      
      // Add to feeds list (in production, this would save to database)
      this.RSS_FEEDS.push({
        url: feedUrl,
        publisher,
        category,
        enabled: true
      });
      
      // Clear cache to refresh
      this.cache.clear();
      
      return true;
    } catch (error) {
      console.error('Failed to add custom feed:', error);
      return false;
    }
  }

  toggleFeed(feedUrl: string, enabled: boolean): void {
    const feed = this.RSS_FEEDS.find(f => f.url === feedUrl);
    if (feed) {
      feed.enabled = enabled;
      this.cache.clear(); // Clear cache when feeds change
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const newsService = NewsService.getInstance();