import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, UserPlus, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (player: { tag: string; realName: string; seed: number; startggId?: string; country?: string }) => void;
  theme: { primaryColor: string; bgFrom: string };
  nextSeed: number;
}

export function AddPlayerModal({ isOpen, onClose, onAdd, theme, nextSeed }: AddPlayerModalProps) {
  const [activeTab, setActiveTab] = useState<'startgg' | 'local'>('local');
  const [tag, setTag] = useState('');
  const [realName, setRealName] = useState('');
  const [seed, setSeed] = useState(nextSeed.toString());
  const [startggSlug, setStartggSlug] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim()) {
      toast.error('Gamer Tag is required');
      return;
    }
    
    onAdd({
      tag: tag.trim(),
      realName: realName.trim(),
      seed: parseInt(seed) || nextSeed,
    });
    
    // Reset and close
    setTag('');
    setRealName('');
    setSeed((parseInt(seed) + 1).toString());
    onClose();
  };

  const handleSearchStartgg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startggSlug.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/startgg/user?slug=${encodeURIComponent(startggSlug.trim())}`);
      const data = await res.json();
      
      if (data.status === 'success' && data.user) {
        onAdd({
          tag: data.user.player?.gamerTag || data.user.name || 'Unknown',
          realName: data.user.name || '',
          seed: parseInt(seed) || nextSeed,
          startggId: data.user.id,
          country: data.user.location?.country,
        });
        toast.success(`Added ${data.user.player?.gamerTag || data.user.name}`);
        setStartggSlug('');
        setSeed((parseInt(seed) + 1).toString());
        onClose();
      } else {
        toast.error('User not found. Check the slug.');
      }
    } catch (e) {
      toast.error('Error fetching from start.gg');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md rounded-xl overflow-hidden border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
            <h2 className="text-lg tracking-wider flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
              <UserPlus size={18} style={{ color: theme.primaryColor }} />
              ADD PLAYER
            </h2>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('local')}
              className="flex-1 py-3 text-xs tracking-widest transition-colors"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                borderBottom: activeTab === 'local' ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
                color: activeTab === 'local' ? theme.primaryColor : 'var(--muted-foreground)',
                background: activeTab === 'local' ? `${theme.primaryColor}10` : 'transparent'
              }}
            >
              LOCAL ADD
            </button>
            <button
              onClick={() => setActiveTab('startgg')}
              className="flex-1 py-3 text-xs tracking-widest transition-colors"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                borderBottom: activeTab === 'startgg' ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
                color: activeTab === 'startgg' ? theme.primaryColor : 'var(--muted-foreground)',
                background: activeTab === 'startgg' ? `${theme.primaryColor}10` : 'transparent'
              }}
            >
              START.GG IMPORT
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'local' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs mb-1.5 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>GAMER TAG *</label>
                  <input
                    type="text"
                    required
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    className="w-full bg-black/20 border rounded px-3 py-2 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    placeholder="e.g. Faker"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>REAL NAME</label>
                  <input
                    type="text"
                    value={realName}
                    onChange={e => setRealName(e.target.value)}
                    className="w-full bg-black/20 border rounded px-3 py-2 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    placeholder="e.g. Lee Sang-hyeok"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>SEED</label>
                  <input
                    type="number"
                    min="1"
                    value={seed}
                    onChange={e => setSeed(e.target.value)}
                    className="w-full bg-black/20 border rounded px-3 py-2 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded text-sm tracking-widest font-bold transition-all hover:brightness-125"
                  style={{ background: theme.primaryColor, color: '#000', fontFamily: 'Rajdhani, sans-serif' }}
                >
                  ADD PLAYER
                </button>
              </form>
            ) : (
              <form onSubmit={handleSearchStartgg} className="flex flex-col gap-4">
                <div className="p-3 rounded mb-2 text-xs flex gap-2 items-start" style={{ background: `${theme.primaryColor}15`, border: `1px solid ${theme.primaryColor}30` }}>
                  <HelpCircle size={14} className="shrink-0 mt-0.5" style={{ color: theme.primaryColor }} />
                  <p className="opacity-80 leading-relaxed" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    Paste a player's full start.gg profile URL or their 8-character user slug.
                    <br/><br/>
                    <span className="opacity-50">Example:</span> https://start.gg/user/<b>3a1b2c3d</b>
                  </p>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>START.GG USER SLUG OR URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={startggSlug}
                      onChange={e => setStartggSlug(e.target.value)}
                      className="w-full bg-black/20 border rounded pl-9 pr-3 py-2 text-sm focus:outline-none transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                      placeholder="e.g. 3a1b2c3d"
                    />
                    <Search size={14} className="absolute left-3 top-2.5 opacity-40" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 opacity-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>SEED</label>
                  <input
                    type="number"
                    min="1"
                    value={seed}
                    onChange={e => setSeed(e.target.value)}
                    className="w-full bg-black/20 border rounded px-3 py-2 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full mt-2 py-2.5 rounded text-sm tracking-widest font-bold transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  style={{ background: theme.primaryColor, color: '#000', fontFamily: 'Rajdhani, sans-serif' }}
                >
                  {isSearching ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                  {isSearching ? 'SEARCHING...' : 'FETCH & ADD PLAYER'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
