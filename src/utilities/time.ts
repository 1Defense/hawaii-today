import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const HAWAII_TIMEZONE = 'Pacific/Honolulu';

/**
 * Format a date/time for Hawaii timezone display
 */
export function formatTime(
  date: Date | string, 
  timezone: string = HAWAII_TIMEZONE,
  formatString: string = 'MMM d, h:mm a'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedTime = utcToZonedTime(dateObj, timezone);
  return format(zonedTime, formatString);
}

/**
 * Get relative time string (e.g., "2 minutes ago", "in 3 hours")
 */
export function getRelativeTime(date: Date | string, timezone: string = HAWAII_TIMEZONE): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const zonedDate = utcToZonedTime(dateObj, timezone);
  const zonedNow = utcToZonedTime(now, timezone);
  
  return formatDistanceToNow(zonedDate, { 
    addSuffix: true,
    includeSeconds: false 
  });
}

/**
 * Get a friendly date description (Today, Tomorrow, Yesterday, or formatted date)
 */
export function getFriendlyDate(date: Date | string, timezone: string = HAWAII_TIMEZONE): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedTime = utcToZonedTime(dateObj, timezone);
  const zonedNow = utcToZonedTime(new Date(), timezone);
  
  if (isToday(zonedTime)) {
    return 'Today';
  } else if (isTomorrow(zonedTime)) {
    return 'Tomorrow';
  } else if (isYesterday(zonedTime)) {
    return 'Yesterday';
  } else {
    return format(zonedTime, 'EEEE, MMM d');
  }
}

/**
 * Get current Hawaii time
 */
export function getHawaiiTime(): Date {
  return utcToZonedTime(new Date(), HAWAII_TIMEZONE);
}

/**
 * Convert UTC time to Hawaii time
 */
export function toHawaiiTime(utcDate: Date | string): Date {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return utcToZonedTime(dateObj, HAWAII_TIMEZONE);
}

/**
 * Convert Hawaii time to UTC
 */
export function toUtcTime(hawaiiDate: Date | string): Date {
  const dateObj = typeof hawaiiDate === 'string' ? new Date(hawaiiDate) : hawaiiDate;
  return zonedTimeToUtc(dateObj, HAWAII_TIMEZONE);
}

/**
 * Get time of day category for styling
 */
export function getTimeOfDay(date?: Date): 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' {
  const hawaiiTime = date ? toHawaiiTime(date) : getHawaiiTime();
  const hour = hawaiiTime.getHours();
  
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Check if a date is within the last N hours
 */
export function isWithinHours(date: Date | string, hours: number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= hours;
}

/**
 * Get sunrise/sunset times for Hawaii (approximate)
 */
export function getSunTimes(date?: Date): { sunrise: Date; sunset: Date } {
  const hawaiiTime = date ? toHawaiiTime(date) : getHawaiiTime();
  
  // Approximate sunrise/sunset for Hawaii (varies by ~1 hour throughout year)
  const sunrise = new Date(hawaiiTime);
  sunrise.setHours(6, 30, 0, 0); // ~6:30 AM average
  
  const sunset = new Date(hawaiiTime);
  sunset.setHours(18, 45, 0, 0); // ~6:45 PM average
  
  return { sunrise, sunset };
}

/**
 * Format time range (e.g., "2:00 PM - 5:00 PM")
 */
export function formatTimeRange(
  startDate: Date | string, 
  endDate: Date | string,
  timezone: string = HAWAII_TIMEZONE
): string {
  const start = formatTime(startDate, timezone, 'h:mm a');
  const end = formatTime(endDate, timezone, 'h:mm a');
  return `${start} - ${end}`;
}

/**
 * Get business hours status
 */
export function getBusinessHoursStatus(
  openHour: number = 9, 
  closeHour: number = 17
): 'open' | 'closed' | 'closing-soon' {
  const hawaiiTime = getHawaiiTime();
  const hour = hawaiiTime.getHours();
  const minute = hawaiiTime.getMinutes();
  const currentMinutes = hour * 60 + minute;
  const openMinutes = openHour * 60;
  const closeMinutes = closeHour * 60;
  const closingSoonMinutes = closeMinutes - 30; // 30 minutes before closing
  
  if (currentMinutes >= openMinutes && currentMinutes < closingSoonMinutes) {
    return 'open';
  } else if (currentMinutes >= closingSoonMinutes && currentMinutes < closeMinutes) {
    return 'closing-soon';
  } else {
    return 'closed';
  }
}