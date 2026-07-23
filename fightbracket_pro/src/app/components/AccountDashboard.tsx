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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="bg-[#050A14] border border-[#00E5FF] p-10 rounded-xl shadow-2xl w-full max-w-lg">
          <h2 className="text-3xl font-bold mb-8 text-[#00E5FF] text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {isLogin ? 'FIGHTBRACKET ACCOUNT' : 'CREATE ACCOUNT'}
          </h2>
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
          <p className="text-[#00FF88] font-mono text-sm mt-1">Logged in as {user.email}</p>
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
