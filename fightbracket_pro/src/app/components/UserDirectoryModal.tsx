import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User, UserPlus, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserDirectoryItem {
  id: string;
  unique_id: string;
  gamer_tag: string;
  avatar_url?: string;
  is_public: boolean;
  friends_only: boolean;
}

interface UserDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseToken: string | null;
  currentUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function UserDirectoryModal({
  isOpen,
  onClose,
  supabaseToken,
  currentUserId,
  onSelectUser,
}: UserDirectoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  const fetchUsers = async (query: string = '') => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (supabaseToken) {
        headers['Authorization'] = `Bearer ${supabaseToken}`;
      }
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers(searchQuery);
    }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleSendFriendRequest = async (targetId: string, uniqueId: string) => {
    if (!supabaseToken) {
      toast.error('Please log in to add friends');
      return;
    }
    setAddingFriendId(targetId);
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseToken}`,
        },
        body: JSON.stringify({ target_identifier: uniqueId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Friend request sent!');
      } else {
        toast.error(data.detail || 'Could not send friend request');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setAddingFriendId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0A1122] border border-[#00E5FF]/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                <Search size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-rajdhani tracking-wider text-white">PLAYER DIRECTORY</h2>
                <p className="text-xs text-gray-400">Search community members by Gamer Tag or Unique FB-ID</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-6 border-b border-white/5 bg-black/40">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by Gamer Tag (e.g. ArslanAsh) or FB-ID (e.g. FB-A1B2)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchUsers(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-gray-800 focus:border-[#00E5FF] text-white rounded-xl text-sm outline-none transition-all placeholder:text-gray-600"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity"
                style={{
                  background: 'var(--border)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: '#00E5FF',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                SEARCH
              </button>
            </form>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                <Loader2 className="animate-spin text-[#00E5FF]" size={28} />
                <span className="text-xs">Searching players...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No players found</p>
                <p className="text-xs text-gray-600 mt-1">Try a different search term or Gamer Tag</p>
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00E5FF]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.gamer_tag} className="w-10 h-10 rounded-full object-cover border border-[#00E5FF]/40" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] font-bold text-sm">
                        {(u.gamer_tag || 'P').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white font-rajdhani">{u.gamer_tag}</span>
                        {currentUserId === u.id && (
                          <span className="text-[10px] bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-0.5 rounded font-mono font-bold">
                            YOU
                          </span>
                        )}
                        {u.is_public && (
                          <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded">
                            PUBLIC
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cyan-400/70 font-mono">{u.unique_id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectUser(u.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={13} /> PROFILE
                    </button>
                    {currentUserId && currentUserId !== u.id && (
                      <button
                        onClick={() => handleSendFriendRequest(u.id, u.unique_id)}
                        disabled={addingFriendId === u.id}
                        className="px-3 py-1.5 rounded-lg bg-[#FF006E]/20 text-[#FF006E] border border-[#FF006E]/40 hover:bg-[#FF006E]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {addingFriendId === u.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <UserPlus size={13} />
                        )}
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/40 text-center">
            <span className="text-[11px] text-gray-500 font-mono">
              FightBracket Pro Community Network • {users.length} {users.length === 1 ? 'player' : 'players'} listed
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
