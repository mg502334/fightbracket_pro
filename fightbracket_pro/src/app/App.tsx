import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, GitBranch, UserCheck, Monitor, MessageSquare, Smartphone,
  ExternalLink, RefreshCw, Zap, MapPin, Globe, Moon, Sun, X, Tv, Cloud, Play
} from "lucide-react";
import { useTheme } from "next-themes";

import { GameBanner } from "./components/GameBanner";
import { AddPlayerModal } from "./components/AddPlayerModal";
import { supabase } from "./supabaseClient";
import { BracketView } from "./components/BracketView";
import { CheckInPanel } from "./components/CheckInPanel";
import { StationsPanel } from "./components/StationsPanel";
import { SMSPanel } from "./components/SMSPanel";
import { AnnouncementOverlay } from "./components/AnnouncementOverlay";
import { MobileCompanion } from "./components/MobileCompanion";
import { GameSelectionModal } from "./components/GameSelectionModal";
import { ImportModal } from "./components/ImportModal";
import { CallMatchModal } from "./components/CallMatchModal";
import { StreamsPanel } from "./components/StreamsPanel";
import { ExhibitionsPanel } from "./components/ExhibitionsPanel";
import { AccountDashboard } from "./components/AccountDashboard";

import {
  type BracketMatch, type Player, type Station, type SMSLog, type GameTheme, type ExhibitionMatch,
  generateMockDataForGame, generateDynamicBracket, BracketType
} from "./data/tournamentData";

type Tab = 'overview' | 'bracket' | 'checkin' | 'stations' | 'sms' | 'streams' | 'vods' | 'mobile' | 'account';

const DEFAULT_GAME_ORDER: string[] = ['tekken8', 'sf6', 'fatalFury'];
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: Trophy },
  { id: 'bracket', label: 'BRACKET', icon: GitBranch },
  { id: 'checkin', label: 'CHECK-IN', icon: UserCheck },
  { id: 'stations', label: 'STATIONS', icon: Monitor },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'streams', label: 'STREAMS', icon: Tv },
  { id: 'vods', label: 'EXHIBITIONS', icon: Play },
  { id: 'mobile', label: 'MOBILE', icon: Smartphone },
  { id: 'account', label: 'ACCOUNT', icon: UserCheck },
];

