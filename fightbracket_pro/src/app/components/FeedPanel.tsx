import React, { useState, useEffect } from 'react';
import {
  Trophy, GitBranch, Flame, MessageCircle, Calendar,
  Heart, Share2, Bookmark, Send, Image as ImageIcon, Video, Hash, Smile,
  ChevronUp, MoreHorizontal, UserPlus, ExternalLink, Swords
} from 'lucide-react';
import { toast } from 'sonner';

export interface Post {
  id: string;
  author: { name: string; handle: string; initials: string; color: string; badge?: string; avatar?: string };
  time: string;
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  bookmarked: boolean;
  type: "result" | "hype" | "bracket" | "discussion" | "event";
  pinned?: boolean;
}

type FeedFilter = "all" | "results" | "brackets" | "discussions";

const trendingTags = [
  { tag: "CEO2026", posts: "28.7k" },
  { tag: "Tekken8", posts: "21.4k" },
  { tag: "StreetFighter6", posts: "17.9k" },
  { tag: "FatalFury", posts: "12.3k" },
  { tag: "2XKO", posts: "8.6k" },
  { tag: "FGC", posts: "6.2k" },
  { tag: "FightBracketPro", posts: "3.1k" },
];

const defaultUpcomingEvents = [
  { id: 1, name: "Southeast Regional Open", date: "Aug 17, 2026", location: "Atlanta, GA", fighters: 48, status: "registration", sport: "BJJ" },
  { id: 2, name: "Iron Fist Championships", date: "Aug 29, 2026", location: "Miami, FL", fighters: 32, status: "locked", sport: "Kickboxing" },
  { id: 3, name: "Combat Classic Vol. 8", date: "Sep 6, 2026", location: "Houston, TX", fighters: 64, status: "registration", sport: "MMA" },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  registration: { bg: "rgba(6,182,212,0.12)", text: "#06b6d4", label: "Open" },
  locked: { bg: "rgba(251,191,36,0.12)", text: "#f59e0b", label: "Locked" },
  draft: { bg: "rgba(139,139,154,0.12)", text: "#8a8a9a", label: "Draft" },
  live: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "Live" },
};

const defaultSuggestedUsers = [
  { name: "Diego Salazar", handle: "diegoGrapples", initials: "DS", color: "#8b5cf6", sport: "BJJ · -77kg" },
  { name: "Priya Nair", handle: "PriyaKicks", initials: "PN", color: "#ec4899", sport: "Kickboxing · -60kg" },
  { name: "Gulf Coast Promos", handle: "gulfCoastPromos", initials: "GC", color: "#06b6d4", sport: "Promoter" },
];

function ActionBtn({ icon: Icon, label, onClick, active, activeColor, filled }: {
  icon: React.ElementType; label: string; onClick: () => void;
  active?: boolean; activeColor?: string; filled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all duration-150 hover:bg-white/[0.04]"
      style={{ color: active ? activeColor : "#8a8a9a", borderRadius: "2px" }}
    >
      <Icon size={14} fill={filled ? (activeColor ?? "none") : "none"} />
      {label && label}
    </button>
  );
}

export const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  result:     { icon: Trophy,      color: "#f59e0b", label: "Result"     },
  bracket:    { icon: GitBranch,   color: "#06b6d4", label: "Bracket"    },
  hype:       { icon: Flame,       color: "#f97316", label: "Hype"       },
  discussion: { icon: MessageCircle, color: "#8b5cf6", label: "Discussion" },
  event:      { icon: Calendar,    color: "#22c55e", label: "Event"      },
};

