import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Save, Download, RefreshCw, Key, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface AccountDashboardProps {
  user: any;
  theme: any;
  currentTournamentData: any;
  onLoad: (data: any) => void;
  onStartggImport: (slug: string) => void;
}

export function AccountDashboard({ user, theme, currentTournamentData, onLoad, onStartggImport }: AccountDashboardProps) {
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Cloud state
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile state
  const [displayName, setDisplayName] = useState(user?.user_metadata?.displayName || '');

  // Start.gg state
  const [startggToken, setStartggToken] = useState(() => {
    try { return localStorage.getItem('fb_startggToken') || ''; } catch { return ''; }
  });
  const [startggTournaments, setStartggTournaments] = useState<any[]>([]);
  const [fetchingStartgg, setFetchingStartgg] = useState(false);

  useEffect(() => {
    if (user) fetchCloudTournaments();
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success('Logged in successfully');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(error.message);
      else toast.success('Signed up successfully. If email confirmation is off, you are logged in.');
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
      <div className="flex items-center justify-center h-full p-4">
        <div className="bg-[#050A14] border border-[#00E5FF] p-10 rounded-xl shadow-2xl w-full max-w-lg">
          <h2 className="text-3xl font-bold mb-8 text-[#00E5FF] text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {isLogin ? 'FIGHTBRACKET ACCOUNT' : 'CREATE ACCOUNT'}
          </h2>

          {/* Discord OAuth */}
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-white font-bold text-lg tracking-widest mb-6 transition-all hover:brightness-110"
            style={{ background: '#5865F2', fontFamily: 'Rajdhani, sans-serif' }}
          >
            <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3## 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" fill="white"/>
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
                className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white focus:border-[#00E5FF] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white focus:border-[#00E5FF] outline-none transition-colors" />
            </div>
            <button type="submit" className="w-full bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-bold py-3 rounded-lg text-xl transition-all tracking-widest mt-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {isLogin ? 'SIGN IN' : 'REGISTER'}
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
    );
  }

  return (
    <div className="p-6 h-full overflow-auto max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Bar: Account Info */}
      <div className="flex justify-between items-center bg-[#050A14]/80 border border-[#00FF88]/20 p-6 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold font-rajdhani text-white">ACCOUNT DASHBOARD</h2>
          <p className="text-[#00FF88] font-mono text-sm mt-1">Welcome, {user.user_metadata?.displayName || 'Host'}</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="flex items-center gap-2 px-4 py-2 rounded border border-[#FF006E]/30 text-[#FF006E] hover:bg-[#FF006E]/10 transition-colors font-rajdhani tracking-widest font-bold"
        >
          <LogOut size={16}/> LOGOUT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Cloud Tournaments */}
        <div className="space-y-6">
          <div className="bg-[#050A14] border border-[#00FF88]/30 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold font-rajdhani text-[#00FF88] tracking-widest mb-4">PROFILE</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                placeholder="Gamertag or Channel Name" 
                className="flex-1 bg-[#111] border border-gray-800 rounded p-2 text-white focus:border-[#00FF88] outline-none font-mono text-sm" 
              />
              <button 
                onClick={saveDisplayName} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-rajdhani font-bold tracking-wider transition-colors"
              >
                SAVE
              </button>
            </div>
          </div>

          <div className="bg-[#050A14] border border-[#00E5FF]/30 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold font-rajdhani text-[#00E5FF] tracking-widest">CLOUD SAVES</h3>
              <div className="flex gap-2">
                <button onClick={fetchCloudTournaments} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white transition-colors"><RefreshCw size={16} /></button>
                <button onClick={saveToCloud} disabled={saving} className="flex items-center gap-2 px-3 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-bold rounded transition-colors font-rajdhani tracking-wider disabled:opacity-50">
                  <Save size={16} /> {saving ? 'SAVING...' : 'SAVE CURRENT'}
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

        {/* Right Column: Start.gg Hosted */}
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
                className="flex-1 bg-[#111] border border-gray-800 rounded p-2 text-white focus:border-[#FF006E] outline-none font-mono text-sm" 
              />
              <button onClick={saveStartggToken} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-rajdhani font-bold tracking-wider transition-colors">
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
        </div>

      </div>
    </div>
  );
}
