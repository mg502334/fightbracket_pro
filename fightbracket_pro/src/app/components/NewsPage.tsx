import React, { useState, useEffect } from 'react';
import { Megaphone, Wrench, Sparkles, Calendar, ExternalLink, ChevronRight, Trophy, Gamepad2, Tag, Radio, Clock, ShieldCheck } from 'lucide-react';
import { RecentsWidget } from './RecentsWidget';

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
  publishedAt?: number; // timestamp in ms
  game?: string;
  platform?: string;
  discount?: string;
  originalPrice?: string;
  salePrice?: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

const DEFAULT_NEWS_ITEMS: NewsItem[] = [
  {
    id: 'ts_2027',
    type: 'event',
    date: 'Aug 18, 2026',
    publishedAt: NOW - (1 * 24 * 60 * 60 * 1000), // 1 day ago -> Active (6 days left)
    title: 'Texas Showdown 2027',
    body: 'Get ready for Texas Showdown 2027! We are bringing the heat to Houston once again. Pre-registration is officially live. Don\'t miss out on one of the longest-running tournaments in the world!',
    badge: 'EVENT',
    link: 'https://www.start.gg/tournament/texas-showdown-2027/details',
  },
  {
    id: 'signup_promo',
    type: 'feature',
    date: 'Aug 17, 2026',
    publishedAt: NOW - (2 * 24 * 60 * 60 * 1000), // 2 days ago -> Active (5 days left)
    title: 'Why Create a FightBracket Pro Account?',
    body: 'FightBracket Pro is free to join. Create your account in seconds and unlock the full competitive experience — built for the FGC, by the FGC.',
    badge: 'FREE',
    link: 'https://fightbracketpro.com',
    linkLabel: 'Sign Up Free',
    bullets: [
      '🏆  Build your public player profile with your game roster & main characters',
      '📊  Track your tournament history and results imported directly from Start.gg',
      '🎮  Connect your Tekken 8 Polaris ID for live rank & stats',
      '📡  Get a unique FB-ID to share your profile across the community',
      '🗓️  Stay up to date with the latest FGC events and news',
      '💬  Post on the community feed — share results, hype events, call out rivals',
      '👥  Find and follow other players in the FGC user directory',
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
    link: 'https://store.playstation.com',
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
    publishedAt: NOW - (3 * 24 * 60 * 60 * 1000), // 3 days ago -> Active (4 days left)
    title: 'Multi-Platform Stream Support (TikTok, YouTube, Facebook)',
    body: 'The Streams tab now detects and displays Twitch, TikTok, YouTube, and Facebook streams. TikTok handles (@username or bare handle) are correctly resolved to live URLs. Each stream shows a LIVE or PAST badge so you always know whether a broadcast is currently active or already finished.',
    badge: 'NEW',
  },
  {
    id: 'n0b',
    type: 'fix',
    date: 'Aug 14, 2026',
    publishedAt: NOW - (5 * 24 * 60 * 60 * 1000), // 5 days ago -> Active (2 days left)
    title: 'Tournament Winner Badge (WINNER vs ACTIVE)',
    body: 'In a completed tournament, the Grand Final winner is now correctly labelled WINNER (gold) instead of ACTIVE (green). The fix prioritises the Grand Final / Winners Final match when detecting the champion, rather than relying on raw round numbers which differ between Start.gg events.',
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
  const [filter, setFilter] = useState<string>('all');
  const [isArchive, setIsArchive] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(DEFAULT_NEWS_ITEMS);

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

  // Determine active vs auto-archived items based on 7-Day Rule (sales/deals are exempt)
  const isItemArchived = (item: NewsItem): boolean => {
    if (item.archived) return true;
    // Deals/Sales are EXEMPT from 7-day auto-archiving
    if (item.type === 'sale') return false;

    if (item.publishedAt) {
      const ageMs = Date.now() - item.publishedAt;
      return ageMs > SEVEN_DAYS_MS;
    }
    return false;
  };

  const getRemainingDays = (item: NewsItem): string | null => {
    // Deals are exempt
    if (item.type === 'sale') return "Active Deal (Store Sale)";
    if (!item.publishedAt) return null;
    const remainingMs = SEVEN_DAYS_MS - (Date.now() - item.publishedAt);
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

          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400/80 bg-cyan-950/20 px-2.5 py-1 rounded border border-cyan-500/20">
            <Clock size={12} />
            <span>7-Day Active Auto-Archive (Deals Exempt)</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Sidebar: RECENTS Box */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-4">
              <RecentsWidget />
            </div>
          </div>

          {/* Main Column: News Header & Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Megaphone size={28} className={isArchive ? "text-[#a78bfa]" : "text-[#00E5FF]"} />
              <h1 className="text-3xl lg:text-4xl font-bold tracking-widest text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {isArchive ? "NEWS ARCHIVE" : "NEWS & UPDATES"}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mb-6 font-mono">
              {isArchive 
                ? "Historical patch notes and archived announcements (>7 days old)." 
                : "Active patches, announcements (showing for 7 days), and live store discounts across Steam, PS5, Xbox, and Switch."}
            </p>

            {/* Filter Tabs & Archive Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-widest transition-all border ${
                      filter === f.id
                        ? 'bg-[#00E5FF]/10 border-[#00E5FF]/60 text-[#00E5FF]'
                        : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsArchive(!isArchive)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-widest transition-all border shrink-0 ${
                  isArchive
                    ? 'bg-[#a78bfa]/10 border-[#a78bfa]/60 text-[#a78bfa]'
                    : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                }`}
              >
                {isArchive ? '← BACK TO ACTIVE NEWS' : 'VIEW ARCHIVE (>7 DAYS)'}
              </button>
            </div>

            {/* News Cards */}
            <div className="space-y-4">
              {filtered.map(item => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.update;
                const Icon = cfg.icon;
                const daysLeft = getRemainingDays(item);

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
                            {item.badge && (
                              <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-gray-300">
                                {item.badge}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500">{item.date}</span>

                            {!isArchive && daysLeft && (
                              <span 
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded ml-auto"
                                style={{ 
                                  background: item.type === 'sale' ? "rgba(236,72,153,0.15)" : "rgba(6,182,212,0.1)",
                                  color: item.type === 'sale' ? "#f472b6" : "#22d3ee",
                                  border: item.type === 'sale' ? "1px solid rgba(236,72,153,0.3)" : "1px solid rgba(6,182,212,0.2)"
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
                              <span className="text-green-400 font-bold text-sm">{item.salePrice}</span>
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

                          {item.linkLabel && item.link && (
                            onSignUp && item.id === 'signup_promo' ? (
                              <button
                                onClick={onSignUp}
                                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-all font-mono"
                                style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                              >
                                {item.linkLabel} <ChevronRight size={12} />
                              </button>
                            ) : (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-all no-underline font-mono"
                                style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                              >
                                {item.linkLabel} <ChevronRight size={12} />
                              </a>
                            )
                          )}
                        </div>
                      </div>
                      {item.link && (
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
          </div>
        </div>
      </div>
    </div>
  );
}
