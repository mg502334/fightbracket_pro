import { useState } from "react";
import {
  Trophy,
  LayoutDashboard,
  Users,
  Calendar,
  GitBranch,
  BarChart2,
  Settings,
  Bell,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Plus,
  MoreHorizontal,
  Star,
  MapPin,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  User,
  Shield,
  Globe,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  Upload,
  ChevronDown,
  Link,
  Rss,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Image,
  Video,
  Smile,
  Send,
  ThumbsUp,
  Flame,
  Swords,
  Hash,
  UserPlus,
  ExternalLink,
  ChevronUp,
  Award,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Shared data ──────────────────────────────────────────────────────────────

const activityData = [
  { month: "Feb", registrations: 12, completions: 4 },
  { month: "Mar", registrations: 19, completions: 7 },
  { month: "Apr", registrations: 15, completions: 9 },
  { month: "May", registrations: 28, completions: 11 },
  { month: "Jun", registrations: 24, completions: 14 },
  { month: "Jul", registrations: 35, completions: 18 },
  { month: "Aug", registrations: 31, completions: 16 },
];

const upcomingEvents = [
  { id: 1, name: "Southeast Regional Open", date: "Aug 17, 2026", location: "Atlanta, GA", fighters: 48, status: "registration", sport: "BJJ" },
  { id: 2, name: "Iron Fist Championships", date: "Aug 29, 2026", location: "Miami, FL", fighters: 32, status: "locked", sport: "Kickboxing" },
  { id: 3, name: "Combat Classic Vol. 8", date: "Sep 6, 2026", location: "Houston, TX", fighters: 64, status: "registration", sport: "MMA" },
  { id: 4, name: "Warrior Cup 2026", date: "Sep 20, 2026", location: "Las Vegas, NV", fighters: 16, status: "draft", sport: "Boxing" },
];

const recentResults = [
  { name: "Gulf Coast Invitational", date: "Jul 28", winner: 'Marcus "The Bull" Torres', division: "HW", sport: "MMA" },
  { name: "Summer Slam Open", date: "Jul 19", winner: "Kenji Watanabe", division: "-66kg", sport: "Judo" },
  { name: "Pride FC Amateur Series", date: "Jul 12", winner: "Aaliyah Reyes", division: "FW", sport: "Boxing" },
];

const topFighters = [
  { name: "Marcus Torres", record: "14-2", sport: "MMA", weight: "HW", rating: 94 },
  { name: "Kenji Watanabe", record: "22-4", sport: "Judo", weight: "-66kg", rating: 91 },
  { name: "Aaliyah Reyes", record: "8-0", sport: "Boxing", weight: "FW", rating: 88 },
  { name: "Diego Salazar", record: "11-3", sport: "BJJ", weight: "-77kg", rating: 85 },
  { name: "Priya Nair", record: "6-1", sport: "Kickboxing", weight: "-60kg", rating: 82 },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  registration: { bg: "rgba(6,182,212,0.12)", text: "#06b6d4", label: "Open" },
  locked: { bg: "rgba(251,191,36,0.12)", text: "#f59e0b", label: "Locked" },
  draft: { bg: "rgba(139,139,154,0.12)", text: "#8a8a9a", label: "Draft" },
  live: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "Live" },
};

// ─── Feed data ────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  author: { name: string; handle: string; initials: string; color: string; badge?: string };
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

