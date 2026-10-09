import { useState } from "react";

type Fighter = { name: string; seed: number; record: string; winner?: boolean; tbd?: boolean };
type Match = { id: string; fighter1: Fighter; fighter2: Fighter; winner?: 1 | 2 };

const qfMatches: Match[] = [
  {
    id: "qf1",
    fighter1: { name: "Marcus Vega", seed: 1, record: "18-2" },
    fighter2: { name: "Tommy Rios", seed: 8, record: "12-4" },
    winner: 1,
  },
  {
    id: "qf2",
    fighter1: { name: "Jin Hyuk Park", seed: 4, record: "21-1" },
    fighter2: { name: "Darius Cole", seed: 5, record: "15-3" },
    winner: 1,
  },
  {
    id: "qf3",
    fighter1: { name: "Aleksei Volkov", seed: 3, record: "20-2" },
    fighter2: { name: "Paulo Mendez", seed: 6, record: "16-5" },
    winner: 1,
  },
  {
    id: "qf4",
    fighter1: { name: "Kevin Okafor", seed: 2, record: "17-1" },
    fighter2: { name: "Yusuf Hassan", seed: 7, record: "14-3" },
  },
];

const sfMatches: Match[] = [
  {
    id: "sf1",
    fighter1: { name: "Marcus Vega", seed: 1, record: "18-2" },
    fighter2: { name: "Jin Hyuk Park", seed: 4, record: "21-1" },
  },
  {
    id: "sf2",
    fighter1: { name: "Aleksei Volkov", seed: 3, record: "20-2" },
    fighter2: { name: "TBD", seed: 0, record: "—", tbd: true },
  },
];

const finalMatch: Match = {
  id: "final",
  fighter1: { name: "TBD", seed: 0, record: "—", tbd: true },
  fighter2: { name: "TBD", seed: 0, record: "—", tbd: true },
};

function MatchCard({ match, label }: { match: Match; label?: string }) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden", minWidth: 160,
    }}>
      {label && (
        <div style={{
          background: "var(--muted)", padding: "4px 10px",
          fontFamily: "Oswald", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.1em", color: "var(--muted-foreground)",
          textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
      {[match.fighter1, match.fighter2].map((f, i) => {
        const isWinner = match.winner === i + 1;
        const isLoser = match.winner && !isWinner;
        return (
          <div
            key={i}
            style={{
              padding: "8px 10px",
              borderTop: i === 1 ? "1px solid var(--border)" : undefined,
              background: isWinner ? "rgba(232,0,58,0.08)" : undefined,
              opacity: f.tbd ? 0.4 : isLoser ? 0.45 : 1,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {f.seed > 0 && (
                  <span style={{
                    fontFamily: "Oswald", fontSize: 10, fontWeight: 700,
                    color: isWinner ? "var(--primary)" : "var(--muted-foreground)",
                    minWidth: 14,
                  }}>
                    {f.seed}
                  </span>
                )}
                <span style={{
                  fontFamily: "Oswald", fontSize: 13, fontWeight: 600,
                  color: f.tbd ? "var(--muted-foreground)" : isWinner ? "#f0f0f0" : "#c0c0c8",
                  lineHeight: 1.2,
                }}>
                  {f.name}
                </span>
              </div>
              {isWinner && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#e8003a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 10, color: "var(--muted-foreground)", marginTop: 1, marginLeft: f.seed > 0 ? 22 : 0 }}>
              {f.record}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Brackets() {
  const [tournament, setTournament] = useState("Iron Fist Open");

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="px-5 pt-2 pb-4">
        <h1 style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, color: "#f0f0f0", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Brackets
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
          Iron Fist Open · MMA · 32 fighters
        </p>
      </div>

      {/* Tournament picker */}
      <div className="flex gap-2 px-5 mb-5" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
        {["Iron Fist Open", "Gold Belt Classic", "Steel Cage"].map((t) => (
          <button
            key={t}
            onClick={() => setTournament(t)}
            style={{
              fontFamily: "Oswald", fontSize: 12, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap",
              background: tournament === t ? "var(--primary)" : "var(--secondary)",
              color: tournament === t ? "white" : "var(--muted-foreground)",
              border: "1px solid", borderColor: tournament === t ? "var(--primary)" : "var(--border)",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Round labels + bracket */}
      <div className="px-5 pb-6">
        {/* Progress bar */}
        <div style={{
          background: "var(--secondary)", borderRadius: 8, padding: "10px 14px",
          border: "1px solid var(--border)", marginBottom: 20,
        }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily: "Oswald", fontSize: 11, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Progress</span>
            <span style={{ fontFamily: "Oswald", fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>Quarterfinals</span>
          </div>
          <div className="flex gap-1">
            {["R1", "R2", "QF", "SF", "Final"].map((r, i) => (
              <div key={r} style={{ flex: 1 }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: i <= 2 ? "var(--primary)" : "var(--border)",
                  transition: "background 0.2s",
                }} />
                <div style={{
                  fontFamily: "Inter", fontSize: 9, color: i <= 2 ? "var(--primary)" : "var(--muted-foreground)",
                  textAlign: "center", marginTop: 4, letterSpacing: "0.04em",
                }}>
                  {r}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bracket columns */}
        <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          <div style={{ display: "flex", gap: 12, minWidth: 560, paddingBottom: 8 }}>
            {/* QF */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: 4 }}>
                Quarterfinals
              </div>
              {qfMatches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>

            {/* SF */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingTop: 60 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: 4 }}>
                Semifinals
              </div>
              {sfMatches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>

            {/* Final */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 120 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 11, fontWeight: 600, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: 4 }}>
                Final
              </div>
              <MatchCard match={finalMatch} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
