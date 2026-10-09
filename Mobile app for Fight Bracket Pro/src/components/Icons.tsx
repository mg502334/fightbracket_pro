interface IconProps { active: boolean; }

const color = (active: boolean) => active ? "#e8003a" : "#7a7a84";

export function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2 9.5L11 2L20 9.5V20H14V14H8V20H2V9.5Z"
        fill={active ? "#e8003a" : "none"}
        stroke={color(active)} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M7 2H15V12C15 14.2 13.2 16 11 16C8.8 16 7 14.2 7 12V2Z"
        fill={active ? "#e8003a" : "none"}
        stroke={color(active)} strokeWidth="1.5" />
      <path d="M7 5H3V7C3 9.2 4.8 11 7 11"
        stroke={color(active)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 5H19V7C19 9.2 17.2 11 15 11"
        stroke={color(active)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 16V19M8 20H14"
        stroke={color(active)} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UsersIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="9" cy="7" r="3.5"
        fill={active ? "#e8003a" : "none"}
        stroke={color(active)} strokeWidth="1.5" />
      <path d="M2 19C2 15.7 5.1 13 9 13C10.1 13 11.1 13.2 12 13.7"
        stroke={color(active)} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="14" r="3"
        fill={active ? "#e8003a" : "none"}
        stroke={color(active)} strokeWidth="1.5" />
      <path d="M13 21C13 18.8 14.3 17 16 17C17.7 17 19 18.8 19 21"
        stroke={color(active)} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="4" width="18" height="16" rx="2"
        fill={active ? "#e8003a" : "none"}
        stroke={color(active)} strokeWidth="1.5" />
      <path d="M7 2V6M15 2V6M2 9H20"
        stroke={color(active)} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="13" r="1" fill={active ? "white" : color(active)} />
      <circle cx="11" cy="13" r="1" fill={active ? "white" : color(active)} />
      <circle cx="15" cy="13" r="1" fill={active ? "white" : color(active)} />
    </svg>
  );
}
