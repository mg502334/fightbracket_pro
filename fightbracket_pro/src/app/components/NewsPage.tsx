import React, { useState, useEffect } from 'react';
import { Megaphone, Wrench, Sparkles, Calendar, ExternalLink, ChevronRight, Trophy, Gamepad2, Tag, Radio, Clock, ShieldCheck, Search, Filter, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { RecentsWidget } from './RecentsWidget';
import { DealsWidget } from './DealsWidget';

export interface RegistrationPhase {
  label: string;             // e.g. "Early Reg", "Normal Reg", "Late Reg"
  badge: string;             // e.g. "EARLY REG", "NORMAL REG", "LATE REG"
  endsAt: string | number;   // ISO timestamp or ms
}

export interface NewsItem {
  id: string;
  type: 'update' | 'fix' | 'feature' | 'event' | 'sale';
  date: string;
  title: string;
  body: string;
  bullets?: string[];
  badge?: string;
  link?: string;
  linkLabel?: string;
  archived?: boolean;
  expired?: boolean;
  publishedAt?: number | string; // timestamp in ms or ISO string
  expiresAt?: number | string;   // timestamp in ms or ISO string
  expiryLabel?: string;
  registrationPhases?: RegistrationPhase[]; // Multi-phase registration schedule
  game?: string;
  platform?: string;
  discount?: string;
  originalPrice?: string;
  salePrice?: string;
}

export interface GamePatch {
  id: string;
  gameId: string;
  gameName: string;
  gameColor: string;
  appid: number;
  title: string;
  author: string;
  url: string;
  contents: string;
  date: string;
  timestamp: number;
}

// Helper to evaluate multi-phase registration state dynamically
export function getActiveRegistrationState(item: NewsItem) {
  if (item.registrationPhases && item.registrationPhases.length > 0) {
    const now = Date.now();
    for (const phase of item.registrationPhases) {
      const expTime = typeof phase.endsAt === 'number'
        ? phase.endsAt
        : new Date(phase.endsAt).getTime();
      if (!isNaN(expTime) && now <= expTime) {
        const remainingMs = expTime - now;
        const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        return {
          activePhase: phase,
          badge: phase.badge,
          statusText: `${phase.label} Ends ${new Date(phase.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${days} ${days === 1 ? 'day' : 'days'} left`,
          isAllClosed: false,
        };
      }
    }
    // If all registration phases have ended:
    return {
      activePhase: null,
      badge: 'REGISTRATION CLOSED',
      statusText: 'REGISTRATION CLOSED',
      isAllClosed: true,
    };
  }
  return null;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

const DEFAULT_GAME_PATCHES: GamePatch[] = [
  {
    id: 'official-t8-v301',
    gameId: 'tekken8',
    gameName: 'Tekken 8',
    gameColor: '#00E5FF',
    appid: 1778820,
    title: 'TEKKEN 8 Patch Notes Ver. 3.01.01 (Official Bandai Namco)',
    author: 'Bandai Namco Entertainment America Inc.',
    url: 'https://www.bandainamcoent.com/news/tekken-8-patch-notes-v3-01-01',
    contents: 'Official Bandai Namco Patch Release Ver 3.01.01: Special Move Heat System properties adjusted across character moves, stance transitions tuned, competitive stage adjustments, and online lobby stability improvements.',
    date: 'Aug 24, 2026',
    timestamp: NOW - (1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'official-t8-v205',
    gameId: 'tekken8',
    gameName: 'Tekken 8',
    gameColor: '#00E5FF',
    appid: 1778820,
    title: 'TEKKEN 8 Patch Notes Ver. 2.05.00 (Official Bandai Namco)',
    author: 'Bandai Namco Entertainment America Inc.',
    url: 'https://www.bandainamcoent.com/news/tekken-8-patch-notes-v2-05',
    contents: 'Official Bandai Namco Patch Release Ver 2.05: Battle balance adjustments for stance attacks across the roster, Heat Dash combo scaling rebalanced, and wall combo scaling updates.',
    date: 'Jul 18, 2026',
    timestamp: NOW - (38 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'patch-sf6-v2',
    gameId: 'sf6',
    gameName: 'Street Fighter 6',
    gameColor: '#FF006E',
    appid: 1364780,
    title: 'Street Fighter 6 Year 2 Official Character & Battle Balance Patch',
    author: 'Capcom Official (Buckler\'s Boot Camp)',
    url: 'https://www.streetfighter.com/6/',
    contents: 'Capcom Official Battle Balance Update: Drive Gauge recovery rates tuned, Perfect Parry scaling adjustments, and specific hurtbox refinements across all Year 2 roster characters.',
    date: 'Aug 18, 2026',
    timestamp: NOW - (7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'patch-ggst-ver',
    gameId: 'ggst',
    gameName: 'Guilty Gear -Strive-',
    gameColor: '#F59E0B',
    appid: 1384160,
    title: 'Guilty Gear -Strive- Season 4 Official Balance Adjustments',
    author: 'Arc System Works Official',
    url: 'https://www.arcsystemworks.jp/',
    contents: 'Arc System Works Official Patch: Wild Assault tension cost adjustments, Deflect Shield active frames update, and individual move properties adjusted for competitive play.',
    date: 'Aug 15, 2026',
    timestamp: NOW - (10 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'patch-mk1-kombat',
    gameId: 'mk1',
    gameName: 'Mortal Kombat 1',
    gameColor: '#EF4444',
    appid: 1792670,
    title: 'Mortal Kombat 1 Official Patch Notes & Kameo Rebalance',
    author: 'NetherRealm Studios Official',
    url: 'https://www.mortalkombat.com',
    contents: 'NetherRealm Official Game Update: Kameo assist cooldown rebalancing, fatal blow armor adjustments, and general fix for offline & online tournament modes.',
    date: 'Aug 12, 2026',
    timestamp: NOW - (13 * 24 * 60 * 60 * 1000)
  }
];

const GAME_FILTER_OPTIONS = [
  { id: 'all',          name: 'ALL GAMES',                    color: '#ffffff' },
  { id: 'tekken8',      name: 'Tekken 8',                     color: '#00E5FF' },
  { id: 'sf6',          name: 'Street Fighter 6',             color: '#FF006E' },
  { id: 'ggst',         name: 'Guilty Gear -Strive-',         color: '#F59E0B' },
  { id: 'mk1',          name: 'Mortal Kombat 1',              color: '#EF4444' },
  { id: 'sparkingzero', name: 'DB: Sparking! ZERO',           color: '#3B82F6' },
  { id: 'gbfvr',        name: 'GBVS: Rising',                 color: '#10B981' }
];

const DEFAULT_NEWS_ITEMS: NewsItem[] = [
  {
    id: 'social_feed_v2',
    type: 'feature',
    date: 'Aug 19, 2026',
    publishedAt: NOW - (2 * 60 * 60 * 1000), // 2 hours ago -> Active
    title: 'Social Community Feed: Comments, Reposts & Reaction Picker',
    body: 'The Community Feed has received a massive social upgrade! Interact with fellow players, celebrate hype tournament upsets, and share bracket results with full social interactivity.',
    badge: 'NEW',
    bullets: [
      'Interactive Comment Threads: Open any post to join discussions and reply to community posts.',
      '1-Click Feed Reposting: Share noteworthy matches, tournament clips, and announcements to your followers.',
      'Multi-Emoji Reaction Picker: React with 7 expressive emojis with real-time counters.',
    ],
  },
  {
    id: 'recents_deals_widgets',
    type: 'feature',
    date: 'Aug 19, 2026',
    publishedAt: NOW - (4 * 60 * 60 * 1000), // 4 hours ago -> Active
    title: "New 'RECENTS' & 'DEALS' Sidebar Widgets Live",
    body: 'Stay on top of live competition and gear deals with dedicated sidebar widgets in News, Feed, and My Feed.',
    badge: 'NEW',
    bullets: [
      'Active Tournaments & Exhibitions: Live event tracker with automatic Friend Prioritization (highlighting friend events first).',
      '4-Hour Freshness Window: Completed tournaments and exhibition showcase streams are cleanly archived after 4 hours.',
      'FGC Deals Box: Curated discounts on fightsticks, leverless controllers, character season passes, and sales.',
    ],
  },
  {
    id: 'game_requests_support',
    type: 'feature',
    date: 'Aug 19, 2026',
    publishedAt: NOW - (6 * 60 * 60 * 1000), // 6 hours ago -> Active
    title: 'Support Center: Request Missing Fighting Games & Platforms',
    body: 'Want a new fighting game, platform (Steam, PS5, Xbox, Switch, Arcade), or Start.gg community bracket added to FightBracket Pro? You can now submit direct Game Addition Requests through our Help & Support Center modal with instant routing.',
    badge: 'UPDATED',
    link: 'https://fightbracketpro.com',
    linkLabel: 'Open Support Center',
  },
  {
    id: 'ts_2027',
    type: 'event',
    date: 'Aug 18, 2026',
    publishedAt: NOW - (1 * 24 * 60 * 60 * 1000), // 1 day ago -> Active
    registrationPhases: [
      {
        label: 'Early Reg',
        badge: 'EARLY REG',
        endsAt: '2026-08-30T23:59:59Z'
      },
      {
        label: 'Normal Reg',
        badge: 'NORMAL REG',
        endsAt: '2026-12-31T23:59:59Z'
      },
      {
        label: 'Late Reg',
        badge: 'LATE REG',
        endsAt: '2027-04-15T23:59:59Z'
      }
    ],
    title: 'Texas Showdown 2027 Pre-Registration Live',
    body: 'Get ready for Texas Showdown 2027! Houston is bringing the heat once again with major brackets across all premier fighting games. Pre-registration is officially live on Start.gg. Early registration rates end August 30th.',
    link: 'https://www.start.gg/tournament/texas-showdown-2027/details',
    linkLabel: 'View Start.gg Event',
  },
  {
    id: 'signup_promo',
    type: 'feature',
    date: 'Aug 17, 2026',
    publishedAt: NOW - (2 * 24 * 60 * 60 * 1000), // 2 days ago -> Active
    title: 'Why Create a FightBracket Pro Account?',
    body: 'FightBracket Pro is free to join. Create your account in seconds and unlock the full competitive experience — built for the FGC, by the FGC.',
    badge: 'FREE',
    link: 'https://fightbracketpro.com',
    linkLabel: 'Sign Up Free',
    bullets: [
      'Build your public player profile with your game roster & main characters',
      'Track your tournament history and results imported directly from Start.gg',
      'Connect your Tekken 8 Polaris ID for live rank & stats',
      'Get a unique FB-ID to share your profile across the community',
      'Stay up to date with the latest FGC events and news',
      'Post on the community feed — share results, hype events, call out rivals',
      'Find and follow other players in the FGC user directory',
    ],
  },
  {
    id: 'deal_t8_season2',
    type: 'sale',
    date: 'Verified Store Sale',
    publishedAt: NOW - (3 * 24 * 60 * 60 * 1000), // Deals are EXEMPT from 7-day auto-archive
    title: 'Tekken 8 — Season Pass 2 Pre-Order Deal',
    body: 'Tekken 8 Season Pass 2 characters are discounted on Steam, PlayStation Store, and Xbox. Upgrade your roster before the tournament season heats up.',
    badge: '-25% SALE',
    link: 'https://store.steampowered.com/app/1778820/TEKKEN_8/',
    linkLabel: 'Claim Store Deal',
    game: 'Tekken 8',
    platform: 'Steam / PS5 / Xbox',
    discount: '-25%',
    originalPrice: '$39.99',
    salePrice: '$29.99',
  },
  {
    id: 'deal_sf6_pass',
    type: 'sale',
    date: 'Limited Time Deal',
    publishedAt: NOW - (4 * 24 * 60 * 60 * 1000), // Deals are EXEMPT from 7-day auto-archive
    title: 'Street Fighter 6 — Year 2 Character Pass Sale',
    body: 'Unlock Terry Bogard, Mai Shiranui, Elena, and M. Bison at discounted rates on the PlayStation and Microsoft stores.',
    badge: '-33% DEAL',
    link: 'https://store.playstation.com/en-us/product/UP0102-PPSA02633_00-SF6Y2CHARPASS000',
    linkLabel: 'View PSN Deal',
    game: 'Street Fighter 6',
    platform: 'PlayStation Store',
    discount: '-33%',
    originalPrice: '$29.99',
    salePrice: '$19.99',
  },
  {
    id: 'n0a',
    type: 'update',
    date: 'Aug 16, 2026',
    publishedAt: NOW - (3 * 24 * 60 * 60 * 1000), // 3 days ago -> Active
    title: 'Multi-Platform Stream Support (TikTok, YouTube, Facebook)',
    body: 'The Streams tab now detects and displays Twitch, TikTok, YouTube, and Facebook streams. TikTok handles (@username or bare handle) are correctly resolved to live URLs. Each stream shows a LIVE or PAST badge so you always know whether a broadcast is currently active or already finished.',
    badge: 'UPDATED',
  },
  {
    id: 'n0b',
    type: 'fix',
    date: 'Aug 14, 2026',
    publishedAt: NOW - (5 * 24 * 60 * 60 * 1000), // 5 days ago -> Active
    title: 'Tournament Winner Badge & Bracket Improvements',
    body: 'In a completed tournament, the Grand Final winner is now correctly labelled WINNER (gold) instead of ACTIVE (green). In addition, Start.gg multi-pool phase separation and chronological round ordering have been improved.',
    badge: 'PATCH',
  },
  // Auto-Archived Items (> 7 days old)
  {
    id: 'n0c',
    type: 'fix',
    date: 'Aug 3, 2026',
    publishedAt: NOW - (16 * 24 * 60 * 60 * 1000), // 16 days ago -> Auto-archived by 7-day rule
    title: 'Bracket Round Indicators & Ordering',
    body: 'Bracket columns are now sorted in the correct chronological order for both Winners and Losers sides regardless of how Start.gg numbers the rounds. Column labels also strip the internal [Pool X] prefix and instead show descriptive names like "Winners Round 1" or "Losers Semi-Final".',
    archived: true,
  },
  {
    id: 'n0d',
    type: 'fix',
    date: 'Aug 3, 2026',
    publishedAt: NOW - (16 * 24 * 60 * 60 * 1000), // 16 days ago -> Auto-archived
    title: 'DQ / Absent Players No Longer Auto-Checked-In',
    body: 'Players who receive a DQ (Disqualification) result due to absence in a Start.gg import were previously being auto-marked as Checked In. This is now corrected — a DQ loss no longer triggers an automatic check-in for the absent player.',
    archived: true,
  },
  {
    id: 'n0e',
    type: 'feature',
    date: 'Aug 3, 2026',
    publishedAt: NOW - (16 * 24 * 60 * 60 * 1000), // 16 days ago -> Auto-archived
    title: 'Pool Phase Grouping Fixed',
    body: 'The Pools tab now correctly groups matches by their Start.gg phase (e.g. "Pools", "Top 24", "Top 8"). Previously, all phases were flattened into a single list and pools with matching identifiers could overwrite each other.',
    badge: 'NEW',
    archived: true,
  },
  {
    id: 'n1',
    type: 'feature',
    date: 'Aug 1, 2026',
    publishedAt: NOW - (18 * 24 * 60 * 60 * 1000), // 18 days ago -> Auto-archived
    title: 'Home Page, News Feed & User Search Launched',
    body: 'FightBracket Pro now features a full home page with news, updates, and a searchable user directory. Find other players by their gamer tag or FB-ID.',
    badge: 'NEW',
    archived: true,
  },
  {
    id: 'n2',
    type: 'feature',
    date: 'Aug 1, 2026',
    publishedAt: NOW - (18 * 24 * 60 * 60 * 1000), // 18 days ago -> Auto-archived
    title: 'Tekken 8 Polaris ID Integration',
    body: 'You can now add your Tekken 8 Polaris ID to your profile. Future updates will pull live player stats and rankings directly into the app.',
    badge: 'NEW',
    archived: true,
  }
];

const TYPE_CONFIG = {
  update:  { icon: Megaphone,  color: '#00E5FF', bg: 'border-[#00E5FF]/20', label: 'UPDATE' },
  fix:     { icon: Wrench,     color: '#00FF88', bg: 'border-[#00FF88]/20', label: 'FIX' },
  feature: { icon: Sparkles,   color: '#a78bfa', bg: 'border-[#a78bfa]/20', label: 'FEATURE' },
  event:   { icon: Calendar,   color: '#f59e0b', bg: 'border-[#f59e0b]/20', label: 'EVENT' },
  sale:    { icon: Tag,        color: '#FF006E', bg: 'border-[#FF006E]/20', label: 'SALE & DEALS' },
};

const FILTERS = [
  { id: 'all',     label: 'ALL' },
  { id: 'feature', label: 'FEATURES' },
  { id: 'update',  label: 'UPDATES' },
  { id: 'fix',     label: 'FIXES' },
  { id: 'event',   label: 'EVENTS' },
  { id: 'sale',    label: 'SALES & DEALS' },
] as const;

interface NewsPageProps {
  onNavigateHome: () => void;
  onSignUp?: () => void;
}

export function NewsPage({ onNavigateHome, onSignUp }: NewsPageProps) {
  const [mainTab, setMainTab] = useState<'news' | 'patches'>('news');
  const [filter, setFilter] = useState<string>('all');
  const [isArchive, setIsArchive] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(DEFAULT_NEWS_ITEMS);

  // Game Patches State (Steam ISteamNews API)
  const [patchSearchQuery, setPatchSearchQuery] = useState('');
  const [patchGameFilter, setPatchGameFilter] = useState('all');
  const [gamePatches, setGamePatches] = useState<GamePatch[]>(DEFAULT_GAME_PATCHES);
  const [isLoadingPatches, setIsLoadingPatches] = useState(false);
  const [expandedPatchId, setExpandedPatchId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.active || data.archived) {
          const merged = [...(data.active || []), ...(data.archived || [])];
          if (merged.length > 0) {
            setNewsItems(merged);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mainTab === 'patches') {
      setIsLoadingPatches(true);
      fetch(`/api/patches${patchGameFilter !== 'all' ? `?game=${patchGameFilter}` : ''}`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.patches) && data.patches.length > 0) {
            setGamePatches(data.patches);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingPatches(false));
    }
  }, [mainTab, patchGameFilter]);

  // Determine active vs auto-archived items based on expiration date or 7-Day Rule
  const isItemArchived = (item: NewsItem): boolean => {
    if (item.archived || item.expired) return true;

    // Multi-phase registration schedule check
    const regState = getActiveRegistrationState(item);
    if (regState) {
      return regState.isAllClosed;
    }

    // Custom expiration date check (e.g. Early Registration deadline)
    if (item.expiresAt) {
      const expTime = typeof item.expiresAt === 'number'
        ? item.expiresAt
        : new Date(item.expiresAt).getTime();
      if (!isNaN(expTime) && Date.now() > expTime) {
        return true;
      }
    }

    if (item.type === 'sale') return Boolean(item.expired || item.archived);

    if (item.publishedAt) {
      const pubTime = typeof item.publishedAt === 'number'
        ? item.publishedAt
        : new Date(item.publishedAt).getTime();

      if (!isNaN(pubTime)) {
        const ageMs = Date.now() - pubTime;
        return ageMs > SEVEN_DAYS_MS;
      }
    }
    return false;
  };

  const getRemainingDays = (item: NewsItem): string | null => {
    const regState = getActiveRegistrationState(item);
    if (regState) {
      return regState.statusText;
    }

    if (item.expiresAt) {
      const expTime = typeof item.expiresAt === 'number'
        ? item.expiresAt
        : new Date(item.expiresAt).getTime();
      if (!isNaN(expTime)) {
        const remainingMs = expTime - Date.now();
        if (remainingMs <= 0) return "REGISTRATION CLOSED";
        const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        return `${item.expiryLabel ? `${item.expiryLabel} · ` : ''}${days} ${days === 1 ? 'day' : 'days'} left`;
      }
    }

    if (item.type === 'sale') {
      return (item.expired || item.archived) ? "EXPIRED DEAL" : "VERIFIED ACTIVE DEAL";
    }

    if (!item.publishedAt) return null;

    const pubTime = typeof item.publishedAt === 'number'
      ? item.publishedAt
      : new Date(item.publishedAt).getTime();

    if (isNaN(pubTime)) return null;

    const remainingMs = SEVEN_DAYS_MS - (Date.now() - pubTime);
    if (remainingMs <= 0) return "Archived";
    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  };

  const filtered = newsItems.filter(n => {
    const archived = isItemArchived(n);
    if (isArchive && !archived) return false;
    if (!isArchive && archived) return false;
    if (filter !== 'all' && n.type !== filter) return false;
    return true;
  });

  const filteredPatches = gamePatches.filter(p => {
    if (patchGameFilter !== 'all' && p.gameId !== patchGameFilter) return false;
    if (patchSearchQuery.trim()) {
      const q = patchSearchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchGame = p.gameName.toLowerCase().includes(q);
      const matchContents = p.contents.toLowerCase().includes(q);
      const matchAuthor = p.author.toLowerCase().includes(q);
      if (!matchTitle && !matchGame && !matchContents && !matchAuthor) return false;
    }
    return true;
  });

  return (
    <div className="min-h-full p-4 lg:p-8 animate-in fade-in duration-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Back */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNavigateHome}
            className="text-xs text-gray-500 hover:text-[#00E5FF] transition-colors flex items-center gap-1 font-mono"
          >
            ← BACK TO HOME
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Sidebar: RECENTS & DEALS Box */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-4 flex flex-col gap-4">
              <RecentsWidget />
              <DealsWidget />
            </div>
          </div>

          {/* Main Column */}
          <div className="flex-1 min-w-0">

            {/* Primary Navigation Tabs: PLATFORM NEWS vs GAME PATCHES */}
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <button
                onClick={() => setMainTab('news')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all font-mono flex items-center gap-2 ${
                  mainTab === 'news'
                    ? "bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Megaphone size={14} />
                <span>PLATFORM NEWS & DEALS</span>
              </button>

              <button
                onClick={() => setMainTab('patches')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all font-mono flex items-center gap-2 ${
                  mainTab === 'patches'
                    ? "bg-[#a78bfa] text-black shadow-lg shadow-[#a78bfa]/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Gamepad2 size={14} />
                <span>GAME PATCH NOTES (STEAM)</span>
              </button>
            </div>

            {/* MAIN TAB 1: PLATFORM NEWS & DEALS */}
            {mainTab === 'news' ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <Megaphone size={28} className={isArchive ? "text-[#a78bfa]" : "text-[#00E5FF]"} />
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-widest text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {isArchive ? "NEWS ARCHIVE" : "NEWS & UPDATES"}
                  </h1>
                </div>
                <p className="text-xs text-gray-400 mb-6">
                  Official FightBracket Pro platform updates, tournament announcements, and verified FGC deals.
                </p>

                {/* Archive / Active Tabs */}
                <div className="flex items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsArchive(false)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all font-mono ${
                        !isArchive
                          ? "bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      ACTIVE NEWS & DEALS ({newsItems.filter(n => !isItemArchived(n)).length})
                    </button>
                    <button
                      onClick={() => setIsArchive(true)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all font-mono ${
                        isArchive
                          ? "bg-[#a78bfa] text-black shadow-lg shadow-[#a78bfa]/20"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      ARCHIVE ({newsItems.filter(n => isItemArchived(n)).length})
                    </button>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {FILTERS.map(f => {
                    const isActive = filter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider transition-all font-mono uppercase ${
                          isActive
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* News Stream List */}
                <div className="space-y-4">
                  {filtered.map(item => {
                    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.update;
                    const Icon = cfg.icon;
                    const daysLeft = getRemainingDays(item);
                    const regState = getActiveRegistrationState(item);
                    const displayBadge = regState ? regState.badge : item.badge;
                    const isDeal = item.type === 'sale';
                    const isExpiredDeal = isDeal && (item.expired || item.archived);
                    const isRegistrationClosed = regState?.isAllClosed;

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#050A14] border ${cfg.bg} rounded-xl p-5 transition-all hover:brightness-110`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div
                              className="p-2 rounded-lg shrink-0 mt-0.5"
                              style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}
                            >
                              <Icon size={16} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                  className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase"
                                  style={{ background: `${cfg.color}15`, color: cfg.color }}
                                >
                                  {cfg.label}
                                </span>
                                {displayBadge && (
                                  <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded font-mono ${
                                    isRegistrationClosed 
                                      ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                                      : 'bg-white/5 text-gray-300'
                                  }`}>
                                    {displayBadge}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-500">{item.date}</span>

                                {daysLeft && (
                                  <span 
                                    className="text-[9px] font-mono px-2 py-0.5 rounded ml-auto font-bold tracking-wider uppercase"
                                    style={{ 
                                      background: isRegistrationClosed || isExpiredDeal
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : isDeal
                                        ? "rgba(0, 255, 136, 0.15)"
                                        : "rgba(6,182,212,0.1)",
                                      color: isRegistrationClosed || isExpiredDeal
                                        ? "#f87171"
                                        : isDeal
                                        ? "#00FF88"
                                        : "#22d3ee",
                                      border: isRegistrationClosed || isExpiredDeal
                                        ? "1px solid rgba(239, 68, 68, 0.3)"
                                        : isDeal
                                        ? "1px solid rgba(0, 255, 136, 0.3)"
                                        : "1px solid rgba(6,182,212,0.2)"
                                    }}
                                  >
                                    {daysLeft}
                                  </span>
                                )}
                              </div>

                              <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.15rem' }}>
                                {item.title}
                              </h2>

                              {/* Deal specific price tags if available */}
                              {item.type === 'sale' && item.salePrice && (
                                <div className="flex items-center gap-3 my-2 font-mono text-xs">
                                  {item.originalPrice && <span className="text-gray-500 line-through text-[11px]">{item.originalPrice}</span>}
                                  <span className={`font-bold text-sm ${isExpiredDeal ? 'text-gray-400 line-through' : 'text-green-400'}`}>
                                    {item.salePrice}
                                  </span>
                                  {item.platform && <span className="text-gray-400 text-[10px]">· {item.platform}</span>}
                                </div>
                              )}

                              <p className="text-xs text-gray-400 leading-relaxed">{item.body}</p>
                              
                              {item.bullets && (
                                <ul className="mt-3 space-y-1.5">
                                  {item.bullets.map((b, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {isRegistrationClosed ? (
                                <span
                                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest font-mono opacity-50 cursor-not-allowed border border-white/10 bg-white/5 text-gray-400"
                                >
                                  REGISTRATION CLOSED & ARCHIVED
                                </span>
                              ) : item.type === 'sale' && isExpiredDeal ? (
                                <span
                                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest font-mono opacity-50 cursor-not-allowed border border-white/10 bg-white/5 text-gray-400"
                                >
                                  OFFER EXPIRED & ARCHIVED
                                </span>
                              ) : item.type === 'feature' && item.id === 'game_requests_support' ? (
                                <button
                                  onClick={() => window.dispatchEvent(new CustomEvent('open-support'))}
                                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-all font-mono cursor-pointer"
                                  style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                                >
                                  {item.linkLabel} <ChevronRight size={12} />
                                </button>
                              ) : onSignUp && item.id === 'signup_promo' ? (
                                <button
                                  onClick={onSignUp}
                                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-all font-mono cursor-pointer"
                                  style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                                >
                                  {item.linkLabel} <ChevronRight size={12} />
                                </button>
                              ) : item.link ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-all no-underline font-mono"
                                  style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                                >
                                  {item.linkLabel} <ChevronRight size={12} />
                                </a>
                              ) : null}
                            </div>
                          </div>
                          {item.link && !isExpiredDeal && !isRegistrationClosed && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#00E5FF] transition-colors mt-1"
                            >
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-20 opacity-30">
                    <Trophy size={40} className="mx-auto mb-4" />
                    <p className="text-sm font-mono">No items in this category.</p>
                  </div>
                )}
              </>
            ) : (
              /* MAIN TAB 2: GAME PATCH NOTES (STEAM ISteamNews) */
              <>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <Gamepad2 size={28} className="text-[#a78bfa]" />
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-widest text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      GAME PATCH NOTES
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#a78bfa] bg-[#a78bfa]/10 px-2.5 py-1 rounded border border-[#a78bfa]/30">
                    <Radio size={12} className="animate-pulse" />
                    <span>STEAM ISteamNews ACTIVE</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-6">
                  Official developer patch notes, character balance updates, and version releases fetched directly via Steam Web API.
                </p>

                {/* Search Bar & Game Filter Pills */}
                <div className="space-y-3 mb-6">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={patchSearchQuery}
                      onChange={(e) => setPatchSearchQuery(e.target.value)}
                      placeholder="Search patch notes (e.g. Ver 1.05, Drive Gauge, Mishima, Combo)..."
                      className="w-full bg-[#050A14] border border-white/10 focus:border-[#a78bfa] text-white text-xs rounded-xl pl-10 pr-10 py-2.5 transition-all outline-none font-mono"
                    />
                    {patchSearchQuery && (
                      <button
                        onClick={() => setPatchSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Game Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {GAME_FILTER_OPTIONS.map(g => {
                      const isActive = patchGameFilter === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setPatchGameFilter(g.id)}
                          className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider transition-all font-mono uppercase flex items-center gap-1.5 ${
                            isActive
                              ? "bg-white/20 text-white border border-white/30"
                              : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patch Stream List */}
                {isLoadingPatches ? (
                  <div className="text-center py-20 text-gray-400 font-mono text-xs flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-[#a78bfa]" />
                    <span>Fetching live Steam patch notes...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPatches.map(patch => {
                      const isExpanded = expandedPatchId === patch.id;
                      return (
                        <div
                          key={patch.id}
                          className="bg-[#050A14] border border-white/10 hover:border-[#a78bfa]/40 rounded-xl p-5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className="text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded font-mono uppercase"
                                  style={{
                                    background: `${patch.gameColor}15`,
                                    color: patch.gameColor,
                                    border: `1px solid ${patch.gameColor}30`
                                  }}
                                >
                                  {patch.gameName}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                  by {patch.author}
                                </span>
                                <span className="text-[10px] font-mono text-gray-500 ml-auto">
                                  {patch.date}
                                </span>
                              </div>

                              <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                {patch.title}
                              </h2>

                              <p className={`text-xs text-gray-300 leading-relaxed font-mono ${isExpanded ? '' : 'line-clamp-3'}`}>
                                {patch.contents}
                              </p>

                              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                                <button
                                  onClick={() => setExpandedPatchId(isExpanded ? null : patch.id)}
                                  className="text-xs text-[#a78bfa] hover:text-purple-300 font-mono font-bold flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>Collapse Notes <ChevronUp size={12} /></>
                                  ) : (
                                    <>Read Full Patch Notes <ChevronDown size={12} /></>
                                  )}
                                </button>

                                <a
                                  href={patch.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1 no-underline ml-auto"
                                >
                                  View on Steam <ExternalLink size={12} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredPatches.length === 0 && (
                      <div className="text-center py-20 opacity-40 font-mono text-xs">
                        <Gamepad2 size={40} className="mx-auto mb-3 text-purple-400" />
                        <p>No patch notes found matching search query or game filter.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* FGC Community Resources & Stats Footer */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                  <div className="text-gray-400 font-bold tracking-wider">
                    FGC COMMUNITY RESOURCES & STATS
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    <a
                      href="https://ewgf.gg/changelog"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 no-underline"
                    >
                      <span>EWGF.gg Tekken Stats</span>
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href="https://tekkendocs.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 no-underline"
                    >
                      <span>Tekken Docs</span>
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href="https://wavu.wiki"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 no-underline"
                    >
                      <span>Wavu Wiki</span>
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href="https://www.streetfighter.com/6/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 flex items-center gap-1 no-underline"
                    >
                      <span>Buckler's Boot Camp (SF6)</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
