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
  Sword,
  Shield,
  Clock,
  CheckCircle2,
  Circle,
  Menu,
  X,
  Star,
  MapPin,
  LogOut,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  {
    id: 1,
    name: "Southeast Regional Open",
    date: "Aug 17, 2026",
    location: "Atlanta, GA",
    fighters: 48,
    status: "registration",
    sport: "BJJ",
  },
  {
    id: 2,
    name: "Iron Fist Championships",
    date: "Aug 29, 2026",
    location: "Miami, FL",
    fighters: 32,
    status: "locked",
    sport: "Kickboxing",
  },
  {
    id: 3,
    name: "Combat Classic Vol. 8",
    date: "Sep 6, 2026",
    location: "Houston, TX",
    fighters: 64,
    status: "registration",
    sport: "MMA",
  },
  {
    id: 4,
    name: "Warrior Cup 2026",
    date: "Sep 20, 2026",
    location: "Las Vegas, NV",
    fighters: 16,
    status: "draft",
    sport: "Boxing",
  },
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

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Calendar, label: "Events", active: false },
  { icon: GitBranch, label: "Brackets", active: false },
  { icon: Users, label: "Fighters", active: false },
  { icon: BarChart2, label: "Analytics", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  registration: { bg: "rgba(212,24,61,0.12)", text: "#d4183d", label: "Open" },
  locked: { bg: "rgba(251,191,36,0.12)", text: "#f59e0b", label: "Locked" },
  draft: { bg: "rgba(139,139,154,0.12)", text: "#8a8a9a", label: "Draft" },
  live: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "Live" },
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "#0c0c0e",
        fontFamily: "'Inter', sans-serif",
        color: "#f0ede8",
      }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "220px",
          background: "#0f0f12",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-8 h-8 bg-red-600 flex items-center justify-center flex-shrink-0">
            <Trophy size={15} className="text-white" />
          </div>
          <div>
            <div
              className="text-white text-base leading-none tracking-widest uppercase"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}
            >
              FightBracket
            </div>
            <div className="text-red-500 text-[10px] tracking-[0.2em] uppercase font-medium">
              Pro
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-white/40 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
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
          ))}
        </nav>

        {/* User */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "#d4183d", borderRadius: "2px" }}
            >
              JD
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">James Donovan</div>
              <div className="text-[10px]" style={{ color: "#8a8a9a" }}>
                Pro Promoter
              </div>
            </div>
            <button className="ml-auto text-white/30 hover:text-white/70 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center gap-4 px-6 py-4 sticky top-0 z-20"
          style={{
            background: "rgba(12,12,14,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div
              className="flex items-center gap-2 flex-1 px-3 h-9 text-sm"
              style={{
                background: "#1e1e24",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <Search size={13} style={{ color: "#8a8a9a" }} />
              <input
                placeholder="Search events, fighters..."
                className="bg-transparent outline-none flex-1 placeholder:text-white/20 text-sm"
                style={{ color: "#f0ede8" }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>
              <Bell size={16} style={{ color: "#8a8a9a" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* New Event CTA */}
            <button
              className="hidden sm:flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white transition-all duration-150"
              style={{
                background: "#d4183d",
                borderRadius: "2px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b81233")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#d4183d")}
            >
              <Plus size={13} />
              New Event
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Page heading */}
          <div className="mb-6">
            <h1
              className="text-white uppercase tracking-wide mb-0.5"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "1.5rem",
                letterSpacing: "0.05em",
              }}
            >
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: "#8a8a9a" }}>
              Sunday, August 3, 2026 — Welcome back, James.
            </p>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Active Events", value: "7", delta: "+2", up: true, icon: Calendar },
              { label: "Registered Fighters", value: "312", delta: "+38", up: true, icon: Users },
              { label: "Brackets Completed", value: "43", delta: "+6", up: true, icon: GitBranch },
              { label: "Avg. Event Fill", value: "81%", delta: "-3%", up: false, icon: BarChart2 },
            ].map(({ label, value, delta, up, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col gap-3 p-4"
                style={{
                  background: "#141418",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "2px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#8a8a9a", letterSpacing: "0.1em" }}>
                    {label}
                  </span>
                  <Icon size={13} style={{ color: "#8a8a9a" }} />
                </div>
                <div className="flex items-end justify-between">
                  <span
                    className="text-white leading-none"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "2rem" }}
                  >
                    {value}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs font-medium mb-0.5"
                    style={{ color: up ? "#22c55e" : "#ef4444" }}
                  >
                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Middle row — chart + top fighters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Activity chart */}
            <div
              className="lg:col-span-2 p-5"
              style={{
                background: "#141418",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2
                    className="text-white uppercase tracking-wide text-sm"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
                  >
                    Registration Activity
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "#8a8a9a" }}>
                    Fighter registrations vs. completions — last 7 months
                  </p>
                </div>
                <button className="text-white/30 hover:text-white/60 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
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
                  <Tooltip
                    contentStyle={{
                      background: "#1e1e24",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "2px",
                      fontSize: "12px",
                      color: "#f0ede8",
                    }}
                    itemStyle={{ color: "#f0ede8" }}
                    cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <Area type="monotone" dataKey="registrations" stroke="#d4183d" strokeWidth={2} fill="url(#gReg)" name="Registrations" dot={false} />
                  <Area type="monotone" dataKey="completions" stroke="#f59e0b" strokeWidth={2} fill="url(#gComp)" name="Completions" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-2 text-xs" style={{ color: "#8a8a9a" }}>
                  <span className="w-3 h-0.5 bg-red-500 inline-block" />
                  Registrations
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#8a8a9a" }}>
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                  Completions
                </div>
              </div>
            </div>

            {/* Top fighters */}
            <div
              className="p-5"
              style={{
                background: "#141418",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-white uppercase tracking-wide text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
                >
                  Top Fighters
                </h2>
                <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                  View all <ChevronRight size={11} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {topFighters.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold w-4 flex-shrink-0 text-center"
                      style={{ color: i === 0 ? "#d4183d" : "#8a8a9a", fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {i + 1}
                    </span>
                    <div
                      className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: "#1e1e24", borderRadius: "2px" }}
                    >
                      {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{f.name}</div>
                      <div className="text-[10px]" style={{ color: "#8a8a9a" }}>
                        {f.sport} · {f.weight} · {f.record}
                      </div>
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

          {/* Bottom row — upcoming events + recent results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Upcoming events */}
            <div
              className="lg:col-span-2 p-5"
              style={{
                background: "#141418",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-white uppercase tracking-wide text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
                >
                  Upcoming Events
                </h2>
                <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                  All events <ChevronRight size={11} />
                </button>
              </div>

              {/* Table header */}
              <div
                className="grid grid-cols-12 gap-2 pb-2 mb-1 text-[10px] font-medium uppercase tracking-widest"
                style={{ color: "#8a8a9a", borderBottom: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.1em" }}
              >
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
                    <div
                      key={ev.id}
                      className="grid grid-cols-12 gap-2 py-3 items-center transition-colors hover:bg-white/[0.02] cursor-pointer group"
                      style={{
                        borderBottom: i < upcomingEvents.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <div className="col-span-5 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{ev.name}</div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: "#8a8a9a" }}>
                          <MapPin size={9} />
                          {ev.location}
                          <span className="ml-1 px-1 py-0.5" style={{ background: "rgba(255,255,255,0.06)", borderRadius: "1px" }}>
                            {ev.sport}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 hidden sm:block text-xs" style={{ color: "#8a8a9a" }}>
                        {ev.date}
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center gap-1 text-xs" style={{ color: "#f0ede8" }}>
                        <Users size={11} style={{ color: "#8a8a9a" }} />
                        {ev.fighters}
                      </div>
                      <div className="col-span-2">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 uppercase tracking-wider"
                          style={{ background: s.bg, color: s.text, borderRadius: "2px" }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <ChevronRight size={13} style={{ color: "#8a8a9a" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent results */}
            <div
              className="p-5"
              style={{
                background: "#141418",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-white uppercase tracking-wide text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
                >
                  Recent Results
                </h2>
                <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                  History <ChevronRight size={11} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {recentResults.map((r) => (
                  <div
                    key={r.name}
                    className="p-3"
                    style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px" }}
                  >
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
                      <span
                        className="text-[10px] px-1.5 py-0.5 uppercase"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#8a8a9a", borderRadius: "1px" }}
                      >
                        {r.sport}
                      </span>
                      <span className="text-[10px]" style={{ color: "#8a8a9a" }}>{r.division}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#8a8a9a" }}>
                  Quick Actions
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { icon: Calendar, label: "Create New Event" },
                    { icon: GitBranch, label: "Generate Bracket" },
                    { icon: Users, label: "Add Fighter" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex items-center gap-2.5 px-3 h-9 text-xs font-medium transition-all duration-150 w-full text-left"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "2px",
                        color: "#f0ede8",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,24,61,0.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                    >
                      <Icon size={12} style={{ color: "#d4183d" }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
