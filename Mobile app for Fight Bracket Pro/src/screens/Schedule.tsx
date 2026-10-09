import { useState } from "react";

type Match = {
  id: number;
  time: string;
  fighter1: string;
  fighter2: string;
  f1Record: string;
  f2Record: string;
  weight: string;
  bout: string;
  status: "live" | "upcoming" | "completed";
  result?: string;
  card: "main" | "prelim";
};

const matches: Match[] = [
  {
    id: 1, time: "9:00 PM", card: "main",
    fighter1: "Marcus Vega", fighter2: "Jin Hyuk Park",
    f1Record: "18-2", f2Record: "21-1",
    weight: "Lightweight", bout: "Quarterfinal",
    status: "live",
  },
  {
    id: 2, time: "8:15 PM", card: "main",
    fighter1: "Aleksei Volkov", fighter2: "Kevin Okafor",
    f1Record: "20-2", f2Record: "17-1",
    weight: "Welterweight", bout: "Quarterfinal",
    status: "upcoming",
  },
  {
    id: 3, time: "7:30 PM", card: "prelim",
    fighter1: "Tommy Rios", fighter2: "Darius Cole",
    f1Record: "12-4", f2Record: "15-3",
    weight: "Lightweight", bout: "Round of 16",
    status: "completed",
    result: "Rios by KO R2",
  },
  {
    id: 4, time: "6:45 PM", card: "prelim",
    fighter1: "Paulo Mendez", fighter2: "Yusuf Hassan",
    f1Record: "16-5", f2Record: "14-3",
    weight: "Welterweight", bout: "Round of 16",
    status: "completed",
    result: "Mendez by SUB R3",
  },
  {
    id: 5, time: "6:00 PM", card: "prelim",
    fighter1: "Ray Tanaka", fighter2: "Carlos Diaz",
    f1Record: "9-2", f2Record: "11-3",
    weight: "Featherweight", bout: "Round of 16",
    status: "completed",
    result: "Tanaka by DEC",
  },
];

const days = ["Sep 14", "Sep 15", "Sep 20"];

function statusColor(s: Match["status"]) {
  if (s === "live") return "var(--primary)";
  if (s === "upcoming") return "#60a0ff";
  return "var(--muted-foreground)";
}

function statusLabel(s: Match["status"]) {
  if (s === "live") return "● LIVE";
  if (s === "upcoming") return "Upcoming";
  return "Final";
}

export default function Schedule() {
  const [day, setDay] = useState("Sep 14");
  const [card, setCard] = useState<"all" | "main" | "prelim">("all");

  const visible = matches.filter((m) => card === "all" || m.card === card);

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="px-5 pt-2 pb-3">
        <h1 style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, color: "#f0f0f0", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Schedule
        </h1>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 px-5 mb-4" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            style={{
              fontFamily: "Oswald", fontSize: 12, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap",
              background: day === d ? "var(--primary)" : "var(--secondary)",
              color: day === d ? "white" : "var(--muted-foreground)",
              border: "1px solid", borderColor: day === d ? "var(--primary)" : "var(--border)",
              cursor: "pointer",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Card filter */}
      <div className="flex gap-2 px-5 mb-5">
        {(["all", "main", "prelim"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCard(c)}
            style={{
              fontFamily: "Oswald", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "4px 12px", borderRadius: 6,
              background: card === c ? "rgba(232,0,58,0.15)" : "transparent",
              color: card === c ? "var(--primary)" : "var(--muted-foreground)",
              border: `1px solid ${card === c ? "rgba(232,0,58,0.3)" : "transparent"}`,
              cursor: "pointer",
            }}
          >
            {c === "all" ? "All" : c === "main" ? "Main Card" : "Prelims"}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="px-5 pb-6 flex flex-col gap-3">
        {visible.map((m) => (
          <div
            key={m.id}
            style={{
              background: "var(--card)", border: "1px solid",
              borderColor: m.status === "live" ? "rgba(232,0,58,0.35)" : "var(--border)",
              borderRadius: 14, overflow: "hidden",
              background: m.status === "live" ? "linear-gradient(135deg, #120006 0%, #0e000a 100%)" : "var(--card)",
            } as React.CSSProperties}
          >
            {/* Top row */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "Oswald", fontSize: 11, color: statusColor(m.status), fontWeight: 600, letterSpacing: "0.08em" }}>
                  {statusLabel(m.status)}
                </span>
                <span style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)" }}>·</span>
                <span style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)" }}>{m.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: "Oswald", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                  textTransform: "uppercase", color: "var(--muted-foreground)",
                  background: "var(--muted)", padding: "2px 6px", borderRadius: 4,
                }}>
                  {m.weight}
                </span>
                <span style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)" }}>
                  {m.bout}
                </span>
              </div>
            </div>

            {/* Fight */}
            <div className="flex items-center px-4 py-3">
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Oswald", fontSize: 16, fontWeight: 700, color: "#f0f0f0", textTransform: "uppercase" }}>
                  {m.fighter1}
                </div>
                <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>
                  {m.f1Record}
                </div>
              </div>

              <div style={{
                padding: "6px 12px",
                background: m.status === "live" ? "rgba(232,0,58,0.15)" : "var(--secondary)",
                border: `1px solid ${m.status === "live" ? "rgba(232,0,58,0.3)" : "var(--border)"}`,
                borderRadius: 8, textAlign: "center", flexShrink: 0,
              }}>
                <div style={{ fontFamily: "Oswald", fontSize: 14, fontWeight: 700, color: m.status === "live" ? "var(--primary)" : "var(--muted-foreground)" }}>
                  VS
                </div>
              </div>

              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontFamily: "Oswald", fontSize: 16, fontWeight: 700, color: "#f0f0f0", textTransform: "uppercase" }}>
                  {m.fighter2}
                </div>
                <div style={{ fontFamily: "Inter", fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>
                  {m.f2Record}
                </div>
              </div>
            </div>

            {/* Result */}
            {m.result && (
              <div style={{
                borderTop: "1px solid var(--border)", padding: "8px 16px",
                background: "rgba(255,255,255,0.02)",
                fontFamily: "Oswald", fontSize: 12, fontWeight: 600,
                color: "var(--muted-foreground)", letterSpacing: "0.04em",
                textTransform: "uppercase", textAlign: "center",
              }}>
                {m.result}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
