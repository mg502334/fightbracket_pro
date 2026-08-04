import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Save, Download, RefreshCw, Key, LogOut, ArrowLeft, Globe, ExternalLink, Settings, X, AlertTriangle, User, Shield, Swords, Sparkles, Cloud, Users, Eye, EyeOff, ChevronRight, LayoutDashboard, Menu, Search, Bell, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { TekkenStatsPanel } from './TekkenStatsPanel';
import { SteamStatsPanel } from './SteamStatsPanel';
import { AccountSettingsPanel } from './AccountSettingsPanel';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, params: any) => string;
      reset: (target?: string | HTMLElement) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

const safeResetTurnstile = (): void => {
  if (window.turnstile) {
    try {
      const container = document.querySelector('.cf-turnstile') as HTMLElement | null;
      const hasWidget = container?.querySelector('iframe');
      if (hasWidget && container) window.turnstile.reset(container);
    } catch {
      // silently ignore reset errors
    }
  }
};

const GAME_COVERS: Record<string, string> = {
  'Tekken 8': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/library_600x900_2x.jpg',
  'Tekken 7': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/389730/library_600x900_2x.jpg',
  'Street Fighter 6': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/library_600x900_2x.jpg',
  'Street Fighter V': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/310950/library_600x900_2x.jpg',
  'Street Fighter IV': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/45760/library_600x900_2x.jpg',
  'Guilty Gear Strive': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1384160/library_600x900_2x.jpg',
  'Guilty Gear Xrd': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/520440/library_600x900_2x.jpg',
  'Mortal Kombat 1': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900_2x.jpg',
  'Mortal Kombat 11': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/976310/library_600x900_2x.jpg',
  'DBFZ': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/678950/library_600x900_2x.jpg',
  'GBVSR': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2157560/library_600x900_2x.jpg',
  'UNI2': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2076010/library_600x900_2x.jpg',
  'KOF XV': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1498590/library_600x900_2x.jpg',
  'Marvel vs. Capcom 3': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/357190/library_600x900_2x.jpg',
  'BlazBlue: Central Fiction': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/586140/library_600x900_2x.jpg',
  'Soul Calibur VI': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/544810/library_600x900_2x.jpg',
  'Smash Ultimate': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1xrs.jpg',
  'Smash Melee': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2l1b.jpg',
  '2XKO': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3812.jpg',
  'Fatal Fury: City of the Wolves': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co811o.jpg',
};

interface AccountDashboardProps {
  user: any;
  theme: any;
  currentTournamentData: any;
  onLoad: (data: any) => void;
  onStartggImport: (slug: string) => void;
  onOpenFriendsModal?: () => void;
  onNavigateHome?: () => void;
  onViewOwnProfile?: () => void;
}