export default function App() {
  const safeParse = (key: string, defaultVal: any) => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : defaultVal; } catch { return defaultVal; }
  };

  const [activeGame, setActiveGame] = useState<string | null>(() => safeParse('fb_activeGame', null));
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [players, setPlayers] = useState<Player[]>(() => safeParse('fb_players', []));
  const [matches, setMatches] = useState<BracketMatch[]>(() => safeParse('fb_matches', []));

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
  const [activeTournament, setActiveTournament] = useState<{ name: string, location: string } | null>(() => safeParse('fb_tournament', null));
  const [autoSyncSlug, setAutoSyncSlug] = useState<string | null>(() => safeParse('fb_autoSyncSlug', null));
  const [exhibitions, setExhibitions] = useState<ExhibitionMatch[]>(() => safeParse('fb_exhibitions', []));

  // Dynamic games state
  const [gameThemes, setGameThemes] = useState<Record<string, GameTheme>>(() => safeParse('fb_themes', {}));
  const [gameOrder, setGameOrder] = useState<string[]>(() => safeParse('fb_gameOrder', []));

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
  }, [activeGame, players, matches, stations, smsLogs, activeTournament, gameThemes, gameOrder, autoSyncSlug, exhibitions]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSupabaseUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSupabaseUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
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

    // Assign random theme colors
    const hue = Math.floor(Math.random() * 360);
    const newTheme: GameTheme = {
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

  const handleAddPlayer = (playerData: { tag: string; realName: string; seed: number; startggId?: string; country?: string }) => {
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

  // Find the final match to protect the winner from being marked eliminated
  const maxRoundMatch = gameMatches.reduce((prev, current) =>
    (prev && prev.round > current.round) ? prev : current, gameMatches[0]);
  const championId = maxRoundMatch && maxRoundMatch.state === 'completed' ? maxRoundMatch.winnerId : null;

  const gamePlayers = activeGame ? players.filter(p => p.gameId === activeGame).map(p => ({
    ...p,
    status: (championId === p.id || activePlayerIds.has(p.id)) ? 'active' as const : 'eliminated' as const
  })).sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
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

    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, state: 'called', stationId: sid } : m));
    setStations(prev => prev.map(s => s.id === sid ? { ...s, matchId: match.id } : s));
    const updatedMatch: BracketMatch = { ...match, state: 'called', stationId: sid };
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
  }, [theme?.primaryColor, players, gameThemes]);

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
    if (!token) {
      throw new Error('Start.gg API token required. Please log in with Start.gg or enter your Personal Access Token in Account settings.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const queryTourney = `
      query TournamentQuery($slug: String!) {
        tournament(slug: $slug) {
          id name city addrState venueAddress isOnline
          events { id name videogame { id name } }
        }
      }
    `;

    const tourneyRes = await fetch('https://api.start.gg/gql/alpha', {
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
              id state fullRoundText round winnerId displayScore
              stream { streamName streamSource }
              slots { entrant { id name } standing { stats { score { value } } } }
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
        const entRes = await fetch('https://api.start.gg/gql/alpha', {
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
        const setRes = await fetch('https://api.start.gg/gql/alpha', {
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

    const token = localStorage.getItem('startgg_access_token') || localStorage.getItem('fb_startggToken');
    
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
      if (e.message && (e.message.includes('token') || e.message.includes('Token') || e.message.includes('Account settings'))) {
        throw e;
      }
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
        if (set.stream?.streamSource === 'TWITCH' && set.stream?.streamName) {
          streamUrl = `https://twitch.tv/${set.stream.streamName}`;
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

        const poolIdentifier = set.phaseGroup?.displayIdentifier;
        const phaseName = set.phaseGroup?.phase?.name;
        let roundLabel = set.fullRoundText || `Round ${set.round || 1}`;
        if (poolIdentifier && !roundLabel.toLowerCase().includes('pool')) {
          roundLabel = `[Pool ${poolIdentifier}] ${roundLabel}`;
        }

        newMatches.push({
          id: String(set.id),
          gameId,
          round: parsedRound,
          roundName: roundLabel,
          matchNumber: idx + 1,
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
        });
      });
    });

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
      const merged = [...prev];
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
        </div>
        <div className="flex items-center gap-3">
          {matches.some(m => m.state === 'in_progress' || m.state === 'called') && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
              <span className="text-xs font-bold tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF88' }}>LIVE</span>
            </div>
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
                borderBottom: isActive ? `2px solid ${gt.primaryColor}` : '2px solid transparent',
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
        <div className="flex-1" />
        <div className="flex items-center gap-5 px-5 opacity-50">
          {[
            { label: 'PLAYERS', value: totalPlayers },
            { label: 'CHECKED IN', value: totalCheckedIn },
            { label: 'LIVE', value: totalActive },
            { label: 'BUSY', value: totalStationsActive },
          ].map(s => (
            <div key={s.label} className="text-right">
              <div className="text-xs leading-none mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, opacity: 0.6 }}>{s.label}</div>
              <div className="text-sm tabular-nums" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>
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
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
      <main className="flex-1 overflow-auto p-5 relative">
        {activeTab === 'account' ? (
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
            />
          </div>
        ) : !activeGame || !theme ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center opacity-50">
            <Trophy size={64} className="mb-6 opacity-20" />
            <h2 className="text-2xl tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>NO TOURNAMENT LOADED</h2>
            <p className="text-sm max-w-md" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {startggUser ? "Import a live tournament from Start.gg or add a game manually to get started." : "Please login with Start.gg to import a tournament."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeGame}-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {activeTab === 'overview' && (
                <OverviewTab players={gamePlayers} matches={gameMatches} stations={stations} onCallMatch={(m) => setPendingCallMatch(m)} onUndoCall={handleUndoCall} gameThemes={gameThemes} onOpenAddPlayer={() => setShowAddPlayerModal(true)} />
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
                  />
                </div>
              )}
              {activeTab === 'checkin' && (
                <div>
                  <SectionHeader title="PARTICIPANT CHECK-IN" subtitle={`${checkedInCount} of ${gamePlayers.length} checked in`} theme={theme} />
                  <CheckInPanel players={gamePlayers} theme={theme} onCheckIn={handleCheckIn} />
                </div>
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
              {activeTab === 'sms' && (
                <div>
                  <SectionHeader title="SMS NOTIFICATIONS" subtitle="Send match calls & announcements via Twilio" theme={theme} />
                  <SMSPanel
                    players={gamePlayers}
                    matches={gameMatches}
                    theme={theme}
                    smsLogs={smsLogs.filter(l => gamePlayers.some(p => p.id === l.playerId))}
                    onSendSMS={handleSendSMS}
                  />
                </div>
              )}
              {activeTab === 'mobile' && (
                <div>
                  <SectionHeader title="MOBILE COMPANION" subtitle="Preview the player-facing companion app" theme={theme} />
                  <MobileCompanion players={players} matches={matches} theme={theme} />
                </div>
              )}
              {activeTab === 'streams' && (
                <div>
                  <SectionHeader title="LIVE STREAMS" subtitle="Monitor active broadcast channels" theme={theme} />
                  <StreamsPanel matches={gameMatches} players={gamePlayers} theme={theme} />
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

      <Toaster position="bottom-right" />
      <footer className="text-center py-4 border-t shrink-0 text-xs opacity-50" style={{ background: 'var(--sidebar)', borderColor: 'var(--border)', fontFamily: 'JetBrains Mono, monospace' }}>
        Developed and Powered by &copy; 2026 Ender Gaming Core Hosting. All rights reserved.
      </footer>
    </div>
  );
}

// ── Overview Tab ──

function OverviewTab({
  players, matches, stations, onCallMatch, onUndoCall, gameThemes, onOpenAddPlayer
}: {
  players: Player[];
  matches: BracketMatch[];
  stations: Station[];
  onCallMatch: (match: BracketMatch, stationId?: number) => void;
  onUndoCall: (matchId: string) => void;
  gameThemes: Record<string, GameTheme>;
  onOpenAddPlayer?: () => void;
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
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* Live matches full width */}
      <div className="col-span-2 rounded overflow-hidden" style={{ background: 'var(--card)', border: `1px solid rgba(0,229,255,0.12)` }}>
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
                    <button
                      onClick={() => onUndoCall(m.id)}
                      className="px-2 py-1 rounded text-xs opacity-60 hover:opacity-100 transition-opacity ml-2"
                      style={{ background: 'rgba(255,23,68,0.15)', color: '#FF1744', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      UNDO
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
                  <span className="text-xs tabular-nums font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: isEliminated ? '#FF1744' : '#00FF88' }}>
                    {isEliminated ? 'ELIMINATED' : 'ACTIVE'}
                  </span>
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

      {/* Completed Matches */}
      <div className="col-span-2 rounded overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(122,158,192,0.15)' }}>
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