const initialPosts: Post[] = [
  {
    id: 1,
    author: { name: "IronFist Promotions", handle: "ironFistPromos", initials: "IF", color: "#06b6d4", badge: "Promoter" },
    time: "2h ago",
    content: "🏆 BRACKET DROP — Southeast Regional Open is now LIVE. 48 competitors across 6 weight classes. Check in opens Friday 6PM. Come ready.\n\nStream: twitch.tv/ironFistPromos",
    image: "https://images.unsplash.com/photo-1757580190896-8a092a315311?w=800&h=400&fit=crop&auto=format",
    tags: ["SoutheastOpen", "FightBracketPro", "BJJ"],
    likes: 184,
    comments: 43,
    shares: 29,
    liked: false,
    bookmarked: false,
    type: "bracket",
    pinned: true,
  },
  {
    id: 2,
    author: { name: "Marcus Torres", handle: "TheBull_Torres", initials: "MT", color: "#f59e0b" },
    time: "4h ago",
    content: "Just finished a 4-hour grinding session on the mits. Footwork drills until my legs gave out. If you're not putting in the reps nobody is doing it for you.\n\nSee you all at Combat Classic. I'm not coming to lose. 🔥",
    tags: ["GrindSeason", "CombatClassic", "MMA"],
    likes: 312,
    comments: 67,
    shares: 14,
    liked: true,
    bookmarked: false,
    type: "hype",
  },
  {
    id: 3,
    author: { name: "FGC Central", handle: "fgcCentral", initials: "FC", color: "#8b5cf6", badge: "Media" },
    time: "6h ago",
    content: "RESULTS: Gulf Coast Invitational — HW Finals\n\n🥇 Marcus \"The Bull\" Torres def. Leon Garrett via TKO R2\n🥈 Leon Garrett\n🥉 Darius Webb / Kofi Mensah\n\nTorres is on a 6-fight win streak and looking unstoppable heading into the fall season. Full brackets below 👇",
    tags: ["GulfCoastInvitational", "Results", "HeavyWeight"],
    likes: 529,
    comments: 112,
    shares: 88,
    liked: false,
    bookmarked: true,
    type: "result",
  },
  {
    id: 4,
    author: { name: "Aaliyah Reyes", handle: "AaliyahBoxes", initials: "AR", color: "#ec4899" },
    time: "9h ago",
    content: "Going 8-0 doesn't mean anything if you can't defend it. Every fight I walk into I expect to be the hardest one yet. That's the only mindset that keeps you sharp.\n\nRegistered for Pride FC Amateur Series Vol. 2. Let's go. 👊",
    tags: ["Boxing", "FemaleAthletes", "PrideFCAm"],
    likes: 741,
    comments: 203,
    shares: 56,
    liked: false,
    bookmarked: false,
    type: "hype",
  },
  {
    id: 5,
    author: { name: "BracketHead", handle: "bracketHead99", initials: "BH", color: "#22c55e", badge: "Analyst" },
    time: "12h ago",
    content: "Hot take: seeding at regional grappling events is completely broken. Half the time a blue belt with 40 matches is getting placed in the same pool as someone with 5 tournament appearances.\n\nFightBracketPro's weighted seeding system actually solves this — your entry history matters. Who else has run into busted seeds at a local?",
    tags: ["HotTake", "Seeding", "Grappling", "BJJ"],
    likes: 267,
    comments: 95,
    shares: 31,
    liked: false,
    bookmarked: false,
    type: "discussion",
  },
  {
    id: 6,
    author: { name: "Kenji Watanabe", handle: "KenjiJudo", initials: "KW", color: "#06b6d4" },
    time: "1d ago",
    content: "First time competing in the US and I have to say — the energy at Summer Slam was unreal. Thank you to everyone who came out. The crowd in the finals was something I won't forget.\n\nGGs to everyone I matched with. See you on the mat. 🙏",
    image: "https://images.unsplash.com/photo-1785123550428-898fcb48c8e6?w=800&h=400&fit=crop&auto=format",
    tags: ["GGs", "Judo", "SummerSlam", "ThankYou"],
    likes: 893,
    comments: 147,
    shares: 62,
    liked: true,
    bookmarked: true,
    type: "result",
  },
  {
    id: 7,
    author: { name: "CombatCast Podcast", handle: "combatCastPod", initials: "CC", color: "#f97316", badge: "Media" },
    time: "1d ago",
    content: "NEW EPISODE: We break down the top 5 bracket collapses of 2026 so far — upsets, injuries, no-shows, and one absolutely unbelievable double DQ.\n\nDrop in your #1 upset of the year in the comments 👇\n\nLink in bio.",
    tags: ["Podcast", "Upsets", "FGC", "CombatCast"],
    likes: 188,
    comments: 74,
    shares: 41,
    liked: false,
    bookmarked: false,
    type: "discussion",
  },
];

const trendingTags = [
  { tag: "SoutheastOpen", posts: "2.4k" },
  { tag: "CombatClassic", posts: "1.8k" },
  { tag: "GGs", posts: "14.2k" },
  { tag: "BJJ", posts: "9.1k" },
  { tag: "MMA", posts: "31.6k" },
  { tag: "Upsets", posts: "872" },
  { tag: "FightBracketPro", posts: "5.5k" },
];

const suggestedUsers = [
  { name: "Diego Salazar", handle: "diegoGrapples", initials: "DS", color: "#8b5cf6", sport: "BJJ · -77kg" },
  { name: "Priya Nair", handle: "PriyaKicks", initials: "PN", color: "#ec4899", sport: "Kickboxing · -60kg" },
  { name: "Gulf Coast Promos", handle: "gulfCoastPromos", initials: "GC", color: "#06b6d4", sport: "Promoter" },
];

