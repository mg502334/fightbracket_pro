import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (slug: string) => Promise<void>;
  theme: any;
}

export function ImportModal({ isOpen, onClose, onImport, theme }: ImportModalProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!inputUrl.trim()) return;
    setLoading(true);
    setError(null);
    
    // Extract slug from full url if pasted, e.g. https://www.start.gg/tournament/evo-2023/details -> evo-2023
    let slug = inputUrl.trim();
    if (slug.includes('start.gg/tournament/')) {
      const match = slug.match(/start\.gg\/tournament\/([^\/]+)/);
      if (match) slug = match[1];
    }
    
    try {
      await onImport(slug);
      setInputUrl('');
    } catch (err: any) {
      setError(err.message || "Failed to import tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md overflow-hidden rounded-lg flex flex-col"
          style={{ background: 'var(--card)', border: `1px solid ${theme.primaryColor}40` }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
            <div className="text-lg tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor }}>
              IMPORT LIVE TOURNAMENT
            </div>
            <button onClick={onClose} className="p-1 opacity-60 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm opacity-70">
              Paste a Start.gg tournament URL or slug to fetch the live players and brackets.
            </p>
            <input
              type="text"
              placeholder="e.g. start.gg/tournament/evo-2026 or evo-2026"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded bg-black/20 outline-none focus:ring-1 transition-shadow"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', focusRingColor: theme.primaryColor }}
            />
            {error && <div className="text-red-400 text-xs">{error}</div>}
            
            <button 
              onClick={handleImport}
              disabled={loading || !inputUrl.trim()}
              className="mt-2 py-2 w-full rounded flex justify-center items-center gap-2 font-bold transition-opacity disabled:opacity-50"
              style={{ background: theme.primaryColor, color: '#000' }}
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? "IMPORTING..." : "IMPORT"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
