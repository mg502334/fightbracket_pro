import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, GitBranch, UserCheck, Monitor, MessageSquare, Smartphone,
  ExternalLink, RefreshCw, Zap, MapPin, Globe, Moon, Sun, X, Tv, Cloud, Play, LayoutGrid, Trash2, Megaphone, Search
} from "lucide-react";
import { useTheme } from "next-themes";

const API_URL = import.meta.env.VITE_API_URL || '';

import { GameBanner } from "./components/GameBanner";
import { AddPlayerModal } from "./components/AddPlayerModal";
import { supabase } from "./supabaseClient";
import { BracketView } from "./components/BracketView";
import { CheckInPanel } from "./components/CheckInPanel";
import { StationsPanel } from "./components/StationsPanel";
import { AnnouncementOverlay } from "./components/AnnouncementOverlay";
import { GameSelectionModal } from "./components/GameSelectionModal";
import { ImportModal } from "./components/ImportModal";
import { CallMatchModal } from "./components/CallMatchModal";
import { StreamsPanel } from "./components/StreamsPanel";
import { ExhibitionsPanel } from "./components/ExhibitionsPanel";
import { AccountDashboard } from "./components/AccountDashboard";
import { PoolsPanel } from "./components/PoolsPanel";
import { ReportScoreModal } from "./components/ReportScoreModal";
import { FriendsModal } from "./components/FriendsModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { UserDirectoryModal } from "./components/UserDirectoryModal";
import { StaticPageModal, type StaticPageId } from "./components/StaticPageModal";
import { OfficialRulesModal } from "./components/OfficialRulesModal";
import { TermsOfServiceModal } from "./components/TermsOfServiceModal";
import { NewsPage } from "./components/NewsPage";
import { PasswordResetModal } from "./components/PasswordResetModal";
import { SupportModal } from "./components/SupportModal";
import { Users } from "lucide-react";

import {
  type BracketMatch, type Player, type Station, type SMSLog, type GameTheme, type ExhibitionMatch,
  GAME_THEMES, generateMockDataForGame, generateDynamicBracket, BracketType
} from "./data/tournamentData";

type Tab = 'overview' | 'bracket' | 'checkin' | 'stations' | 'streams' | 'vods' | 'pools' | 'account' | 'news';

const DEFAULT_GAME_ORDER: string[] = ['tekken8', 'sf6', 'fatalFury'];
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: Trophy },
  { id: 'pools', label: 'POOLS', icon: LayoutGrid },
  { id: 'bracket', label: 'BRACKET', icon: GitBranch },
  { id: 'checkin', label: 'CHECK-IN', icon: UserCheck },
  { id: 'stations', label: 'STATIONS', icon: Monitor },
  { id: 'streams', label: 'STREAMS', icon: Tv },
  { id: 'vods', label: 'EXHIBITIONS', icon: Play },
  { id: 'account', label: 'ACCOUNT', icon: UserCheck },
];

export function parseStreamUrl(streamName: string, streamSource?: string): string {
  if (!streamName) return '';
  if (streamName.startsWith('http')) return streamName;

  // TikTok - handle domain, @username, or bare username
  if (streamSource === 'TIKTOK' || streamName.includes('tiktok')) {
    if (streamName.includes('tiktok.com')) return `https://${streamName.replace(/^\/\//, '')}`;
    const handle = streamName.startsWith('@') ? streamName : `@${streamName}`;
    return `https://www.tiktok.com/${handle}/live`;
  }
  if (streamName.includes('tiktok.com')) return `https://${streamName.replace(/^\/\//, '')}`;

  // YouTube
  if (streamName.includes('youtube.com') || streamName.includes('youtu.be')) return `https://${streamName.replace(/^\/\//, '')}`;
  if (streamSource === 'YOUTUBE') return `https://youtube.com/@${streamName}/live`;

  // Facebook
  if (streamSource === 'FACEBOOK') return `https://facebook.com/${streamName}`;

  // Twitch (default)
  if (streamName.includes('twitch.tv')) return `https://${streamName.replace(/^\/\//, '')}`;
  return `https://twitch.tv/${streamName}`;
}

