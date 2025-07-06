import { NewsArticle, WeatherData, SurfSpot, EventData, Island } from '@/types';
import { formatTime, getSunTimes, getHawaiiTime } from '@/utils/time';

interface NewsletterSubscriber {
  id: string;
  email: string;
  island: Island;
  preferences: {
    weather: boolean;
    surf: boolean;
    news: boolean;
    events: boolean;
    traffic: boolean;
  };
  subscribed: boolean;
  subscribedAt: string;
  unsubscribeToken: string;
}

interface DailyBriefingData {
  weather: WeatherData;
  topSurfSpot: SurfSpot;
  topNews: NewsArticle[];
  todaysEvents: EventData[];
  sunsetTime: string;
  greeting: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class EmailService {
  private static instance: EmailService;
  private readonly BEEHIIV_API_URL = 'https://api.beehiiv.com/v2';
  private readonly ONESIGNAL_API_URL = 'https://onesignal.com/api/v1';
  private readonly BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
  private readonly BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;
  private readonly ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  private readonly ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

  // In production, this would be stored in a database
  private subscribers = new Map<string, NewsletterSubscriber>();

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Newsletter subscription management
  async subscribeEmail(email: string, island: Island = 'oahu'): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        return { success: false, message: 'Invalid email address' };
      }

      // Check if already subscribed
      if (this.subscribers.has(email)) {
        const subscriber = this.subscribers.get(email)!;
        if (subscriber.subscribed) {
          return { success: false, message: 'Email already subscribed' };
        } else {
          // Reactivate subscription
          subscriber.subscribed = true;
          subscriber.subscribedAt = new Date().toISOString();
          return { success: true, message: 'Subscription reactivated' };
        }
      }

      // Create new subscriber
      const subscriber: NewsletterSubscriber = {
        id: this.generateSubscriberId(),
        email,
        island,
        preferences: {
          weather: true,
          surf: true,
          news: true,
          events: true,
          traffic: false
        },
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        unsubscribeToken: this.generateUnsubscribeToken()
      };

      // Add to Beehiiv if configured
      if (this.BEEHIIV_API_KEY && this.BEEHIIV_PUBLICATION_ID) {
        await this.addToBeehiiv(subscriber);
      }

      // Store subscriber (in production, save to database)
      this.subscribers.set(email, subscriber);

      // Send welcome email
      await this.sendWelcomeEmail(subscriber);

