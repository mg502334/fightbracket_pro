import { useState } from "react";

const fighters = [
  {
    id: 1, name: "Marcus Vega", nickname: "The Predator",
    record: "18-2-0", weight: "Lightweight", country: "🇺🇸", age: 28,
    gym: "Apex MMA", status: "active", seed: 1,
    stats: { wins: 18, losses: 2, ko: 12, sub: 4, dec: 2 },
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 2, name: "Jin Hyuk Park", nickname: "Iron Fist",
    record: "21-1-0", weight: "Lightweight", country: "🇰🇷", age: 31,
    gym: "Seoul Combat", status: "active", seed: 4,
    stats: { wins: 21, losses: 1, ko: 8, sub: 9, dec: 4 },
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 3, name: "Aleksei Volkov", nickname: "The Bear",
    record: "20-2-0", weight: "Welterweight", country: "🇷🇺", age: 34,
    gym: "Dynamo FC", status: "active", seed: 3,
    stats: { wins: 20, losses: 2, ko: 14, sub: 3, dec: 3 },
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 4, name: "Kevin Okafor", nickname: "K-Force",
    record: "17-1-0", weight: "Lightweight", country: "🇳🇬", age: 26,
    gym: "Lagos Warriors", status: "active", seed: 2,
    stats: { wins: 17, losses: 1, ko: 10, sub: 5, dec: 2 },
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 5, name: "Paulo Mendez", nickname: "El Toro",
    record: "16-5-0", weight: "Welterweight", country: "🇧🇷", age: 29,
    gym: "Nova União", status: "eliminated", seed: 6,
    stats: { wins: 16, losses: 5, ko: 6, sub: 8, dec: 2 },
    img: "https://images.unsplash.com/photo-1542178243-bc20204b769f?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 6, name: "Darius Cole", nickname: "Southside",
    record: "15-3-0", weight: "Lightweight", country: "🇺🇸", age: 27,
    gym: "Chicago Boxing Club", status: "eliminated", seed: 5,
    stats: { wins: 15, losses: 3, ko: 7, sub: 2, dec: 6 },
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&auto=format",
  },
];

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontFamily: "Oswald", fontSize: 11, fontWeight: 600, color: "#f0f0f0" }}>{value}</span>
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, var(--primary) 0%, #ff6080 100%)",
          width: `${(value / max) * 100}%`, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

export default function Fighters() {
  const [selected, setSelected] = useState<typeof fighters[0] | null>(null);
  const [filter, setFilter] = useState<"All" | "Active" | "Eliminated">("All");
  const [search, setSearch] = useState("");

  const filtered = fighters.filter((f) => {
    const matchFilter = filter === "All" || f.status === filter.toLowerCase();
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.nickname.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (selected) {
    return (
      <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Back + hero */}
        <div style={{ position: "relative", height: 180, background: "#1a1a1e" }}>
          <img src={selected.img} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, var(--background) 100%)" }} />
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute", top: 12, left: 16,
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20, padding: "6px 14px",
              fontFamily: "Inter", fontSize: 12, color: "white", cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>

        <div className="px-5" style={{ marginTop: -24 }}>
          <div className="flex items-end gap-3 mb-4">
            <div style={{
              width: 72, height: 72, borderRadius: 36,
              border: "3px solid var(--primary)",
              overflow: "hidden", background: "#1a1a1e", flexShrink: 0,
            }}>
              <img src={selected.img} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 22, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.1, textTransform: "uppercase" }}>
                {selected.name}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--primary)", fontStyle: "italic", marginTop: 1 }}>
                "{selected.nickname}"
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="grid mb-4" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Record", value: selected.record },
              { label: "Weight", value: selected.weight.split(" ")[0] },
              { label: "Seed", value: `#${selected.seed}` },
            ].map((item) => (
              <div key={item.label} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "10px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "Oswald", fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>{item.value}</div>
                <div style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "14px", marginBottom: 16,
          }}>
            <div className="flex justify-between text-sm mb-3">
              <span style={{ fontFamily: "Inter", fontSize: 12, color: "var(--muted-foreground)" }}>
                {selected.country} {selected.gym}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: 12, color: "var(--muted-foreground)" }}>
                Age {selected.age}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <StatBar label="KO / TKO" value={selected.stats.ko} max={21} />
              <StatBar label="Submissions" value={selected.stats.sub} max={21} />
              <StatBar label="Decisions" value={selected.stats.dec} max={21} />
            </div>
          </div>

          {/* Status */}
          <div style={{
            background: selected.status === "active" ? "rgba(232,0,58,0.1)" : "var(--secondary)",
            border: `1px solid ${selected.status === "active" ? "rgba(232,0,58,0.3)" : "var(--border)"}`,
            borderRadius: 10, padding: "10px 14px",
            fontFamily: "Oswald", fontSize: 13, fontWeight: 600,
            color: selected.status === "active" ? "var(--primary)" : "var(--muted-foreground)",
            textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center",
            marginBottom: 24,
          }}>
            {selected.status === "active" ? "● Still Competing" : "Eliminated"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="px-5 pt-2 pb-4">
        <h1 style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, color: "#f0f0f0", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Fighters
        </h1>

        {/* Search */}
        <div style={{
          background: "var(--secondary)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginTop: 12,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#7a7a84" strokeWidth="1.3" />
            <path d="M9.5 9.5L12.5 12.5" stroke="#7a7a84" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fighters..."
            style={{
              background: "none", border: "none", outline: "none",
              fontFamily: "Inter", fontSize: 13, color: "#f0f0f0",
              flex: 1,
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {(["All", "Active", "Eliminated"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontFamily: "Oswald", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "5px 12px", borderRadius: 20,
                background: filter === f ? "var(--primary)" : "var(--secondary)",
                color: filter === f ? "white" : "var(--muted-foreground)",
                border: "1px solid", borderColor: filter === f ? "var(--primary)" : "var(--border)",
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-6">
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f)}
            style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "12px",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", textAlign: "left", transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(232,0,58,0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 26,
              border: `2px solid ${f.status === "active" ? "var(--primary)" : "var(--border)"}`,
              overflow: "hidden", background: "#1a1a1e", flexShrink: 0,
            }}>
              <img src={f.img} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: f.status === "eliminated" ? 0.4 : 1 }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "Oswald", fontSize: 15, fontWeight: 700, color: f.status === "eliminated" ? "var(--muted-foreground)" : "#f0f0f0", textTransform: "uppercase" }}>
                  {f.name}
                </span>
                <span style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)" }}>{f.country}</span>
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>
                {f.weight} · {f.record}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span style={{
                fontFamily: "Oswald", fontSize: 11, fontWeight: 600,
                color: "var(--muted-foreground)",
              }}>
                #{f.seed}
              </span>
              <span style={{
                fontFamily: "Oswald", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                padding: "2px 7px", borderRadius: 4,
                background: f.status === "active" ? "rgba(232,0,58,0.15)" : "var(--secondary)",
                color: f.status === "active" ? "var(--primary)" : "var(--muted-foreground)",
              }}>
                {f.status === "active" ? "Active" : "OUT"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
