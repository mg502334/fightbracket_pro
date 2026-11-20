/**
 * Date and time formatting utilities for FightBracket Pro community events and tournaments.
 * Ensures consistent parsing and local timezone display between client and server.
 */

/**
 * Safely parses an event ISO datetime string or fallback date string into a Date object.
 * Event timestamps from backend are stored in UTC. If the ISO string lacks timezone information
 * (e.g. naive string like "2026-11-22T02:00:00"), 'Z' is appended so JavaScript interprets it
 * as UTC rather than falling back to local time.
 */
export function parseEventDate(isoString?: string | null, fallbackStr?: string | null): Date | null {
  if (!isoString && !fallbackStr) return null;

  if (isoString) {
    try {
      const trimmed = isoString.trim();
      // Check if it already has timezone specification (Z, UTC offset like +00:00 or -06:00 at end)
      const hasTimezone = /[zZ]$|[+-]\d{2}(?::?\d{2})?$/.test(trimmed);
      const safeIso = hasTimezone ? trimmed : `${trimmed}Z`;
      const d = new Date(safeIso);
      if (!isNaN(d.getTime())) return d;
    } catch {
      // continue to fallback
    }
  }

  if (fallbackStr) {
    try {
      const cleanFallback = fallbackStr.replace(' · ', ' ').trim();
      const d = new Date(cleanFallback);
      if (!isNaN(d.getTime())) return d;
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Formats an event date and time for display in the user's local browser timezone.
 * Example output: "Nov 21, 2026 · 8:00 PM" or "Nov 21, 2026 · 8:00 PM CST"
 */
export function formatEventDateTime(
  isoString?: string | null,
  fallbackStr?: string | null,
  options?: { includeTimeZone?: boolean }
): string {
  const d = parseEventDate(isoString, fallbackStr);
  if (!d) return fallbackStr || 'TBD';

  try {
    const datePart = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      ...(options?.includeTimeZone ? { timeZoneName: 'short' } : {})
    }).format(d);

    return `${datePart} · ${timePart}`;
  } catch {
    return fallbackStr || 'TBD';
  }
}

/**
 * Converts a Date object or UTC ISO string into the local "YYYY-MM-DDTHH:mm" format
 * required by HTML `<input type="datetime-local">`.
 */
export function toDateTimeLocalInput(dateOrIso?: Date | string | null): string {
  if (!dateOrIso) return '';
  let d: Date;
  if (typeof dateOrIso === 'string') {
    const parsed = parseEventDate(dateOrIso);
    if (!parsed) return '';
    d = parsed;
  } else {
    d = dateOrIso;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
