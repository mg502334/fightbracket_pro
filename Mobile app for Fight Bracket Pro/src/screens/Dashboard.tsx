import { useState } from "react";

const tournaments = [
  {
    id: 1,
    name: "Iron Fist Open",
    sport: "MMA",
    date: "Sep 14, 2026",
    location: "Las Vegas, NV",
    fighters: 32,
    status: "live",
    round: "Quarterfinals",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=300&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Gold Belt Classic",
    sport: "Boxing",
    date: "Sep 20, 2026",
    location: "Houston, TX",
    fighters: 16,
    status: "upcoming",
    round: "Registration",
    image: "https://images.unsplash.com/photo-1516218195845-68fdb33a7a03?w=600&h=300&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Steel Cage Championship",
    sport: "Wrestling",
    date: "Oct 5, 2026",
    location: "Chicago, IL",
    fighters: 64,
    status: "upcoming",
    round: "Registration",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=300&fit=crop&auto=format",
  },
];

const liveMatch = {
  fighter1: { name: "Marcus Vega", record: "18-2", country: "🇺🇸" },
  fighter2: { name: "Jin Hyuk Park", record: "21-1", country: "🇰🇷" },
  round: "R3",
  time: "2:47",
  event: "Iron Fist Open — QF",
};

const stats = [
  { label: "Active Tournaments", value: "3" },
  { label: "Total Fighters", value: "112" },
  { label: "Matches Today", value: "8" },
];

export default function Dashboard() {
  const [notif, setNotif] = useState(true);

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <div>
          <p style={{ fontFamily: "Inter", fontSize: 12, color: "var(--muted-foreground)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500 }}>
            Welcome back
          </p>
          <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: 26, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.1, marginTop: 2 }}>
            FIGHT BRACKET PRO
          </h1>
        </div>
        <button
          onClick={() => setNotif(!notif)}
          style={{
            width: 40, height: 40, borderRadius: 20,
            background: "var(--secondary)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5C6.5 1.5 4.5 3.5 4.5 6V10.5L3 12H15L13.5 10.5V6C13.5 3.5 11.5 1.5 9 1.5Z"
              stroke="#c8c8cc" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M7.5 12V12.5C7.5 13.3 8.2 14 9 14C9.8 14 10.5 13.3 10.5 12.5V12"
              stroke="#c8c8cc" strokeWidth="1.3" />
          </svg>
          {notif && (
            <span style={{
              position: "absolute", top: 8, right: 8,
              width: 8, height: 8, borderRadius: 4,
              background: "var(--primary)", border: "1.5px solid var(--background)",
            }} />
          )}
        </button>
      </div>

      {/* Live match card */}
      <div className="px-5 mb-5">
        <div
          style={{
            background: "linear-gradient(135deg, #1a0008 0%, #200010 50%, #0e000a 100%)",
            border: "1px solid rgba(232,0,58,0.3)",
            borderRadius: 16,
            padding: "16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Live pulse */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5">
            <span style={{
              display: "inline-block", width: 7, height: 7, borderRadius: 4,
              background: "var(--primary)", animation: "pulse 1.5s infinite",
            }} />
            <span style={{ fontFamily: "Oswald", fontSize: 11, fontWeight: 600, color: "var(--primary)", letterSpacing: "0.1em" }}>LIVE</span>
          </div>

          <p style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(232,0,58,0.7)", fontWeight: 500, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {liveMatch.event}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div style={{ fontFamily: "Oswald", fontSize: 18, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.1 }}>
                {liveMatch.fighter1.country} {liveMatch.fighter1.name}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                {liveMatch.fighter1.record}
              </div>
            </div>

            <div className="flex flex-col items-center px-4">
              <div style={{
                background: "rgba(232,0,58,0.15)", border: "1px solid rgba(232,0,58,0.3)",
                borderRadius: 8, padding: "6px 12px", marginBottom: 4,
              }}>
                <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, color: "var(--primary)", textAlign: "center" }}>
                  VS
                </div>
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)" }}>
                {liveMatch.round} · {liveMatch.time}
              </div>
            </div>

            <div className="flex-1 text-right">
              <div style={{ fontFamily: "Oswald", fontSize: 18, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.1 }}>
                {liveMatch.fighter2.name} {liveMatch.fighter2.country}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                {liveMatch.fighter2.record}
              </div>
            </div>
          </div>

          <button
            style={{
              width: "100%", marginTop: 14, padding: "9px",
              background: "var(--primary)", borderRadius: 8, border: "none",
              fontFamily: "Oswald", fontSize: 13, fontWeight: 600,
              letterSpacing: "0.08em", color: "white", cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            View Bracket →
          </button>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
      </div>

      {/* Stats row */}
      <div className="grid px-5 mb-5" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "12px 10px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, color: "#f0f0f0", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)", marginTop: 4, lineHeight: 1.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tournaments */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: "Oswald", fontSize: 16, fontWeight: 600, color: "#f0f0f0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            My Tournaments
          </h2>
          <button style={{ fontFamily: "Inter", fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>
            See all
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 14, overflow: "hidden",
                cursor: "pointer", transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(232,0,58,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ height: 80, background: "#1a1a1e", overflow: "hidden", position: "relative" }}>
                <img src={t.image} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 100%)",
                }} />
                <div style={{ position: "absolute", top: 8, left: 10 }}>
                  <span style={{
                    fontFamily: "Oswald", fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "white", background: "rgba(0,0,0,0.5)",
                    padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)",
                  }}>
                    {t.sport}
                  </span>
                </div>
                <div style={{ position: "absolute", top: 8, right: 10 }}>
                  <span style={{
                    fontFamily: "Oswald", fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    padding: "2px 8px", borderRadius: 4,
                    background: t.status === "live" ? "var(--primary)" : "rgba(255,255,255,0.1)",
                    color: "white",
                  }}>
                    {t.status === "live" ? "● LIVE" : "Upcoming"}
                  </span>
                </div>
              </div>

              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: "Oswald", fontSize: 16, fontWeight: 600, color: "#f0f0f0", lineHeight: 1.1 }}>
                  {t.name}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)" }}>
                    {t.date} · {t.location}
                  </div>
                  <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)" }}>
                    {t.fighters} fighters
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 mt-2"
                  style={{
                    fontFamily: "Oswald", fontSize: 11, fontWeight: 500,
                    color: t.status === "live" ? "var(--primary)" : "var(--muted-foreground)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}
                >
                  <span>{t.round}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
