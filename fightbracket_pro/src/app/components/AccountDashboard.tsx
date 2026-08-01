import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Save, Download, RefreshCw, Key, LogOut, ArrowLeft, Globe, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { TekkenStatsPanel } from './TekkenStatsPanel';

declare global {
  interface Window {
    turnstile?: any;
  }
}

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
    is_public?: boolean;
    friends_only?: boolean;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [userStartggInput, setUserStartggInput] = useState('');
  const [userTekkenId, setUserTekkenId] = useState('');
  const [importingUserStartgg, setImportingUserStartgg] = useState(false);

  // Start.gg state
  const [startggToken, setStartggToken] = useState(() => {
    try { return localStorage.getItem('fb_startggToken') || ''; } catch { return ''; }
  });
  const [startggTournaments, setStartggTournaments] = useState<any[]>([]);
  const [fetchingStartgg, setFetchingStartgg] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCloudTournaments();
      fetchUserProfile();
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
        if (data.user?.tekken_id) setUserTekkenId(data.user.tekken_id);
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
        } catch {}
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
        window.turnstile?.reset();
        return false;
      }
      return true;
    } catch (err) {
      toast.error('Verification server connection error. Please try again.');
      window.turnstile?.reset();
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
        window.turnstile?.reset();
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
        window.turnstile?.reset();
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
      window.turnstile?.reset();
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      window.turnstile?.reset();
    }
  };

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
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

  const saveStartggToken = () => {
    localStorage.setItem('fb_startggToken', startggToken);
    toast.success('Start.gg API Token saved locally');
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
    const { error } = await supabase.auth.updateUser({ data: { displayName } });
    if (error) toast.error(error.message);
    else toast.success('Profile updated! Changes will reflect globally.');
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
            {isLogin ? 'Welcome back to FightBracket' : 'Join the next generation of bracket management'}
          </p>

          {/* Discord OAuth */}
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-white font-bold text-lg tracking-widest mb-6 transition-all hover:brightness-110"
            style={{ background: '#5865F2', fontFamily: 'Rajdhani, sans-serif' }}
          >
            <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z" fill="white"/>
            </svg>
            SIGN IN WITH DISCORD
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-xs text-gray-500 font-mono tracking-wider">OR USE EMAIL</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

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
      <div className="flex justify-between items-center bg-[#050A14]/80 border border-[#00FF88]/20 p-6 rounded-xl">
        <div className="flex items-center gap-4">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono tracking-wider text-gray-400 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all shrink-0"
            >
              <ArrowLeft size={14} /> HOME
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold font-rajdhani text-white">ACCOUNT DASHBOARD</h2>
            <p className="text-[#00FF88] font-mono text-sm mt-1">Welcome, {user.user_metadata?.displayName || 'Host'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          {onViewOwnProfile && (
            <button
              onClick={onViewOwnProfile}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#00FF88]/50 text-[#00FF88] hover:bg-[#00FF88]/10 transition-all font-rajdhani tracking-widest font-bold text-sm"
            >
              <Globe size={15}/> MY PUBLIC PROFILE
            </button>
          )}
          {onOpenFriendsModal && (
            <button
              onClick={onOpenFriendsModal}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all font-rajdhani tracking-widest font-bold text-sm"
            >
              FRIENDS &amp; DMs
            </button>
          )}
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 transition-all font-rajdhani tracking-widest font-bold text-sm"
          >
            <LogOut size={15}/> LOGOUT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Profile & Privacy & Cloud */}
        <div className="space-y-6">
          <div className="bg-[#050A14] border border-[#00FF88]/30 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold font-rajdhani text-[#00FF88] tracking-widest">PROFILE & PRIVACY</h3>
            {/* Always-visible FB-ID row */}
            <div className="bg-black/40 border border-[#00FF88]/20 p-3 rounded">
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
              {profileLoading ? (
                <div className="text-xs font-mono text-gray-500 mt-1 animate-pulse">Loading...</div>
              ) : profileError ? (
                <div className="text-xs font-mono text-red-400 mt-1 break-all" title={profileError}>
                  Error: {profileError.slice(0, 120)}
                </div>
              ) : userProfile?.unique_id ? (
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold tracking-widest bg-[#00FF88]/10 px-2.5 py-1 rounded text-[#00FF88] text-sm">
                    {userProfile.unique_id}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(userProfile.unique_id!); toast.success('FB-ID copied!'); }}
                    className="text-xs text-gray-400 hover:text-white font-mono ml-2 transition-colors"
                  >
                    COPY
                  </button>
                </div>
              ) : (
                <div className="text-xs font-mono text-gray-500 mt-1">No identifier found — check server logs</div>
              )}
            </div>
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
                className="px-5 py-2 rounded-lg border border-[#00FF88]/50 text-[#00FF88] hover:bg-[#00FF88]/10 font-rajdhani font-bold tracking-wider transition-all text-sm"
              >
                SAVE
              </button>
            </div>

            {/* Privacy Controls */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="text-xs font-mono font-bold text-gray-400">PRIVACY CONTROLS</div>
              <div className="flex items-center justify-between p-2.5 rounded bg-black/30 border border-white/5">
                <span className="text-xs font-mono opacity-80">Publicly Searchable Profile</span>
                <button
                  onClick={() => handleTogglePrivacy('is_public', !(userProfile?.is_public ?? true))}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    (userProfile?.is_public ?? true) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {(userProfile?.is_public ?? true) ? 'PUBLIC' : 'HIDDEN'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-black/30 border border-white/5">
                <span className="text-xs font-mono opacity-80">Friends-Only Start.gg Stats</span>
                <button
                  onClick={() => handleTogglePrivacy('friends_only', !(userProfile?.friends_only ?? false))}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    (userProfile?.friends_only ?? false) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {(userProfile?.friends_only ?? false) ? 'FRIENDS ONLY' : 'ANYONE'}
                </button>
              </div>
            </div>
          </div>

          {/* Start.gg Career Profile Importer — self-contained with inline token step */}
          <div className="bg-[#050A14] border border-cyan-500/40 p-6 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,229,255,0.06) 0%, transparent 70%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink size={16} className="text-cyan-400" />
                <h3 className="text-xl font-bold font-rajdhani text-cyan-400 tracking-widest">START.GG CAREER STATS</h3>
              </div>
              <p className="text-xs font-mono text-gray-400 leading-relaxed">
                Import your public Start.gg profile to showcase tournament placements and career history on your FightBracket profile.
              </p>
            </div>

            {/* Step 1: API Token */}
            <div className={`space-y-2 p-3 rounded-lg border ${startggToken ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono tracking-widest font-bold ${startggToken ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {startggToken ? '✓ STEP 1 — API TOKEN SAVED' : '⚠ STEP 1 — API TOKEN REQUIRED'}
                </span>
                {startggToken && (
                  <button
                    onClick={() => { setStartggToken(''); localStorage.removeItem('fb_startggToken'); }}
                    className="text-[10px] font-mono text-gray-600 hover:text-red-400 transition-colors"
                  >
                    CLEAR
                  </button>
                )}
              </div>
              {!startggToken ? (
                <>
                  <p className="text-[11px] font-mono text-amber-300/80">
                    A Start.gg Developer API token is required.{' '}
                    <a
                      href="https://developer.start.gg/docs/authentication"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-cyan-400 transition-colors"
                    >
                      Get your free token here ↗
                    </a>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Paste your Start.gg API token..."
                      value={startggToken}
                      onChange={e => setStartggToken(e.target.value)}
                      className="flex-1 bg-[#0a0a1a] border border-amber-500/40 rounded-lg p-2.5 text-white focus:border-cyan-400 outline-none font-mono text-sm placeholder:text-gray-600 transition-colors"
                    />
                    <button
                      onClick={() => { localStorage.setItem('fb_startggToken', startggToken); toast.success('API token saved!'); }}
                      disabled={!startggToken.trim()}
                      className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                    >
                      SAVE TOKEN
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] font-mono text-gray-500">Token is saved. Continue below to import your profile.</p>
              )}
            </div>

            {/* Step 2: Slug / URL — disabled until token is present */}
            <div className={`space-y-2 ${!startggToken ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              <span className="text-[10px] font-mono tracking-widest font-bold text-cyan-400">STEP 2 — ENTER YOUR PROFILE URL OR SLUG</span>
              {userProfile?.startgg_slug && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-[10px] font-mono text-gray-400">CURRENTLY LINKED:</span>
                  <a
                    href={`https://start.gg/user/${userProfile.startgg_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    start.gg/user/{userProfile.startgg_slug} <ExternalLink size={10} />
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. start.gg/user/mang0  or just  mang0"
                  value={userStartggInput}
                  onChange={e => setUserStartggInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !importingUserStartgg && userStartggInput.trim() && handleImportCareerStats()}
                  className="flex-1 bg-[#0a0a1a] border border-cyan-500/30 rounded-lg p-3 text-white focus:border-cyan-400 outline-none font-mono text-sm placeholder:text-gray-600 transition-colors"
                />
                <button
                  onClick={handleImportCareerStats}
                  disabled={importingUserStartgg || !userStartggInput.trim() || !startggToken}
                  className="px-5 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40 shrink-0"
                >
                  {importingUserStartgg ? 'IMPORTING...' : 'IMPORT'}
                </button>
              </div>
              <p className="text-[10px] font-mono text-gray-600">
                ⓘ Supports full URLs (start.gg/user/…) or just the slug. Press Enter or click Import.
              </p>
            </div>
          </div>

          {/* Tekken 8 Importer Box */}
          <div className="bg-[#050A14] border border-[#ff003c]/30 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold font-rajdhani text-[#ff003c] tracking-widest">TEKKEN 8 POLARIS ID</h3>
            <p className="text-xs font-mono opacity-60">
              Add your Tekken 8 Polaris ID to fetch live game stats and player metrics.
            </p>
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
                className="px-5 py-2 rounded-lg border border-[#ff003c]/50 text-[#ff003c] hover:bg-[#ff003c]/10 font-rajdhani font-bold tracking-wider transition-all text-sm disabled:opacity-40"
              >
                SAVE
              </button>
            </div>
          </div>

          <div className="bg-[#050A14] border border-[#00E5FF]/30 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest">CLOUD SAVES</h3>
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
                      <div className="text-xs text-gray-500 font-mono mt-1">Updated: {new Date(t.updated_at).toLocaleString()}</div>
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

        {/* Right Column: Start.gg Hosted + Tekken Stats */}
        <div className="space-y-6">
          <div className="bg-[#050A14] border border-[#FF006E]/30 p-6 rounded-xl shadow-lg">
            <div className="border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-xl font-bold font-rajdhani text-[#FF006E] tracking-widest flex items-center gap-2">
                <Key size={20}/> START.GG INTEGRATION
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-2">Connect your Developer API Token to view and instantly import tournaments you have hosted.</p>
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                type="password" 
                value={startggToken} 
                onChange={e => setStartggToken(e.target.value)} 
                placeholder="Paste Start.gg API Token..." 
                className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:border-[#FF006E] outline-none font-mono text-sm" 
              />
              <button onClick={saveStartggToken} className="px-5 py-2 rounded-lg border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 font-rajdhani font-bold tracking-wider transition-all text-sm">
                SAVE
              </button>
            </div>

            <button 
              onClick={fetchStartggHosted} 
              disabled={fetchingStartgg || !startggToken} 
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF006E] hover:bg-[#FF006E]/80 disabled:opacity-50 text-white font-bold rounded-lg transition-colors font-rajdhani tracking-widest mb-6"
            >
              <RefreshCw size={16} className={fetchingStartgg ? "animate-spin" : ""} /> 
              {fetchingStartgg ? 'FETCHING...' : 'FETCH MY HOSTED TOURNAMENTS'}
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

          {/* Tekken 8 Live Stats — shown once user has saved a Tekken ID */}
          <div className="bg-[#050A14] border border-[#ff003c]/30 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 pt-5 pb-1">
              <p className="text-[10px] font-mono text-gray-500 tracking-wider">
                Live stats synced from EWGF · updates on demand
              </p>
            </div>
            <div className="p-4">
              <TekkenStatsPanel tekkenId={userProfile?.tekken_id} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