export function PostCard({ post, onLike, onBookmark }: { post: Post; onLike: (id: string) => void; onBookmark: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const tc = typeConfig[post.type] || typeConfig.discussion;
  const TypeIcon = tc.icon;

  const handleDate = (isoDate: string) => {
    if (!isoDate) return "Just now";
    const d = new Date(isoDate);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#141418",
        border: post.pinned ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "2px",
      }}
    >
      {post.pinned && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-0" style={{ color: "#06b6d4" }}>
          <ChevronUp size={11} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Pinned Post</span>
        </div>
      )}

      <div className="flex items-start gap-3 px-4 pt-4 pb-0">
        <div className="w-9 h-9 flex-shrink-0 overflow-hidden" style={{ borderRadius: "2px" }}>
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: post.author.color, fontFamily: "'Barlow Condensed', sans-serif" }}>
              {post.author.initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{post.author.name}</span>
            {post.author.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "2px" }}>
                {post.author.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: "#8a8a9a" }}>{handleDate(post.time)}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1 text-[10px]" style={{ color: tc.color }}>
              <TypeIcon size={10} />{tc.label}
            </span>
          </div>
        </div>
        <button className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="px-4 pt-3">
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#e0ddd8" }}>
          {post.content}
        </p>
      </div>

      {post.image && (
        <div className="mx-4 mt-3 overflow-hidden" style={{ borderRadius: "2px", background: "#1e1e24" }}>
          <img src={post.image} alt="Post attachment" className="w-full object-cover" style={{ maxHeight: "280px" }} />
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 mt-3">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-medium cursor-pointer transition-colors hover:text-cyan-300" style={{ color: "#06b6d4" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 mt-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-[11px]" style={{ color: "#8a8a9a" }}>{post.likes} likes</span>
        <span className="text-[11px]" style={{ color: "#8a8a9a" }}>{post.comments} comments</span>
        <span className="text-[11px]" style={{ color: "#8a8a9a" }}>{post.shares} shares</span>
      </div>

      <div className="flex items-center px-2 py-1">
        <ActionBtn
          icon={Heart}
          label={post.liked ? "Liked" : "Like"}
          active={post.liked}
          activeColor="#f43f5e"
          onClick={() => onLike(post.id)}
          filled={post.liked}
        />
        <ActionBtn icon={MessageCircle} label="Comment" onClick={() => setShowComments(!showComments)} active={showComments} activeColor="#06b6d4" />
        <ActionBtn icon={Share2} label="Share" onClick={() => toast.info("Sharing coming soon")} />
        <div className="ml-auto">
          <ActionBtn
            icon={Bookmark}
            label=""
            active={post.bookmarked}
            activeColor="#06b6d4"
            onClick={() => onBookmark(post.id)}
            filled={post.bookmarked}
          />
        </div>
      </div>

      {showComments && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex gap-2 pt-3">
            <div className="flex-1 flex items-center gap-2" style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px", paddingLeft: "12px", paddingRight: "8px" }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent outline-none text-xs py-2 placeholder:text-white/20"
                style={{ color: "#f0ede8" }}
                onKeyDown={(e) => { if (e.key === "Enter") { setCommentText(""); toast.info("Comments coming soon"); } }}
              />
              <button onClick={() => { setCommentText(""); toast.info("Comments coming soon"); }} style={{ color: commentText ? "#06b6d4" : "#8a8a9a" }}>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FeedPanel({ userProfile, getHeaders }: { userProfile: any, getHeaders: () => Promise<HeadersInit> }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<any[]>(defaultUpcomingEvents);
  const [users, setUsers] = useState<any[]>(defaultSuggestedUsers);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [composerText, setComposerText] = useState("");
  const [composerFocused, setComposerFocused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
    fetchSidebar();
  }, []);

  const fetchSidebar = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/feed/sidebar', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.upcoming_events && data.upcoming_events.length > 0) {
          setEvents(data.upcoming_events);
        }
        if (data.suggested_users && data.suggested_users.length > 0) {
          setUsers(data.suggested_users);
        }
      }
    } catch (e) {
      console.error("Failed to load sidebar", e);
    }
  };

  const fetchFeed = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/feed', { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? posts : posts.filter((p) => {
    if (filter === "results") return p.type === "result";
    if (filter === "brackets") return p.type === "bracket";
    if (filter === "discussions") return p.type === "discussion" || p.type === "hype";
    return true;
  });

  const toggleLike = async (id: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    try {
      const headers = await getHeaders();
      await fetch(`/api/feed/${id}/like`, { method: 'POST', headers });
    } catch (e) {
      // Revert on failure
      setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
      toast.error('Failed to like post');
    }
  };

  const toggleBookmark = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
    toast.info("Bookmarks coming soon");
  };

  const submitPost = async () => {
    if (!composerText.trim()) return;
    
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: composerText,
          type: "discussion",
          tags: [],
        })
      });
      
      if (res.ok) {
        setComposerText("");
        setComposerFocused(false);
        fetchFeed(); // Refresh feed
        toast.success("Post created!");
      } else {
        toast.error("Failed to post");
      }
    } catch (e) {
      toast.error("Failed to post");
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-[#8a8a9a]">Loading feed...</div>;
  }

  return (
    <div className="p-4 lg:p-6 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Composer */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div className="flex gap-3">
                <div className="w-9 h-9 flex-shrink-0 mt-0.5 overflow-hidden" style={{ borderRadius: "2px" }}>
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt={userProfile.gamer_tag || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: userProfile?.profile_color || "#06b6d4", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {userProfile?.gamer_tag ? userProfile.gamer_tag.substring(0, 2).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onFocus={() => setComposerFocused(true)}
                    placeholder="Share results, hype your next event, call out your rivals..."
                    rows={composerFocused ? 3 : 1}
                    className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-white/25 transition-all duration-200"
                    style={{ color: "#f0ede8", lineHeight: "1.6", paddingTop: "8px" }}
                  />
                  {composerFocused && (
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-1">
                        {[
                          { icon: ImageIcon, label: "Photo" },
                          { icon: Video, label: "Video" },
                          { icon: Hash, label: "Tag" },
                          { icon: Smile, label: "Emoji" },
                        ].map(({ icon: Icon, label }) => (
                          <button key={label} title={label} onClick={() => toast.info(`${label} uploads coming soon`)} className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px", color: "#8a8a9a" }}>
                            <Icon size={15} />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setComposerFocused(false); setComposerText(""); }} className="h-8 px-3 text-xs font-medium" style={{ color: "#8a8a9a" }}>
                          Cancel
                        </button>
                        <button
                          onClick={submitPost}
                          disabled={!composerText.trim()}
                          className="flex items-center gap-1.5 h-8 px-4 text-xs font-bold transition-all duration-150 disabled:opacity-50"
                          style={{
                            background: composerText.trim() ? "#06b6d4" : "#1e1e24",
                            color: composerText.trim() ? "#000" : "#8a8a9a",
                            borderRadius: "2px",
                            fontFamily: "'Barlow Condensed', sans-serif",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          <Send size={12} />Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {([
                { id: "all", label: "All Posts" },
                { id: "results", label: "Results" },
                { id: "brackets", label: "Brackets" },
                { id: "discussions", label: "Discussion" },
              ] as { id: FeedFilter; label: string }[]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className="px-4 pb-3 text-xs font-medium uppercase tracking-wider relative transition-colors"
                  style={{
                    color: filter === id ? "#f0ede8" : "#8a8a9a",
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                  {filter === id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
                </button>
              ))}
            </div>

            {/* Posts */}
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} onLike={toggleLike} onBookmark={toggleBookmark} />
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center p-8 text-[#8a8a9a] text-sm">
                No posts found for this filter.
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
            {/* Your activity */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 overflow-hidden flex-shrink-0" style={{ borderRadius: "2px" }}>
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt={userProfile.gamer_tag || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ background: userProfile?.profile_color || "#06b6d4", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {userProfile?.gamer_tag?.substring(0, 2).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{userProfile?.gamer_tag}</div>
                  <div className="text-xs truncate" style={{ color: "#8a8a9a" }}>@{userProfile?.gamer_tag}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Posts", value: "0" },
                  { label: "Following", value: "0" },
                  { label: "Followers", value: "0" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-white font-bold text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "#8a8a9a" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending tags */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <h3 className="text-white uppercase tracking-wide text-xs mb-3 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
                <Flame size={13} className="text-cyan-400" />Trending in FGC
              </h3>
              <div className="flex flex-col gap-1">
                {trendingTags.map(({ tag, posts: count }, i) => (
                  <button key={tag} className="flex items-center justify-between py-1.5 px-2 transition-colors hover:bg-white/[0.03] text-left" style={{ borderRadius: "2px" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-4 text-center" style={{ color: "#8a8a9a", fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
                      <span className="text-sm font-medium" style={{ color: "#06b6d4" }}>#{tag}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#8a8a9a" }}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="rounded-xl overflow-hidden mb-6" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <Calendar size={13} className="text-cyan-400" />
                <h3 className="text-white uppercase tracking-wide text-xs" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
                  UPCOMING EVENTS
                </h3>
              </div>
              <div className="p-3">
                {events.length === 0 ? (
                  <div className="text-[11px] text-center py-4" style={{ color: "#8a8a9a" }}>Loading events from Start.gg...</div>
                ) : events.map((ev) => {
                  const s = statusColors[ev.status as keyof typeof statusColors] || { bg: "#1e1e24", text: "#8a8a9a", label: "TBD" };
                  const content = (
                    <div key={ev.id} className="flex items-start gap-2.5 mb-3 last:mb-0 group">
                      <div className="w-8 h-8 flex-shrink-0 overflow-hidden" style={{ borderRadius: "2px" }}>
                        {ev.image ? (
                          <img src={ev.image} alt={ev.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "#1e1e24" }}>
                            <Swords size={13} style={{ color: "#06b6d4" }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate group-hover:text-cyan-400 transition-colors">{ev.name}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "#8a8a9a" }}>{ev.date} · {ev.location}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 uppercase" style={{ background: s.bg, color: s.text, borderRadius: "1px" }}>{s.label}</span>
                          {ev.fighters > 0 && <span className="text-[9px]" style={{ color: "#8a8a9a" }}>{ev.fighters} entrants</span>}
                        </div>
                      </div>
                    </div>
                  );
                  return ev.link ? (
                    <a key={ev.id} href={ev.link} target="_blank" rel="noopener noreferrer" className="block">
                      {content}
                    </a>
                  ) : content;
                })}
              </div>
            </div>


            {/* Suggested */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <h3 className="text-white uppercase tracking-wide text-xs mb-3 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
                <UserPlus size={13} className="text-cyan-400" />Suggested
              </h3>
              <div className="flex flex-col gap-3">
                {users.map((u) => (
                  <div key={u.handle} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: u.color, borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>{u.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{u.name}</div>
                      <div className="text-[10px]" style={{ color: "#8a8a9a" }}>{u.sport}</div>
                    </div>
                    <button className="flex items-center gap-1 text-[10px] font-bold px-2 h-6 transition-all flex-shrink-0"
                      style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                      <UserPlus size={9} />Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