      return { success: true, message: 'Successfully subscribed to daily Hawaii briefing' };
    } catch (error) {
      console.error('Subscription error:', error);
      return { success: false, message: 'Subscription failed. Please try again.' };
    }
  }

  async unsubscribeEmail(email: string, token?: string): Promise<{ success: boolean; message: string }> {
    try {
      const subscriber = this.subscribers.get(email);
      
      if (!subscriber) {
        return { success: false, message: 'Email not found' };
      }

      if (token && token !== subscriber.unsubscribeToken) {
        return { success: false, message: 'Invalid unsubscribe token' };
      }

      // Mark as unsubscribed
      subscriber.subscribed = false;

      // Remove from Beehiiv if configured
      if (this.BEEHIIV_API_KEY) {
        await this.removeFromBeehiiv(subscriber);
      }

      return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return { success: false, message: 'Unsubscribe failed. Please try again.' };
    }
  }

  // Daily briefing generation and sending
  async sendDailyBriefing(): Promise<{ sent: number; failed: number }> {
    try {
      console.log('Starting daily briefing send...');
      
      // Get all active subscribers
      const activeSubscribers = Array.from(this.subscribers.values())
        .filter(sub => sub.subscribed);

      if (activeSubscribers.length === 0) {
        console.log('No active subscribers found');
        return { sent: 0, failed: 0 };
      }

      // Group subscribers by island for optimized data fetching
      const subscribersByIsland = this.groupSubscribersByIsland(activeSubscribers);

      let totalSent = 0;
      let totalFailed = 0;

      // Send briefings for each island
      for (const [island, subscribers] of Object.entries(subscribersByIsland)) {
        try {
          const briefingData = await this.generateBriefingData(island as Island);
          const template = await this.generateEmailTemplate(briefingData, island as Island);

          // Send to all subscribers for this island
          const results = await Promise.allSettled(
            subscribers.map(subscriber => this.sendEmailToSubscriber(subscriber, template))
          );

          const sent = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;

          totalSent += sent;
          totalFailed += failed;

          console.log(`Sent ${sent} briefings for ${island}, ${failed} failed`);
        } catch (error) {
          console.error(`Failed to send briefings for ${island}:`, error);
          totalFailed += subscribers.length;
        }
      }

      console.log(`Daily briefing complete: ${totalSent} sent, ${totalFailed} failed`);
      return { sent: totalSent, failed: totalFailed };
    } catch (error) {
      console.error('Daily briefing error:', error);
      return { sent: 0, failed: 0 };
    }
  }

  private async generateBriefingData(island: Island): Promise<DailyBriefingData> {
    // Import services dynamically to avoid circular dependencies
    const { weatherService } = await import('./weatherService');
    const { surfService } = await import('./surfService');
    const { newsService } = await import('./newsService');
    const { eventsService } = await import('./eventsService');

    // Fetch all data in parallel
    const [weather, surfData, news, events] = await Promise.all([
      weatherService.getWeatherData(island),
      surfService.getSurfData(island),
      newsService.getLatestNews(undefined, 5),
      eventsService.getEvents(island, undefined, 1, 3) // Today's events only
    ]);

    // Get top surf spot for the island
    const topSurfSpot = surfData.spots.reduce((best, spot) => {
      const bestScore = this.calculateSurfScore(best);
      const spotScore = this.calculateSurfScore(spot);
      return spotScore > bestScore ? spot : best;
    }, surfData.spots[0]);

    // Get sunset time
    const hawaiiTime = getHawaiiTime();
    const sunTimes = getSunTimes(hawaiiTime);
    const sunsetTime = formatTime(sunTimes.sunset, 'Pacific/Honolulu', 'h:mm a');

    // Generate greeting based on time of day
    const hour = hawaiiTime.getHours();
    const greeting = hour < 12 ? 'Good morning' : 
                    hour < 17 ? 'Good afternoon' : 'Aloha';

    return {
      weather,
      topSurfSpot,
      topNews: news.slice(0, 3),
      todaysEvents: events,
      sunsetTime,
      greeting
    };
  }

  private calculateSurfScore(spot: SurfSpot): number {
    const qualityScore = {
      'excellent': 10,
      'good': 7,
      'fair': 4,
      'poor': 1
    }[spot.current.quality] || 1;

    const heightScore = spot.current.waveHeight.max;
    return qualityScore + heightScore;
  }

  private async generateEmailTemplate(data: DailyBriefingData, island: Island): Promise<EmailTemplate> {
    const hawaiiTime = getHawaiiTime();
    const dateStr = formatTime(hawaiiTime, 'Pacific/Honolulu', 'EEEE, MMMM d, yyyy');
    const islandName = this.formatIslandName(island);

    const subject = `🌺 Your ${islandName} Update - ${dateStr}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #0369a1; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        .weather-card { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .surf-card { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .news-item { border-left: 4px solid #dc2626; padding-left: 15px; margin-bottom: 20px; }
        .event-item { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
        .footer { background: #374151; color: white; padding: 20px; text-align: center; }
        .footer a { color: #60a5fa; text-decoration: none; }
        .unsubscribe { font-size: 12px; color: #9ca3af; margin-top: 15px; }
        .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌺 Hawaii Today</h1>
            <p>${data.greeting}, ${islandName}! Here's your daily briefing for ${dateStr}</p>
        </div>
        
        <div class="content">
            <!-- Weather Section -->
            <div class="section">
                <div class="weather-card">
                    <h2 style="color: white; border: none; margin-bottom: 10px;">🌤️ Today's Weather</h2>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 36px; font-weight: bold;">${data.weather.current.temperature}°F</div>
                            <div>${data.weather.current.conditions}</div>
                        </div>
                        <div style="text-align: right;">
                            <div>💨 ${data.weather.current.windSpeed} mph ${data.weather.current.windDirection}</div>
                            <div>💧 ${data.weather.current.humidity}% humidity</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Surf Section -->
            <div class="section">
                <div class="surf-card">
                    <h2 style="color: white; border: none; margin-bottom: 10px;">🏄‍♂️ Top Surf Spot Today</h2>
                    <div>
                        <div style="font-size: 24px; font-weight: bold;">${data.topSurfSpot.name}</div>
                        <div style="font-size: 18px; margin: 5px 0;">${data.topSurfSpot.current.waveHeight.min}-${data.topSurfSpot.current.waveHeight.max} ft</div>
                        <div>Quality: ${data.topSurfSpot.current.quality.charAt(0).toUpperCase() + data.topSurfSpot.current.quality.slice(1)} • Period: ${data.topSurfSpot.current.period}s</div>
                    </div>
                </div>
            </div>

            <!-- News Section -->
            <div class="section">
                <h2>📰 Top Stories</h2>
                ${data.topNews.map(article => `
                    <div class="news-item">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px;">${article.title}</h3>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${article.summary}</p>
                        <div style="font-size: 12px; color: #888;">
                            ${article.publisher.name} • ${this.timeAgo(article.publishedAt)}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Events Section -->
            ${data.todaysEvents.length > 0 ? `
            <div class="section">
                <h2>🎉 Today's Events</h2>
                ${data.todaysEvents.map(event => `
                    <div class="event-item">
                        <h3 style="margin: 0 0 5px 0; font-size: 16px;">${event.title}</h3>
                        <div style="font-size: 14px; color: #666;">📍 ${event.location.name}</div>
                        <div style="font-size: 14px; color: #666;">🕐 ${formatTime(new Date(event.startDate), 'Pacific/Honolulu', 'h:mm a')}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Sunset -->
            <div class="section" style="text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px;">
                <h2 style="color: white; border: none; margin-bottom: 10px;">🌅 Tonight's Sunset</h2>
                <div style="font-size: 24px; font-weight: bold;">${data.sunsetTime}</div>
                <div style="font-size: 14px; opacity: 0.9;">Perfect time to catch the sunset at your favorite beach!</div>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://www.hawaiitoday.com" class="cta-button">View Full Dashboard</a>
            </div>
        </div>

        <div class="footer">
            <p>🌺 Have a wonderful day in paradise! 🌺</p>
            <p><a href="https://www.hawaiitoday.com">Visit Hawaii Today</a> for real-time updates</p>
            <div class="unsubscribe">
                <p>You're receiving this because you subscribed to daily Hawaii updates.<br>
                <a href="https://www.hawaiitoday.com/unsubscribe?email=${encodeURIComponent('{{EMAIL}}')}">Unsubscribe</a> | 
                <a href="https://www.hawaiitoday.com/preferences?email=${encodeURIComponent('{{EMAIL}}')}">Update Preferences</a></p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = this.generateTextVersion(data, island, dateStr);

    return { subject, html, text };
  }

  private generateTextVersion(data: DailyBriefingData, island: Island, dateStr: string): string {
    const islandName = this.formatIslandName(island);
    
    return `
🌺 HAWAII TODAY - ${islandName.toUpperCase()} DAILY BRIEFING 🌺
${dateStr}

${data.greeting}, ${islandName}!

🌤️ WEATHER
${data.weather.current.temperature}°F - ${data.weather.current.conditions}
Wind: ${data.weather.current.windSpeed} mph ${data.weather.current.windDirection}
Humidity: ${data.weather.current.humidity}%

🏄‍♂️ TOP SURF SPOT
${data.topSurfSpot.name}: ${data.topSurfSpot.current.waveHeight.min}-${data.topSurfSpot.current.waveHeight.max} ft
Quality: ${data.topSurfSpot.current.quality} • Period: ${data.topSurfSpot.current.period}s

📰 TOP STORIES
${data.topNews.map((article, index) => 
  `${index + 1}. ${article.title}\n   ${article.summary}\n   Source: ${article.publisher.name}`
).join('\n\n')}

${data.todaysEvents.length > 0 ? `
🎉 TODAY'S EVENTS
${data.todaysEvents.map(event => 
  `• ${event.title}\n  📍 ${event.location.name}\n  🕐 ${formatTime(new Date(event.startDate), 'Pacific/Honolulu', 'h:mm a')}`
).join('\n\n')}
` : ''}

🌅 TONIGHT'S SUNSET: ${data.sunsetTime}

Have a wonderful day in paradise! 🌺

---
Visit https://www.hawaiitoday.com for real-time updates
Unsubscribe: https://www.hawaiitoday.com/unsubscribe
`;
  }

  // Push notification methods
  async sendPushNotification(notification: PushNotification, segments?: string[]): Promise<boolean> {
    if (!this.ONESIGNAL_APP_ID || !this.ONESIGNAL_API_KEY) {
      console.warn('OneSignal not configured');
      return false;
    }

    try {
      const payload = {
        app_id: this.ONESIGNAL_APP_ID,
        headings: { en: notification.title },
        contents: { en: notification.body },
        ...(notification.icon && { large_icon: notification.icon }),
        ...(notification.badge && { small_icon: notification.badge }),
        ...(notification.tag && { android_group: notification.tag }),
        ...(notification.data && { data: notification.data }),
        ...(segments && { included_segments: segments })
      };

      const response = await fetch(`${this.ONESIGNAL_API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.ONESIGNAL_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  // Helper methods
  private async addToBeehiiv(subscriber: NewsletterSubscriber): Promise<void> {
    if (!this.BEEHIIV_API_KEY || !this.BEEHIIV_PUBLICATION_ID) return;

    try {
      await fetch(`${this.BEEHIIV_API_URL}/publications/${this.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.BEEHIIV_API_KEY}`
        },
        body: JSON.stringify({
          email: subscriber.email,
          reactivate_existing: true,
          send_welcome_email: false,
          custom_fields: {
            island: subscriber.island,
            source: 'hawaiitoday'
          }
        })
      });
    } catch (error) {
      console.error('Beehiiv subscription error:', error);
    }
  }

  private async removeFromBeehiiv(subscriber: NewsletterSubscriber): Promise<void> {
    // Implementation would depend on Beehiiv's unsubscribe API
  }

  private async sendEmailToSubscriber(subscriber: NewsletterSubscriber, template: EmailTemplate): Promise<void> {
    // Replace email placeholder
    const personalizedHtml = template.html.replace(/\{\{EMAIL\}\}/g, subscriber.email);
    const personalizedText = template.text.replace(/\{\{EMAIL\}\}/g, subscriber.email);

    // In production, this would use your email service (Beehiiv, SendGrid, etc.)
    console.log(`Sending email to ${subscriber.email}: ${template.subject}`);
  }

  private async sendWelcomeEmail(subscriber: NewsletterSubscriber): Promise<void> {
    const islandName = this.formatIslandName(subscriber.island);
    
    const welcomeTemplate: EmailTemplate = {
      subject: `🌺 Welcome to Hawaii Today - Your ${islandName} Updates!`,
      html: `
      <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0369a1;">🌺 Welcome to Hawaii Today!</h1>
        <p>Aloha! You're now subscribed to daily Hawaii updates for ${islandName}.</p>
        <p>Every morning at 6 AM HST, you'll receive:</p>
        <ul>
          <li>🌤️ Current weather conditions and forecast</li>
          <li>🏄‍♂️ Top surf spots and wave conditions</li>
          <li>📰 Latest local news summaries</li>
          <li>🎉 Today's events and activities</li>
          <li>🌅 Tonight's sunset time</li>
        </ul>
        <p>Your first briefing will arrive tomorrow morning!</p>
        <p style="margin-top: 30px;">
          <a href="https://www.hawaiitoday.com" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Visit Hawaii Today Dashboard</a>
        </p>
      </div>`,
      text: `Welcome to Hawaii Today! You're now subscribed to daily ${islandName} updates. Your first briefing arrives tomorrow at 6 AM HST.`
    };

    await this.sendEmailToSubscriber(subscriber, welcomeTemplate);
  }

  private groupSubscribersByIsland(subscribers: NewsletterSubscriber[]): Record<string, NewsletterSubscriber[]> {
    return subscribers.reduce((groups, subscriber) => {
      const island = subscriber.island;
      if (!groups[island]) groups[island] = [];
      groups[island].push(subscriber);
      return groups;
    }, {} as Record<string, NewsletterSubscriber[]>);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generateSubscriberId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  private formatIslandName(island: Island): string {
    const names: Record<Island, string> = {
      oahu: "O'ahu",
      maui: 'Maui',
      hawaii: 'Big Island',
      kauai: "Kaua'i",
      molokai: "Moloka'i",
      lanai: "Lāna'i"
    };
    return names[island];
  }

  private timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // Public utility methods
  getSubscriberCount(): number {
    return Array.from(this.subscribers.values()).filter(sub => sub.subscribed).length;
  }

  async scheduleTestBriefing(email: string): Promise<boolean> {
    try {
      const subscriber = this.subscribers.get(email);
      if (!subscriber) {
        return false;
      }

      const briefingData = await this.generateBriefingData(subscriber.island);
      const template = await this.generateEmailTemplate(briefingData, subscriber.island);
      
      await this.sendEmailToSubscriber(subscriber, template);
      return true;
    } catch (error) {
      console.error('Test briefing error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();