import React, { useState } from 'react';
import { ExhibitionMatch, GameTheme } from '../data/tournamentData';
import { Plus, Play, Link as LinkIcon, Trash, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExhibitionsPanelProps {
  exhibitions: ExhibitionMatch[];
  setExhibitions: React.Dispatch<React.SetStateAction<ExhibitionMatch[]>>;
  theme: GameTheme;
  userId: string | null;
  activeGameId: string | null;
}

export function ExhibitionsPanel({ exhibitions, setExhibitions, theme, userId, activeGameId }: ExhibitionsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [activeExhibitionId, setActiveExhibitionId] = useState<string | null>(null);

  // Form State
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [firstTo, setFirstTo] = useState(5);
  const [videoUrl, setVideoUrl] = useState('');
  const [hostTag, setHostTag] = useState('');

  const activeExhibitions = exhibitions.filter(e => e.gameId === activeGameId).sort((a, b) => b.createdAt - a.createdAt);
  const activeExhibition = exhibitions.find(e => e.id === activeExhibitionId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Must be logged in to create an exhibition.");
    if (!activeGameId) return toast.error("Select a game first.");

    const newExhibition: ExhibitionMatch = {
      id: `exh-${Date.now()}`,
      hostId: userId,
      gameId: activeGameId,
      player1Name: p1Name || 'Player 1',
      player2Name: p2Name || 'Player 2',
      player1Score: 0,
      player2Score: 0,
      firstTo: firstTo,
      videoUrl: videoUrl,
      createdAt: Date.now(),
      hostTag: hostTag || undefined
    };

    setExhibitions(prev => [newExhibition, ...prev]);
    setShowCreate(false);
    setP1Name(''); setP2Name(''); setVideoUrl(''); setFirstTo(5); setHostTag('');
    setActiveExhibitionId(newExhibition.id);
  };

  const updateScore = (id: string, p1Delta: number, p2Delta: number) => {
    setExhibitions(prev => prev.map(ex => {
      if (ex.id === id) {
        return {
          ...ex,
          player1Score: Math.max(0, ex.player1Score + p1Delta),
          player2Score: Math.max(0, ex.player2Score + p2Delta)
        };
      }
      return ex;
    }));
  };

  const deleteExhibition = (id: string) => {
    if (!confirm("Delete this exhibition?")) return;
    setExhibitions(prev => prev.filter(e => e.id !== id));
    if (activeExhibitionId === id) setActiveExhibitionId(null);
  };

  const renderVideoPlayer = (url: string) => {
    if (!url) return <div className="flex items-center justify-center h-full text-gray-500 font-mono">No Video URL Provided</div>;
    
    // TikTok URL
    if (url.includes('tiktok.com')) {
      const videoIdMatch = url.match(/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      if (videoId) {
        return (
          <iframe 
            src={`https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`}
            className="w-full h-full border-none rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        );
      }
    }
    
    // YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      
      if (videoId) {
        return (
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full border-none rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        );
      }
    }
    
    // Twitch URL
    if (url.includes('twitch.tv/videos/')) {
      const videoId = url.split('videos/')[1].split('?')[0];
      return (
        <iframe 
          src={`https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`}
          className="w-full h-full border-none rounded-xl"
          allowFullScreen
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <LinkIcon size={32} className="text-gray-600" />
        <a href={url} target="_blank" rel="noreferrer" className="text-[#00E5FF] hover:underline font-mono">Open External Link</a>
      </div>
    );
  };

  if (activeExhibition) {
    const isHost = activeExhibition.hostId === userId;
    const p1Winner = activeExhibition.player1Score >= activeExhibition.firstTo;
    const p2Winner = activeExhibition.player2Score >= activeExhibition.firstTo;
    const isOver = p1Winner || p2Winner;

    return (
      <div className="flex gap-4 h-full p-2">
        {/* Left Side: Video Player */}
        <div className="flex-1 bg-black/40 border rounded-xl relative overflow-hidden" style={{ borderColor: 'rgba(122,158,192,0.2)' }}>
          {renderVideoPlayer(activeExhibition.videoUrl)}
          <button 
            onClick={() => setActiveExhibitionId(null)}
            className="absolute top-4 left-4 bg-black/60 hover:bg-black text-white px-3 py-1 rounded backdrop-blur font-rajdhani border border-white/10"
          >
            ← BACK TO LIST
          </button>
        </div>

        {/* Right Side: Score Tracker */}
        <div className="w-96 flex flex-col gap-4">
          <div className="bg-black/60 border rounded-xl p-6" style={{ borderColor: theme.primaryColor }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-rajdhani" style={{ color: theme.primaryColor }}>EXHIBITION SET</h2>
              <p className="text-sm text-gray-400 font-mono">FIRST TO {activeExhibition.firstTo} WINS</p>
              {isOver && <div className="mt-2 inline-flex items-center gap-1 bg-[#00FF88] text-black px-2 py-0.5 rounded font-bold text-xs"><CheckCircle size={12}/> MATCH COMPLETE</div>}
            </div>

            <div className="space-y-8">
              {/* Player 1 */}
              <div className="relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-xl font-bold font-rajdhani truncate pr-4" style={{ color: p1Winner ? theme.primaryColor : 'white' }}>
                    {activeExhibition.player1Name}
                  </div>
                  <div className="text-5xl font-mono font-bold" style={{ color: p1Winner ? theme.primaryColor : 'white' }}>
                    {activeExhibition.player1Score}
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: `${(activeExhibition.player1Score / activeExhibition.firstTo) * 100}%`, backgroundColor: theme.primaryColor }} />
                </div>
                {isHost && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateScore(activeExhibition.id, 1, 0)} className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 rounded font-mono text-xs text-white transition-colors">+1 WIN</button>
                    <button onClick={() => updateScore(activeExhibition.id, -1, 0)} className="flex-1 bg-white/5 hover:bg-white/10 py-1.5 rounded font-mono text-xs text-gray-400">-1 WIN</button>
                  </div>
                )}
              </div>

              <div className="text-center font-mono text-gray-600 text-sm italic">VS</div>

              {/* Player 2 */}
              <div className="relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-xl font-bold font-rajdhani truncate pr-4" style={{ color: p2Winner ? theme.primaryColor : 'white' }}>
                    {activeExhibition.player2Name}
                  </div>
                  <div className="text-5xl font-mono font-bold" style={{ color: p2Winner ? theme.primaryColor : 'white' }}>
                    {activeExhibition.player2Score}
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: `${(activeExhibition.player2Score / activeExhibition.firstTo) * 100}%`, backgroundColor: theme.primaryColor }} />
                </div>
                {isHost && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateScore(activeExhibition.id, 0, 1)} className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 rounded font-mono text-xs text-white transition-colors">+1 WIN</button>
                    <button onClick={() => updateScore(activeExhibition.id, 0, -1)} className="flex-1 bg-white/5 hover:bg-white/10 py-1.5 rounded font-mono text-xs text-gray-400">-1 WIN</button>
                  </div>
                )}
              </div>
            </div>
            
            {!isHost && (
              <div className="mt-8 text-center text-xs text-gray-500 font-mono border-t border-gray-800 pt-4">
                Score tracking is locked to the host.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-rajdhani tracking-widest" style={{ color: theme.primaryColor }}>EXHIBITIONS & VODS</h2>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded text-black font-bold font-rajdhani tracking-widest hover:brightness-125 transition-all"
          style={{ background: theme.primaryColor }}
        >
          {showCreate ? 'CANCEL' : <><Plus size={16}/> NEW MATCH</>}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-black/40 border rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4" style={{ borderColor: 'rgba(122,158,192,0.2)' }}>
          <h3 className="text-lg font-rajdhani text-white mb-4">SETUP EXHIBITION MATCH</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">PLAYER 1 TAG</label>
              <input type="text" value={p1Name} onChange={e => setP1Name(e.target.value)} required className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">PLAYER 2 TAG</label>
              <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)} required className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">VIDEO URL (TikTok, YouTube, Twitch)</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">FIRST TO X WINS</label>
              <input type="number" min="1" max="99" value={firstTo} onChange={e => setFirstTo(parseInt(e.target.value))} required className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-mono text-gray-400 mb-1">HOST TAG (Optional)</label>
            <input type="text" value={hostTag} onChange={e => setHostTag(e.target.value)} placeholder="e.g. Ninja, xQc" className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 rounded text-black font-bold font-rajdhani tracking-widest hover:brightness-125 transition-all" style={{ background: theme.primaryColor }}>
            START TRACKING
          </button>
        </form>
      )}

      {activeExhibitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Play size={48} className="mb-4" />
          <p className="font-mono text-sm text-center">No exhibition matches recorded for this game yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeExhibitions.map(ex => (
            <div key={ex.id} className="bg-black/30 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors cursor-pointer relative group" onClick={() => setActiveExhibitionId(ex.id)}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-gray-500">{new Date(ex.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  {ex.hostTag && <span className="text-xs font-mono bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-0.5 rounded border border-[#00E5FF]/20">Host: {ex.hostTag}</span>}
                  <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white">FT{ex.firstTo}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className="font-rajdhani text-lg font-bold truncate flex-1">{ex.player1Name}</div>
                <div className="font-mono text-2xl font-bold ml-2" style={{ color: theme.primaryColor }}>{ex.player1Score}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="font-rajdhani text-lg font-bold truncate flex-1">{ex.player2Name}</div>
                <div className="font-mono text-2xl font-bold ml-2" style={{ color: theme.primaryColor }}>{ex.player2Score}</div>
              </div>

              {ex.hostId === userId && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteExhibition(ex.id); }}
                  className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