export default function App() {
  const safeParse = (key: string, defaultVal: any) => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : defaultVal; } catch { return defaultVal; }
  };

  const [activeGame, setActiveGame] = useState<string | null>(() => safeParse('fb_activeGame', null));
  const [activeTab, setActiveTab] = useState<Tab>(() => safeParse('fb_activeTab', 'overview'));
  const [players, setPlayers] = useState<Player[]>(() => safeParse('fb_players', []));
  const [matches, setMatches] = useState<BracketMatch[]>(() => safeParse('fb_matches', []));
  const [selectedPool, setSelectedPool] = useState<string>('ALL');

  // Generating default stations
  const [stations, setStations] = useState<Station[]>(() => safeParse('fb_stations',
    Array.from({ length: 8 }).map((_, i) => ({ id: i + 1, name: `Station ${i + 1}`, active: true, matchId: null, gameId: null }))
  ));

  const [smsLogs, setSmsLogs] = useState<SMSLog[]>(() => safeParse('fb_smsLogs', []));
  const [announcement, setAnnouncement] = useState<BracketMatch | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [pendingCallMatch, setPendingCallMatch] = useState<BracketMatch | null>(null);
  const [startggUser, setStartggUser] = useState<{ id: string; name: string } | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [targetProfileUserId, setTargetProfileUserId] = useState<string | null>(null);
  const [showStaticPage, setShowStaticPage] = useState<StaticPageId | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const handleOpenTos = () => setShowTerms(true);
    const handleOpenPrivacy = () => setShowStaticPage('privacy');
    window.addEventListener('open-tos', handleOpenTos);
    window.addEventListener('open-privacy', handleOpenPrivacy);
    return () => {
      window.removeEventListener('open-tos', handleOpenTos);
      window.removeEventListener('open-privacy', handleOpenPrivacy);
    };
  }, []);

  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [activeTournament, setActiveTournament] = useState<{ name: string, location: string, slug?: string, numAttendees?: number } | null>(() => safeParse('fb_tournament', null));
  const [autoSyncSlug, setAutoSyncSlug] = useState<string | null>(() => safeParse('fb_autoSyncSlug', null));
  const [exhibitions, setExhibitions] = useState<ExhibitionMatch[]>(() => safeParse('fb_exhibitions', []));

  // Dynamic games state
  const [gameThemes, setGameThemes] = useState<Record<string, GameTheme>>(() => safeParse('fb_themes', {}));
  const [gameOrder, setGameOrder] = useState<string[]>(() => safeParse('fb_gameOrder', []));

  // Host & editing state
  const [tournamentOwnerId, setTournamentOwnerId] = useState<string | null>(() => safeParse('fb_tournamentOwnerId', null));
  const [pendingReportMatch, setPendingReportMatch] = useState<BracketMatch | null>(null);

  // Determine if the current user is the host
  const isHost = !tournamentOwnerId || (supabaseUser?.id === tournamentOwnerId) || (startggUser?.id === tournamentOwnerId);

  useEffect(() => {
    localStorage.setItem('fb_activeGame', JSON.stringify(activeGame));
    localStorage.setItem('fb_players', JSON.stringify(players));
    localStorage.setItem('fb_matches', JSON.stringify(matches));
    localStorage.setItem('fb_stations', JSON.stringify(stations));
    localStorage.setItem('fb_smsLogs', JSON.stringify(smsLogs));
    localStorage.setItem('fb_tournament', JSON.stringify(activeTournament));
    localStorage.setItem('fb_themes', JSON.stringify(gameThemes));
    localStorage.setItem('fb_gameOrder', JSON.stringify(gameOrder));
    localStorage.setItem('fb_autoSyncSlug', JSON.stringify(autoSyncSlug));
    localStorage.setItem('fb_exhibitions', JSON.stringify(exhibitions));
    localStorage.setItem('fb_tournamentOwnerId', JSON.stringify(tournamentOwnerId));
    localStorage.setItem('fb_activeTab', JSON.stringify(activeTab));
  }, [activeGame, players, matches, stations, smsLogs, activeTournament, gameThemes, gameOrder, autoSyncSlug, exhibitions, tournamentOwnerId, activeTab]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSupabaseUser(session?.user ?? null);
      setSupabaseToken(session?.access_token ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSupabaseUser(session?.user ?? null);
      setSupabaseToken(session?.access_token ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync station names to backend
  const stationNamesStr = JSON.stringify(stations.map(s => s.name));
  useEffect(() => {
    if (!supabaseToken || !stationNamesStr) return;
    const isDefault = stations.every((s, i) => s.name === `Station ${i + 1}`);
    if (isDefault) return; // Don't overwrite cloud with defaults on first load
    const timer = setTimeout(() => {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${supabaseToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_names: stationNamesStr })
      }).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [stationNamesStr, supabaseToken]);

  // Load station names from backend
  useEffect(() => {
    if (!supabaseToken) return;
    fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${supabaseToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const profile = data?.profile || data?.user;
        if (profile?.station_names) {
          try {
            const parsedNames = JSON.parse(profile.station_names);
            if (Array.isArray(parsedNames) && parsedNames.length > 0) {
              setStations(prev => {
                const newStations = [...prev];
                parsedNames.forEach((name, i) => {
                  if (newStations[i]) {
                    newStations[i].name = name;
                  } else {
                    newStations.push({ id: i + 1, name, active: true, matchId: null, gameId: null });
                  }
                });
                return newStations;
              });
            }
          } catch {}
        }
      })
      .catch(console.error);
  }, [supabaseToken]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/t/')) {
      const id = path.split('/t/')[1];
      if (id) {
        fetch(`/api/public/tournaments/${id}`)
          .then(r => {
            if (!r.ok) throw new Error('Not found');
            return r.json();
          })
          .then(data => {
            const parsed = JSON.parse(data.tournament.data);
            setActiveGame(parsed.activeGame || null);
            setPlayers(parsed.players || []);
            setMatches(parsed.matches || []);
            setStations(parsed.stations || []);
            setGameThemes(parsed.gameThemes || {});
            setGameOrder(parsed.gameOrder || []);
            setAutoSyncSlug(parsed.autoSyncSlug || null);
            setExhibitions(parsed.exhibitions || []);
            setActiveTournament(parsed.activeTournament || null);
            setTournamentOwnerId(data.tournament.user_id);
            toast.success("Tournament loaded");
          })
          .catch(() => {
            toast.error("Tournament not found");
          });
      }
    }
  }, []);

  useEffect(() => {
    if (!autoSyncSlug) return;
    const interval = setInterval(() => {
      handleLiveImport(autoSyncSlug, true).catch(() => { });
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [autoSyncSlug]);

  // Create anonymous user ID if not logged in
  const userId = useMemo(() => {
    if (supabaseUser?.id) return supabaseUser.id;
    if (startggUser?.id) return startggUser.id;
    let localId = localStorage.getItem('local_user_id');
    if (!localId) {
      localId = 'anon-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('local_user_id', localId);
    }
    return localId;
  }, [startggUser, supabaseUser]);
  useEffect(() => {
    fetch(`/api/state?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        // Merge DB state with local state
        setPlayers(prev => prev.map(p => {
          const dbP = data.players?.find((x: any) => x.id === p.id);
          if (dbP) return { ...p, checkedIn: dbP.checked_in, smsNotified: dbP.sms_notified };
          return p;
        }));
        setStations(prev => prev.map(s => {
          const dbS = data.stations?.find((x: any) => x.id === s.id);
          if (dbS) return { ...s, matchId: dbS.match_id, active: dbS.active };
          return s;
        }));
        if (data.sms_logs) {
          setSmsLogs(data.sms_logs.map((log: any) => ({
            id: log.id,
            playerId: log.player_id,
            message: log.message,
            status: log.status,
            matchId: log.match_id,
            sentAt: new Date() // Since sent_at isn't returned from API currently, use now
          })));
        }
      })
      .catch(err => console.error("Failed to load initial state", err));

    const token = localStorage.getItem('startgg_access_token');
    if (token) {
      fetch(`/api/user/me?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.user) {
            setStartggUser({ id: data.user.id, name: data.user.name });
          } else {
            localStorage.removeItem('startgg_access_token');
          }
        })
        .catch(err => console.error("Failed to fetch start.gg user", err));
    }
  }, []);

  const handleAddGame = (game: { id: string; name: string; imageUrl: string }) => {
    const newGameId = `game-${game.id}`;
    if (gameOrder.includes(newGameId)) {
      setActiveGame(newGameId);
      setShowGameModal(false);
      return;
    }

    // Check if preset theme exists in GAME_THEMES
    const presetThemeKey = Object.keys(GAME_THEMES).find(k => 
      GAME_THEMES[k].displayName.toLowerCase() === game.name.toLowerCase() ||
      game.name.toLowerCase().includes(GAME_THEMES[k].displayName.toLowerCase()) ||
      GAME_THEMES[k].displayName.toLowerCase().includes(game.name.toLowerCase())
    );
    const preset = presetThemeKey ? GAME_THEMES[presetThemeKey] : null;

    const hue = Math.floor(Math.random() * 360);
    const newTheme: GameTheme = preset ? {
      ...preset,
      id: newGameId,
    } : {
      id: newGameId,
      displayName: game.name.toUpperCase(),
      shortName: game.name.substring(0, 3).toUpperCase(),
      primaryColor: `hsl(${hue}, 100%, 60%)`,
      secondaryColor: `hsl(${(hue + 45) % 360}, 100%, 60%)`,
      bgFrom: `hsl(${hue}, 80%, 10%)`,
      glowColor: `hsla(${hue}, 100%, 60%, 0.4)`,
      description: 'Newly Added Tournament Game',
      publisher: 'Unknown',
    };

    setGameThemes(prev => ({ ...prev, [newGameId]: newTheme }));
    setGameOrder(prev => [...prev, newGameId]);
    setActiveGame(newGameId);
    setShowGameModal(false);
    toast.success(`${game.name} added to tournament tabs!`, {
      style: { background: 'var(--card)', border: `1px solid ${newTheme.primaryColor}40`, color: 'var(--foreground)' },
    });
  };

  const handleRemoveGame = (e: React.MouseEvent, gameIdToRemove: string) => {
    e.stopPropagation();
    setGameOrder(prev => prev.filter(id => id !== gameIdToRemove));
    if (activeGame === gameIdToRemove) {
      const nextOrder = gameOrder.filter(id => id !== gameIdToRemove);
      setActiveGame(nextOrder.length > 0 ? nextOrder[0] : null);
    }
    setPlayers(prev => prev.filter(p => p.gameId !== gameIdToRemove));
    setMatches(prev => prev.filter(m => m.gameId !== gameIdToRemove));
  };

  const handleAddPlayer = (playerData: { tag: string; realName: string; seed: number; startggId?: string; country?: string; character?: string; fbUserId?: string }) => {
    if (!activeGame) return;
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      tag: playerData.tag,
      realName: playerData.realName,
      seed: playerData.seed,
      country: playerData.country || 'US',
      countryFlag: '🎮', // Default flag
      checkedIn: true,
      phone: '',
      smsNotified: false,
      gameId: activeGame,
      character: playerData.character,
      fbUserId: playerData.fbUserId,
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const handleGenerateBracket = (type: BracketType) => {
    if (!activeGame) return;
    const gamePlayerIds = players.filter(p => p.gameId === activeGame).map(p => p.id);
    if (gamePlayerIds.length === 0) {
      toast.error('Add players before generating bracket');
      return;
    }
    const newMatches = generateDynamicBracket(activeGame, gamePlayerIds, type);
    setMatches(prev => [...prev.filter(m => m.gameId !== activeGame), ...newMatches]);
    toast.success(`Generated ${type.replace(/_/g, ' ')} bracket!`);
  };

  const theme: GameTheme | null = activeGame ? gameThemes[activeGame] : null;
  const gameMatches = matches.filter(m => m.gameId === activeGame);

  // Calculate player status based on whether they have future/active matches
  const activePlayerIds = new Set<string>();
  gameMatches.forEach(m => {
    if (m.state !== 'completed') {
      if (m.player1Id) activePlayerIds.add(m.player1Id);
      if (m.player2Id) activePlayerIds.add(m.player2Id);
    }
  });

  // Find the tournament champion
  // 1. If start.gg provided official placement data, use the player with placement 1
  const startGgChampion = activeGame ? players.find(p => p.gameId === activeGame && p.placement === 1) : null;

  // 2. Fallback to bracket match calculation (for local tournaments)
  const grandFinalMatches = gameMatches.filter(m =>
    m.roundName && (
      m.roundName.toLowerCase().includes('grand final') ||
      m.roundName.toLowerCase() === 'grand finals'
    )
  );
  const grandFinalMatch = grandFinalMatches.length > 0 
    ? grandFinalMatches.reduce((prev, current) => (Math.abs(prev.round) > Math.abs(current.round)) ? prev : current)
    : null;

  const maxRoundMatch = grandFinalMatch || (gameMatches.length > 0 ?
    gameMatches.reduce((prev, current) =>
      (prev && Math.abs(prev.round) > Math.abs(current.round)) ? prev : current, gameMatches[0]) : null);
      
  const championId = startGgChampion ? startGgChampion.id : (maxRoundMatch && maxRoundMatch.state === 'completed' ? maxRoundMatch.winnerId : null);

  const gamePlayers = activeGame ? players.filter(p => p.gameId === activeGame).map(p => ({
    ...p,
    status: (championId === p.id) ? 'winner' as const : (activePlayerIds.has(p.id) ? 'active' as const : 'eliminated' as const)
  })).sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'winner') return -1;
      if (b.status === 'winner') return 1;
      return a.status === 'active' ? -1 : 1;
    }
    return a.seed - b.seed;
  }) : [];
  const activeMatches = gameMatches.filter(m => m.state === 'in_progress' || m.state === 'called');
  const completedMatches = gameMatches.filter(m => m.state === 'completed');
  const completionPercentage = gameMatches.length > 0 ? Math.round((completedMatches.length / gameMatches.length) * 100) : 0;
  const checkedInCount = gamePlayers.filter(p => p.checkedIn).length;

  const handleCheckIn = useCallback(async (playerId: string, checked: boolean) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, checkedIn: checked } : p));
    const player = players.find(p => p.id === playerId);

    try {
      await fetch(`/api/checkin?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, checked_in: checked })
      });
      toast(checked ? `${player?.tag} checked in` : `${player?.tag} checked out`, {
        style: { background: 'var(--card)', border: `1px solid ${checked ? '#00FF88' : '#FF1744'}40`, color: 'var(--foreground)' },
      });
    } catch (e) {
      toast.error('Failed to sync check-in to database');
      // Revert state on fail
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, checkedIn: !checked } : p));
    }
  }, []);

  const handleCallMatch = useCallback((match: BracketMatch, stationId?: number) => {
    if (!stationId) {
      setPendingCallMatch(match);
      return;
    }
    const sid = stationId;

    const calledTime = Date.now();

    // Find the station so we can pull its stream name into the match
    const station = stations.find(s => s.id === sid);
    const streamUrl = station?.streamName
      ? parseStreamUrl(station.streamName)
      : match.streamUrl;

    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, state: 'called', stationId: sid, calledAt: calledTime, streamUrl: streamUrl || m.streamUrl } : m));
    setStations(prev => prev.map(s => s.id === sid ? { ...s, matchId: match.id } : s));
    const updatedMatch: BracketMatch = { ...match, state: 'called', stationId: sid, calledAt: calledTime, streamUrl: streamUrl || match.streamUrl };
    setAnnouncement(updatedMatch);

    const playerIds = [match.player1Id, match.player2Id].filter(Boolean) as string[];
    const gameThemeName = gameThemes[match.gameId]?.displayName || 'GAME';

    playerIds.forEach((pid, idx) => {
      const player = players.find(p => p.id === pid);
      if (!player) return;
      setSmsLogs(prev => [...prev, {
        id: `sms-${Date.now()}-${idx}`,
        playerId: pid,
        message: `[${gameThemeName}] ${player.tag}, your ${match.roundName} match has been called! Report to Station ${sid} immediately. — CLASH OF KINGS VII`,
        sentAt: new Date(),
        status: Math.random() > 0.1 ? 'delivered' : 'sent',
        matchId: match.id,
      }]);
    });

    setPlayers(prev => prev.map(p => playerIds.includes(p.id) ? { ...p, smsNotified: true } : p));
    toast.success(`Match called — Station ${sid}`, {
      style: { background: 'var(--card)', border: `1px solid ${theme?.primaryColor || '#00FF88'}40`, color: 'var(--foreground)' },
      action: {
        label: 'Undo',
        onClick: () => handleUndoCall(match.id),
      },
    });
  }, [theme?.primaryColor, players, gameThemes, stations]);

  const handleUndoCall = useCallback((matchId: string) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, state: 'pending', stationId: null } : m));
    setStations(prev => prev.map(s => s.matchId === matchId ? { ...s, matchId: null } : s));
  }, []);

  const handleAssignMatch = useCallback(async (stationId: number, matchId: string) => {
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, matchId } : s));
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, stationId } : m));

    try {
      await fetch(`/api/station/assign?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: stationId, match_id: matchId })
      });
      toast(`Match assigned to Station ${stationId}`, {
        style: { background: 'var(--card)', border: `1px solid ${theme?.primaryColor || '#00E5FF'}30`, color: 'var(--foreground)' },
      });
    } catch (e) {
      toast.error('Failed to sync station assignment to database');
    }
  }, [theme?.primaryColor, userId]);

  const handleClearStation = useCallback(async (stationId: number) => {
    setStations(prev => {
      const station = prev.find(s => s.id === stationId);
      if (station?.matchId) {
        setMatches(pm => pm.map(m => m.id === station.matchId ? { ...m, stationId: null } : m));
      }
      return prev.map(s => s.id === stationId ? { ...s, matchId: null } : s);
    });

    try {
      await fetch(`/api/station/assign?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: stationId, match_id: null })
      });
    } catch (e) {
      toast.error('Failed to sync station clear to database');
    }
  }, [userId]);

  const handleAddStation = useCallback(() => {
    setStations(prev => {
      const newId = Math.max(0, ...prev.map(s => s.id)) + 1;
      return [...prev, { id: newId, name: `Station ${newId}`, active: true, matchId: null, gameId: null }];
    });
  }, []);

  const handleRemoveStation = useCallback((stationId: number) => {
    handleClearStation(stationId);
    setStations(prev => prev.filter(s => s.id !== stationId));
  }, [handleClearStation]);

  const handleRenameStation = useCallback((stationId: number, name: string) => {
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, name } : s));
  }, []);

  const handleSendSMS = useCallback(async (playerIds: string[], message: string, matchId?: string) => {
    const phoneNumbers = playerIds.map(pid => players.find(p => p.id === pid)?.phone).filter(Boolean) as string[];

    try {
      const res = await fetch(`/api/sms/send?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_numbers: phoneNumbers, message, match_id: matchId, enable_real_sms: false })
      });
      const data = await res.json();

      const newLogs = playerIds.map((pid, i): SMSLog => ({
        id: `sms-${Date.now()}-${i}`,
        playerId: pid,
        message,
        sentAt: new Date(),
        status: data.results?.[i]?.status === 'success' || data.results?.[i]?.status === 'demo_sent' ? 'delivered' : 'failed',
        matchId,
      }));
      setSmsLogs(prev => [...prev, ...newLogs]);
      toast.success(`SMS request complete for ${playerIds.length} player${playerIds.length !== 1 ? 's' : ''}`, {
        style: { background: 'var(--card)', border: `1px solid ${theme?.primaryColor || '#00FF88'}40`, color: 'var(--foreground)' },
      });
    } catch (e) {
      toast.error('Failed to send SMS', { style: { background: 'var(--card)', color: 'var(--foreground)' } });
    }
  }, [theme?.primaryColor, players, userId]);

  async function fetchStartggDirect(slug: string, token?: string | null) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to sync from Start.gg');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };

    const queryTourney = `
      query TournamentQuery($slug: String!) {
        tournament(slug: $slug) {
          id name city addrState venueAddress isOnline
          stations {
            nodes {
              id number prefix enabled state numSetups
              stream { id streamName streamSource isOnline enabled streamLogo }
            }
          }
          streamQueue {
            id
            stream { id streamName streamSource isOnline }
            sets { id fullRoundText }
          }
          events { id name videogame { id name } }
        }
      }
    `;

    const tourneyRes = await fetch(`${API_URL}/api/startgg/proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: queryTourney, variables: { slug } })
    });

    const tourneyJson = await tourneyRes.json().catch(() => ({}));
    if (tourneyJson.message?.includes('Invalid authentication token') || tourneyJson.errors?.[0]?.message?.includes('Invalid authentication token')) {
      throw new Error('Start.gg API token is missing or invalid. Please connect your Start.gg account or enter a Personal Access Token in Account settings.');
    }
    if (!tourneyRes.ok || tourneyJson.errors) {
      const msg = tourneyJson.errors?.[0]?.message || tourneyJson.message || 'Failed to fetch tournament from Start.gg';
      throw new Error(msg);
    }

    const tournament = tourneyJson.data?.tournament;
    if (!tournament) throw new Error('Tournament not found on Start.gg');

    const queryEntrants = `
      query EventEntrants($eventId: ID!, $page: Int!) {
        event(id: $eventId) {
          entrants(query: {page: $page, perPage: 100}) {
            pageInfo { totalPages total }
            nodes { id name participants { gamerTag } seeds { seedNum } standing { placement } }
          }
        }
      }
    `;

    const querySets = `
      query EventSets($eventId: ID!, $page: Int!) {
        event(id: $eventId) {
          sets(page: $page, perPage: 50, sortType: STANDARD) {
            pageInfo { totalPages total }
            nodes {
              id identifier state fullRoundText round winnerId displayScore
              stream { streamName streamSource }
              slots {
                entrant { id name }
                standing { stats { score { value } } }
                prereqId
                prereqType
              }
              phaseGroup {
                displayIdentifier
                phase { name }
              }
            }
          }
        }
      }
    `;

    for (const ev of tournament.events || []) {
      // Fetch all entrants (paginated)
      let allEntrants: any[] = [];
      let page = 1;
      while (true) {
        const entRes = await fetch(`${API_URL}/api/startgg/proxy`, {
          method: 'POST', headers, body: JSON.stringify({ query: queryEntrants, variables: { eventId: ev.id, page } })
        });
        const entJson = await entRes.json().catch(() => ({}));
        const entrantsObj = entJson.data?.event?.entrants;
        const nodes = entrantsObj?.nodes || [];
        if (nodes.length > 0) allEntrants.push(...nodes);
        const totalPages = entrantsObj?.pageInfo?.totalPages || 1;
        if (page >= totalPages || nodes.length === 0) break;
        page++;
      }
      ev.entrants = { nodes: allEntrants };

      // Fetch all sets (paginated)
      let allSets: any[] = [];
      page = 1;
      while (true) {
        const setRes = await fetch(`${API_URL}/api/startgg/proxy`, {
          method: 'POST', headers, body: JSON.stringify({ query: querySets, variables: { eventId: ev.id, page } })
        });
        const setJson = await setRes.json().catch(() => ({}));
        const setsObj = setJson.data?.event?.sets;
        const nodes = setsObj?.nodes || [];
        if (nodes.length > 0) allSets.push(...nodes);
        const totalPages = setsObj?.pageInfo?.totalPages || 1;
        if (page >= totalPages || nodes.length === 0) break;
        page++;
      }
      ev.sets = { nodes: allSets };
    }

    return tournament;
  }

  async function handleLiveImport(rawSlug: string, isAutoSync = false) {
    let slug = rawSlug.trim();
    if (slug.includes('start.gg/tournament/')) {
      slug = slug.split('start.gg/tournament/')[1];
    } else if (slug.includes('tournament/')) {
      slug = slug.split('tournament/')[1];
    }
    slug = slug.split('/')[0].split('?')[0].trim();

    let token = localStorage.getItem('startgg_access_token') || localStorage.getItem('fb_startggToken');
    if (token === 'SECURE_HIDDEN') {
      token = null;
    }

    let tournamentData: any = null;
    try {
      const url = `/api/bracket/sync?slug=${encodeURIComponent(slug)}${token ? `&token=${token}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        tournamentData = json.data?.tournament;
      } else {
        const err = await res.json().catch(() => ({ detail: null }));
        if (err.detail) throw new Error(err.detail);
      }
    } catch (e: any) {
      // Don't throw the token error yet, let it try the authenticated fallback first!
    }

    if (!tournamentData) {
      // Direct client fallback to Start.gg GraphQL API
      tournamentData = await fetchStartggDirect(slug, token);
    }

    if (!tournamentData) throw new Error('Tournament not found or invalid format');

    const tName = tournamentData.name;
    const events = tournamentData.events || [];

    let newPlayers: Player[] = [];
    let newMatches: BracketMatch[] = [];
    let newGameIds: string[] = [];
    let newThemes: Record<string, GameTheme> = {};

    events.forEach((ev: any) => {
      if (!ev.videogame) return; // Skip events without a videogame
      const gameId = `startgg-ev-${ev.id}`;
      const evName = ev.name || ev.videogame.name;
      const fullDisplayName = (ev.videogame?.name && !evName.toLowerCase().includes(ev.videogame.name.toLowerCase()))
        ? `${ev.videogame.name} - ${evName}`.toUpperCase()
        : evName.toUpperCase();

      if (!gameOrder.includes(gameId) && !newGameIds.includes(gameId)) {
        newGameIds.push(gameId);
        let hue = Math.floor(Math.random() * 360);
        const gameName = (ev.videogame?.name || evName).toLowerCase();
        if (gameName.includes('tekken 8')) hue = 0;
        else if (gameName.includes('street fighter 6')) hue = 280;
        else if (gameName.includes('wolves') || gameName.includes('fatal fury')) hue = 50;

        newThemes[gameId] = {
          id: gameId,
          displayName: fullDisplayName,
          shortName: evName.substring(0, 3).toUpperCase(),
          primaryColor: `hsl(${hue}, 100%, 60%)`,
          secondaryColor: `hsl(${(hue + 45) % 360}, 100%, 60%)`,
          bgFrom: `hsl(${hue}, 80%, 10%)`,
          glowColor: `hsla(${hue}, 100%, 60%, 0.4)`,
          description: `${tName} — ${evName}`,
          publisher: 'Start.gg',
        };
      }

      const entrants = ev.entrants?.nodes || [];
      entrants.forEach((ent: any) => {
        newPlayers.push({
          id: String(ent.id),
          tag: ent.participants?.[0]?.gamerTag || ent.name,
          realName: ent.name,
          country: 'US',
          countryFlag: '🇺🇸',
          seed: ent.seeds?.[0]?.seedNum || 1,
          checkedIn: true,
          phone: '',
          smsNotified: false,
          character: 'Unknown',
          placement: ent.standing?.placement,
          gameId
        });
      });

      const sets = ev.sets?.nodes || [];
      sets.forEach((set: any, idx: number) => {
        const slots = set.slots || [];
        const p1 = slots[0]?.entrant?.id;
        const p2 = slots[1]?.entrant?.id;

        let matchState: BracketMatch['state'] = 'pending';
        if (set.state === 2) matchState = 'in_progress';
        else if (set.state === 3) matchState = 'completed';
        else if (set.state === 6) matchState = 'called';

        let streamUrl: string | undefined = undefined;
        if (set.stream?.streamName) {
          streamUrl = parseStreamUrl(set.stream.streamName, set.stream.streamSource);
        }
        const winnerId = set.winnerId ? String(set.winnerId) : null;

        let p1Score = 0;
        let p2Score = 0;
        const s1 = slots[0]?.standing?.stats?.score?.value;
        const s2 = slots[1]?.standing?.stats?.score?.value;
        if (s1 != null && s1 >= 0) p1Score = s1;
        if (s2 != null && s2 >= 0) p2Score = s2;

        let parsedRound = set.round || 1;
        if (set.fullRoundText && set.fullRoundText.toLowerCase().includes('reset')) {
          parsedRound += 0.1;
        }

        if (set.displayScore && set.displayScore !== "DQ") {
          const parts = set.displayScore.split(" - ");
          if (parts.length === 2) {
            const leftScoreStr = parts[0].trim().split(" ").pop();
            const rightScoreStr = parts[1].trim().split(" ").pop();
            const ls = parseInt(leftScoreStr as string);
            const rs = parseInt(rightScoreStr as string);
            if (!isNaN(ls)) p1Score = ls;
            if (!isNaN(rs)) p2Score = rs;
          }
        }

        const isDQ = set.displayScore === "DQ" && winnerId;
        const loserId = isDQ ? (p1 === winnerId ? p2 : p1) : null;

        if (matchState === 'completed' && p1 && p2) {
          const p1Player = newPlayers.find(np => np.id === String(p1));
          if (p1Player && p1 !== loserId) p1Player.checkedIn = true;
          
          const p2Player = newPlayers.find(np => np.id === String(p2));
          if (p2Player && p2 !== loserId) p2Player.checkedIn = true;
        }

        // Extract prereqSet IDs so BracketEngine can build the true bracket tree
        const prereqSetIds = slots
          .filter((s: any) => !!s.prereqId)
          .map((s: any) => String(s.prereqId));

        const poolIdentifier = set.phaseGroup?.displayIdentifier;
        const phaseName = set.phaseGroup?.phase?.name;
        let roundLabel = set.fullRoundText || `Round ${set.round || 1}`;
        if (poolIdentifier && !roundLabel.toLowerCase().includes('pool')) {
          roundLabel = `[Pool ${poolIdentifier}] ${roundLabel}`;
        }

        // Use numeric set.id for stable ordering within rounds
        // start.gg IDs are always increasing in chronological bracket order
        const numericSetId = parseInt(String(set.id), 10) || idx;

        newMatches.push({
          id: String(set.id),
          gameId,
          round: parsedRound,
          roundName: roundLabel,
          matchNumber: numericSetId,
          player1Id: p1 ? String(p1) : null,
          player2Id: p2 ? String(p2) : null,
          state: matchState,
          stationId: null,
          player1Score: p1Score,
          player2Score: p2Score,
          winnerId,
          streamUrl,
          bestOf: 3,
          pool: poolIdentifier,
          phase: phaseName,
          identifier: set.identifier || undefined,
          prereqSetIds: prereqSetIds.length > 0 ? prereqSetIds : undefined,
        });
      });
    });

    // AUTO-LINKER: If start.gg API fails to return prereqId (common in some pool phases),
    // we manually reconstruct the tree using Player-Tracing and identifier sorting.
    const hasTreeData = newMatches.some(m => m.prereqSetIds && m.prereqSetIds.length > 0);
    if (!hasTreeData) {
      // Pass 1: Player-Tracing (100% accurate for played matches)
      for (const m of newMatches) {
        m.prereqSetIds = m.prereqSetIds || [];
        
        if (m.player1Id) {
          const p1Prereq = newMatches.find(prev => 
            prev.pool === m.pool && 
            Math.abs(prev.round) < Math.abs(m.round) && 
            prev.winnerId === m.player1Id
          );
          if (p1Prereq && !m.prereqSetIds.includes(p1Prereq.id)) m.prereqSetIds.push(p1Prereq.id);
        }
        
        if (m.player2Id) {
          const p2Prereq = newMatches.find(prev => 
            prev.pool === m.pool && 
            Math.abs(prev.round) < Math.abs(m.round) && 
            prev.winnerId === m.player2Id
          );
          if (p2Prereq && !m.prereqSetIds.includes(p2Prereq.id)) m.prereqSetIds.push(p2Prereq.id);
        }
      }

      // Pass 2: Identifier-Sorting Fallback for unplayed matches
      const phasePools = new Map<string, typeof newMatches>();
      for (const m of newMatches) {
        const key = `${m.phase}-${m.pool}`;
        if (!phasePools.has(key)) phasePools.set(key, []);
        phasePools.get(key)!.push(m);
      }

      for (const pMatches of phasePools.values()) {
        const wMatches = pMatches.filter(m => m.round > 0);
        const rMap = new Map<number, typeof newMatches>();
        for (const m of wMatches) {
          if (!rMap.has(m.round)) rMap.set(m.round, []);
          rMap.get(m.round)!.push(m);
        }

        const rounds = Array.from(rMap.keys()).sort((a,b)=>a-b);
        for (let i = 0; i < rounds.length - 1; i++) {
          const currRound = rMap.get(rounds[i])!;
          const nextRound = rMap.get(rounds[i+1])!;
          
          const sortByIndentifier = (a: any, b: any) => {
            const idA = a.identifier;
            const idB = b.identifier;
            if (idA && idB) {
              if (idA.length !== idB.length) return idA.length - idB.length;
              return idA.localeCompare(idB);
            }
            return 0;
          };

          currRound.sort(sortByIndentifier);
          nextRound.sort(sortByIndentifier);

          for (let j = 0; j < nextRound.length; j++) {
            const parent = nextRound[j];
            if (parent.prereqSetIds && parent.prereqSetIds.length === 2) continue; // Already linked by Player-Tracing
            
            const c1 = currRound[j * 2];
            const c2 = currRound[j * 2 + 1];
            
            if (c1 && !parent.prereqSetIds!.includes(c1.id)) parent.prereqSetIds!.push(c1.id);
            if (c2 && !parent.prereqSetIds!.includes(c2.id)) parent.prereqSetIds!.push(c2.id);
          }
        } // END OF WINNERS LOOP

        const lMatches = pMatches.filter(m => m.round < 0);
        const lMap = new Map<number, typeof newMatches>();
        for (const m of lMatches) {
          if (!lMap.has(m.round)) lMap.set(m.round, []);
          lMap.get(m.round)!.push(m);
        }

        const lRounds = Array.from(lMap.keys()).sort((a,b)=>Math.abs(a)-Math.abs(b));
        for (let i = 0; i < lRounds.length - 1; i++) {
          const currRound = lMap.get(lRounds[i])!;
          const nextRound = lMap.get(lRounds[i+1])!;
          
          const sortByIndentifier = (a: any, b: any) => {
            const idA = a.identifier;
            const idB = b.identifier;
            if (idA && idB) {
              if (idA.length !== idB.length) return idA.length - idB.length;
              return idA.localeCompare(idB);
            }
            return 0;
          };

          currRound.sort(sortByIndentifier);
          nextRound.sort(sortByIndentifier);

          if (currRound.length === nextRound.length) {
            // Drop round: 1-to-1 progression
            for (let j = 0; j < nextRound.length; j++) {
              const parent = nextRound[j];
              if (parent.prereqSetIds && parent.prereqSetIds.length > 0) continue; // Skip if Player-Tracing found it
              
              const child = currRound[j];
              if (child && !parent.prereqSetIds!.includes(child.id)) parent.prereqSetIds!.push(child.id);
            }
          } else if (currRound.length === nextRound.length * 2) {
            // Standard progression round: 2-to-1
            for (let j = 0; j < nextRound.length; j++) {
              const parent = nextRound[j];
              if (parent.prereqSetIds && parent.prereqSetIds.length === 2) continue; // Skip if Player-Tracing found both
              
              const c1 = currRound[j * 2];
              const c2 = currRound[j * 2 + 1];
              if (c1 && !parent.prereqSetIds!.includes(c1.id)) parent.prereqSetIds!.push(c1.id);
              if (c2 && !parent.prereqSetIds!.includes(c2.id)) parent.prereqSetIds!.push(c2.id);
            }
          }
        }
      }
    }

    if (newGameIds.length > 0) {
      setGameThemes(prev => ({ ...prev, ...newThemes }));
      setGameOrder(prev => [...prev, ...newGameIds]);
      setActiveGame(newGameIds[0]);
    }

    let tLocation = 'Online';
    if (!tournamentData.isOnline) {
      if (tournamentData.city && tournamentData.addrState) {
        tLocation = `${tournamentData.city}, ${tournamentData.addrState}`;
      } else if (tournamentData.venueAddress) {
        tLocation = tournamentData.venueAddress;
      } else {
        tLocation = 'Offline';
      }
    }
    setActiveTournament({ name: tName, location: tLocation });

    // Merge state for 100% accurate sync
    setPlayers(prev => {
      const filteredPrev = prev.filter(p => !p.id.startsWith('tk') && !p.id.startsWith('sf') && !p.id.startsWith('ff'));
      const merged = [...filteredPrev];
      newPlayers.forEach(np => {
        const idx = merged.findIndex(p => p.id === np.id);
        if (idx >= 0) merged[idx] = { ...merged[idx], ...np };
        else merged.push(np);
      });
      return merged;
    });

    setMatches(prev => {
      const merged = [...prev];
      newMatches.forEach(nm => {
        const idx = merged.findIndex(m => m.id === nm.id);
        if (idx >= 0) {
          // preserve station assignment if already called/in_progress locally
          merged[idx] = { ...merged[idx], ...nm, stationId: merged[idx].stationId };
        } else {
          merged.push(nm);
        }
      });
      return merged;
    });

    if (!isAutoSync) {
      setAutoSyncSlug(slug);
      setShowImportModal(false);
      toast.success(`Imported ${tName} successfully!`, {
        style: { background: 'var(--card)', border: `1px solid var(--border)`, color: '#00FF88' },
      });
    }
  }

  const handleClearTournament = async () => {
    if (!confirm("Are you sure you want to clear all tournament data? This action cannot be undone.")) return;

    setPlayers([]);
    setMatches([]);
    setGameThemes({});
    setGameOrder([]);
    setActiveGame(null);
    setActiveTournament(null);
    setAutoSyncSlug(null);
    setExhibitions([]);
    setSmsLogs([]);
    setStations(Array.from({ length: 8 }).map((_, i) => ({ id: i + 1, name: `Station ${i + 1}`, active: true, matchId: null, gameId: null })));

    try {
      await fetch(`/api/user/data?user_id=${userId}`, { method: 'DELETE' });
      toast.success('Tournament data cleared');
    } catch (e) {
      toast.error('Failed to clear database records');
    }
  };

  const handleReportScore = (matchId: string, p1Score: number, p2Score: number, winnerId: string | null) => {
    setMatches(prev => {
      const match = prev.find(m => m.id === matchId);
      if (!match) return prev;

      const loserId = winnerId ? (match.player1Id === winnerId ? match.player2Id : match.player1Id) : null;

      const updated = prev.map(m => m.id === matchId ? {
        ...m,
        player1Score: p1Score,
        player2Score: p2Score,
        winnerId,
        state: 'completed' as const
      } : { ...m });

      // 1. Advance winner to the next round / destination match
      if (winnerId) {
        // Priority 1: Match with prereqSetIds containing this match
        const destMatch = updated.find(m => m.gameId === match.gameId && m.prereqSetIds?.includes(matchId));
        if (destMatch) {
          if (destMatch.prereqSetIds && destMatch.prereqSetIds[0] === matchId) {
            destMatch.player1Id = winnerId;
          } else if (destMatch.prereqSetIds && destMatch.prereqSetIds[1] === matchId) {
            destMatch.player2Id = winnerId;
          } else if (!destMatch.player1Id || destMatch.player1Id === winnerId) {
            destMatch.player1Id = winnerId;
          } else {
            destMatch.player2Id = winnerId;
          }
        } else if (match.round >= 0) {
          // Priority 2: Fallback for sequential single elimination
          const nextRound = match.round + 1;
          const nextMatchNum = Math.floor(match.matchNumber / 2);
          const nextMatchIdx = updated.findIndex(
            m => m.gameId === match.gameId && m.round === nextRound && m.matchNumber === nextMatchNum
          );
          if (nextMatchIdx >= 0) {
            if (match.matchNumber % 2 === 0) {
              updated[nextMatchIdx].player1Id = winnerId;
            } else {
              updated[nextMatchIdx].player2Id = winnerId;
            }
          }
        }
      }

      // 2. Advance loser in Double Elimination / drop brackets
      if (loserId) {
        if (match.loserNextMatchId) {
          const lDest = updated.find(m => m.id === match.loserNextMatchId);
          if (lDest) {
            if (!lDest.player1Id) {
              lDest.player1Id = loserId;
            } else if (!lDest.player2Id) {
              lDest.player2Id = loserId;
            }
          }
        } else {
          const lDest = updated.find(m => m.gameId === match.gameId && m.loserPrereqSetIds?.includes(matchId));
          if (lDest) {
            if (lDest.loserPrereqSetIds && lDest.loserPrereqSetIds[0] === matchId) {
              lDest.player1Id = loserId;
            } else {
              lDest.player2Id = loserId;
            }
          }
        }
      }

      return updated as BracketMatch[];
    });

    // Auto-free station
    setStations(prev => prev.map(s => s.matchId === matchId ? { ...s, matchId: null } : s));
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!confirm('Remove this player from the tournament?')) return;
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    // Optionally unassign them from pending matches
    setMatches(prev => prev.map(m => {
      if (m.state === 'completed' || m.state === 'in_progress') return m;
      if (m.player1Id === playerId) return { ...m, player1Id: null };
      if (m.player2Id === playerId) return { ...m, player2Id: null };
      return m;
    }));
  };

  const totalPlayers = players.length;
  const totalCheckedIn = players.filter(p => p.checkedIn).length;
  const totalActive = matches.filter(m => m.state === 'in_progress' || m.state === 'called').length;
  const totalStationsActive = stations.filter(s => s.active && s.matchId).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <header className="border-b flex items-center justify-between px-6 py-3 shrink-0" style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00E5FF, #FF006E)', boxShadow: '0 0 12px rgba(0,229,255,0.4)' }}>
              <Zap size={14} color="#050A14" />
            </div>
            <div>
              <div className="text-sm tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>FightBracket Pro</div>
              <div className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>powered by start.gg</div>
            </div>
          </div>
          <div className="w-px h-8 opacity-20" style={{ background: '#00E5FF' }} />
          <div className="min-w-[150px]">
            <div className="text-sm tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{activeTournament ? activeTournament.name : ''}</div>
            {activeTournament && (
              <div className="flex items-center gap-1.5">
                <MapPin size={9} className="opacity-40" />
                <span className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                  {activeTournament.location}
                </span>
              </div>
            )}
          </div>
          {(activeTournament || totalPlayers > 0) && (
            <>
              <div className="w-px h-8 opacity-20" style={{ background: '#00E5FF' }} />
              <div className="flex items-center gap-4 opacity-70">
                {[
                  { label: 'PLAYERS', value: totalPlayers },
                  { label: 'CHECKED IN', value: totalCheckedIn },
                  { label: 'LIVE', value: totalActive },
                  { label: 'BUSY', value: totalStationsActive },
                ].map(s => (
                  <div key={s.label} className="text-left">
                    <div className="text-xs leading-none mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, opacity: 0.6 }}>{s.label}</div>
                    <div className="text-sm tabular-nums" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {matches.some(m => m.state === 'in_progress' || m.state === 'called') && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
              <span className="text-xs font-bold tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF88' }}>LIVE</span>
            </div>
          )}
          {tournamentOwnerId && isHost && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/t/' + activeTournament?.slug);
                toast.success('Share link copied to clipboard!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:opacity-80 transition-opacity bg-white/10 text-white font-mono"
            >
              SHARE LINK
            </button>
          )}
          <a href="https://start.gg" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:opacity-80 transition-opacity"
            style={{ background: 'var(--border)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF', fontFamily: 'JetBrains Mono, monospace' }}>
            <Globe size={11} />start.gg<ExternalLink size={9} />
          </a>
          <button onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider transition-opacity hover:opacity-100"
            style={{
              background: 'var(--border)',
              border: '1px solid rgba(0,229,255,0.2)',
              color: '#00E5FF',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
            <GitBranch size={11} />
            IMPORT LIVE
          </button>
          {activeTournament && (
            <button onClick={handleClearTournament}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:bg-red-500/10 transition-colors"
              style={{ border: '1px solid rgba(255,23,68,0.3)', color: '#FF1744', fontFamily: 'JetBrains Mono, monospace' }}>
              CLEAR TOURNAMENT
            </button>
          )}
          {startggUser && (
            <div className="flex items-center gap-3 ml-2">
              <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>{startggUser.name}</span>
              <button onClick={() => { localStorage.removeItem('startgg_access_token'); setStartggUser(null); }} className="text-xs opacity-50 hover:opacity-100 transition-opacity" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>[DISCONNECT]</button>
            </div>
          )}
          {supabaseUser ? (
            <button onClick={() => setActiveTab('account')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:opacity-80 transition-opacity ml-2"
              style={{ background: '#FF006E15', border: '1px solid rgba(255,0,110,0.3)', color: '#FF006E', fontFamily: 'JetBrains Mono, monospace' }}>
              <UserCheck size={11} />
              {supabaseUser.user_metadata?.displayName || 'ACCOUNT'}
            </button>
          ) : (
            <button onClick={() => setActiveTab('account')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:opacity-80 transition-opacity ml-2"
              style={{ background: '#FF006E15', border: '1px solid rgba(255,0,110,0.3)', color: '#FF006E', fontFamily: 'JetBrains Mono, monospace' }}>
              <UserCheck size={11} />
              LOGIN
            </button>
          )}
          <button
            onClick={() => setShowDirectoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:opacity-80 transition-opacity"
            style={{
              background: 'var(--border)',
              border: '1px solid rgba(0,229,255,0.3)',
              color: '#00E5FF',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
            <Search size={11} />
            DIRECTORY
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider hover:opacity-80 transition-opacity"
            style={{
              background: activeTab === 'news' ? '#a78bfa18' : 'var(--border)',
              border: activeTab === 'news' ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(167,139,250,0.2)',
              color: '#a78bfa',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
            <Megaphone size={11} />
            NEWS
          </button>
          <ThemeToggleButton />
        </div>
      </header>

      {/* Game tabs */}
      <div className="flex items-center border-b shrink-0 overflow-x-auto" style={{ background: 'var(--sidebar)', borderColor: 'rgba(0,229,255,0.06)' }}>
        {gameOrder.map(gameId => {
          const gt = gameThemes[gameId];
          if (!gt) return null;
          const isActive = activeGame === gameId;
          const liveCount = matches.filter(m => m.gameId === gameId && (m.state === 'in_progress' || m.state === 'called')).length;
          return (
            <button key={gameId} onClick={() => setActiveGame(gameId)}
              className="relative flex items-center gap-2 px-5 py-3 transition-all"
              style={{
                background: isActive ? `${gt.primaryColor}10` : 'transparent',
                borderTop: isActive ? `2px solid ${gt.primaryColor}` : '2px solid transparent',
              }}>
              <div className="w-2 h-2 rounded-full" style={{ background: gt.primaryColor, boxShadow: isActive ? `0 0 6px ${gt.primaryColor}` : 'none' }} />
              <span className="text-sm tracking-wider whitespace-nowrap" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isActive ? gt.primaryColor : 'var(--muted-foreground)' }}>
                {gt.displayName}
              </span>
              {liveCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${gt.primaryColor}20`, color: gt.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                  {liveCount} LIVE
                </span>
              )}
              {isActive && (
                <div
                  onClick={(e) => handleRemoveGame(e, gameId)}
                  className="ml-1 opacity-50 hover:opacity-100 p-0.5 rounded-full hover:bg-black/20 transition-all"
                  style={{ color: gt.primaryColor }}
                >
                  <X size={12} />
                </div>
              )}
            </button>
          );
        })}
        <button onClick={() => setShowGameModal(true)} className="flex items-center gap-1.5 px-4 py-3 opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">
          <span className="text-xl font-light">+</span>
          <span className="text-xs tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>ADD GAME</span>
        </button>
      </div>

      {/* Game banner */}
      {activeGame && theme && (
        <>
          <AnimatePresence mode="wait">
            <motion.div key={activeGame} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <GameBanner theme={theme} entrantCount={gamePlayers.length} checkedInCount={checkedInCount} activeMatchCount={activeMatches.length} completionPercentage={completionPercentage} />
            </motion.div>
          </AnimatePresence>

          {/* Nav tabs */}
          <div className="flex items-center border-b shrink-0 px-4" style={{ background: 'var(--sidebar)', borderColor: `${theme.primaryColor}12` }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => React.startTransition(() => setActiveTab(tab.id))}
                  className="flex items-center gap-1.5 px-4 py-2.5 transition-all text-xs tracking-widest"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: isActive ? theme.primaryColor : 'var(--muted-foreground)',
                    borderBottom: isActive ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
                    background: isActive ? `${theme.primaryColor}06` : 'transparent',
                  }}>
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto p-3 md:p-5 relative">
        {activeTab === 'news' ? (
          <NewsPage onNavigateHome={() => setActiveTab('overview')} />
        ) : activeTab === 'account' ? (
          <div className="h-full">
            <AccountDashboard
              user={supabaseUser}
              theme={theme}
              currentTournamentData={{
                players, matches, stations, gameThemes, gameOrder, activeGame, activeTournament, smsLogs, autoSyncSlug, exhibitions
              }}
              onLoad={(data) => {
                if (data.players) setPlayers(data.players);
                if (data.matches) setMatches(data.matches);
                if (data.stations) setStations(data.stations);
                if (data.gameThemes) setGameThemes(data.gameThemes);
                if (data.gameOrder) setGameOrder(data.gameOrder);
                if (data.activeGame) setActiveGame(data.activeGame);
                if (data.activeTournament) setActiveTournament(data.activeTournament);
                if (data.smsLogs) setSmsLogs(data.smsLogs);
                if (data.autoSyncSlug !== undefined) setAutoSyncSlug(data.autoSyncSlug);
                if (data.exhibitions) setExhibitions(data.exhibitions);
              }}
              onStartggImport={(slug) => handleLiveImport(slug)}
              onOpenFriendsModal={() => setShowFriendsModal(true)}
              onNavigateHome={() => setActiveTab('overview')}
              onViewOwnProfile={supabaseUser ? () => setTargetProfileUserId(supabaseUser.id) : undefined}
            />
          </div>
        ) : !activeGame || !theme ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center opacity-50">
            <Trophy size={64} className="mb-6 opacity-20" />
            <h2 className="text-2xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>NO TOURNAMENT LOADED</h2>
            <p className="text-sm max-w-md" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Import a live tournament from Start.gg or add a game manually to get started.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeGame}-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {activeTab === 'overview' && (
                <OverviewTab
                  players={gamePlayers}
                  matches={gameMatches}
                  stations={stations}
                  onCallMatch={(m) => setPendingCallMatch(m)}
                  onUndoCall={handleUndoCall}
                  gameThemes={gameThemes}
                  onOpenAddPlayer={() => setShowAddPlayerModal(true)}
                  isHost={isHost}
                  onReportScore={setPendingReportMatch}
                  onRemovePlayer={handleRemovePlayer}
                />
              )}
              {activeTab === 'bracket' && (
                <div>
                  <SectionHeader title="TOURNAMENT BRACKET" subtitle={`${theme.displayName} · Double Elimination`} theme={theme} />
                  <BracketView
                    matches={gameMatches}
                    players={gamePlayers}
                    theme={theme}
                    onCallMatch={m => {
                      const availStation = stations.find(s => s.active && !s.matchId);
                      if (availStation) handleCallMatch(m, availStation.id);
                      else toast.error('No available stations', { style: { background: 'var(--card)', color: 'var(--foreground)' } });
                    }}
                    onGenerateBracket={handleGenerateBracket}
                    selectedPool={selectedPool}
                    onSelectPool={setSelectedPool}
                  />
                </div>
              )}
              {activeTab === 'checkin' && (
                <div>
                  <SectionHeader title="PARTICIPANT CHECK-IN" subtitle={`${checkedInCount} of ${gamePlayers.length} checked in`} theme={theme} />
                  <CheckInPanel 
                    players={gamePlayers} 
                    theme={theme} 
                    onCheckIn={handleCheckIn} 
                    onRemovePlayer={isHost ? handleRemovePlayer : undefined} 
                    onAddPlayer={handleAddPlayer}
                    isCustomTournament={!autoSyncSlug && !activeTournament?.slug}
                    supabaseToken={supabaseToken}
                  />
                </div>
              )}
              {activeTab === 'pools' && (
                <PoolsPanel
                  matches={gameMatches}
                  players={gamePlayers}
                  theme={theme}
                  isHost={isHost}
                  onUpdateMatches={setMatches}
                  onSelectPool={(p) => {
                    setSelectedPool(p);
                    setActiveTab('bracket');
                  }}
                  isImported={Boolean(autoSyncSlug || activeTournament)}
                />
              )}
              {activeTab === 'stations' && (
                <div>
                  <SectionHeader title="STATION MANAGEMENT" subtitle={`${stations.filter(s => s.active && s.matchId).length} / ${stations.filter(s => s.active).length} stations occupied`} theme={theme} />
                  <StationsPanel
                    stations={stations}
                    matches={matches}
                    players={players}
                    theme={theme}
                    onAssignMatch={handleAssignMatch}
                    onCallMatch={(m, sid) => handleCallMatch(m, sid)}
                    onClearStation={handleClearStation}
                    onAddStation={handleAddStation}
                    onRemoveStation={handleRemoveStation}
                    onRenameStation={handleRenameStation}
                  />
                </div>
              )}
              {activeTab === 'vods' && (
                <div className="h-full">
                  <ExhibitionsPanel
                    exhibitions={exhibitions}
                    setExhibitions={setExhibitions}
                    theme={theme}
                    userId={supabaseUser?.id || null}
                    activeGameId={activeGame}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Render StreamsPanel outside AnimatePresence so it doesn't unmount, and control visibility via CSS */}
        {activeGame && theme && (
          <div style={{ display: activeTab === 'streams' ? 'block' : 'none' }}>
            <SectionHeader title="LIVE STREAMS" subtitle="Monitor active broadcast channels" theme={theme} />
            <StreamsPanel matches={gameMatches} players={gamePlayers} theme={theme} />
          </div>
        )}
      </main>

      {/* Announcement overlay */}
      <AnnouncementOverlay
        match={announcement}
        players={players}
        theme={announcement && gameThemes[announcement.gameId] ? gameThemes[announcement.gameId] : (theme || {
          id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: ''
        })}
        onDismiss={() => {
          if (announcement) {
            setMatches(prev => prev.map(m => m.id === announcement.id ? { ...m, state: 'in_progress' } : m));
          }
          setAnnouncement(null);
        }}
      />

      {pendingCallMatch && theme && (
        <CallMatchModal
          match={pendingCallMatch}
          players={players}
          stations={stations}
          theme={theme}
          onConfirm={(stationId) => {
            handleCallMatch(pendingCallMatch, stationId);
            setPendingCallMatch(null);
          }}
          onCancel={() => setPendingCallMatch(null)}
        />
      )}

      {pendingReportMatch && theme && (
        <ReportScoreModal
          match={pendingReportMatch}
          players={Object.fromEntries(players.map(p => [p.id, p]))}
          theme={theme}
          onConfirm={(matchId, p1Score, p2Score, winnerId) => {
            handleReportScore(matchId, p1Score, p2Score, winnerId);
            setPendingReportMatch(null);
          }}
          onCancel={() => setPendingReportMatch(null)}
        />
      )}

      <GameSelectionModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        onSelectGame={handleAddGame}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: '' }}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(slug) => handleLiveImport(slug)}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: '' }}
      />

      {activeGame && theme && (
        <AddPlayerModal
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          onAdd={handleAddPlayer}
          theme={theme}
          nextSeed={players.filter(p => p.gameId === activeGame).length + 1}
        />
      )}

      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: '' }}
        currentUserId={supabaseUser?.id ?? null}
        supabaseToken={supabaseToken}
        onViewProfile={(userId) => setTargetProfileUserId(userId)}
      />

      <UserProfileModal
        isOpen={Boolean(targetProfileUserId)}
        onClose={() => setTargetProfileUserId(null)}
        targetUserId={targetProfileUserId}
        supabaseToken={supabaseToken}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: '' }}
        onImportBracket={async (slug) => { await handleLiveImport(slug); }}
      />

      <UserDirectoryModal
        isOpen={showDirectoryModal}
        onClose={() => setShowDirectoryModal(false)}
        supabaseToken={supabaseToken}
        currentUserId={supabaseUser?.id ?? null}
        onSelectUser={(userId) => {
          setTargetProfileUserId(userId);
        }}
      />

      <StaticPageModal
        pageId={showStaticPage}
        onClose={() => setShowStaticPage(null)}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: '' }}
      />

      <OfficialRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF', secondaryColor: '#FF006E', bgFrom: '#050A14', glowColor: 'rgba(0,229,255,0.4)', description: '', publisher: '' }}
      />

      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <Toaster position="bottom-right" />
      <footer
        className="shrink-0 border-t px-6 py-5"
        style={{ background: 'var(--sidebar)', borderColor: 'var(--border)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-[12px] font-bold tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#00E5FF' }}>
            FIGHTBRACKET PRO
          </div>
          
          <div className="flex items-center justify-center gap-8 text-[9px] uppercase tracking-widest text-gray-500 mt-1 flex-wrap">
            {([
              { id: 'help', label: 'Help' },
              { id: 'privacy', label: 'Privacy' },
              { id: 'terms', label: 'Terms' },
              { id: 'disclaimer', label: 'Disclaimer' },
              { id: 'resources', label: 'Resources' },
            ] as { id: StaticPageId; label: string }[]).map(link => (
              <button
                key={link.id}
                onClick={() => setShowStaticPage(link.id)}
                className="hover:text-[#00E5FF] transition-colors"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => setShowRulesModal(true)}
              className="hover:text-[#00E5FF] transition-colors"
            >
              Official Rules
            </button>
            <button
              onClick={() => setShowSupportModal(true)}
              className="hover:text-[#00E5FF] transition-colors"
            >
              Contact Support
            </button>
          </div>

          <div className="text-[9px] text-gray-600 mt-2 space-y-1">
            <div>
              <span>Developed and Hosted by <span className="text-gray-400">Ender Gaming Core Hosting</span></span>
              <span className="mx-2">&middot;</span>
              <span>Powered by <span className="text-gray-400">Start.gg</span></span>
            </div>
            <div>
              &copy; 2026 FightBracket Pro &middot; &copy; 2026 Ender Gaming Core Hosting &mdash; All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Match Timer ──
function MatchTimer({ calledAt }: { calledAt: number }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, 10 * 60 * 1000 - (Date.now() - calledAt)));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, 10 * 60 * 1000 - (Date.now() - calledAt)));
    }, 1000);
    return () => clearInterval(interval);
  }, [calledAt]);

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const isDanger = timeLeft < 60000;

  return (
    <span className={`text-xs tabular-nums font-bold ${isDanger ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

// ── Overview Tab ──

function OverviewTab({
  players, matches, stations, onCallMatch, onUndoCall, gameThemes, onOpenAddPlayer,
  isHost, onReportScore, onRemovePlayer
}: {
  players: Player[];
  matches: BracketMatch[];
  stations: Station[];
  onCallMatch: (match: BracketMatch, stationId?: number) => void;
  onUndoCall: (matchId: string) => void;
  gameThemes: Record<string, GameTheme>;
  onOpenAddPlayer?: () => void;
  isHost: boolean;
  onReportScore: (match: BracketMatch) => void;
  onRemovePlayer: (playerId: string) => void;
}) {
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const activeMatches = matches.filter(m => m.state === 'in_progress' || m.state === 'called');
  const pendingReadyMatches = matches.filter(m => m.state === 'pending' && m.player1Id && m.player2Id);
  const notCheckedIn = players.filter(p => !p.checkedIn);

  const [playerSearch, setPlayerSearch] = useState('');
  const filteredPlayers = playerSearch
    ? players.filter(p => p.tag.toLowerCase().includes(playerSearch.toLowerCase()) || (p.realName && p.realName.toLowerCase().includes(playerSearch.toLowerCase())))
    : players;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Live matches full width */}
      <div className="col-span-1 lg:col-span-2 rounded overflow-hidden" style={{ background: 'var(--card)', border: `1px solid rgba(0,229,255,0.12)` }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
          <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF88' }}>LIVE MATCHES</span>
          <span className="ml-auto text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{activeMatches.length} active</span>
        </div>
        {activeMatches.length === 0 ? (
          <div className="py-6 text-center text-sm opacity-30" style={{ fontFamily: 'JetBrains Mono, monospace' }}>No live matches right now</div>
        ) : (
          activeMatches.map(m => {
            const gt = gameThemes[m.gameId] || { primaryColor: '#aaa', shortName: 'GAME' };
            const p1 = m.player1Id ? playerMap[m.player1Id] : null;
            const p2 = m.player2Id ? playerMap[m.player2Id] : null;
            return (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: '1px solid rgba(122,158,192,0.06)' }}>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${gt.primaryColor}15`, color: gt.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{gt.shortName}</span>
                <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                  {p1?.tag ?? 'TBD'} <span style={{ color: gt.primaryColor }}>vs</span> {p2?.tag ?? 'TBD'}
                </span>
                <span className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.roundName}</span>
                <div className="ml-auto flex items-center gap-4">
                  {m.stationId && (
                    <span className="flex items-center gap-1 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: gt.primaryColor }}>
                      <Monitor size={11} /> STN {m.stationId}
                    </span>
                  )}
                  <span className="text-xs tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FFD600' }}>
                    {m.player1Score} – {m.player2Score}
                  </span>
                  {m.state === 'called' && (
                    <>
                      {m.calledAt && <MatchTimer calledAt={m.calledAt} />}
                      <button
                        onClick={() => onUndoCall(m.id)}
                        className="px-2 py-1 rounded text-xs opacity-60 hover:opacity-100 transition-opacity ml-2"
                        style={{ background: 'rgba(255,23,68,0.15)', color: '#FF1744', fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        UNDO
                      </button>
                    </>
                  )}
                  {isHost && (
                    <button
                      onClick={() => onReportScore(m)}
                      className="px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30 font-mono ml-2"
                    >
                      REPORT
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ready to call */}
      <div className="rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.12)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
          <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FFD600' }}>READY TO CALL</span>
          <span className="ml-auto text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{pendingReadyMatches.length}</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          {pendingReadyMatches.slice(0, 10).map(m => {
            const gt = gameThemes[m.gameId] || { primaryColor: '#aaa', shortName: 'GAME' };
            const p1 = m.player1Id ? playerMap[m.player1Id] : null;
            const p2 = m.player2Id ? playerMap[m.player2Id] : null;
            const availStation = stations.find(s => s.active && !s.matchId && (!s.gameId || s.gameId === m.gameId));
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(122,158,192,0.05)' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: gt.primaryColor }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
                    {p1?.tag ?? 'TBD'} vs {p2?.tag ?? 'TBD'}
                  </div>
                  <div className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                    {gt.shortName} · {m.roundName}
                  </div>
                </div>
                {availStation && (
                  <button
                    onClick={() => onCallMatch(m, availStation.id)}
                    className="shrink-0 px-2.5 py-1 rounded text-xs tracking-wider hover:opacity-80 transition-opacity"
                    style={{ background: `${gt.primaryColor}15`, border: `1px solid ${gt.primaryColor}30`, color: gt.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
                  >
                    CALL
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Status */}
      <div className="rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.15)' }}>
        <div className="px-5 py-3 border-b flex flex-col gap-3" style={{ borderColor: 'rgba(122,158,192,0.1)', background: 'var(--sidebar)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>PLAYER STATUS</span>
            <span className="ml-auto text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{filteredPlayers.length}</span>
            <button
              onClick={onOpenAddPlayer}
              className="ml-2 px-2 py-1 rounded text-xs transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(122,158,192,0.3)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              + ADD
            </button>
          </div>
          <input
            type="text"
            placeholder="Search players..."
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          {filteredPlayers.length === 0 ? (
            <div className="py-6 text-center text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>No players found</div>
          ) : (
            filteredPlayers.map(p => {
              const gt = gameThemes[p.gameId] || { primaryColor: '#aaa', shortName: 'GAME' };
              const isEliminated = p.status === 'eliminated';
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: '1px solid rgba(122,158,192,0.05)', opacity: isEliminated ? 0.5 : 1 }}>
                  <span className="text-sm">{p.countryFlag}</span>
                  <div className="flex-1">
                    <div className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: isEliminated ? '#FF1744' : 'var(--foreground)', textDecoration: isEliminated ? 'line-through' : 'none' }}>
                      {p.tag}
                    </div>
                    <div className="text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{gt.shortName} · #{p.seed}</div>
                  </div>
                  <span className="text-xs tabular-nums font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: p.status === 'eliminated' ? '#FF1744' : p.status === 'winner' ? '#FFD600' : '#00FF88' }}>
                    {p.status.toUpperCase()}
                  </span>
                  {isHost && (
                    <button onClick={() => onRemovePlayer(p.id)} className="opacity-50 hover:opacity-100 hover:text-[#FF1744] transition-all ml-2">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Standings */}
      <div className="rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.15)' }}>
        <div className="px-5 py-3 border-b flex flex-col gap-3" style={{ borderColor: 'rgba(122,158,192,0.1)', background: 'var(--sidebar)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={13} style={{ color: '#FFD600' }} />
            <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>TOP 8 STANDINGS</span>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          {players.filter(p => p.placement && p.placement <= 8).length === 0 ? (
            <div className="py-6 text-center text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Standings unavailable</div>
          ) : (
            players
              .filter(p => p.placement && p.placement <= 8)
              .sort((a, b) => a.placement! - b.placement!)
              .map((p, i) => {
                const colors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
                const color = colors[p.placement!] || 'var(--foreground)';
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: '1px solid rgba(122,158,192,0.05)' }}>
                    <div className="w-6 text-center text-xs font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>
                      {p.placement}
                    </div>
                    <span className="text-sm">{p.countryFlag}</span>
                    <div className="flex-1">
                      <div className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--foreground)' }}>
                        {p.tag}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Pools Summary */}
      <div className="rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.15)' }}>
        <div className="px-5 py-3 border-b flex flex-col gap-3" style={{ borderColor: 'rgba(122,158,192,0.1)', background: 'var(--sidebar)' }}>
          <div className="flex items-center gap-2">
            <LayoutGrid size={13} style={{ color: '#00E5FF' }} />
            <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>POOLS SUMMARY</span>
          </div>
        </div>
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 300 }}>
          {Array.from(new Set(matches.map(m => m.pool).filter(Boolean))).length === 0 ? (
            <div className="py-6 text-center text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>No pools created</div>
          ) : (
            Array.from(new Set(matches.map(m => m.pool).filter(Boolean))).sort().map(pool => {
              const poolMatches = matches.filter(m => m.pool === pool);
              const completed = poolMatches.filter(m => m.state === 'completed').length;
              const total = poolMatches.length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={pool as string} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold">POOL {pool as string}</span>
                    <span className="opacity-60">{completed}/{total}</span>
                  </div>
                  <div className="h-1 bg-black w-full rounded overflow-hidden">
                    <div className="h-full bg-[#00E5FF]" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Matches */}
      <div className="col-span-1 lg:col-span-2 rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.15)' }}>
        <div className="px-5 py-3 border-b flex flex-col gap-3" style={{ borderColor: 'rgba(122,158,192,0.1)', background: 'var(--sidebar)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>RECENT RESULTS</span>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          {matches.filter(m => m.state === 'completed').length === 0 ? (
            <div className="py-6 text-center text-xs opacity-40" style={{ fontFamily: 'JetBrains Mono, monospace' }}>No matches completed yet</div>
          ) : (
            matches
              .filter(m => m.state === 'completed')
              .sort((a, b) => b.round - a.round)
              .slice(0, 10)
              .map((m) => {
                const gt = gameThemes[m.gameId] || { primaryColor: '#aaa', shortName: 'GAME' };
                const p1 = m.player1Id ? playerMap[m.player1Id] : null;
                const p2 = m.player2Id ? playerMap[m.player2Id] : null;
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: '1px solid rgba(122,158,192,0.05)' }}>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${gt.primaryColor}15`, color: gt.primaryColor, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{gt.shortName}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: p1?.id === m.winnerId ? 700 : 400, color: p1?.id === m.winnerId ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                        {p1?.tag ?? 'TBD'}
                      </span>
                      <span className="text-[10px] opacity-30">vs</span>
                      <span className="text-xs" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: p2?.id === m.winnerId ? 700 : 400, color: p2?.id === m.winnerId ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                        {p2?.tag ?? 'TBD'}
                      </span>
                    </div>
                    <div className="text-xs opacity-40 mr-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {m.roundName}
                    </div>
                    <span className="text-xs tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
                      {m.player1Score} – {m.player2Score}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, theme }: { title: string; subtitle?: string; theme: GameTheme }) {
  return (
    <div className="mb-5">
      <div className="text-xl tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-xs opacity-40 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{subtitle}</div>
      )}
    </div>
  );
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  // Using mounted check to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 ml-2" />;
  }

  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors ml-2"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun size={14} color="var(--foreground)" /> : <Moon size={14} color="var(--foreground)" />}
    </button>
  );
}
