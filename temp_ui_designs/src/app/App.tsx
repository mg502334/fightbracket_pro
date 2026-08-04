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
  Key,
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
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Data ────────────────────────────────────────────────────────────────────

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
  registration: { bg: "rgba(212,24,61,0.12)", text: "#d4183d", label: "Open" },
  locked: { bg: "rgba(251,191,36,0.12)", text: "#f59e0b", label: "Locked" },
  draft: { bg: "rgba(139,139,154,0.12)", text: "#8a8a9a", label: "Draft" },
  live: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "Live" },
};

// ─── Nav ─────────────────────────────────────────────────────────────────────

type View = "dashboard" | "settings";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" as View },
  { icon: Calendar, label: "Events", view: null },
  { icon: GitBranch, label: "Brackets", view: null },
  { icon: Users, label: "Fighters", view: null },
  { icon: BarChart2, label: "Analytics", view: null },
  { icon: Settings, label: "Settings", view: "settings" as View },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#0c0c0e", fontFamily: "'Inter', sans-serif", color: "#f0ede8" }}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: "220px", background: "#0f0f12", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 bg-red-600 flex items-center justify-center flex-shrink-0">
            <Trophy size={15} className="text-white" />
          </div>
          <div>
            <div className="text-white text-base leading-none tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}>FightBracket</div>
            <div className="text-red-500 text-[10px] tracking-[0.2em] uppercase font-medium">Pro</div>
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
                  background: active ? "rgba(212,24,61,0.1)" : "transparent",
                  borderLeft: active ? "2px solid #d4183d" : "2px solid transparent",
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
            <div className="w-8 h-8 flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#d4183d", borderRadius: "2px" }}>JD</div>
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
        {/* Topbar */}
        <header
          className="flex items-center gap-4 px-6 py-4 sticky top-0 z-20"
          style={{ background: "rgba(12,12,14,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-3 h-9 text-sm" style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <Search size={13} style={{ color: "#8a8a9a" }} />
              <input placeholder="Search events, fighters..." className="bg-transparent outline-none flex-1 placeholder:text-white/20 text-sm" style={{ color: "#f0ede8" }} />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>
              <Bell size={16} style={{ color: "#8a8a9a" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button
              className="hidden sm:flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white transition-all duration-150"
              style={{ background: "#d4183d", borderRadius: "2px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b81233")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#d4183d")}
            >
              <Plus size={13} />New Event
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {view === "dashboard" ? <DashboardView /> : <SettingsView />}
        </main>
      </div>
    </div>
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
                  <stop offset="5%" stopColor="#d4183d" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#d4183d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#8a8a9a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8a8a9a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", fontSize: "12px", color: "#f0ede8" }} itemStyle={{ color: "#f0ede8" }} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
              <Area type="monotone" dataKey="registrations" stroke="#d4183d" strokeWidth={2} fill="url(#gReg)" name="Registrations" dot={false} />
              <Area type="monotone" dataKey="completions" stroke="#f59e0b" strokeWidth={2} fill="url(#gComp)" name="Completions" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: "#8a8a9a" }}><span className="w-3 h-0.5 bg-red-500 inline-block" />Registrations</div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#8a8a9a" }}><span className="w-3 h-0.5 bg-amber-400 inline-block" />Completions</div>
          </div>
        </div>

        <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white uppercase tracking-wide text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>Top Fighters</h2>
            <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">View all <ChevronRight size={11} /></button>
          </div>
          <div className="flex flex-col gap-3">
            {topFighters.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <span className="text-xs font-bold w-4 flex-shrink-0 text-center" style={{ color: i === 0 ? "#d4183d" : "#8a8a9a", fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
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
            <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">All events <ChevronRight size={11} /></button>
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
            <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">History <ChevronRight size={11} /></button>
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
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,24,61,0.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <Icon size={12} style={{ color: "#d4183d" }} />{label}
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
        <h1 className="text-white uppercase tracking-wide mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "0.05em" }}>
          Account Settings
        </h1>
        <p className="text-sm" style={{ color: "#8a8a9a" }}>Manage your profile, privacy, and integrations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings sidebar */}
        <div className="flex lg:flex-col gap-1 lg:w-48 flex-shrink-0 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {settingsTabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 lg:w-full text-left"
              style={{
                color: activeTab === id ? "#f0ede8" : "#8a8a9a",
                background: activeTab === id ? "rgba(212,24,61,0.1)" : "transparent",
                borderLeft: activeTab === id ? "2px solid #d4183d" : "2px solid transparent",
                borderRadius: "2px",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Settings panel */}
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

// ─── Settings Panels ──────────────────────────────────────────────────────────

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
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        readOnly={readOnly}
        className="h-10 px-3 text-sm outline-none transition-all duration-200 placeholder:text-white/20"
        style={{ background: readOnly ? "rgba(255,255,255,0.03)" : "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", color: readOnly ? "#8a8a9a" : "#f0ede8", borderRadius: "2px", cursor: readOnly ? "default" : "text" }}
        onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "rgba(212,24,61,0.5)"; }}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
      />
      {helper && <p className="text-[11px]" style={{ color: "#8a8a9a" }}>{helper}</p>}
    </div>
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  const handle = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-2 h-9 px-5 text-xs font-semibold text-white transition-all duration-150"
      style={{ background: saved ? "#16a34a" : "#d4183d", borderRadius: "2px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
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
      <button
        onClick={() => setOn(!on)}
        className="relative flex-shrink-0 w-10 h-5 transition-colors duration-200"
        style={{ background: on ? "#d4183d" : "#2a2a34", borderRadius: "10px" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200"
          style={{ borderRadius: "8px", transform: on ? "translateX(22px)" : "translateX(2px)" }}
        />
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
        <select
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="appearance-none h-8 pl-3 pr-7 text-xs font-medium outline-none cursor-pointer"
          style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px" }}
        >
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8a8a9a" }} />
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [fbId] = useState("FB-29471-XKQM");
  const [copied, setCopied] = useState(false);
  const copyId = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      <SettingsCard title="Public Identity" description="How you appear to other promoters and fighters on the platform.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <SettingsInput label="First Name" value="James" />
          <SettingsInput label="Last Name" value="Donovan" />
        </div>
        <div className="mb-4">
          <SettingsInput label="Display Name / Promoter Tag" value="IronFistPromos" helper="This is how your org appears in brackets and fighter rosters." />
        </div>
        <div className="mb-4">
          <SettingsInput label="Organization" value="Iron Fist Promotions LLC" />
        </div>
        <div className="mb-5">
          <SettingsInput label="Bio" placeholder="Short description of your promotion..." />
        </div>
        <div className="flex justify-end"><SaveButton /></div>
      </SettingsCard>

      <SettingsCard title="Avatar" description="Used in event headers and your public profile.">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: "#d4183d", borderRadius: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>JD</div>
          <div>
            <button className="flex items-center gap-2 h-9 px-4 text-xs font-medium transition-colors" style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px" }}>
              <Upload size={13} />Upload Photo
            </button>
            <p className="text-[11px] mt-1.5" style={{ color: "#8a8a9a" }}>PNG or JPG, max 2MB. Square images work best.</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Unique Fighter Bracket ID" description="Your permanent platform identifier. Share this with fighters so they can link their profiles to your events.">
        <div className="flex items-center gap-3 p-3 mb-1" style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          <code className="flex-1 text-sm font-mono" style={{ color: "#f0ede8" }}>{fbId}</code>
          <button onClick={copyId} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: copied ? "#22c55e" : "#8a8a9a" }}>
            {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
          </button>
          <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: "#8a8a9a" }}>
            <RefreshCw size={13} />Regenerate
          </button>
        </div>
        <p className="text-[11px]" style={{ color: "#8a8a9a" }}>Regenerating will break existing links. Use with caution.</p>
      </SettingsCard>

      <SettingsCard title="Contact & Login Email" description="Your account email. Used for login and notifications.">
        <div className="mb-4">
          <SettingsInput label="Email Address" value="james@ironfistpromos.com" type="email" />
        </div>
        <div className="flex justify-end"><SaveButton label="Update Email" /></div>
      </SettingsCard>
    </>
  );
}

function PrivacySettings() {
  return (
    <>
      <SettingsCard title="Profile Visibility" description="Control who can find and view your promoter profile.">
        <VisibilitySelect label="Publicly Searchable Profile" description="Allow other users to find you by name or tag." options={["Public", "Unlisted", "Private"]} defaultValue="Public" />
        <VisibilitySelect label="Event History" description="Who can see your past events and results." options={["Anyone", "Registered Users", "Only Me"]} defaultValue="Anyone" />
        <VisibilitySelect label="Fighter Roster" description="Who can browse fighters linked to your org." options={["Anyone", "Registered Users", "Only Me"]} defaultValue="Registered Users" />
      </SettingsCard>

      <SettingsCard title="Start.gg Stats Sharing" description="Controls synced from your Start.gg integration.">
        <VisibilitySelect label="Start.gg Tournament Stats" description="Bracket results pulled from Start.gg." options={["Anyone", "Friends Only", "Only Me"]} defaultValue="Friends Only" />
        <VisibilitySelect label="Fighter Placement Records" description="Placement data shown on fighter profiles." options={["Anyone", "Friends Only", "Only Me"]} defaultValue="Anyone" />
      </SettingsCard>

      <SettingsCard title="Communication">
        <Toggle label="Allow contact from other promoters" description="Other users can send you collaboration requests." defaultChecked={true} />
        <Toggle label="Show online status" description="Display when you were last active." />
        <Toggle label="Allow fighter self-registration requests" description="Fighters can request to be added to your roster." defaultChecked={true} />
      </SettingsCard>
    </>
  );
}

function IntegrationsSettings() {
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  return (
    <>
      <SettingsCard title="Start.gg Integration" description="Connect your Start.gg account to import brackets, fighter profiles, and tournament history.">
        <div className="flex items-center gap-3 p-3 mb-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "2px" }}>
          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
          <span className="text-xs text-green-400 font-medium">Connected — last synced Aug 3, 2026 at 4:12 AM</span>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>API Token</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={tokenVisible ? "text" : "password"}
                  defaultValue="sg-token-7f3a9b2e1d4c8f05a6e7b3d2c1f9e4a8"
                  className="w-full h-10 px-3 pr-10 text-sm outline-none font-mono"
                  style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede8", borderRadius: "2px" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,24,61,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8a8a9a" }} onClick={() => setTokenVisible(!tokenVisible)}>
                  {tokenVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={() => { setTokenSaved(true); setTimeout(() => setTokenSaved(false), 2000); }}
                className="flex items-center gap-2 h-10 px-4 text-xs font-semibold text-white transition-all duration-150 flex-shrink-0"
                style={{ background: tokenSaved ? "#16a34a" : "#d4183d", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
              >
                {tokenSaved ? <><Check size={13} />Saved</> : "Save Token"}
              </button>
            </div>
            <p className="text-[11px]" style={{ color: "#8a8a9a" }}>Generate tokens at <span className="text-red-400">start.gg/admin/profile/developer</span></p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>Profile Slug</label>
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue="ironFistPromos"
                placeholder="e.g. mang0"
                className="flex-1 h-10 px-3 text-sm outline-none font-mono"
                style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede8", borderRadius: "2px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,24,61,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <button className="flex items-center gap-2 h-10 px-4 text-xs font-semibold transition-colors flex-shrink-0"
                style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,24,61,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              >
                Import
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 mb-1" style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px" }}>
          <p className="text-xs font-medium uppercase mb-2" style={{ color: "#8a8a9a", letterSpacing: "0.08em" }}>What gets synced</p>
          <div className="grid grid-cols-2 gap-1.5">
            {["Tournament brackets", "Fighter profiles", "Placement records", "Event metadata"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs" style={{ color: "#f0ede8" }}>
                <Check size={11} className="text-green-400 flex-shrink-0" />{item}
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Other Integrations" description="Coming soon — additional platform connections.">
        {[
          { name: "Smoothcomp", status: "coming_soon", desc: "Grappling & BJJ tournament management" },
          { name: "Fightmatrix", status: "coming_soon", desc: "MMA rankings and fighter records" },
          { name: "Tapology", status: "coming_soon", desc: "Event promotion and fighter profiles" },
        ].map(({ name, desc }) => (
          <div key={name} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div>
              <div className="text-sm text-white font-medium">{name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>{desc}</div>
            </div>
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
        <Toggle label="New fighter registration" description="When a fighter registers for one of your events." defaultChecked={true} />
        <Toggle label="Event capacity reached" description="When an event hits its fighter cap." defaultChecked={true} />
        <Toggle label="Bracket finalization reminders" description="3 days before an event, if bracket is not locked." defaultChecked={true} />
        <Toggle label="Start.gg sync updates" description="Summary emails after a sync completes." />
        <Toggle label="Platform announcements" description="New features and platform updates." defaultChecked={true} />
      </SettingsCard>

      <SettingsCard title="In-App Notifications">
        <Toggle label="Fighter check-in alerts" description="Notify when fighters check in on event day." defaultChecked={true} />
        <Toggle label="Match result submissions" description="Notify when scores or results are submitted." defaultChecked={true} />
        <Toggle label="Bracket disputes" description="Notify when a result is flagged for review." defaultChecked={true} />
        <Toggle label="Profile view activity" description="When other promoters view your profile." />
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

      <SettingsCard title="Export Account Data" description="Download a full copy of your account data including events, brackets, and fighter records.">
        <button className="flex items-center gap-2 h-9 px-4 text-xs font-medium transition-colors"
          style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8", borderRadius: "2px" }}>
          <Globe size={13} />Request Data Export
        </button>
        <p className="text-[11px] mt-2" style={{ color: "#8a8a9a" }}>You will receive a download link via email within 24 hours.</p>
      </SettingsCard>

      <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(212,24,61,0.25)", borderRadius: "2px" }}>
        <div className="mb-4" style={{ borderBottom: "1px solid rgba(212,24,61,0.15)", paddingBottom: "0.75rem" }}>
          <h3 className="uppercase tracking-wide text-sm flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", color: "#d4183d" }}>
            <AlertTriangle size={14} />Danger Zone
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>These actions are permanent and cannot be undone.</p>
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div className="text-sm font-medium" style={{ color: "#f0ede8" }}>Deactivate Account</div>
            <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>Temporarily disable your account. Events will be hidden but data is preserved.</div>
          </div>
          <button className="flex items-center gap-2 h-9 px-4 text-xs font-medium flex-shrink-0 ml-4"
            style={{ background: "transparent", border: "1px solid rgba(212,24,61,0.4)", color: "#d4183d", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.7rem" }}>
            Deactivate
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium" style={{ color: "#f0ede8" }}>Delete Account</div>
            <div className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>Permanently delete your account and all associated data. This cannot be reversed.</div>
          </div>
          <button className="flex items-center gap-2 h-9 px-4 text-xs font-medium flex-shrink-0 ml-4"
            style={{ background: "rgba(212,24,61,0.15)", border: "1px solid rgba(212,24,61,0.4)", color: "#d4183d", borderRadius: "2px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.7rem" }}>
            <Trash2 size={12} />Delete
          </button>
        </div>
      </div>
    </>
  );
}
