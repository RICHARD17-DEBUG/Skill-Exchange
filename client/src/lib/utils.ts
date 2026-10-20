import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a booking to its in-app meeting URL
 * Handles existing database URLs like https://meet.skillexchange.org/bk-jhasbq as well as internal /meet/ references
 */
export function getMeetingUrl(booking: { bookingReference?: string; meetingLink?: string }): string {
  if (booking.bookingReference) {
    return `/meet/${booking.bookingReference.toLowerCase()}`;
  }
  if (booking.meetingLink) {
    const match = booking.meetingLink.match(/\/([a-zA-Z0-9-_]+)$/);
    if (match) {
      return `/meet/${match[1].toLowerCase()}`;
    }
  }
  return '/meet/session';
}