import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import startggGames from '../data/startggGames.json';

interface GameSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: { id: string; name: string; imageUrl: string }) => void;
  theme: any;
}

export function GameSelectionModal({ isOpen, onClose, onSelectGame, theme }: GameSelectionModalProps) {
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;
  const filteredGames = startggGames
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

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
          className="relative w-full max-w-3xl overflow-hidden rounded-lg flex flex-col"
          style={{ background: 'var(--card)', border: `1px solid ${theme.primaryColor}40`, maxHeight: '80vh' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}>
            <div className="text-lg tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: theme.primaryColor }}>
              ADD TOURNAMENT GAME
            </div>
            <button onClick={onClose} className="p-1 opacity-60 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
              <input
                type="text"
                placeholder="Search start.gg games..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm rounded bg-black/20 outline-none focus:ring-1 transition-shadow"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className="group flex flex-col text-left transition-transform hover:scale-[1.02] overflow-hidden rounded shadow-md"
                  style={{ background: 'var(--sidebar)', border: '1px solid var(--border)' }}
                >
                  <div className="aspect-[16/9] w-full bg-black/40 relative overflow-hidden flex-shrink-0">
                    {game.imageUrl ? (
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        referrerPolicy="no-referrer"
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="items-center justify-center w-full h-full text-2xl font-bold absolute inset-0"
                      style={{
                        display: game.imageUrl ? 'none' : 'flex',
                        background: `linear-gradient(135deg, ${theme?.primaryColor || '#00E5FF'}22, #050A14)`,
                        color: theme?.primaryColor || '#00E5FF',
                        fontFamily: 'Rajdhani, sans-serif',
                      }}
                    >
                      {game.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="p-3 text-sm flex-1 flex items-center" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, lineHeight: '1.2' }}>
                    {game.name}
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  const customName = search.trim() || prompt("Enter custom game name:");
                  if (customName && customName.trim()) {
                    onSelectGame({ id: `custom_${Date.now()}`, name: customName.trim(), imageUrl: '' });
                  }
                }}
                className="group flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] overflow-hidden rounded shadow-md"
                style={{ 
                  background: 'transparent', 
                  border: `2px dashed ${theme?.primaryColor || '#00E5FF'}60`,
                  color: theme?.primaryColor || '#00E5FF',
                  minHeight: '160px'
                }}
              >
                <div className="p-4 font-rajdhani font-bold text-lg tracking-wider flex flex-col items-center gap-2">
                  <span className="text-4xl font-light leading-none mb-1">+</span>
                  <span className="break-words max-w-full px-2 line-clamp-2">{search.trim() ? `ADD "${search.trim()}"` : 'CUSTOM GAME'}</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
