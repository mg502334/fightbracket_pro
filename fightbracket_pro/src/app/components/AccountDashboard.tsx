import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Save, Download, RefreshCw, Key, LogOut, ArrowLeft, Globe, ExternalLink, Settings, X, AlertTriangle, User, Shield, Swords, Sparkles, Cloud, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { TekkenStatsPanel } from './TekkenStatsPanel';
import { SteamStatsPanel } from './SteamStatsPanel';

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
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    } catch {}
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
          } catch (e) {}
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
    setProfileLoading(true);
    setProfileError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setProfileError(data.error);
          console.error('Profile API error:', data.error);
          return;
        }
        setUserProfile(data.user);
        if (data.user?.startgg_slug) setUserStartggInput(data.user.startgg_slug);
        if (data.user?.startgg_token) {
          setStartggToken(data.user.startgg_token);
          try { localStorage.setItem('fb_startggToken', data.user.startgg_token); } catch {}
        }
        if (data.user?.tekken_id) setUserTekkenId(data.user.tekken_id);
        if (data.user?.steam_id) setUserSteamId(data.user.steam_id);
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
            if (Array.isArray(parsed)) setGamesList(parsed);
          } catch {}
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

  const saveStartggToken = async () => {
    if (!startggToken.trim()) return;
    try {
      try { localStorage.setItem('fb_startggToken', startggToken.trim()); } catch {}
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
      const res = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${startggToken}`,
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
    if (!newMainChar.trim()) return toast.error('Please enter your main character');
    const updated = [...gamesList.filter(g => g.game !== newGameName), { game: newGameName, main: newMainChar.trim() }];
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

    return (
      <div className="flex flex-col h-full p-4">
        {onNavigateHome && (
          <div className="mb-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wider text-gray-400 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={12} /> BACK TO HOME
            </button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className={`bg-[#050A14] border p-10 rounded-xl shadow-2xl w-full max-w-lg transition-colors duration-300 ${isLogin ? 'border-[#00E5FF]' : 'border-[#FF006E]'}`}>
            <h2 className={`text-3xl font-bold mb-2 text-center transition-colors duration-300 ${isLogin ? 'text-[#00E5FF]' : 'text-[#FF006E]'}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </h2>
            <p className="text-center text-gray-400 text-sm mb-8 font-mono">
              {isLogin ? 'Welcome back to FightBracket Pro' : 'Join the next generation of bracket management'}
            </p>

            {/* Discord OAuth & Passkey Sign In */}
            {isLogin && (
              <>
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleDiscordLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-white font-bold text-base tracking-widest transition-all hover:brightness-110 shadow-lg"
                    style={{ background: '#5865F2', fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z" fill="white" />
                    </svg>
                    SIGN IN WITH DISCORD
                  </button>

                  <button
                    onClick={handleTwitchLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-white font-bold text-base tracking-widest transition-all hover:brightness-110 shadow-lg bg-[#9146FF]"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                    SIGN IN WITH TWITCH
                  </button>

                  <button
                    onClick={handlePasskeySignIn}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-black font-bold text-base tracking-widest transition-all hover:brightness-110 shadow-lg bg-[#00FF88] hover:bg-[#00FF88]/90 font-rajdhani"
                  >
                    <Key size={18} />
                    SIGN IN WITH PASSKEY / BIOMETRIC
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gray-800"></div>
                  <span className="text-xs text-gray-500 font-mono tracking-wider">OR USE EMAIL</span>
                  <div className="flex-1 h-px bg-gray-800"></div>
                </div>
              </>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>EMAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className={`w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white outline-none transition-colors ${isLogin ? 'focus:border-[#00E5FF]' : 'focus:border-[#FF006E]'}`} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>PASSWORD</label>
                  {isLogin && (
                    <button type="button" onClick={handleResetPassword} className="text-xs text-gray-500 hover:text-[#00E5FF] transition-colors" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className={`w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white outline-none transition-colors ${isLogin ? 'focus:border-[#00E5FF]' : 'focus:border-[#FF006E]'}`} />
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>CONFIRM PASSWORD</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white outline-none transition-colors focus:border-[#FF006E]" />
                </div>
              )}
              <div className="flex justify-center mt-4">
                <div
                  id="turnstile-widget"
                  className="cf-turnstile"
                  data-sitekey="0x4AAAAAAEBO-v0nV0L1u4Sv"
                  data-action="turnstile-spin-v2"
                  data-theme="dark"
                ></div>
              </div>
              <button type="submit" className={`w-full font-bold py-3 rounded-lg text-xl transition-all tracking-widest mt-4 ${isLogin ? 'bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black' : 'bg-[#FF006E] hover:bg-[#FF006E]/80 text-white'}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {isLogin ? 'SIGN IN' : 'REGISTER NOW'}
              </button>
            </form>
            <div className="mt-8 text-center border-t border-gray-800 pt-6">
              <p className="text-sm text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-[#FF006E] hover:text-[#FF006E]/80 font-bold ml-2 transition-colors">
                  {isLogin ? 'Register Now' : 'Log In Here'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Top Bar: Account Info */}
      <div className="bg-[#050A14]/90 border border-[#00FF88]/30 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Navigation + Title + User Greeting */}
        <div className="flex items-center gap-4">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider text-gray-300 hover:text-white border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all shrink-0"
              title="Return to Home"
            >
              <ArrowLeft size={14} />
              <span>HOME</span>
            </button>
          )}

          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-rajdhani text-white tracking-wide">
              ACCOUNT DASHBOARD
            </h2>
            <p className="text-[#00FF88] font-mono text-xs md:text-sm mt-0.5">
              Welcome, <span className="text-white font-semibold">{user.user_metadata?.displayName || 'Host'}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAccountSettingsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 hover:border-[#FF006E]/60 text-gray-200 hover:text-[#FF006E] bg-white/5 hover:bg-[#FF006E]/10 transition-all font-rajdhani tracking-wider font-semibold text-xs"
          >
            <Settings size={14} />
            <span>SETTINGS</span>
          </button>

          {onViewOwnProfile && (
            <button
              onClick={onViewOwnProfile}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/10 transition-all font-rajdhani tracking-wider font-semibold text-xs"
            >
              <Globe size={14} />
              <span>PUBLIC PROFILE</span>
            </button>
          )}

          {onOpenFriendsModal && (
            <button
              onClick={onOpenFriendsModal}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all font-rajdhani tracking-wider font-semibold text-xs"
            >
              <Users size={14} />
              <span>FRIENDS &amp; DMs</span>
              {userProfile?.unread_messages_count ? (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF006E] text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-md">
                  {userProfile.unread_messages_count}
                </span>
              ) : null}
            </button>
          )}

          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all font-rajdhani tracking-wider font-semibold text-xs"
          >
            <LogOut size={14} />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Full Width Tekken 8 Live Stats Box */}
      <div className="bg-[#050A14] border border-[#ff003c]/30 rounded-2xl shadow-2xl overflow-hidden w-full">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-xl font-bold font-rajdhani text-[#ff003c] tracking-widest flex items-center gap-2">
              TEKKEN 8 LIVE STATS & RANKING
            </h3>
            <p className="text-[11px] font-mono text-gray-400 tracking-wider mt-0.5">
              Live ranking & battle history synced from EWGF · updates on demand
            </p>
          </div>
          {!userProfile?.tekken_id && (
            <button
              onClick={() => setShowAccountSettingsModal(true)}
              className="text-xs font-mono text-[#ff003c] bg-[#ff003c]/10 border border-[#ff003c]/30 px-3 py-1.5 rounded-lg hover:bg-[#ff003c]/20 transition-all shrink-0"
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
      <div className="bg-[#050A14] border border-[#57CBDE]/30 rounded-2xl shadow-2xl overflow-hidden w-full">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-xl font-bold font-rajdhani text-[#57CBDE] tracking-widest flex items-center gap-2">
              STEAM PLAYER CARD & LIVE STATUS
            </h3>
            <p className="text-[11px] font-mono text-gray-400 tracking-wider mt-0.5">
              Live status, avatar, and Steam profile connection
            </p>
          </div>
          {!userProfile?.steam_id && (
            <button
              onClick={() => setShowAccountSettingsModal(true)}
              className="text-xs font-mono text-[#57CBDE] bg-[#57CBDE]/10 border border-[#57CBDE]/30 px-3 py-1.5 rounded-lg hover:bg-[#57CBDE]/20 transition-all shrink-0"
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
          <div className="bg-[#050A14] border border-[#FF006E]/30 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold font-rajdhani text-[#FF006E] tracking-widest flex items-center gap-2">
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
                  className="bg-[#111] border border-gray-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#FF006E] min-w-[150px]"
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
                  placeholder="Main Character (e.g. Kazuya)"
                  value={newMainChar}
                  onChange={e => setNewMainChar(e.target.value)}
                  className="flex-1 bg-[#111] border border-gray-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#FF006E]"
                />
                <button
                  onClick={handleAddGameMain}
                  className="px-4 py-2 bg-[#FF006E] text-white font-bold font-rajdhani tracking-wider rounded-lg text-xs hover:bg-[#FF006E]/80 transition-all shrink-0"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {gamesList.map(item => (
                  <div key={item.game} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between group">
                    <div>
                      <div className="font-bold text-xs font-mono text-[#00E5FF]">{item.game}</div>
                      <div className="text-sm font-bold font-rajdhani text-white mt-0.5">{item.main}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveGameMain(item.game)}
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cloud Saves */}
          <div className="bg-[#050A14] border border-[#00E5FF]/30 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest flex items-center gap-2">
                <Cloud size={20} /> CLOUD SAVES
              </h3>
              <div className="flex gap-2">
                <button onClick={fetchCloudTournaments} className="p-2 rounded-lg border border-white/10 text-white hover:border-white/30 hover:bg-white/5 transition-all" title="Refresh">
                  <RefreshCw size={15} />
                </button>
                <button onClick={saveToCloud} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-bold transition-all font-rajdhani tracking-wider text-sm disabled:opacity-50">
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
          <div className="bg-[#050A14] border border-[#FF006E]/30 p-6 rounded-2xl shadow-xl">
            <div className="border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-xl font-bold font-rajdhani text-[#FF006E] tracking-widest flex items-center gap-2">
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
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF006E] hover:bg-[#FF006E]/80 disabled:opacity-50 text-white font-bold rounded-lg transition-colors font-rajdhani tracking-widest mb-6"
            >
              <RefreshCw size={16} className={fetchingStartgg ? "animate-spin" : ""} />
              {fetchingStartgg ? 'FETCHING...' : 'FETCH MY PAST EVENTS'}
            </button>

            {startggTournaments.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {startggTournaments.map(t => (
                  <div key={t.id} className="flex flex-col p-4 bg-[#111] border border-gray-800 hover:border-[#FF006E]/50 rounded-lg transition-colors">
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
        </div>

      </div>

      {/* Account Settings Modal Overlay */}
      <AnimatePresence>
        {showAccountSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAccountSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#050A14] border border-[#FF006E]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3 text-[#FF006E]">
                  <Settings size={20} />
                  <h3 className="text-xl font-bold font-rajdhani tracking-widest">ACCOUNT SETTINGS</h3>
                </div>
                <button onClick={() => setShowAccountSettingsModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                
                {/* === PROFILE & PRIVACY SECTION === */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-bold font-rajdhani text-[#00FF88] tracking-widest border-b border-[#00FF88]/30 pb-2 flex items-center gap-2">
                    <Shield size={16} /> PROFILE & PRIVACY
                  </h4>

                  {/* Always-visible FB-ID row */}
                  <div className="bg-black/40 border border-[#00FF88]/20 p-3.5 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#00FF88] font-mono tracking-wider opacity-80">UNIQUE FB-ID</span>
                      <button
                        onClick={fetchUserProfile}
                        className="text-xs text-gray-500 hover:text-white font-mono transition-colors"
                        title="Refresh"
                      >
                        ↻
                      </button>
                    </div>
                    {userProfile?.unique_id ? (
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-mono font-bold tracking-widest bg-[#00FF88]/10 px-2.5 py-1 rounded text-[#00FF88] text-sm">
                          {userProfile.unique_id}
                        </span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(userProfile.unique_id!); toast.success('FB-ID copied!'); }}
                          className="text-xs text-gray-400 hover:text-white font-mono ml-2 transition-colors px-2.5 py-1 bg-white/5 rounded border border-white/10 hover:bg-white/10"
                        >
                          COPY
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-mono text-gray-400">
                          {profileLoading ? 'Loading FB-ID...' : profileError ? `Error: ${profileError}` : 'FB-ID not initialized'}
                        </span>
                        <button
                          onClick={fetchUserProfile}
                          className="text-xs text-[#00FF88] hover:underline font-mono ml-2"
                        >
                          RETRY
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gamer Tag */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-gray-400">GAMER TAG / DISPLAY NAME</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Gamertag or Channel Name"
                        className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#00FF88] outline-none font-mono text-sm"
                      />
                      <button
                        onClick={saveDisplayName}
                        className="px-5 py-2 rounded-lg border border-[#00FF88]/50 text-[#00FF88] hover:bg-[#00FF88]/10 font-rajdhani font-bold tracking-wider transition-all text-sm shrink-0"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>

                  {/* Privacy Controls */}
                  <div className="pt-2 space-y-2.5">
                    <div className="text-xs font-mono font-bold text-gray-400">PRIVACY CONTROLS</div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-xs font-mono opacity-80">Publicly Searchable Profile</span>
                      <button
                        onClick={() => handleTogglePrivacy('is_public', !(userProfile?.is_public ?? true))}
                        className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${(userProfile?.is_public ?? true) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 text-gray-400'
                          }`}
                      >
                        {(userProfile?.is_public ?? true) ? 'PUBLIC' : 'HIDDEN'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-xs font-mono opacity-80">Friends-Only Start.gg Stats</span>
                      <button
                        onClick={() => handleTogglePrivacy('friends_only', !(userProfile?.friends_only ?? false))}
                        className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${(userProfile?.friends_only ?? false) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-white/5 text-gray-400'
                          }`}
                      >
                        {(userProfile?.friends_only ?? false) ? 'FRIENDS ONLY' : 'ANYONE'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* === INTEGRATIONS SECTION === */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-sm font-bold font-rajdhani text-cyan-400 tracking-widest border-b border-cyan-500/30 pb-2 flex items-center gap-2">
                    <Globe size={16} /> INTEGRATIONS & API KEYS
                  </h4>
                  
                  {/* Start.gg Token & Career Import */}
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-xs font-mono font-bold text-gray-400 flex items-center justify-between">
                      <span>START.GG API TOKEN & PROFILE SLUG</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Start.gg Developer Token"
                        value={startggToken}
                        onChange={e => setStartggToken(e.target.value)}
                        className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-cyan-400 outline-none font-mono text-sm"
                      />
                      <button
                        onClick={saveStartggToken}
                        disabled={!startggToken.trim()}
                        className="px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                      >
                        SAVE TOKEN
                      </button>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Start.gg Profile Slug (e.g. mang0)"
                        value={userStartggInput}
                        onChange={e => setUserStartggInput(e.target.value)}
                        className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-cyan-400 outline-none font-mono text-sm"
                      />
                      <button
                        onClick={handleImportCareerStats}
                        disabled={importingUserStartgg || !userStartggInput.trim() || !startggToken}
                        className="px-5 py-2 rounded-lg bg-[#FF006E]/20 border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/30 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                      >
                        {importingUserStartgg ? 'IMPORTING...' : 'IMPORT'}
                      </button>
                    </div>
                  </div>

                  {/* Tekken 8 Polaris ID */}
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-xs font-mono font-bold text-gray-400">TEKKEN 8 POLARIS ID</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 1234-5678-9012"
                        value={userTekkenId}
                        onChange={e => setUserTekkenId(e.target.value)}
                        className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#ff003c] outline-none font-mono text-sm"
                      />
                      <button
                        onClick={saveTekkenId}
                        disabled={!userTekkenId.trim()}
                        className="px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                      >
                        SAVE ID
                      </button>
                    </div>
                  </div>

                  {/* Steam ID or Vanity URL */}
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-xs font-mono font-bold text-gray-400">STEAM ID OR VANITY USERNAME</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 76561198000000000 or customurl"
                        value={userSteamId}
                        onChange={e => setUserSteamId(e.target.value)}
                        className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#57CBDE] outline-none font-mono text-sm"
                      />
                      <button
                        onClick={saveSteamId}
                        disabled={!userSteamId.trim()}
                        className="px-5 py-2 rounded-lg border border-[#57CBDE]/50 text-[#57CBDE] hover:bg-[#57CBDE]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                      >
                        SAVE ID
                      </button>
                    </div>
                  </div>

                  {/* Twitch ID & URL */}
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-gray-400">TWITCH CHANNEL USERNAME & URL</div>
                      <button
                        onClick={async () => {
                          const { error } = await supabase.auth.signInWithOAuth({
                            provider: 'twitch',
                            options: {
                              redirectTo: window.location.origin,
                            }
                          });
                          if (error) toast.error(error.message);
                        }}
                        className="px-3 py-1 rounded text-xs font-mono bg-[#9146FF]/20 text-[#9146FF] hover:bg-[#9146FF]/30 border border-[#9146FF]/40 transition-all flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                        SIGN IN WITH TWITCH
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Twitch Username (e.g. fightbracket)"
                        value={userTwitchId}
                        onChange={e => setUserTwitchId(e.target.value)}
                        className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#9146FF] outline-none font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Twitch URL (e.g. https://twitch.tv/fightbracket)"
                          value={userTwitchUrl}
                          onChange={e => setUserTwitchUrl(e.target.value)}
                          className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#9146FF] outline-none font-mono text-sm"
                        />
                        <button
                          onClick={saveTwitchData}
                          className="px-5 py-2 rounded-lg border border-[#9146FF]/50 text-[#9146FF] hover:bg-[#9146FF]/10 font-rajdhani font-bold tracking-wider transition-all text-sm shrink-0"
                        >
                          SAVE TWITCH
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* === BASIC SETTINGS SECTION === */}
                <h4 className="text-sm font-bold font-rajdhani text-[#FF006E] tracking-widest border-b border-[#FF006E]/30 pb-2 flex items-center gap-2">
                  <User size={16} /> PROFILE & ACCOUNT
                </h4>
                       {/* Update Avatar Upload */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-gray-400 flex items-center justify-between">
                    <span>UPLOAD AVATAR IMAGE</span>
                    {userProfile?.avatar_url && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setNewAvatarUrl(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2 text-white outline-none font-mono text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#FF006E]/20 file:text-[#FF006E] hover:file:bg-[#FF006E]/30"
                    />
                    <button
                      onClick={handleUpdateAvatar}
                      disabled={!newAvatarUrl.trim()}
                      className="px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                    >
                      SAVE
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono">Select an image file to upload as your profile picture.</p>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Update Email */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-gray-400">UPDATE EMAIL ADDRESS</div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="New Email Address"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#FF006E] outline-none font-mono text-sm"
                    />
                    <button
                      onClick={handleUpdateEmail}
                      disabled={updatingEmail || !newEmail.trim()}
                      className="px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                    >
                      {updatingEmail ? 'UPDATING...' : 'UPDATE'}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Change Password */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-gray-400">CHANGE PASSWORD</div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="New Password (min. 6 chars)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#FF006E] outline-none font-mono text-sm"
                    />
                    <button
                      onClick={handleUpdatePassword}
                      disabled={updatingPassword || !newPassword.trim()}
                      className="px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                    >
                      {updatingPassword ? 'UPDATING...' : 'UPDATE'}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Passkeys & Biometrics */}
                <div className="space-y-3">
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Key size={14} /> PASSKEYS & BIOMETRIC SECURITY</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">Supabase WebAuthn</span>
                  </div>
                  <p className="text-xs font-mono text-gray-400">
                    Register Touch ID, Face ID, Windows Hello, or a hardware Security Key for instant passwordless sign in.
                  </p>
                  
                  {passkeyFactors.length > 0 && (
                    <div className="space-y-2">
                      {passkeyFactors.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-emerald-400" />
                            <span className="text-xs font-mono font-bold text-white">{f.friendly_name || 'Registered Passkey'}</span>
                          </div>
                          <button
                            onClick={() => handleUnenrollPasskey(f.id)}
                            className="text-xs font-mono text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-all"
                            title="Remove Passkey"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleEnrollPasskey}
                    disabled={enrollingPasskey}
                    className="w-full py-2.5 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-rajdhani font-bold tracking-wider transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Key size={14} /> {enrollingPasskey ? 'REGISTERING PASSKEY...' : '+ REGISTER NEW PASSKEY / TOUCH ID'}
                  </button>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Delete Account */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-mono font-bold text-red-500 flex items-center gap-2">
                    <AlertTriangle size={14} /> DANGER ZONE
                  </div>
                  {!showDeleteModal ? (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full px-5 py-3 rounded-lg bg-red-600/10 border border-red-600/50 text-red-500 hover:bg-red-600/20 font-rajdhani font-bold tracking-wider transition-all text-sm"
                    >
                      DELETE ACCOUNT PERMANENTLY
                    </button>
                  ) : (
                    <div className="space-y-2 bg-red-950/30 p-4 rounded-lg border border-red-600/50 animate-in fade-in zoom-in duration-200">
                      <p className="text-xs font-mono text-red-400 leading-relaxed">
                        WARNING: This will permanently delete your account, tournaments, messages, and profile. This action cannot be undone. Type <span className="font-bold text-white">DELETE</span> below to confirm.
                      </p>
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Type DELETE"
                          value={deleteConfirmation}
                          onChange={e => setDeleteConfirmation(e.target.value)}
                          className="flex-1 bg-[#111] border border-red-600/50 rounded-lg p-2.5 text-white focus:border-red-500 outline-none font-mono text-sm"
                        />
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount || deleteConfirmation !== 'DELETE'}
                          className="px-5 py-2 rounded-lg bg-red-600 text-white font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                        >
                          {deletingAccount ? 'DELETING...' : 'CONFIRM'}
                        </button>
                      </div>
                      <button
                        onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                        className="w-full text-center text-xs font-mono text-gray-400 hover:text-white mt-2"
                      >
                        Cancel Deletion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