export function AccountDashboard({ user, theme, currentTournamentData, onLoad, onStartggImport, onOpenFriendsModal, onNavigateHome, onViewOwnProfile }: AccountDashboardProps) {
  // Sidebar layout state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Cloud state
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile state
  const [displayName, setDisplayName] = useState(user?.user_metadata?.displayName || '');
  const [userProfile, setUserProfile] = useState<{
    id: string;
    unique_id: string;
    gamer_tag?: string;
    bio?: string;
    startgg_slug?: string;
    startgg_data?: string;
    tekken_id?: string;
    games_data?: string;
    is_public?: boolean;
    friends_only?: boolean;
    unread_messages_count?: number;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Main games & characters state
  const [gamesList, setGamesList] = useState<{ game: string; main: string }[]>([]);
  const [newGameName, setNewGameName] = useState('Tekken 8');
  const [newMainChar, setNewMainChar] = useState('');

  const [userStartggInput, setUserStartggInput] = useState('');
  const [userTekkenId, setUserTekkenId] = useState('');
  const [userSteamId, setUserSteamId] = useState('');
  const [userTwitchId, setUserTwitchId] = useState('');
  const [userTwitchUrl, setUserTwitchUrl] = useState('');
  const [importingUserStartgg, setImportingUserStartgg] = useState(false);

  // Start.gg state
  const [startggToken, setStartggToken] = useState(() => {
    try { return localStorage.getItem('fb_startggToken') || ''; } catch { return ''; }
  });
  const [startggTournaments, setStartggTournaments] = useState<any[]>([]);
  const [fetchingStartgg, setFetchingStartgg] = useState(false);
  
  // Local Tournament History state
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [fetchingLocalHistory, setFetchingLocalHistory] = useState(false);

  // Account Settings state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [passkeyFactors, setPasskeyFactors] = useState<any[]>([]);
  const [enrollingPasskey, setEnrollingPasskey] = useState(false);

  const fetchPasskeyFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data?.all) {
        setPasskeyFactors(data.all.filter(f => f.factor_type === 'webauthn'));
      }
    } catch { }
  };

  useEffect(() => {
    let checkInterval: any;
    const renderWidget = () => {
      if (!user && window.turnstile) {
        const container = document.getElementById('turnstile-widget');
        if (container && container.innerHTML === '') {
          try {
            window.turnstile.render(container, {
              sitekey: '0x4AAAAAAEBO-v0nV0L1u4Sv',
              action: 'turnstile-spin-v2',
              theme: 'dark'
            });
          } catch (e) { }
        }
      }
    };

    if (!user) {
      if (window.turnstile) {
        renderWidget();
      } else {
        checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 500);
      }
    }

    return () => clearInterval(checkInterval);
  }, [user, isLogin]);

  useEffect(() => {
    if (user) {
      fetchCloudTournaments();
      fetchUserProfile();
      fetchPasskeyFactors();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile || data.user);
        const profile = data.profile || data.user;
        if (profile?.unique_id) {
          fetchLocalHistory(profile.unique_id);
        }
        if (profile?.startgg_slug) setUserStartggInput(profile.startgg_slug);
        if (profile?.startgg_token) {
          setStartggToken(profile.startgg_token);
          try { localStorage.setItem('fb_startggToken', profile.startgg_token); } catch { }
        }
        if (profile?.tekken_id) setUserTekkenId(profile.tekken_id);
        if (profile?.steam_id) setUserSteamId(profile.steam_id);
        // Auto-detect Twitch username from OAuth metadata if not already set in DB profile
        const oauthTwitchUsername = user?.user_metadata?.preferred_username || user?.user_metadata?.user_name || (user?.app_metadata?.provider === 'twitch' ? user?.user_metadata?.name : '');
        const currentTwitchId = data.user?.twitch_id || oauthTwitchUsername || '';
        const currentTwitchUrl = data.user?.twitch_url || (currentTwitchId ? (currentTwitchId.startsWith('http') ? currentTwitchId : `https://twitch.tv/${currentTwitchId}`) : '');

        setUserTwitchId(currentTwitchId);
        setUserTwitchUrl(currentTwitchUrl);
        if (data.user?.gamer_tag && !displayName) setDisplayName(data.user.gamer_tag);
        if (data.user?.games_data) {
          try {
            const parsed = JSON.parse(data.user.games_data);
            setGamesList(Array.isArray(parsed) ? parsed : []);
          } catch {
            setGamesList([]);
          }
        }
      } else {
        const errText = await res.text().catch(() => res.statusText);
        setProfileError(`HTTP ${res.status}: ${errText}`);
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Network error');
      console.error('Failed to fetch user profile', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchLocalHistory = async (uniqueId: string) => {
    setFetchingLocalHistory(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/users/${uniqueId}/local-history`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLocalHistory(data.tournaments || []);
      }
    } catch (err) {
      console.error("Failed to fetch local history:", err);
    } finally {
      setFetchingLocalHistory(false);
    }
  };

  const saveStartggToken = async () => {
    if (!startggToken.trim()) return;
    try {
      try { localStorage.setItem('fb_startggToken', startggToken.trim()); } catch { }
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ startgg_token: startggToken.trim() })
      });
      if (res.ok) {
        toast.success('Start.gg API token saved to account profile');
        fetchUserProfile();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || 'Failed to save Start.gg token');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save Start.gg token');
    }
  };

  const handleImportCareerStats = async () => {
    if (!userStartggInput.trim()) return;
    setImportingUserStartgg(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/startgg-import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          startgg_slug_or_url: userStartggInput.trim(),
          api_token: startggToken
        })
      });
      if (res.ok) {
        toast.success('Start.gg career profile imported!');
        fetchUserProfile();
      } else {
        // Surface the actual server error so user knows what to fix
        let detail = 'Failed to import Start.gg profile';
        try {
          const errData = await res.json();
          if (errData?.detail) detail = errData.detail;
        } catch { }
        toast.error(detail, { duration: 6000 });
      }
    } catch (err) {
      toast.error('Error connecting to server — check your internet connection');
    } finally {
      setImportingUserStartgg(false);
    }
  };


  const handleTogglePrivacy = async (field: 'is_public' | 'friends_only', value: boolean) => {
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        toast.success('Privacy settings updated');
        fetchUserProfile();
      }
    } catch (err) {
      toast.error('Failed to update privacy settings');
    }
  };

  const saveTekkenId = async () => {
    if (!userTekkenId.trim()) return;
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ tekken_id: userTekkenId.trim() })
      });
      if (res.ok) {
        toast.success('Tekken ID saved successfully');
        fetchUserProfile();
      }
    } catch (err) {
      toast.error('Failed to save Tekken ID');
    }
  };

  const saveSteamId = async () => {
    if (!userSteamId.trim()) return;
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ steam_id: userSteamId.trim() })
      });
      if (res.ok) {
        toast.success('Steam ID / Vanity URL saved successfully');
        fetchUserProfile();
      }
    } catch (err) {
      toast.error('Failed to save Steam ID');
    }
  };

  const saveTwitchData = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          twitch_id: userTwitchId.trim(),
          twitch_url: userTwitchUrl.trim()
        })
      });
      if (res.ok) {
        toast.success('Twitch integration saved successfully');
        fetchUserProfile();
      }
    } catch (err) {
      toast.error('Failed to save Twitch data');
    }
  };

  const handlePasskeySignIn = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Passkeys / WebAuthn are not supported by this browser.');
      return;
    }
    try {
      const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors();
      if (factorsErr) {
        toast.error('Passkey verification failed. Please sign in with password first.');
        return;
      }
      const passkeyFactor = factors?.all?.find(f => f.factor_type === 'webauthn');
      if (!passkeyFactor) {
        toast.error('No Passkey enrolled on this account. Log in with password or Discord, then register your Passkey in Settings!');
        return;
      }

      toast.info('Opening Passkey / Biometric prompt...');
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: passkeyFactor.id });
      if (chErr) {
        toast.error(chErr.message);
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: passkeyFactor.id,
        challengeId: challenge.id,
        code: ''
      });
      if (vErr) {
        toast.error(vErr.message || 'Passkey verification failed');
      } else {
        toast.success('Passkey verified successfully!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Passkey sign-in error');
    }
  };

  const handleEnrollPasskey = async () => {
    if (!user) return;
    if (!window.PublicKeyCredential) {
      toast.error('WebAuthn / Passkeys are not supported in your current browser.');
      return;
    }

    setEnrollingPasskey(true);
    try {
      const friendlyName = prompt('Enter a name for your new Passkey (e.g. "iPhone Touch ID", "MacBook Face ID", "YubiKey"):') || 'Passkey';
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'webauthn',
        friendlyName
      });

      if (error) {
        toast.error(error.message || 'Passkey enrollment failed');
        return;
      }

      toast.success(`Passkey "${friendlyName}" registered successfully!`);
      fetchPasskeyFactors();
    } catch (err: any) {
      toast.error(err?.message || 'Error registering Passkey');
    } finally {
      setEnrollingPasskey(false);
    }
  };

  const handleUnenrollPasskey = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Passkey removed');
        fetchPasskeyFactors();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error removing Passkey');
    }
  };

  const verifyTurnstile = async (): Promise<boolean> => {
    const token = window.turnstile?.getResponse();
    if (!token) {
      toast.error('Please complete the CAPTCHA verification.');
      return false;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!res.ok) {
        toast.error('CAPTCHA verification failed. Please try again.');
        safeResetTurnstile();
        return false;
      }
      return true;
    } catch (err) {
      toast.error('Verification server connection error. Please try again.');
      safeResetTurnstile();
      return false;
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verified = await verifyTurnstile();
    if (!verified) return;

    const getFriendlyError = (err: any) => {
      if (!err) return '';
      const msg = err.message;
      if (!msg || msg === '{}' || typeof msg !== 'string') {
        return 'Supabase server error (500). Please check your Supabase dashboard logs and SMTP configuration.';
      }
      return msg;
    };

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(getFriendlyError(error));
        safeResetTurnstile();
      } else {
        toast.success('Logged in successfully');
      }
    } else {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(getFriendlyError(error));
        safeResetTurnstile();
      } else {
        toast.success('Signed up successfully. If email confirmation is off, you are logged in.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first to reset your password.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      const errMsg = error.message && error.message !== '{}' && typeof error.message === 'string'
        ? error.message
        : 'Failed to send recovery email (HTTP 500). This usually means your Supabase project SMTP/email provider settings are not configured or have hit their rate limit.';
      toast.error(errMsg);
      safeResetTurnstile();
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      safeResetTurnstile();
    }
  };

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.access_token) {
      await supabase.auth.signOut();
      throw new Error('Your session has expired. Please log in again.');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchCloudTournaments = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/tournaments', { headers });
      const data = await res.json();
      if (data.tournaments) setTournaments(data.tournaments);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tournaments');
    }
    setLoading(false);
  };

  const saveToCloud = async () => {
    if (!currentTournamentData?.activeTournament?.name) {
      toast.error('No active tournament to save. Setup a tournament first.');
      return;
    }
    setSaving(true);
    try {
      const slug = currentTournamentData.activeTournament.slug || currentTournamentData.activeTournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        id: slug,
        name: currentTournamentData.activeTournament.name,
        data: JSON.stringify(currentTournamentData)
      };
      const headers = await getHeaders();
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Tournament saved to cloud!');
      fetchCloudTournaments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save to cloud');
    }
    setSaving(false);
  };

  const handleLinkIdentity = async (provider: 'discord' | 'twitch' | 'google') => {
    const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo: window.location.origin } });
    if (error) toast.error(error.message);
  };

  const deleteTournament = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament from the cloud?')) return;
    setDeletingId(id);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Tournament deleted');
      fetchCloudTournaments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete tournament');
    }
    setDeletingId(null);
  };

  const loadTournament = async (id: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/tournaments/${id}`, { headers });
      if (!res.ok) throw new Error('Load failed');
      const data = await res.json();
      const parsedData = JSON.parse(data.tournament.data);
      onLoad(parsedData);
      toast.success('Tournament loaded from cloud!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tournament data');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Check both your old and new email to confirm the change.');
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update email');
    }
    setUpdatingEmail(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    }
    setUpdatingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeletingAccount(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete account');
      }
      toast.success('Account deleted permanently.');
      await supabase.auth.signOut();
      if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    }
    setDeletingAccount(false);
  };

  const handleUpdateAvatar = async () => {
    if (!newAvatarUrl.trim()) return;
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ avatar_url: newAvatarUrl })
      });
      if (!res.ok) throw new Error('Failed to update avatar');
      toast.success('Avatar updated successfully');
      fetchUserProfile();
      setNewAvatarUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Error updating avatar');
    }
  };

  const fetchStartggHosted = async () => {
    if (!startggToken) return toast.error("Please enter a Start.gg token first");
    setFetchingStartgg(true);
    try {
      const query = `
      query CurrentUserTournaments {
        currentUser {
          tournaments(query: {page: 1, perPage: 20}) {
            nodes {
              id
              name
              slug
              state
            }
          }
        }
      }`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/startgg/proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.errors) throw new Error(data.errors[0].message);
      const tourneys = data.data?.currentUser?.tournaments?.nodes || [];
      setStartggTournaments(tourneys);
      if (tourneys.length === 0) toast.info("No hosted tournaments found on Start.gg");
    } catch (err: any) {
      toast.error(`Start.gg Error: ${err.message}`);
    }
    setFetchingStartgg(false);
  };

  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    const { error } = await supabase.auth.updateUser({ data: { displayName: displayName.trim() } });
    if (error) {
      toast.error(error.message);
      return;
    }
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ gamer_tag: displayName.trim() })
      });
      toast.success('Gamer Tag saved!');
      fetchUserProfile();
    } catch {
      toast.success('Profile updated!');
    }
  };

  const saveGamesList = async (updatedList: { game: string; main: string }[]) => {
    setGamesList(updatedList);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ games_data: JSON.stringify(updatedList) })
      });
      toast.success('Fighter Mains updated!');
      fetchUserProfile();
    } catch {
      toast.error('Failed to save mains');
    }
  };

  const handleAddGameMain = () => {
    if (!newGameName.trim()) return toast.error('Please select or enter a game');
    const updated = [...gamesList.filter(g => g.game !== newGameName), { game: newGameName.trim(), main: newMainChar.trim() }];
    saveGamesList(updated);
    setNewMainChar('');
  };

  const handleRemoveGameMain = (gameName: string) => {
    const updated = gamesList.filter(g => g.game !== gameName);
    saveGamesList(updated);
  };

  if (!user) {
    const handleDiscordLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) toast.error(error.message);
    };

    const handleTwitchLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitch',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) toast.error(error.message);
    };

    const handleGoogleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) toast.error(error.message);
    };

    return (
      <div className="flex flex-col min-h-full p-4 md:p-6 items-center justify-center">
        {onNavigateHome && (
          <div className="w-full max-w-md mb-4 flex justify-start">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider text-gray-400 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={14} /> BACK TO HOME
            </button>
          </div>
        )}
        <div className="w-full max-w-md bg-[#0A0E1A]/95 border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Dual Header Tabs */}
          <div className="grid grid-cols-2 border-b border-white/10 bg-[#060913]">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`py-4 text-xs sm:text-sm font-bold tracking-widest uppercase transition-all relative flex items-center justify-center font-rajdhani ${isLogin
                  ? 'text-white bg-white/[0.03]'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              SIGN IN
              {isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`py-4 text-xs sm:text-sm font-bold tracking-widest uppercase transition-all relative flex items-center justify-center font-rajdhani ${!isLogin
                  ? 'text-white bg-white/[0.03]'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              REGISTER
              {!isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-rajdhani tracking-wider uppercase mb-1">
                {isLogin ? 'WELCOME BACK' : 'JOIN THE ARENA'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-mono">
                {isLogin
                  ? 'Enter your credentials to access the arena.'
                  : 'Enter your details to create your FightBracket Pro account.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1.5 font-mono">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full bg-[#121929]/90 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none text-sm font-mono transition-colors focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1.5 font-mono">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#121929]/90 border border-white/10 rounded-lg pl-4 pr-11 py-3 text-white placeholder-gray-600 outline-none text-sm font-mono transition-colors focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isLogin && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs text-gray-400 hover:text-[#00E5FF] transition-colors font-mono"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1.5 font-mono">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#121929]/90 border border-white/10 rounded-lg pl-4 pr-11 py-3 text-white placeholder-gray-600 outline-none text-sm font-mono transition-colors focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-1">
                <div
                  id="turnstile-widget"
                  className="cf-turnstile"
                  data-sitekey="0x4AAAAAAEBO-v0nV0L1u4Sv"
                  data-action="turnstile-spin-v2"
                  data-theme="dark"
                ></div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-lg text-[#050A14] font-bold text-base sm:text-lg tracking-widest uppercase transition-all duration-200 shadow-lg flex items-center justify-center gap-2 font-rajdhani bg-[#00E5FF] hover:bg-[#00B3CC] active:scale-[0.99] shadow-[#00E5FF]/25 mt-2"
              >
                <span>{isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
                <ChevronRight size={18} />
              </button>
            </form>

            {isLogin && (
              <>
                {/* OR Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full border-t border-white/10"></div>
                  <span className="bg-[#0A0E1A] px-3 text-xs font-mono text-gray-500 tracking-widest uppercase absolute">
                    OR
                  </span>
                </div>

                {/* Social Logins */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all hover:shadow-md font-mono"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleDiscordLogin}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-white font-medium text-xs transition-all font-mono"
                      title="Sign in with Discord"
                    >
                      <svg width="16" height="16" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z" />
                      </svg>
                      <span>Discord</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTwitchLogin}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#9146FF]/20 hover:bg-[#9146FF]/30 border border-[#9146FF]/40 text-white font-medium text-xs transition-all font-mono"
                      title="Sign in with Twitch"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                      </svg>
                      <span>Twitch</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePasskeySignIn}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#00FF88]/15 hover:bg-[#00FF88]/25 border border-[#00FF88]/30 text-[#00FF88] font-medium text-xs transition-all font-mono"
                      title="Sign in with Passkey"
                    >
                      <Key size={14} />
                      <span>Passkey</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Bottom Toggle Text */}
            <div className="text-center pt-2 border-t border-white/10">
              <p className="text-xs text-gray-400 font-mono">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#00E5FF] hover:underline font-bold ml-1.5 transition-colors"
                >
                  {isLogin ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex w-full"
      style={{
        background: "#0c0c0e",
        fontFamily: "'Inter', sans-serif",
        color: "#f0ede8",
      }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "220px",
          background: "#0f0f12",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Mobile Close Button */}
        <div
          className="flex items-center gap-3 px-5 py-5 lg:hidden"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="font-bold text-white text-sm tracking-widest font-rajdhani">MENU</div>
          <button
            className="ml-auto text-white/40 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <button
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
            style={{
              color: "#f0ede8",
              background: "rgba(0, 229, 255, 0.1)",
              borderLeft: "2px solid #00E5FF",
              borderRadius: "2px",
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>
          
          {onViewOwnProfile && (
            <button
              onClick={onViewOwnProfile}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group text-[#8a8a9a] hover:text-[#00E5FF] hover:bg-white/5"
              style={{ borderLeft: "2px solid transparent", borderRadius: "2px" }}
            >
              <Globe size={15} />
              Public Profile
            </button>
          )}

          {onOpenFriendsModal && (
            <button
              onClick={onOpenFriendsModal}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group text-[#8a8a9a] hover:text-[#00E5FF] hover:bg-white/5"
              style={{ borderLeft: "2px solid transparent", borderRadius: "2px" }}
            >
              <Users size={15} />
              Friends & DMs
              {userProfile?.unread_messages_count ? (
                <span className="ml-auto bg-[#00E5FF] text-[#050A14] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {userProfile.unread_messages_count}
                </span>
              ) : null}
            </button>
          )}

          <button
            onClick={() => setActiveTab("Settings")}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
            style={{
              color: activeTab === "Settings" ? "#f0ede8" : "#8a8a9a",
              background: activeTab === "Settings" ? "rgba(0, 229, 255, 0.1)" : "transparent",
              borderLeft: activeTab === "Settings" ? "2px solid #00E5FF" : "2px solid transparent",
              borderRadius: "2px",
            }}
          >
            <Settings size={15} />
            Settings
          </button>

          <div className="mt-auto pt-4">
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group text-[#8a8a9a] hover:text-red-400 hover:bg-red-500/10"
              style={{ borderLeft: "2px solid transparent", borderRadius: "2px" }}
            >
              <LogOut size={15} />
              Log Out
            </button>
          </div>
        </nav>

        {/* User */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#050A14] flex-shrink-0"
              style={{ background: "#00E5FF", borderRadius: "2px" }}
            >
              {(userProfile?.gamer_tag || user.user_metadata?.displayName || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white truncate">{userProfile?.gamer_tag || user.user_metadata?.displayName || 'User'}</div>
              <div className="text-[10px]" style={{ color: "#00E5FF" }}>
                {userProfile?.unique_id || 'PRO USER'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center gap-4 px-6 py-4 sticky top-0 z-20"
          style={{
            background: "rgba(12,12,14,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div
              className="flex items-center gap-2 flex-1 px-3 h-9 text-sm"
              style={{
                background: "#1e1e24",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <Search size={13} style={{ color: "#8a8a9a" }} />
              <input
                placeholder="Search..."
                className="bg-transparent outline-none flex-1 placeholder:text-white/20 text-sm font-mono"
                style={{ color: "#f0ede8" }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-3 py-1.5 mr-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
            >
              <LogOut size={14} /> LOG OUT
            </button>

            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>
              <Bell size={16} style={{ color: "#8a8a9a" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            </button>

            {/* Home CTA */}
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="hidden sm:flex items-center gap-2 h-9 px-4 text-xs font-semibold text-[#050A14] transition-all duration-150"
                style={{
                  background: "#00E5FF",
                  borderRadius: "2px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#00B3CC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#00E5FF")}
              >
                <ArrowLeft size={13} />
                RETURN HOME
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "Settings" && (
            <AccountSettingsPanel
              user={user}
              userProfile={userProfile}
              fetchUserProfile={fetchUserProfile}
              getHeaders={getHeaders}
            />
          )}
          <div style={{ display: activeTab === "Settings" ? 'none' : 'block' }}>
          {/* Page heading */}
          <div className="mb-6">
            <h1
              className="text-white uppercase tracking-wide mb-0.5"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "1.5rem",
                letterSpacing: "0.05em",
              }}
            >
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: "#8a8a9a" }}>
              Welcome back, {userProfile?.gamer_tag || user.user_metadata?.displayName || 'User'}.
            </p>
          </div>
          
          <div className="max-w-6xl space-y-8 animate-in fade-in duration-300">

      {/* Full Width Tekken 8 Live Stats Box */}
      <div className="bg-[#050A14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-full">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
              TEKKEN 8 LIVE STATS & RANKING
            </h3>
            <p className="text-[11px] font-mono text-gray-400 tracking-wider mt-0.5">
              Live ranking & battle history synced from EWGF · updates on demand
            </p>
          </div>
          {!userProfile?.tekken_id && (
            <button
              onClick={() => setActiveTab('Settings')}
              className="text-xs font-mono text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1.5 rounded-lg hover:bg-[#00E5FF]/20 transition-all shrink-0"
            >
              + SET POLARIS ID IN SETTINGS
            </button>
          )}
        </div>
        <div className="p-6">
          <TekkenStatsPanel tekkenId={userProfile?.tekken_id} />
        </div>
      </div>

      {/* Full Width Steam Live Gamer Card Box */}
      <div className="bg-[#050A14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-full">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
              STEAM PLAYER CARD & LIVE STATUS
            </h3>
            <p className="text-[11px] font-mono text-gray-400 tracking-wider mt-0.5">
              Live status, avatar, and Steam profile connection
            </p>
          </div>
          {!userProfile?.steam_id && (
            <button
              onClick={() => setActiveTab('Settings')}
              className="text-xs font-mono text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1.5 rounded-lg hover:bg-[#00E5FF]/20 transition-all shrink-0"
            >
              + SET STEAM ID IN SETTINGS
            </button>
          )}
        </div>
        <div className="p-6">
          <SteamStatsPanel steamId={userProfile?.steam_id} />
        </div>
      </div>

      {/* 2-Column Grid for Games & Mains + Start.gg Past Events & Cloud Saves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left Column: Main Games & Characters */}
        <div className="space-y-6">
          <div className="bg-[#050A14] border border-white/10 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
                MAIN GAMES & CHARACTERS
              </h3>
            </div>

            {/* Quick Add */}
            <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl space-y-3">
              <div className="text-xs font-mono text-gray-400 font-bold">ADD OR UPDATE YOUR MAIN</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  list="games-datalist"
                  value={newGameName}
                  onChange={e => setNewGameName(e.target.value)}
                  placeholder="Game Name (e.g. Tekken 8)"
                  className="bg-[#111] border border-gray-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#00E5FF] min-w-[150px]"
                />
                <datalist id="games-datalist">
                  <option value="Tekken 8" />
                  <option value="Tekken 7" />
                  <option value="Tekken 6" />
                  <option value="Tekken 5" />
                  <option value="Street Fighter 6" />
                  <option value="Street Fighter V" />
                  <option value="Street Fighter IV" />
                  <option value="Street Fighter III: 3rd Strike" />
                  <option value="Soul Calibur VI" />
                  <option value="Soul Calibur V" />
                  <option value="Guilty Gear Strive" />
                  <option value="Guilty Gear Xrd" />
                  <option value="Fatal Fury: City of the Wolves" />
                  <option value="2XKO" />
                  <option value="Avatar: The Last Airbender" />
                  <option value="Smash Ultimate" />
                  <option value="Smash Melee" />
                  <option value="Mortal Kombat 1" />
                  <option value="Mortal Kombat 11" />
                  <option value="GBVSR" />
                  <option value="UNI2" />
                  <option value="DBFZ" />
                  <option value="KOF XV" />
                  <option value="Marvel vs. Capcom 3" />
                  <option value="Marvel vs. Capcom 2" />
                  <option value="BlazBlue: Central Fiction" />
                </datalist>
                <input
                  type="text"
                  placeholder="Main Character (Optional)"
                  value={newMainChar}
                  onChange={e => setNewMainChar(e.target.value)}
                  className="flex-1 bg-[#111] border border-gray-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#00E5FF]"
                />
                <button
                  onClick={handleAddGameMain}
                  className="px-4 py-2 bg-[#00E5FF] text-[#050A14] font-bold font-rajdhani tracking-wider rounded-lg text-xs hover:bg-[#00B3CC] transition-all shrink-0"
                >
                  ADD
                </button>
              </div>
            </div>

            {/* List of games & mains */}
            {gamesList.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-gray-500">
                No main games added yet. Add your main characters above to display them on your profile!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {gamesList.map(item => {
                  const coverUrl = GAME_COVERS[item.game];
                  return (
                    <div 
                      key={item.game} 
                      className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group shadow-lg flex flex-col justify-end bg-[#050A14]"
                    >
                      {/* Background Cover */}
                      {coverUrl ? (
                        <img src={coverUrl} alt={item.game} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 to-[#050A14] flex flex-col items-center justify-center p-4 text-center">
                          <Swords size={24} className="text-white/20 mb-2" />
                          <span className="font-bold font-rajdhani text-lg text-white/40 leading-tight">{item.game}</span>
                        </div>
                      )}
                      
                      {/* Gradient Overlay for Text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      {/* Text Content */}
                      <div className="relative z-10 p-3 w-full transform transition-transform duration-300 group-hover:translate-y-[-2px]">
                        <div className="font-bold text-[10px] sm:text-xs font-mono text-[#00E5FF] line-clamp-1 truncate drop-shadow-md">{item.game}</div>
                        {item.main && (
                          <div className="text-sm sm:text-base font-bold font-rajdhani text-white mt-0.5 line-clamp-1 truncate drop-shadow-md">{item.main}</div>
                        )}
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveGameMain(item.game)}
                        className="absolute top-2 right-2 z-20 text-white/50 bg-black/50 p-1.5 rounded-full hover:text-red-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-md"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cloud Saves */}
          <div className="bg-[#050A14] border border-white/10 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
                <Cloud size={20} /> CLOUD SAVES
              </h3>
              <div className="flex gap-2">
                <button onClick={fetchCloudTournaments} className="p-2 rounded-lg border border-white/10 text-white hover:border-white/30 hover:bg-white/5 transition-all" title="Refresh">
                  <RefreshCw size={15} />
                </button>
                <button onClick={saveToCloud} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00E5FF] hover:bg-[#00B3CC] text-[#050A14] font-bold transition-all font-rajdhani tracking-wider text-sm disabled:opacity-50">
                  <Save size={15} /> {saving ? 'SAVING...' : 'SAVE CURRENT'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 opacity-50 font-mono text-sm">Loading from cloud...</div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-10 opacity-50 font-mono text-sm">No tournaments saved in the cloud.</div>
            ) : (
              <div className="space-y-3">
                {tournaments.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-[#111] border border-gray-800 hover:border-[#00E5FF]/50 rounded-lg transition-colors group">
                    <div>
                      <div className="font-bold text-white font-rajdhani text-lg">{t.name}</div>
                      <div className="text-xs text-gray-500 font-mono">ID: {t.id}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => loadTournament(t.id)} className="flex items-center gap-1 px-3 py-1.5 bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 border border-[#00FF88]/30 rounded font-rajdhani font-bold tracking-wider transition-colors text-sm">
                        <Download size={14} /> LOAD
                      </button>
                      <button onClick={() => deleteTournament(t.id)} disabled={deletingId === t.id} className="p-1.5 text-gray-500 hover:text-[#FF006E] hover:bg-[#FF006E]/10 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Start.gg Past Events */}
        <div className="space-y-6">
          <div className="bg-[#050A14] border border-white/10 p-6 rounded-2xl shadow-xl">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
                <Key size={20} /> START.GG PAST EVENTS
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-2">Connect your Developer API Token to view and import events you have participated in.</p>
            </div>

            {!startggToken && (
              <div className="mb-4 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 p-3 rounded flex items-center gap-2">
                <AlertTriangle size={14} /> Please add your Start.gg API Token in Account Settings to use this feature.
              </div>
            )}

            <button
              onClick={fetchStartggHosted}
              disabled={fetchingStartgg || !startggToken}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00E5FF] hover:bg-[#00B3CC] disabled:opacity-50 text-[#050A14] font-bold rounded-lg transition-colors font-rajdhani tracking-widest mb-6"
            >
              <RefreshCw size={16} className={fetchingStartgg ? "animate-spin" : ""} />
              {fetchingStartgg ? 'FETCHING...' : 'FETCH MY PAST EVENTS'}
            </button>

            {startggTournaments.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {startggTournaments.map(t => (
                  <div key={t.id} className="flex flex-col p-4 bg-[#111] border border-gray-800 hover:border-[#00E5FF]/50 rounded-lg transition-colors">
                    <div className="font-bold text-white font-rajdhani text-lg truncate mb-1">{t.name}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">State: {t.state === 1 ? 'Published' : 'Draft'}</span>
                      <button
                        onClick={() => onStartggImport(t.slug)}
                        className="text-xs font-bold font-rajdhani tracking-widest text-[#00E5FF] hover:underline"
                      >
                        IMPORT →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Local Tournament History */}
        <div className="space-y-6 md:col-span-2">
          <div className="bg-[#050A14] border border-white/10 p-6 rounded-2xl shadow-xl">
            <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
                  <Key size={20} /> LOCAL TOURNAMENT HISTORY
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-2">Custom tournaments you've participated in on this platform.</p>
              </div>
              <button
                onClick={() => userProfile?.unique_id && fetchLocalHistory(userProfile.unique_id)}
                disabled={fetchingLocalHistory}
                className="p-2 rounded-lg border border-white/10 text-white hover:border-white/30 hover:bg-white/5 transition-all"
                title="Refresh History"
              >
                <RefreshCw size={15} className={fetchingLocalHistory ? "animate-spin" : ""} />
              </button>
            </div>
            
            {fetchingLocalHistory ? (
              <div className="text-center py-8 opacity-50 font-mono text-sm">Loading history...</div>
            ) : localHistory.length === 0 ? (
              <div className="text-center py-8 opacity-50 font-mono text-sm">No local tournament history found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localHistory.map((t, idx) => (
                  <div key={`${t.tournament_id}-${idx}`} className="flex flex-col p-4 bg-[#111] border border-gray-800 rounded-lg hover:border-[#00E5FF]/30 transition-colors">
                    <div className="text-xs font-mono text-gray-500 mb-1">{new Date(t.date).toLocaleDateString()}</div>
                    <div className="font-bold text-white font-rajdhani text-lg truncate mb-2">{t.tournament_name}</div>
                    <div className="flex justify-between items-end mt-auto pt-2 border-t border-white/5">
                      <div className="text-xs font-mono text-gray-400">Played as: <span className="text-[#00E5FF]">{t.gamer_tag}</span></div>
                      {t.placement && (
                        <div className="text-sm font-bold font-rajdhani text-white bg-white/10 px-2 rounded">
                          {t.placement}{[11,12,13].includes(t.placement%100) ? 'th' : ['st','nd','rd'][t.placement%10-1] || 'th'} Place
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      
    </div>
    </div>
          </div>
  </main>
</div>
</div>
  );
}
