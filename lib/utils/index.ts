import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string, format: string = 'PP'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse HH:MM:SS duration string to milliseconds
 * @param hhmmss Duration string in HH:MM:SS format (e.g., "01:23:45")
 * @returns Duration in milliseconds
 * @throws Error if format is invalid
 */
export const parseHHMMSSToMilliseconds = (hhmmss: string): number => {
  const parts = hhmmss.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid duration format. Expected HH:MM:SS');
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    throw new Error('Invalid duration format. All parts must be numbers');
  }

  if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    throw new Error('Invalid duration values. Hours must be >= 0, minutes and seconds must be 0-59');
  }

  const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
  return totalMilliseconds;
};
