import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, MessageSquare, X, Check, CheckCheck, Trash2, Send, MailOpen, Search, Loader2, User, MoreHorizontal, Share, Flag } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Friend {
  id: string;
  unique_id: string;
  gamer_tag: string;
  bio?: string;
  avatar_url?: string;
  is_public?: boolean;
}

interface PendingRequest {
  id: string;
  unique_id: string;
  gamer_tag: string;
  friendship_id: string;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  sent_at: string;
  read: boolean;
}

interface InboxConversation {
  partner_id: string;
  gamer_tag: string;
  unique_id: string;
  avatar_url: string;
  latest_message: string;
  sent_at: string;
  unread_count: number;
}

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any;
  currentUserId: string | null;
  supabaseToken: string | null;
  onViewProfile?: (userId: string) => void;
}

export function FriendsModal({ isOpen, onClose, theme, currentUserId, supabaseToken, onViewProfile }: FriendsModalProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'add' | 'inbox'>('inbox');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingRequest[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<PendingRequest[]>([]);
  const [inboxConversations, setInboxConversations] = useState<InboxConversation[]>([]);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  // DM state
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchFriends = async () => {
    if (!supabaseToken) return;
    try {
      const res = await fetch(`${API_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setPendingIncoming(data.pending_incoming || []);
        setPendingOutgoing(data.pending_outgoing || []);
      }
    } catch (e) {
      console.error('Error fetching friends:', e);
    }
  };

  const fetchInbox = async () => {
    if (!supabaseToken) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/inbox`, {
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInboxConversations(data.conversations || []);
      }
    } catch (e) {
      console.error('Error fetching inbox:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      fetchInbox();
    }
  }, [isOpen, supabaseToken]);

  // Debounced live search
  useEffect(() => {
    if (!addIdentifier.trim() || !supabaseToken) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(addIdentifier.trim())}`, {
          headers: { Authorization: `Bearer ${supabaseToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.users || []).filter((u: Friend) => u.id !== currentUserId));
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addIdentifier, supabaseToken, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendRequest = async () => {
    if (!addIdentifier.trim() || !supabaseToken) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({ target_identifier: addIdentifier.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: data.message || "Friend request sent!", isError: false });
        setAddIdentifier('');
        fetchFriends();
      } else {
        setStatusMsg({ text: data.detail || "Failed to send friend request", isError: true });
      }
    } catch (e: any) {
      setStatusMsg({ text: e.message || "Error sending request", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (friendshipId: string, action: 'accept' | 'decline') => {
    if (!supabaseToken) return;
    try {
      const res = await fetch(`${API_URL}/api/friends/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({ friendship_id: friendshipId, action })
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch (e) {
      console.error('Error responding to request:', e);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!supabaseToken) return;
    try {
      const res = await fetch(`${API_URL}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        if (activeChatFriend?.id === friendId) setActiveChatFriend(null);
        fetchFriends();
      }
    } catch (e) {
      console.error('Error removing friend:', e);
    }
  };

  const openChat = async (friend: Friend) => {
    setActiveChatFriend(friend);
    if (!supabaseToken) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${friend.id}`, {
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Mark messages as read after opening (also done server-side on fetch)
        fetchInbox();
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatFriend || !supabaseToken) return;
    const msgText = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({ recipient_id: activeChatFriend.id, message: msgText })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
      }
    } catch (e) {
      console.error('Error sending DM:', e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!supabaseToken) return;
    setDeletingMsgId(messageId);
    try {
      const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        // Refresh inbox in case it was the latest message
        fetchInbox();
      }
    } catch (e) {
      console.error('Error deleting message:', e);
    } finally {
      setDeletingMsgId(null);
      setHoveredMsgId(null);
    }
  };

  const handleMarkRead = async (partnerId: string) => {
    if (!supabaseToken) return;
    try {
      await fetch(`${API_URL}/api/messages/mark-read/${partnerId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseToken}` }
      });
      // Optimistically update unread count
      setInboxConversations(prev =>
        prev.map(c => c.partner_id === partnerId ? { ...c, unread_count: 0 } : c)
      );
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl h-[580px] overflow-hidden rounded-2xl flex flex-col border shadow-2xl"
          style={{ background: '#050A14', borderColor: `${theme.primaryColor}40` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <Users size={22} style={{ color: theme.primaryColor }} />
              <div>
                <h2 className="font-bold tracking-wider text-base" style={{ fontFamily: 'Rajdhani, sans-serif', color: theme.primaryColor }}>
                  FRIENDS &amp; DIRECT MESSAGES
                </h2>
                <p className="text-[11px] opacity-50 font-mono">Connect and chat with FightBracket players.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 opacity-60 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Nav / Tabs */}
            <div className="w-48 border-r bg-black/40 p-3 space-y-2 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => { setActiveTab('inbox'); setActiveChatFriend(null); }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
                style={{
                  color: activeTab === 'inbox' && !activeChatFriend ? "#f0ede8" : "#8a8a9a",
                  background: activeTab === 'inbox' && !activeChatFriend ? "rgba(0, 229, 255, 0.1)" : "transparent",
                  borderLeft: activeTab === 'inbox' && !activeChatFriend ? "2px solid #00E5FF" : "2px solid transparent",
                  borderRadius: "2px",
                }}
              >
                <span className="flex items-center gap-3"><MessageSquare size={15} /> Inbox</span>
                {inboxConversations.some(c => c.unread_count > 0) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-black font-bold animate-pulse">
                    {inboxConversations.filter(c => c.unread_count > 0).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('friends'); setActiveChatFriend(null); }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
                style={{
                  color: activeTab === 'friends' && !activeChatFriend ? "#f0ede8" : "#8a8a9a",
                  background: activeTab === 'friends' && !activeChatFriend ? "rgba(0, 229, 255, 0.1)" : "transparent",
                  borderLeft: activeTab === 'friends' && !activeChatFriend ? "2px solid #00E5FF" : "2px solid transparent",
                  borderRadius: "2px",
                }}
              >
                <span className="flex items-center gap-3"><Users size={15} /> Friends</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-bold">{friends.length}</span>
              </button>

              <button
                onClick={() => { setActiveTab('pending'); setActiveChatFriend(null); }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
                style={{
                  color: activeTab === 'pending' && !activeChatFriend ? "#f0ede8" : "#8a8a9a",
                  background: activeTab === 'pending' && !activeChatFriend ? "rgba(0, 229, 255, 0.1)" : "transparent",
                  borderLeft: activeTab === 'pending' && !activeChatFriend ? "2px solid #00E5FF" : "2px solid transparent",
                  borderRadius: "2px",
                }}
              >
                <span className="flex items-center gap-3"><UserPlus size={15} /> Requests</span>
                {pendingIncoming.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold animate-pulse">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('add'); setActiveChatFriend(null); }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group mt-4"
                style={{
                  color: activeTab === 'add' && !activeChatFriend ? "#f0ede8" : "#8a8a9a",
                  background: activeTab === 'add' && !activeChatFriend ? "rgba(0, 229, 255, 0.1)" : "transparent",
                  borderLeft: activeTab === 'add' && !activeChatFriend ? "2px solid #00E5FF" : "2px solid transparent",
                  borderRadius: "2px",
                }}
              >
                <span className="flex items-center gap-3"><Search size={15} /> Add Friend</span>
              </button>
            </div>

            {/* Main Section */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#070D1B]">
              {activeChatFriend ? (
                /* DM Chat View */
                <div className="flex-1 flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="p-3 border-b bg-white/5 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <button 
                      onClick={() => onViewProfile?.(activeChatFriend.id)}
                      className="flex items-center gap-2 group text-left hover:bg-white/5 p-1 -m-1 rounded transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-400 text-xs group-hover:bg-cyan-500/30 transition-colors">
                        {activeChatFriend.gamer_tag.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm font-rajdhani group-hover:text-cyan-400 transition-colors">{activeChatFriend.gamer_tag}</div>
                        <div className="text-[10px] font-mono opacity-40">{activeChatFriend.unique_id}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveChatFriend(null)}
                      className="text-xs font-mono opacity-60 hover:opacity-100 bg-white/5 px-2 py-1 rounded"
                    >
                      Back to list
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="text-center py-10 opacity-30 text-xs font-mono">
                        No messages yet. Say hi! 👋
                      </div>
                    ) : (
                      messages.map(m => {
                        const isMe = m.sender_id === currentUserId;
                        const isHovered = hoveredMsgId === m.id;
                        const isDeleting = deletingMsgId === m.id;
                        return (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: isDeleting ? 0 : 1, y: 0, scale: isDeleting ? 0.9 : 1 }}
                            transition={{ duration: 0.15 }}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            onMouseEnter={() => setHoveredMsgId(m.id)}
                            onMouseLeave={() => setHoveredMsgId(null)}
                          >
                            <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Delete button — only own messages, on hover */}
                              {isMe && (
                                <AnimatePresence>
                                  {isHovered && (
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.7 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.7 }}
                                      transition={{ duration: 0.12 }}
                                      onClick={() => handleDeleteMessage(m.id)}
                                      title="Delete message"
                                      className="p-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-colors shrink-0 mb-1"
                                    >
                                      <Trash2 size={11} />
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              )}

                              <div
                                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
                                  isMe
                                    ? 'bg-cyan-500 text-black font-medium rounded-tr-sm'
                                    : 'bg-white/10 text-white rounded-tl-sm border border-white/10'
                                }`}
                                style={{ overflowWrap: 'anywhere' }}
                              >
                                {m.message}
                              </div>
                            </div>

                            {/* Timestamp + read receipt */}
                            <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="text-[9px] font-mono opacity-30">
                                {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {/* Read receipt icon — future RCS: shows checkmarks */}
                              {isMe && (
                                <span title={m.read ? 'Read' : 'Delivered'}>
                                  {m.read
                                    ? <CheckCheck size={10} className="text-cyan-400 opacity-70" />
                                    : <Check size={10} className="opacity-25" />
                                  }
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t bg-black/40 flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold text-xs hover:brightness-125 disabled:opacity-30 transition-all flex items-center gap-1"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              ) : activeTab === 'inbox' ? (
                /* Inbox List */
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {inboxConversations.length === 0 ? (
                    <div className="text-center py-16 opacity-40 text-xs font-mono space-y-2">
                      <MessageSquare size={32} className="mx-auto opacity-30" />
                      <p>No messages yet.</p>
                      <p className="text-[11px] opacity-60">Message a friend to start a conversation!</p>
                    </div>
                  ) : (
                    inboxConversations.map(convo => (
                      <div
                        key={convo.partner_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
                      >
                        {/* Clickable area — opens chat */}
                        <div
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => openChat({ id: convo.partner_id, gamer_tag: convo.gamer_tag, unique_id: convo.unique_id, avatar_url: convo.avatar_url })}
                        >
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-400 text-sm shrink-0">
                            {convo.gamer_tag.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm font-rajdhani text-white flex items-center gap-2">
                              {convo.gamer_tag}
                              {convo.unread_count > 0 && (
                                <span className="bg-cyan-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                  {convo.unread_count} NEW
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono opacity-50 truncate max-w-[180px]">
                              {convo.latest_message}
                            </div>
                            <div className="text-[9px] font-mono opacity-30 mt-0.5">
                              {new Date(convo.sent_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Mark as Read button — shown when there are unread messages */}
                        {convo.unread_count > 0 && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={e => { e.stopPropagation(); handleMarkRead(convo.partner_id); }}
                            title="Mark as read"
                            className="ml-2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-cyan-500/15 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/20 text-[10px] font-mono transition-all shrink-0"
                          >
                            <MailOpen size={12} />
                            <span className="hidden group-hover:inline">Read</span>
                          </motion.button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'friends' ? (
                /* Friends List */
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {friends.length === 0 ? (
                    <div className="text-center py-16 opacity-40 text-xs font-mono space-y-2">
                      <Users size={32} className="mx-auto opacity-30" />
                      <p>You haven't added any friends yet.</p>
                      <p className="text-[11px] opacity-60">Use the 'ADD FRIEND' tab to connect using their FB-ID or tag!</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all"
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/profile"
                          onClick={() => onViewProfile?.(friend.id)}
                        >
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-400 text-sm group-hover/profile:bg-cyan-500/30 transition-colors">
                            {friend.gamer_tag.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm font-rajdhani text-white group-hover/profile:text-cyan-400 transition-colors">{friend.gamer_tag}</div>
                            <div className="text-[10px] font-mono opacity-50">{friend.unique_id}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 relative">
                          <button
                            onClick={() => openChat(friend)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold hover:bg-cyan-500/30 transition-all"
                          >
                            <MessageSquare size={12} /> DM
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === friend.id ? null : friend.id);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all relative z-10"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {openDropdownId === friend.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                              <div className="absolute right-0 top-full mt-2 w-48 bg-[#111116] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => { setOpenDropdownId(null); onViewProfile?.(friend.id); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-mono text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                  <Share size={12} /> Share profile
                                </button>
                                <button
                                  onClick={() => { setOpenDropdownId(null); toast.success("User reported"); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-mono text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                  <Flag size={12} /> Report user
                                </button>
                                <div className="h-px bg-white/10 my-1" />
                                <button
                                  onClick={() => { setOpenDropdownId(null); handleRemoveFriend(friend.id); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-mono text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={12} /> Delete friend
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'pending' ? (
                /* Pending Requests */
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                  {/* Incoming */}
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                      INCOMING REQUESTS <span className="px-1.5 py-0.5 rounded bg-cyan-500/20">{pendingIncoming.length}</span>
                    </h3>
                    {pendingIncoming.length === 0 ? (
                      <div className="text-xs font-mono opacity-30 py-2">No pending incoming requests.</div>
                    ) : (
                      <div className="space-y-2">
                        {pendingIncoming.map(req => (
                          <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div>
                              <div className="font-bold text-sm font-rajdhani">{req.gamer_tag}</div>
                              <div className="text-[10px] font-mono opacity-40">{req.unique_id}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(req.friendship_id, 'accept')}
                                className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold hover:bg-emerald-500/30 flex items-center gap-1"
                              >
                                <Check size={12} /> ACCEPT
                              </button>
                              <button
                                onClick={() => handleRespond(req.friendship_id, 'decline')}
                                className="px-3 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold hover:bg-red-500/30 flex items-center gap-1"
                              >
                                <X size={12} /> DECLINE
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outgoing */}
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-widest opacity-60 mb-3">
                      OUTGOING REQUESTS ({pendingOutgoing.length})
                    </h3>
                    {pendingOutgoing.length === 0 ? (
                      <div className="text-xs font-mono opacity-30 py-2">No pending outgoing requests.</div>
                    ) : (
                      <div className="space-y-2">
                        {pendingOutgoing.map(req => (
                          <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div>
                              <div className="font-bold text-sm font-rajdhani">{req.gamer_tag}</div>
                              <div className="text-[10px] font-mono opacity-40">{req.unique_id}</div>
                            </div>
                            <span className="text-[10px] font-mono opacity-40 italic">Pending response...</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Add Friend Tab */
                <div className="p-6 flex-1 space-y-5 overflow-y-auto">
                  <div>
                    <h3 className="text-base font-bold font-rajdhani text-cyan-400 mb-1">ADD A FRIEND</h3>
                    <p className="text-xs font-mono opacity-60">
                      Search by Gamer Tag or FightBracket ID to find and add players.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. ArslanAsh or FB-XXXX-YYYY"
                        value={addIdentifier}
                        onChange={e => { setAddIdentifier(e.target.value); setStatusMsg(null); }}
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-cyan-400 font-mono transition-colors"
                      />
                      {searching && (
                        <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 animate-spin" />
                      )}
                    </div>

                    {/* Live search results dropdown */}
                    {searchResults.length > 0 && (
                      <div className="rounded-xl border border-white/10 bg-[#0A1020] overflow-hidden divide-y divide-white/5">
                        {searchResults.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                            {/* Avatar */}
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.gamer_tag} className="w-9 h-9 rounded-full object-cover border border-cyan-500/30 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                <User size={14} className="text-cyan-400" />
                              </div>
                            )}
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-white font-rajdhani truncate">{u.gamer_tag}</div>
                              <div className="text-[10px] font-mono text-cyan-400/60 truncate">{u.unique_id}</div>
                            </div>
                            {/* Quick-add */}
                            <button
                              onClick={async () => {
                                if (addingFriendId === u.id || !supabaseToken) return;
                                setAddingFriendId(u.id);
                                setStatusMsg(null);
                                try {
                                  const res = await fetch(`${API_URL}/api/friends/request`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseToken}` },
                                    body: JSON.stringify({ target_identifier: u.unique_id })
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    setStatusMsg({ text: data.message || `Friend request sent to ${u.gamer_tag}!`, isError: false });
                                    setSearchResults(prev => prev.filter(r => r.id !== u.id));
                                    fetchFriends();
                                  } else {
                                    setStatusMsg({ text: data.detail || 'Failed to send request', isError: true });
                                  }
                                } catch (e: any) {
                                  setStatusMsg({ text: e.message || 'Error', isError: true });
                                } finally {
                                  setAddingFriendId(null);
                                }
                              }}
                              disabled={addingFriendId === u.id}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all disabled:opacity-50"
                              style={{ background: 'rgba(0,229,255,0.12)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.25)' }}
                            >
                              {addingFriendId === u.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <UserPlus size={12} />
                              )}
                              ADD
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results hint */}
                    {addIdentifier.trim() && !searching && searchResults.length === 0 && (
                      <div className="text-center py-4 text-xs font-mono text-gray-600">
                        No matching players found. You can still send by exact FB-ID below.
                      </div>
                    )}

                    {/* Status message */}
                    {statusMsg && (
                      <div className={`text-xs font-mono p-3 rounded-lg border ${
                        statusMsg.isError ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {statusMsg.text}
                      </div>
                    )}

                    <button
                      onClick={handleSendRequest}
                      disabled={loading || !addIdentifier.trim()}
                      className="w-full py-3 rounded-xl bg-cyan-500 text-black font-bold text-sm hover:brightness-125 disabled:opacity-40 transition-all font-rajdhani tracking-wider flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> SEND FRIEND REQUEST
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
