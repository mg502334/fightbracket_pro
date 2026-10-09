import { useState } from "react";
import Dashboard from "./screens/Dashboard";
import Brackets from "./screens/Brackets";
import Fighters from "./screens/Fighters";
import Schedule from "./screens/Schedule";
import { HomeIcon, TrophyIcon, UsersIcon, CalendarIcon } from "./components/Icons";

type Tab = "home" | "brackets" | "fighters" | "schedule";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tabs: { id: Tab; label: string; icon: React.FC<{ active: boolean }> }[] = [
    { id: "home", label: "Home", icon: ({ active }) => <HomeIcon active={active} /> },
    { id: "brackets", label: "Brackets", icon: ({ active }) => <TrophyIcon active={active} /> },
    { id: "fighters", label: "Fighters", icon: ({ active }) => <UsersIcon active={active} /> },
    { id: "schedule", label: "Schedule", icon: ({ active }) => <CalendarIcon active={active} /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#050506" }}>
      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 390,
          height: 844,
          background: "var(--background)",
          borderRadius: 44,
          boxShadow: "0 0 0 10px #1a1a1e, 0 40px 80px rgba(0,0,0,0.8), 0 0 120px rgba(232,0,58,0.08)",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-8 pt-3 pb-1 flex-shrink-0"
          style={{ paddingTop: 16, height: 50 }}
        >
          <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 15, color: "#f0f0f0" }}>9:41</span>
          <div
            className="absolute left-1/2"
            style={{
              transform: "translateX(-50%)",
              width: 120,
              height: 34,
              background: "#0a0a0b",
              borderRadius: 20,
              top: 0,
            }}
          />
          <div className="flex items-center gap-1.5">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="3" width="3" height="9" rx="1" fill="#f0f0f0" />
              <rect x="4.5" y="2" width="3" height="10" rx="1" fill="#f0f0f0" />
              <rect x="9" y="0" width="3" height="12" rx="1" fill="#f0f0f0" />
              <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#f0f0f0" opacity="0.3" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 2.5C9.8 2.5 11.4 3.2 12.6 4.4L14 3C12.4 1.4 10.3 0.5 8 0.5C5.7 0.5 3.6 1.4 2 3L3.4 4.4C4.6 3.2 6.2 2.5 8 2.5Z" fill="#f0f0f0" />
              <path d="M8 5.5C9.1 5.5 10.1 5.9 10.8 6.7L12.2 5.3C11.1 4.2 9.6 3.5 8 3.5C6.4 3.5 4.9 4.2 3.8 5.3L5.2 6.7C5.9 5.9 6.9 5.5 8 5.5Z" fill="#f0f0f0" />
              <circle cx="8" cy="10" r="1.5" fill="#f0f0f0" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#f0f0f0" strokeOpacity="0.35" />
              <rect x="2" y="2" width="16" height="8" rx="2" fill="#f0f0f0" />
              <path d="M23 4.5V7.5C23.8 7.2 24.5 6.5 24.5 6C24.5 5.5 23.8 4.8 23 4.5Z" fill="#f0f0f0" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "home" && <Dashboard />}
          {activeTab === "brackets" && <Brackets />}
          {activeTab === "fighters" && <Fighters />}
          {activeTab === "schedule" && <Schedule />}
        </div>

        {/* Bottom navigation */}
        <div
          className="flex-shrink-0 flex items-center"
          style={{
            background: "#0e0e10",
            borderTop: "1px solid var(--border)",
            height: 83,
            paddingBottom: 20,
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1"
                style={{ background: "none", border: "none", cursor: "pointer", paddingTop: 12 }}
              >
                <tab.icon active={active} />
                <span
                  style={{
                    fontFamily: "Oswald, sans-serif",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                    transition: "color 0.15s",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
