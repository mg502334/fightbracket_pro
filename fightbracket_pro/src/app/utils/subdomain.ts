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
 * Builds the canonical base URL for the site without wildcard subdomain requirements.
 * - On fightbracketpro.com -> https://fightbracketpro.com
 * - On localhost:5173 -> http://localhost:5173
 */
export function getBaseOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://fightbracketpro.com';
  }
  const { protocol, host } = window.location;
  // If host has a subdomain like ev-123.fightbracketpro.com, strip it to apex
  if (host.endsWith('.fightbracketpro.com')) {
    return `${protocol}//fightbracketpro.com`;
  }
  if (host.includes('.localhost')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//localhost${port}`;
  }
  return `${protocol}//${host}`;
}

export function getSubdomainOrigin(subdomain?: string): string {
  return getBaseOrigin();
}

/**
 * Builds a shareable event page URL: https://fightbracketpro.com/events/<uniqueId>
 */
export function getEventSubdomainUrl(subdomain?: string | null, slugOrId?: string | null): string {
  const cleanSub = sanitizeSubdomain(subdomain, 'ev');
  const origin = getBaseOrigin();
  const targetSlug = slugOrId || cleanSub;
  return `${origin}/events/${encodeURIComponent(targetSlug)}`;
}

/**
 * Builds a shareable bracket permalink link:
 * https://fightbracketpro.com/t/<uniqueId>
 */
export function getBracketSubdomainUrl(options: {
  subdomain?: string | null;
  tournamentId?: string | null;
  eventSlug?: string | null;
}): string {
  const origin = getBaseOrigin();
  const uniqueId = options.tournamentId || options.subdomain || options.eventSlug || generateRandomSubdomain('fb');
  return `${origin}/t/${encodeURIComponent(uniqueId)}`;
}

/**
 * Builds a direct match permalink:
 * https://fightbracketpro.com/m/<uniqueMatchId>
 * or with tournament context:
 * https://fightbracketpro.com/t/<tournamentId>?match=<matchId>
 */
export function getMatchPermalink(matchId: string, tournamentId?: string | null): string {
  const origin = getBaseOrigin();
  const cleanMatchId = encodeURIComponent(matchId);
  if (tournamentId) {
    return `${origin}/t/${encodeURIComponent(tournamentId)}?match=${cleanMatchId}`;
  }
  return `${origin}/m/${cleanMatchId}`;
}