// ─── Nav ─────────────────────────────────────────────────────────────────────

type View = "dashboard" | "feed" | "settings";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" as View },
  { icon: Rss, label: "Feed", view: "feed" as View },
  { icon: Calendar, label: "Events", view: null },
  { icon: GitBranch, label: "Brackets", view: null },
  { icon: Users, label: "Fighters", view: null },
  { icon: BarChart2, label: "Analytics", view: null },
  { icon: Settings, label: "Settings", view: "settings" as View },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#0c0c0e", fontFamily: "'Inter', sans-serif", color: "#f0ede8" }}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: "220px", background: "#0f0f12", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
      >
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 bg-cyan-500 flex items-center justify-center flex-shrink-0">
            <Trophy size={15} className="text-white" />
          </div>
          <div>
            <div className="text-white text-base leading-none tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}>FightBracket</div>
            <div className="text-cyan-400 text-[10px] tracking-[0.2em] uppercase font-medium">Pro</div>
          </div>
          <button className="ml-auto lg:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(({ icon: Icon, label, view: v }) => {
            const active = v === view;
            return (
              <button
                key={label}
                onClick={() => { if (v) setView(v); setSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full"
                style={{
                  color: active ? "#f0ede8" : "#8a8a9a",
                  background: active ? "rgba(6,182,212,0.1)" : "transparent",
                  borderLeft: active ? "2px solid #06b6d4" : "2px solid transparent",
                  borderRadius: "2px",
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#06b6d4", borderRadius: "2px" }}>JD</div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">James Donovan</div>
              <div className="text-[10px]" style={{ color: "#8a8a9a" }}>Pro Promoter</div>
            </div>
            <button className="ml-auto text-white/30 hover:text-white/70 transition-colors"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center gap-4 px-6 py-4 sticky top-0 z-20"
          style={{ background: "rgba(12,12,14,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-3 h-9 text-sm" style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <Search size={13} style={{ color: "#8a8a9a" }} />
              <input placeholder="Search events, fighters, posts..." className="bg-transparent outline-none flex-1 placeholder:text-white/20 text-sm" style={{ color: "#f0ede8" }} />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>
              <Bell size={16} style={{ color: "#8a8a9a" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            </button>
            <button
              className="hidden sm:flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white transition-all duration-150"
              style={{ background: "#06b6d4", color: "#000", borderRadius: "2px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0891b2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#06b6d4")}
            >
              <Plus size={13} />New Event
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {view === "dashboard" && <DashboardView />}
          {view === "feed" && <FeedView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

// ─── Feed View ────────────────────────────────────────────────────────────────

type FeedFilter = "all" | "results" | "brackets" | "discussions";

function FeedView() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [composerText, setComposerText] = useState("");
  const [composerFocused, setComposerFocused] = useState(false);

  const filtered = filter === "all" ? posts : posts.filter((p) => {
    if (filter === "results") return p.type === "result";
    if (filter === "brackets") return p.type === "bracket";
    if (filter === "discussions") return p.type === "discussion" || p.type === "hype";
    return true;
  });

  const toggleLike = (id: number) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleBookmark = (id: number) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
  };

  const submitPost = () => {
    if (!composerText.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      author: { name: "James Donovan", handle: "ironFistPromos", initials: "JD", color: "#06b6d4", badge: "Promoter" },
      time: "Just now",
      content: composerText,
      tags: [],
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: false,
      type: "hype",
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposerText("");
    setComposerFocused(false);
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-6">
          {/* Main feed column */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Composer */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div className="flex gap-3">
                <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ background: "#06b6d4", borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>JD</div>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onFocus={() => setComposerFocused(true)}
                    placeholder="Share results, hype your next event, call out your rivals..."
                    rows={composerFocused ? 3 : 1}
                    className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-white/25 transition-all duration-200"
                    style={{ color: "#f0ede8", lineHeight: "1.6" }}
                  />
                  {composerFocused && (
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-1">
                        {[
                          { icon: Image, label: "Photo" },
                          { icon: Video, label: "Video" },
                          { icon: Hash, label: "Tag" },
                          { icon: Smile, label: "Emoji" },
                        ].map(({ icon: Icon, label }) => (
                          <button key={label} title={label} className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px", color: "#8a8a9a" }}>
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
                          className="flex items-center gap-1.5 h-8 px-4 text-xs font-bold transition-all duration-150"
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
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">

            {/* Your activity */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 flex items-center justify-center text-sm font-bold text-white" style={{ background: "#06b6d4", borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>JD</div>
                <div>
                  <div className="text-sm font-medium text-white">James Donovan</div>
                  <div className="text-xs" style={{ color: "#8a8a9a" }}>@ironFistPromos</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Posts", value: "47" },
                  { label: "Following", value: "183" },
                  { label: "Followers", value: "1.2k" },
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

            {/* Upcoming events mini */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <h3 className="text-white uppercase tracking-wide text-xs mb-3 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
                <Calendar size={13} className="text-cyan-400" />Upcoming Events
              </h3>
              <div className="flex flex-col gap-3">
                {upcomingEvents.slice(0, 3).map((ev) => {
                  const s = statusColors[ev.status];
                  return (
                    <div key={ev.id} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "#1e1e24", borderRadius: "2px" }}>
                        <Swords size={13} style={{ color: "#06b6d4" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{ev.name}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "#8a8a9a" }}>{ev.date} · {ev.location}</div>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 mt-1 inline-block uppercase" style={{ background: s.bg, color: s.text, borderRadius: "1px" }}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="w-full mt-3 pt-3 text-xs text-center transition-colors hover:text-cyan-300" style={{ color: "#06b6d4", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                View all events <ExternalLink size={10} className="inline ml-1" />
              </button>
            </div>

            {/* Suggested */}
            <div className="p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <h3 className="text-white uppercase tracking-wide text-xs mb-3 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
                <UserPlus size={13} className="text-cyan-400" />Suggested
              </h3>
              <div className="flex flex-col gap-3">
                {suggestedUsers.map((u) => (
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

// ─── Post Card ────────────────────────────────────────────────────────────────

const typeConfig = {
  result:     { icon: Trophy,      color: "#f59e0b", label: "Result"     },
  bracket:    { icon: GitBranch,   color: "#06b6d4", label: "Bracket"    },
  hype:       { icon: Flame,       color: "#f97316", label: "Hype"       },
  discussion: { icon: MessageCircle, color: "#8b5cf6", label: "Discussion" },
  event:      { icon: Calendar,    color: "#22c55e", label: "Event"      },
};

function PostCard({ post, onLike, onBookmark }: { post: Post; onLike: (id: number) => void; onBookmark: (id: number) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const tc = typeConfig[post.type];
  const TypeIcon = tc.icon;

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#141418",
        border: post.pinned ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "2px",
      }}
    >
      {/* Pinned banner */}
      {post.pinned && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-0" style={{ color: "#06b6d4" }}>
          <ChevronUp size={11} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Pinned Post</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-0">
        <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: post.author.color, borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>
          {post.author.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{post.author.name}</span>
            {post.author.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "2px" }}>
                {post.author.badge}
              </span>
            )}
            <span className="text-xs" style={{ color: "#8a8a9a" }}>@{post.author.handle}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: "#8a8a9a" }}>{post.time}</span>
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

      {/* Content */}
      <div className="px-4 pt-3">
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#e0ddd8" }}>
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="mx-4 mt-3 overflow-hidden" style={{ borderRadius: "2px", background: "#1e1e24" }}>
          <img src={post.image} alt="Post attachment" className="w-full object-cover" style={{ maxHeight: "280px" }} />
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 mt-3">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-medium cursor-pointer transition-colors hover:text-cyan-300" style={{ color: "#06b6d4" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 mt-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-[11px]" style={{ color: "#8a8a9a" }}>{post.likes} likes</span>
        <span className="text-[11px]" style={{ color: "#8a8a9a" }}>{post.comments} comments</span>
        <span className="text-[11px]" style={{ color: "#8a8a9a" }}>{post.shares} shares</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center px-2 py-1">
        <ActionBtn
          icon={post.liked ? Heart : Heart}
          label={post.liked ? "Liked" : "Like"}
          active={post.liked}
          activeColor="#f43f5e"
          onClick={() => onLike(post.id)}
          filled={post.liked}
        />
        <ActionBtn icon={MessageCircle} label="Comment" onClick={() => setShowComments(!showComments)} active={showComments} activeColor="#06b6d4" />
        <ActionBtn icon={Share2} label="Share" onClick={() => {}} />
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

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex gap-2 pt-3">
            <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "#06b6d4", borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>JD</div>
            <div className="flex-1 flex items-center gap-2" style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px", paddingLeft: "12px", paddingRight: "8px" }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent outline-none text-xs py-2 placeholder:text-white/20"
                style={{ color: "#f0ede8" }}
                onKeyDown={(e) => { if (e.key === "Enter") setCommentText(""); }}
              />
              <button onClick={() => setCommentText("")} style={{ color: commentText ? "#06b6d4" : "#8a8a9a" }}>
                <Send size={13} />
              </button>
            </div>
          </div>
          {/* Sample comments */}
          <div className="flex flex-col gap-3 mt-3">
            {[
              { name: "Diego Salazar", initials: "DS", color: "#8b5cf6", text: "GGs to everyone at the event, see you all next time 🙌", time: "1h ago" },
              { name: "Priya Nair", initials: "PN", color: "#ec4899", text: "Already registered. Let's go 🔥", time: "45m ago" },
            ].map((c) => (
              <div key={c.name} className="flex gap-2">
                <div className="w-6 h-6 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: c.color, borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.initials}</div>
                <div className="flex-1">
                  <div className="inline-block px-3 py-2 text-xs" style={{ background: "#1a1a20", borderRadius: "2px" }}>
                    <span className="font-semibold text-white mr-2">{c.name}</span>
                    <span style={{ color: "#d0cdc8" }}>{c.text}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <button className="text-[10px] font-medium hover:text-white transition-colors" style={{ color: "#8a8a9a" }}>Like</button>
                    <button className="text-[10px] font-medium hover:text-white transition-colors" style={{ color: "#8a8a9a" }}>Reply</button>
                    <span className="text-[10px]" style={{ color: "#8a8a9a" }}>{c.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white uppercase tracking-wide mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "0.05em" }}>Dashboard</h1>
        <p className="text-sm" style={{ color: "#8a8a9a" }}>Sunday, August 3, 2026 — Welcome back, James.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Events", value: "7", delta: "+2", up: true, icon: Calendar },
          { label: "Registered Fighters", value: "312", delta: "+38", up: true, icon: Users },
          { label: "Brackets Completed", value: "43", delta: "+6", up: true, icon: GitBranch },
          { label: "Avg. Event Fill", value: "81%", delta: "-3%", up: false, icon: BarChart2 },
        ].map(({ label, value, delta, up, icon: Icon }) => (
          <div key={label} className="flex flex-col gap-3 p-4" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>{label}</span>
              <Icon size={13} style={{ color: "#8a8a9a" }} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-white leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "2rem" }}>{value}</span>
              <span className="flex items-center gap-1 text-xs font-medium mb-0.5" style={{ color: up ? "#22c55e" : "#ef4444" }}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 p-5" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white uppercase tracking-wide text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>Registration Activity</h2>
              <p className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>Fighter registrations vs. completions — last 7 months</p>
            </div>
            <button className="text-white/30 hover:text-white/60 transition-colors"><MoreHorizontal size={16} /></button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#8a8a9a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8a8a9a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", fontSize: "12px", color: "#f0ede8" }} itemStyle={{ color: "#f0ede8" }} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
              <Area type="monotone" dataKey="registrations" stroke="#06b6d4" strokeWidth={2} fill="url(#gReg)" name="Registrations" dot={false} />
              <Area type="monotone" dataKey="completions" stroke="#f59e0b" strokeWidth={2} fill="url(#gComp)" name="Completions" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: "#8a8a9a" }}><span className="w-3 h-0.5 bg-cyan-500 inline-block" />Registrations</div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#8a8a9a" }}><span className="w-3 h-0.5 bg-amber-400 inline-block" />Completions</div>
          </div>
        </div>

        <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white uppercase tracking-wide text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>Top Fighters</h2>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">View all <ChevronRight size={11} /></button>
          </div>
          <div className="flex flex-col gap-3">
            {topFighters.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <span className="text-xs font-bold w-4 flex-shrink-0 text-center" style={{ color: i === 0 ? "#06b6d4" : "#8a8a9a", fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
                <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "#1e1e24", borderRadius: "2px" }}>
                  {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{f.name}</div>
                  <div className="text-[10px]" style={{ color: "#8a8a9a" }}>{f.sport} · {f.weight} · {f.record}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-amber-400" />
                  <span className="text-xs font-medium" style={{ color: "#f0ede8" }}>{f.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white uppercase tracking-wide text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>Upcoming Events</h2>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">All events <ChevronRight size={11} /></button>
          </div>
          <div className="grid grid-cols-12 gap-2 pb-2 mb-1 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#8a8a9a", borderBottom: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.1em" }}>
            <span className="col-span-5">Event</span>
            <span className="col-span-2 hidden sm:block">Date</span>
            <span className="col-span-2 hidden sm:block">Fighters</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1" />
          </div>
          <div className="flex flex-col">
            {upcomingEvents.map((ev, i) => {
              const s = statusColors[ev.status];
              return (
                <div key={ev.id} className="grid grid-cols-12 gap-2 py-3 items-center transition-colors hover:bg-white/[0.02] cursor-pointer group" style={{ borderBottom: i < upcomingEvents.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="col-span-5 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{ev.name}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: "#8a8a9a" }}>
                      <MapPin size={9} />{ev.location}
                      <span className="ml-1 px-1 py-0.5" style={{ background: "rgba(255,255,255,0.06)", borderRadius: "1px" }}>{ev.sport}</span>
                    </div>
                  </div>
                  <div className="col-span-2 hidden sm:block text-xs" style={{ color: "#8a8a9a" }}>{ev.date}</div>
                  <div className="col-span-2 hidden sm:flex items-center gap-1 text-xs" style={{ color: "#f0ede8" }}>
                    <Users size={11} style={{ color: "#8a8a9a" }} />{ev.fighters}
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 uppercase tracking-wider" style={{ background: s.bg, color: s.text, borderRadius: "2px" }}>{s.label}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight size={13} style={{ color: "#8a8a9a" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white uppercase tracking-wide text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>Recent Results</h2>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">History <ChevronRight size={11} /></button>
          </div>
          <div className="flex flex-col gap-3">
            {recentResults.map((r) => (
              <div key={r.name} className="p-3" style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-white truncate">{r.name}</span>
                  <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: "#8a8a9a" }}>{r.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={11} className="text-amber-400 flex-shrink-0" />
                  <span className="text-xs" style={{ color: "#f0ede8" }}>{r.winner}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 uppercase" style={{ background: "rgba(255,255,255,0.06)", color: "#8a8a9a", borderRadius: "1px" }}>{r.sport}</span>
                  <span className="text-[10px]" style={{ color: "#8a8a9a" }}>{r.division}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#8a8a9a" }}>Quick Actions</p>
            <div className="flex flex-col gap-2">
              {[
                { icon: Calendar, label: "Create New Event" },
                { icon: GitBranch, label: "Generate Bracket" },
                { icon: Users, label: "Add Fighter" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex items-center gap-2.5 px-3 h-9 text-xs font-medium transition-all duration-150 w-full text-left"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px", color: "#f0ede8" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <Icon size={12} style={{ color: "#06b6d4" }} />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

type SettingsTab = "profile" | "privacy" | "integrations" | "notifications" | "danger";

const settingsTabs: { id: SettingsTab; icon: React.ElementType; label: string }[] = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "privacy", icon: Shield, label: "Privacy" },
  { id: "integrations", icon: Link, label: "Integrations" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "danger", icon: AlertTriangle, label: "Danger Zone" },
];

function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white uppercase tracking-wide mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "0.05em" }}>Account Settings</h1>
        <p className="text-sm" style={{ color: "#8a8a9a" }}>Manage your profile, privacy, and integrations.</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex lg:flex-col gap-1 lg:w-48 flex-shrink-0 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {settingsTabs.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 lg:w-full text-left"
              style={{ color: activeTab === id ? "#f0ede8" : "#8a8a9a", background: activeTab === id ? "rgba(6,182,212,0.1)" : "transparent", borderLeft: activeTab === id ? "2px solid #06b6d4" : "2px solid transparent", borderRadius: "2px" }}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "privacy" && <PrivacySettings />}
          {activeTab === "integrations" && <IntegrationsSettings />}
          {activeTab === "notifications" && <NotificationsSettings />}
          {activeTab === "danger" && <DangerSettings />}
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-5" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
      <div className="mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.75rem" }}>
        <h3 className="text-white uppercase tracking-wide text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>{title}</h3>
        {description && <p className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SettingsInput({ label, placeholder, type = "text", value, helper, readOnly }: { label: string; placeholder?: string; type?: string; value?: string; helper?: string; readOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>{label}</label>
      <input type={type} defaultValue={value} placeholder={placeholder} readOnly={readOnly}
        className="h-10 px-3 text-sm outline-none transition-all duration-200 placeholder:text-white/20"
        style={{ background: readOnly ? "rgba(255,255,255,0.03)" : "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", color: readOnly ? "#8a8a9a" : "#f0ede8", borderRadius: "2px", cursor: readOnly ? "default" : "text" }}
        onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)"; }}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
      />
      {helper && <p className="text-[11px]" style={{ color: "#8a8a9a" }}>{helper}</p>}
    </div>
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
      className="flex items-center gap-2 h-9 px-5 text-xs font-semibold text-white transition-all duration-150"
      style={{ background: saved ? "#16a34a" : "#06b6d4", color: saved ? "#fff" : "#000", borderRadius: "2px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
    >
      {saved ? <><Check size={13} />Saved</> : label}
    </button>
  );
}

function Toggle({ label, description, defaultChecked }: { label: string; description?: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>{description}</div>}
      </div>
      <button onClick={() => setOn(!on)} className="relative flex-shrink-0 w-10 h-5 transition-colors duration-200" style={{ background: on ? "#06b6d4" : "#2a2a34", borderRadius: "10px" }}>
        <span className="absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200" style={{ borderRadius: "8px", transform: on ? "translateX(22px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}

function VisibilitySelect({ label, description, options, defaultValue }: { label: string; description?: string; options: string[]; defaultValue: string }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>{description}</div>}
      </div>
      <div className="relative flex-shrink-0">
        <select value={val} onChange={(e) => setVal(e.target.value)} className="appearance-none h-8 pl-3 pr-7 text-xs font-medium outline-none cursor-pointer"
          style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px" }}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8a8a9a" }} />
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <SettingsCard title="Public Identity" description="How you appear to other promoters and fighters on the platform.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <SettingsInput label="First Name" value="James" />
          <SettingsInput label="Last Name" value="Donovan" />
        </div>
        <div className="mb-4"><SettingsInput label="Display Name / Promoter Tag" value="IronFistPromos" helper="This is how your org appears in brackets and fighter rosters." /></div>
        <div className="mb-4"><SettingsInput label="Organization" value="Iron Fist Promotions LLC" /></div>
        <div className="mb-5"><SettingsInput label="Bio" placeholder="Short description of your promotion..." /></div>
        <div className="flex justify-end"><SaveButton /></div>
      </SettingsCard>
      <SettingsCard title="Avatar">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: "#06b6d4", borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>JD</div>
          <div>
            <button className="flex items-center gap-2 h-9 px-4 text-xs font-medium" style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px" }}>
              <Upload size={13} />Upload Photo
            </button>
            <p className="text-[11px] mt-1.5" style={{ color: "#8a8a9a" }}>PNG or JPG, max 2MB.</p>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Unique Fighter Bracket ID">
        <div className="flex items-center gap-3 p-3 mb-1" style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <code className="flex-1 text-sm font-mono" style={{ color: "#f0ede8" }}>FB-29471-XKQM</code>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: copied ? "#22c55e" : "#8a8a9a" }}>
            {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors" style={{ color: "#8a8a9a" }}><RefreshCw size={13} />Regenerate</button>
        </div>
      </SettingsCard>
      <SettingsCard title="Contact & Login Email">
        <div className="mb-4"><SettingsInput label="Email Address" value="james@ironfistpromos.com" type="email" /></div>
        <div className="flex justify-end"><SaveButton label="Update Email" /></div>
      </SettingsCard>
    </>
  );
}

function PrivacySettings() {
  return (
    <>
      <SettingsCard title="Profile Visibility">
        <VisibilitySelect label="Publicly Searchable Profile" options={["Public", "Unlisted", "Private"]} defaultValue="Public" />
        <VisibilitySelect label="Event History" options={["Anyone", "Registered Users", "Only Me"]} defaultValue="Anyone" />
        <VisibilitySelect label="Fighter Roster" options={["Anyone", "Registered Users", "Only Me"]} defaultValue="Registered Users" />
      </SettingsCard>
      <SettingsCard title="Start.gg Stats Sharing">
        <VisibilitySelect label="Tournament Stats" options={["Anyone", "Friends Only", "Only Me"]} defaultValue="Friends Only" />
        <VisibilitySelect label="Fighter Placement Records" options={["Anyone", "Friends Only", "Only Me"]} defaultValue="Anyone" />
      </SettingsCard>
      <SettingsCard title="Communication">
        <Toggle label="Allow contact from other promoters" defaultChecked={true} />
        <Toggle label="Show online status" />
        <Toggle label="Allow fighter self-registration requests" defaultChecked={true} />
      </SettingsCard>
    </>
  );
}

function IntegrationsSettings() {
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  return (
    <>
      <SettingsCard title="Start.gg Integration">
        <div className="flex items-center gap-3 p-3 mb-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "2px" }}>
          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
          <span className="text-xs text-green-400 font-medium">Connected — last synced Aug 3, 2026</span>
        </div>
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>API Token</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type={tokenVisible ? "text" : "password"} defaultValue="sg-token-7f3a9b2e1d4c8f05a6e7b3d2c1f9e4a8"
                  className="w-full h-10 px-3 pr-10 text-sm outline-none font-mono"
                  style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede8", borderRadius: "2px" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8a8a9a" }} onClick={() => setTokenVisible(!tokenVisible)}>
                  {tokenVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={() => { setTokenSaved(true); setTimeout(() => setTokenSaved(false), 2000); }}
                className="flex items-center gap-2 h-10 px-4 text-xs font-semibold text-white flex-shrink-0"
                style={{ background: tokenSaved ? "#16a34a" : "#06b6d4", color: tokenSaved ? "#fff" : "#000", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
              >
                {tokenSaved ? <><Check size={13} />Saved</> : "Save Token"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>Profile Slug</label>
            <div className="flex gap-2">
              <input type="text" defaultValue="ironFistPromos" className="flex-1 h-10 px-3 text-sm outline-none font-mono"
                style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede8", borderRadius: "2px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
              <button className="flex items-center gap-2 h-10 px-4 text-xs font-semibold flex-shrink-0"
                style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              >Import</button>
            </div>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Other Integrations" description="Coming soon.">
        {["Smoothcomp", "Fightmatrix", "Tapology"].map((name) => (
          <div key={name} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="text-sm text-white font-medium">{name}</div>
            <span className="text-[10px] font-medium px-2 py-1 uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.05)", color: "#8a8a9a", borderRadius: "2px" }}>Soon</span>
          </div>
        ))}
      </SettingsCard>
    </>
  );
}

function NotificationsSettings() {
  return (
    <>
      <SettingsCard title="Email Notifications">
        <Toggle label="New fighter registration" defaultChecked={true} />
        <Toggle label="Event capacity reached" defaultChecked={true} />
        <Toggle label="Bracket finalization reminders" defaultChecked={true} />
        <Toggle label="Start.gg sync updates" />
        <Toggle label="Platform announcements" defaultChecked={true} />
      </SettingsCard>
      <SettingsCard title="In-App Notifications">
        <Toggle label="Fighter check-in alerts" defaultChecked={true} />
        <Toggle label="Match result submissions" defaultChecked={true} />
        <Toggle label="Bracket disputes" defaultChecked={true} />
        <Toggle label="Profile view activity" />
      </SettingsCard>
    </>
  );
}

function DangerSettings() {
  return (
    <>
      <SettingsCard title="Change Password">
        <div className="flex flex-col gap-3 mb-4">
          <SettingsInput label="Current Password" type="password" placeholder="••••••••" />
          <SettingsInput label="New Password" type="password" placeholder="••••••••" helper="Minimum 12 characters." />
          <SettingsInput label="Confirm New Password" type="password" placeholder="••••••••" />
        </div>
        <div className="flex justify-end"><SaveButton label="Update Password" /></div>
      </SettingsCard>
      <SettingsCard title="Export Account Data">
        <button className="flex items-center gap-2 h-9 px-4 text-xs font-medium" style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px" }}>
          <Globe size={13} />Request Data Export
        </button>
      </SettingsCard>
      <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(6,182,212,0.15)", borderRadius: "2px" }}>
        <div className="mb-4" style={{ borderBottom: "1px solid rgba(6,182,212,0.1)", paddingBottom: "0.75rem" }}>
          <h3 className="uppercase tracking-wide text-sm flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", color: "#06b6d4" }}>
            <AlertTriangle size={14} />Danger Zone
          </h3>
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div className="text-sm font-medium" style={{ color: "#f0ede8" }}>Deactivate Account</div>
            <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>Temporarily disable your account.</div>
          </div>
          <button className="flex items-center gap-2 h-9 px-4 text-xs font-bold flex-shrink-0 ml-4"
            style={{ background: "transparent", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: "0.7rem" }}>
            Deactivate
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium" style={{ color: "#f0ede8" }}>Delete Account</div>
            <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>Permanently delete everything. Cannot be reversed.</div>
          </div>
          <button className="flex items-center gap-2 h-9 px-4 text-xs font-bold flex-shrink-0 ml-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: "0.7rem" }}>
            <Trash2 size={12} />Delete
          </button>
        </div>
      </div>
    </>
  );
}
