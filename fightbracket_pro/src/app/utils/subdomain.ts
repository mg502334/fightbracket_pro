/**
 * Utilities for generating random subdomains, building subdomain-aware share links
 * for events and brackets, and extracting an active subdomain from the current URL.
 */

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'app', 'mail', 'send', 'admin', 'localhost']);

export function generateRandomSubdomain(prefix: string = 'ev'): string {
  const cleanPrefix = (prefix || 'ev').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'ev';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${cleanPrefix}-${rand}`;
}

export function sanitizeSubdomain(sub?: string | null, fallbackPrefix: string = 'ev'): string {
  if (!sub) return generateRandomSubdomain(fallbackPrefix);
  const cleaned = sub.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
  if (!cleaned || RESERVED_SUBDOMAINS.has(cleaned)) {
    return generateRandomSubdomain(fallbackPrefix);
  }
  return cleaned;
}

/**
 * Extracts the active event/bracket subdomain from the current hostname
 * (e.g., `ev-a8f3k2.fightbracketpro.com` or `ev-a8f3k2.localhost:5173`)
 * or from the `?sub=` query parameter.
 */
export function extractActiveSubdomain(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const subParam = params.get('sub') || params.get('subdomain');
  if (subParam && !RESERVED_SUBDOMAINS.has(subParam.toLowerCase())) {
    return subParam.toLowerCase();
  }

  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.fightbracketpro.com')) {
    const sub = host.slice(0, -'.fightbracketpro.com'.length);
    if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) {
      return sub;
    }
  }

  if (host.endsWith('.localhost')) {
    const sub = host.slice(0, -'.localhost'.length);
    if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) {
      return sub;
    }
  }

  return null;
}

/**
 * Builds the base origin with the given random subdomain.
 * - On fightbracketpro.com -> https://<sub>.fightbracketpro.com
 * - On localhost -> http://<sub>.localhost:<port>
 * - Elsewhere -> https://<sub>.fightbracketpro.com
 */
export function getSubdomainOrigin(subdomain: string): string {
  const cleanSub = sanitizeSubdomain(subdomain);
  if (typeof window === 'undefined') {
    return `https://${cleanSub}.fightbracketpro.com`;
  }
  const { protocol, hostname, port } = window.location;
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host.endsWith('.localhost')) {
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${cleanSub}.localhost${portSuffix}`;
  }

  if (host === 'fightbracketpro.com' || host.endsWith('.fightbracketpro.com')) {
    return `https://${cleanSub}.fightbracketpro.com`;
  }

  // Fallback for preview deployments or IP addresses while still preserving the subdomain
  return `https://${cleanSub}.fightbracketpro.com`;
}

/**
 * Builds a shareable event page URL with its random subdomain.
 */
export function getEventSubdomainUrl(subdomain?: string | null, slugOrId?: string | null): string {
  const cleanSub = sanitizeSubdomain(subdomain, 'ev');
  const origin = getSubdomainOrigin(cleanSub);
  const targetSlug = slugOrId || cleanSub;
  return `${origin}/events/${encodeURIComponent(targetSlug)}?sub=${encodeURIComponent(cleanSub)}`;
}

/**
 * Builds a shareable bracket page link with its random subdomain that can be loaded and run.
 */
export function getBracketSubdomainUrl(options: {
  subdomain?: string | null;
  tournamentId?: string | null;
  eventSlug?: string | null;
}): string {
  const cleanSub = sanitizeSubdomain(options.subdomain, 'fb');
  const origin = getSubdomainOrigin(cleanSub);

  if (options.tournamentId) {
    return `${origin}/t/${encodeURIComponent(options.tournamentId)}?sub=${encodeURIComponent(cleanSub)}`;
  }
  if (options.eventSlug) {
    return `${origin}/?event=${encodeURIComponent(options.eventSlug)}&sub=${encodeURIComponent(cleanSub)}`;
  }
  return `${origin}/t/${encodeURIComponent(cleanSub)}?sub=${encodeURIComponent(cleanSub)}`;
}

