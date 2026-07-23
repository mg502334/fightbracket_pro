import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Save, Download, Trash } from 'lucide-react';
import { toast } from 'sonner';

export function CloudTournamentsModal({ 
  onClose, 
  onLoad,
  currentTournamentData
}: { 
  onClose: () => void,
  onLoad: (data: any) => void,
  currentTournamentData: any
}) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        fetchTournaments(session.access_token);
      }
    });
  }, []);

  const fetchTournaments = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/tournaments', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      setTournaments(data.tournaments || []);
    } catch (err) {
      toast.error('Failed to load tournaments');
    }
  };

  const handleSave = async () => {
    if (!token) return toast.error('Please log in first');
    if (!saveName) return toast.error('Enter a name for the tournament');
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: `t-${Date.now()}`,
          name: saveName,
          data: JSON.stringify(currentTournamentData)
        })
      });
      if (res.ok) {
        toast.success('Tournament saved to cloud!');
        fetchTournaments(token);
      } else {
        toast.error('Error saving tournament');
      }
    } catch (err) {
      toast.error('Failed to save tournament');
    }
  };

  const handleLoad = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.tournament && data.tournament.data) {
        onLoad(JSON.parse(data.tournament.data));
        toast.success(`Loaded ${data.tournament.name}`);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to load tournament');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Deleted tournament');
        fetchTournaments(token);
      }
    } catch (err) {
      toast.error('Failed to delete tournament');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#050A14] border border-[#00FF88] p-6 rounded-lg shadow-2xl w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[#00FF88]" style={{ fontFamily: 'Rajdhani, sans-serif' }}>CLOUD TOURNAMENTS</h2>
        
        <div className="mb-6 p-4 border border-gray-800 rounded bg-[#111]">
          <h3 className="text-lg text-white mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Save Current Tournament</h3>
          <div className="flex gap-2">
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
              placeholder="Tournament Name" className="flex-1 bg-black border border-gray-800 p-2 text-white outline-none focus:border-[#00FF88] rounded" />
            <button onClick={handleSave} className="bg-[#00FF88] text-black px-4 py-2 font-bold rounded flex items-center gap-2 hover:bg-[#00FF88]/80 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Save size={16} /> SAVE
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg text-white mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Saved Tournaments</h3>
          {tournaments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>No saved tournaments found.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tournaments.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 border border-gray-800 rounded bg-[#111] hover:border-gray-600 transition-colors">
                  <div>
                    <div className="text-[#00E5FF] font-bold">{t.name}</div>
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Updated: {new Date(t.updated_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleLoad(t.id)} className="text-[#00FF88] hover:bg-[#00FF88]/10 p-2 rounded flex items-center gap-1 text-sm transition-colors" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <Download size={14} /> LOAD
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-[#FF1744] hover:bg-[#FF1744]/10 p-2 rounded transition-colors">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
