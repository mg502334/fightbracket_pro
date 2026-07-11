export interface GameTheme {
  id: string;
  displayName: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  bgFrom: string;
  glowColor: string;
  description: string;
  publisher: string;
}

export interface Player {
  id: string;
  tag: string;
  realName: string;
  country: string;
  countryFlag: string;
  seed: number;
  checkedIn: boolean;
  phone: string;
  smsNotified: boolean;
  status?: 'active' | 'eliminated';
  character?: string;
  gameId: string;
  placement?: number;
}

export interface BracketMatch {
  id: string;
  gameId: string;
  round: number;
  roundName: string;
  matchNumber: number;
  player1Id: string | null;
  player2Id: string | null;
  state: 'pending' | 'in_progress' | 'completed' | 'called';
  stationId: number | null;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  streamUrl?: string;
  bestOf: number;
}

export interface Station {
  id: number;
  name: string;
  gameId: string | null;
  matchId: string | null;
  active: boolean;
}

export interface SMSLog {
  id: string;
  playerId: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'failed';
  matchId?: string;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  tekken8: {
    id: 'tekken8',
    displayName: 'TEKKEN 8',
    shortName: 'TK8',
    primaryColor: '#2979FF',
    secondaryColor: '#FFD600',
    bgFrom: '#001A4D',
    glowColor: 'rgba(41, 121, 255, 0.4)',
    description: 'The King of Iron Fist Tournament',
    publisher: 'BANDAI NAMCO',
  },
  sf6: {
    id: 'sf6',
    displayName: 'STREET FIGHTER 6',
    shortName: 'SF6',
    primaryColor: '#FF6B00',
    secondaryColor: '#00D4FF',
    bgFrom: '#2A1000',
    glowColor: 'rgba(255, 107, 0, 0.4)',
    description: 'The Legend of the World Warriors',
    publisher: 'CAPCOM',
  },
  fatalFury: {
    id: 'fatalFury',
    displayName: 'FATAL FURY: CITY OF WOLVES',
    shortName: 'FFCOW',
    primaryColor: '#CC0000',
    secondaryColor: '#FFD600',
    bgFrom: '#1A0000',
    glowColor: 'rgba(204, 0, 0, 0.4)',
    description: 'The Wild Wolves Howl Again',
    publisher: 'SNK',
  },
};

export const PLAYERS: Player[] = [
  // Tekken 8 players
  { id: 'tk1', tag: 'Arslan Ash', realName: 'Arslan Siddique', country: 'PK', countryFlag: '🇵🇰', seed: 1, checkedIn: true, phone: '+1-555-0101', smsNotified: false, character: 'Zafina', gameId: 'tekken8' },
  { id: 'tk2', tag: 'Knee', realName: 'Bae Jae-min', country: 'KR', countryFlag: '🇰🇷', seed: 2, checkedIn: true, phone: '+1-555-0102', smsNotified: false, character: 'Steve Fox', gameId: 'tekken8' },
  { id: 'tk3', tag: 'JDCR', realName: 'Kim Hyunjin', country: 'KR', countryFlag: '🇰🇷', seed: 3, checkedIn: true, phone: '+1-555-0103', smsNotified: false, character: 'Dragunov', gameId: 'tekken8' },
  { id: 'tk4', tag: 'Rangchu', realName: 'Jeong Hyeon-ho', country: 'KR', countryFlag: '🇰🇷', seed: 4, checkedIn: true, phone: '+1-555-0104', smsNotified: false, character: 'Panda', gameId: 'tekken8' },
  { id: 'tk5', tag: 'CrazyDad3D', realName: 'Andres Torres', country: 'DE', countryFlag: '🇩🇪', seed: 5, checkedIn: true, phone: '+1-555-0105', smsNotified: false, character: 'King', gameId: 'tekken8' },
  { id: 'tk6', tag: 'Atif Butt', realName: 'Atif Butt', country: 'PK', countryFlag: '🇵🇰', seed: 6, checkedIn: false, phone: '+1-555-0106', smsNotified: false, character: 'Law', gameId: 'tekken8' },
  { id: 'tk7', tag: 'AwesomeMikey', realName: 'Michael Davis', country: 'US', countryFlag: '🇺🇸', seed: 7, checkedIn: true, phone: '+1-555-0107', smsNotified: false, character: 'Bryan', gameId: 'tekken8' },
  { id: 'tk8', tag: 'Saint', realName: 'Lee Seungwoo', country: 'KR', countryFlag: '🇰🇷', seed: 8, checkedIn: true, phone: '+1-555-0108', smsNotified: false, character: 'Jack-8', gameId: 'tekken8' },
  { id: 'tk9', tag: 'LowHigh', realName: 'Kim Junyoung', country: 'KR', countryFlag: '🇰🇷', seed: 9, checkedIn: true, phone: '+1-555-0109', smsNotified: false, character: 'Shaheen', gameId: 'tekken8' },
  { id: 'tk10', tag: 'Speedkicks', realName: 'Marcus Ramsay', country: 'US', countryFlag: '🇺🇸', seed: 10, checkedIn: true, phone: '+1-555-0110', smsNotified: false, character: 'Miguel', gameId: 'tekken8' },
  { id: 'tk11', tag: 'Evo-B', realName: 'Brandon Jones', country: 'US', countryFlag: '🇺🇸', seed: 11, checkedIn: false, phone: '+1-555-0111', smsNotified: false, character: 'Kazuya', gameId: 'tekken8' },
  { id: 'tk12', tag: 'JokerKing', realName: 'Cem Alpay', country: 'TR', countryFlag: '🇹🇷', seed: 12, checkedIn: true, phone: '+1-555-0112', smsNotified: false, character: 'Hwoarang', gameId: 'tekken8' },
  { id: 'tk13', tag: 'Ghirlanda', realName: 'Leonardo Ghirlanda', country: 'IT', countryFlag: '🇮🇹', seed: 13, checkedIn: true, phone: '+1-555-0113', smsNotified: false, character: 'Devil Jin', gameId: 'tekken8' },
  { id: 'tk14', tag: 'Ao', realName: 'Aleksandr Oreshkov', country: 'RU', countryFlag: '🇷🇺', seed: 14, checkedIn: true, phone: '+1-555-0114', smsNotified: false, character: 'Nina', gameId: 'tekken8' },
  { id: 'tk15', tag: 'Av3ryDay', realName: 'Avery Williams', country: 'US', countryFlag: '🇺🇸', seed: 15, checkedIn: true, phone: '+1-555-0115', smsNotified: false, character: 'Lee Chaolan', gameId: 'tekken8' },
  { id: 'tk16', tag: 'UyuJu', realName: 'Park Jungwoo', country: 'KR', countryFlag: '🇰🇷', seed: 16, checkedIn: false, phone: '+1-555-0116', smsNotified: false, character: 'Lars', gameId: 'tekken8' },

  // SF6 players
  { id: 'sf1', tag: 'Punk', realName: 'Victor Woodley', country: 'US', countryFlag: '🇺🇸', seed: 1, checkedIn: true, phone: '+1-555-0201', smsNotified: false, character: 'A.K.I.', gameId: 'sf6' },
  { id: 'sf2', tag: 'iDom', realName: 'Domini McLennon', country: 'US', countryFlag: '🇺🇸', seed: 2, checkedIn: true, phone: '+1-555-0202', smsNotified: false, character: 'Poison', gameId: 'sf6' },
  { id: 'sf3', tag: 'NuckleDu', realName: 'Du Dang', country: 'US', countryFlag: '🇺🇸', seed: 3, checkedIn: true, phone: '+1-555-0203', smsNotified: false, character: 'Guile', gameId: 'sf6' },
  { id: 'sf4', tag: 'Phenom', realName: 'Norbertas Stonkus', country: 'SE', countryFlag: '🇸🇪', seed: 4, checkedIn: true, phone: '+1-555-0204', smsNotified: false, character: 'Akuma', gameId: 'sf6' },
  { id: 'sf5', tag: 'MenaRD', realName: 'Julio Figuereo', country: 'DO', countryFlag: '🇩🇴', seed: 5, checkedIn: true, phone: '+1-555-0205', smsNotified: false, character: 'Blanka', gameId: 'sf6' },
  { id: 'sf6p', tag: 'Tokido', realName: 'Hajime Taniguchi', country: 'JP', countryFlag: '🇯🇵', seed: 6, checkedIn: true, phone: '+1-555-0206', smsNotified: false, character: 'Akuma', gameId: 'sf6' },
  { id: 'sf7', tag: 'Daigo', realName: 'Daigo Umehara', country: 'JP', countryFlag: '🇯🇵', seed: 7, checkedIn: false, phone: '+1-555-0207', smsNotified: false, character: 'Ken', gameId: 'sf6' },
  { id: 'sf8', tag: 'Poongko', realName: 'Lee Chung-gon', country: 'KR', countryFlag: '🇰🇷', seed: 8, checkedIn: true, phone: '+1-555-0208', smsNotified: false, character: 'Seth', gameId: 'sf6' },
  { id: 'sf9', tag: 'Chris T', realName: 'Chris Tatarian', country: 'US', countryFlag: '🇺🇸', seed: 9, checkedIn: true, phone: '+1-555-0209', smsNotified: false, character: 'Ken', gameId: 'sf6' },
  { id: 'sf10', tag: 'Bonchan', realName: 'Masato Takahashi', country: 'JP', countryFlag: '🇯🇵', seed: 10, checkedIn: true, phone: '+1-555-0210', smsNotified: false, character: 'Luke', gameId: 'sf6' },
  { id: 'sf11', tag: 'Fuudo', realName: 'Keita Inoue', country: 'JP', countryFlag: '🇯🇵', seed: 11, checkedIn: true, phone: '+1-555-0211', smsNotified: false, character: 'R. Mika', gameId: 'sf6' },
  { id: 'sf12', tag: 'PR Balrog', realName: 'Eduardo Perez', country: 'US', countryFlag: '🇺🇸', seed: 12, checkedIn: true, phone: '+1-555-0212', smsNotified: false, character: 'Balrog', gameId: 'sf6' },
  { id: 'sf13', tag: 'Snake Eyez', realName: 'Derick Jiang', country: 'US', countryFlag: '🇺🇸', seed: 13, checkedIn: false, phone: '+1-555-0213', smsNotified: false, character: 'Zangief', gameId: 'sf6' },
  { id: 'sf14', tag: 'Nemo', realName: 'Tomomichi Tani', country: 'JP', countryFlag: '🇯🇵', seed: 14, checkedIn: true, phone: '+1-555-0214', smsNotified: false, character: 'Urien', gameId: 'sf6' },
  { id: 'sf15', tag: 'Momochi', realName: 'Yusuke Momochi', country: 'JP', countryFlag: '🇯🇵', seed: 15, checkedIn: true, phone: '+1-555-0215', smsNotified: false, character: 'Ken', gameId: 'sf6' },
  { id: 'sf16', tag: 'Infiltration', realName: 'Lee Seon-woo', country: 'KR', countryFlag: '🇰🇷', seed: 16, checkedIn: true, phone: '+1-555-0216', smsNotified: false, character: 'Abigail', gameId: 'sf6' },

  // Fatal Fury: City of Wolves players
  { id: 'ff1', tag: 'Shen_LW', realName: 'Jin Shen', country: 'JP', countryFlag: '🇯🇵', seed: 1, checkedIn: true, phone: '+1-555-0301', smsNotified: false, character: 'Terry Bogard', gameId: 'fatalFury' },
  { id: 'ff2', tag: 'BukTooth', realName: 'Raul Mendes', country: 'US', countryFlag: '🇺🇸', seed: 2, checkedIn: true, phone: '+1-555-0302', smsNotified: false, character: 'Rock Howard', gameId: 'fatalFury' },
  { id: 'ff3', tag: 'PackZ', realName: 'Patrick Zimmerman', country: 'US', countryFlag: '🇺🇸', seed: 3, checkedIn: true, phone: '+1-555-0303', smsNotified: false, character: 'Tizoc', gameId: 'fatalFury' },
  { id: 'ff4', tag: 'DevlinFGC', realName: 'Devlin Carter', country: 'US', countryFlag: '🇺🇸', seed: 4, checkedIn: true, phone: '+1-555-0304', smsNotified: false, character: 'B. Jenet', gameId: 'fatalFury' },
  { id: 'ff5', tag: 'GrndStone', realName: 'Kenji Watanabe', country: 'JP', countryFlag: '🇯🇵', seed: 5, checkedIn: false, phone: '+1-555-0305', smsNotified: false, character: 'Preecha', gameId: 'fatalFury' },
  { id: 'ff6', tag: 'OmegaX', realName: 'Carlos Reyes', country: 'MX', countryFlag: '🇲🇽', seed: 6, checkedIn: true, phone: '+1-555-0306', smsNotified: false, character: 'Hotaru', gameId: 'fatalFury' },
  { id: 'ff7', tag: 'FightFox', realName: 'Marcus LeBlanc', country: 'CA', countryFlag: '🇨🇦', seed: 7, checkedIn: true, phone: '+1-555-0307', smsNotified: false, character: 'Andy Bogard', gameId: 'fatalFury' },
  { id: 'ff8', tag: 'RockLee_KR', realName: 'Park Seojun', country: 'KR', countryFlag: '🇰🇷', seed: 8, checkedIn: true, phone: '+1-555-0308', smsNotified: false, character: 'Joe Higashi', gameId: 'fatalFury' },
];

// Generate bracket matches for a 16-player single-elimination bracket
export function gen16Bracket(gameId: string, playerIds: string[]): BracketMatch[] {
  const rounds = [
    { round: 0, name: 'Round of 16', count: 8 },
    { round: 1, name: 'Quarterfinals', count: 4 },
    { round: 2, name: 'Semifinals', count: 2 },
    { round: 3, name: 'Grand Finals', count: 1 },
  ];

  const matches: BracketMatch[] = [];

  // Round 1 seeding (1v16, 8v9, 5v12, 4v13, 3v14, 6v11, 7v10, 2v15)
  const r1Pairings = [[0,15],[7,8],[4,11],[3,12],[2,13],[5,10],[6,9],[1,14]];

  r1Pairings.forEach(([a, b], i) => {
    matches.push({
      id: `${gameId}-r0-${i}`,
      gameId,
      round: 0,
      roundName: 'Round of 16',
      matchNumber: i,
      player1Id: playerIds[a] ?? null,
      player2Id: playerIds[b] ?? null,
      state: i < 2 ? 'completed' : i === 2 ? 'in_progress' : i < 5 ? 'called' : 'pending',
      stationId: i < 2 ? null : i === 2 ? 3 : i < 5 ? [1,2,4][i-3] : null,
      player1Score: i < 2 ? 2 : i === 2 ? 1 : 0,
      player2Score: i < 2 ? 1 : i === 2 ? 0 : 0,
      winnerId: i < 2 ? playerIds[a] : null,
      bestOf: 3,
    });
  });

  // Round 2 (QF)
  [0,1,2,3].forEach((i) => {
    matches.push({
      id: `${gameId}-r1-${i}`,
      gameId,
      round: 1,
      roundName: 'Quarterfinals',
      matchNumber: i,
      player1Id: i === 0 ? playerIds[0] : null,
      player2Id: i === 0 ? playerIds[7] : null,
      state: i === 0 ? 'in_progress' : 'pending',
      stationId: i === 0 ? 5 : null,
      player1Score: i === 0 ? 1 : 0,
      player2Score: 0,
      winnerId: null,
      bestOf: 3,
    });
  });

  // SF
  [0,1].forEach((i) => {
    matches.push({
      id: `${gameId}-r2-${i}`,
      gameId,
      round: 2,
      roundName: 'Semifinals',
      matchNumber: i,
      player1Id: null,
      player2Id: null,
      state: 'pending',
      stationId: null,
      player1Score: 0,
      player2Score: 0,
      winnerId: null,
      bestOf: 5,
    });
  });

  // Finals
  matches.push({
    id: `${gameId}-r3-0`,
    gameId,
    round: 3,
    roundName: 'Grand Finals',
    matchNumber: 0,
    player1Id: null,
    player2Id: null,
    state: 'pending',
    stationId: null,
    player1Score: 0,
    player2Score: 0,
    winnerId: null,
    bestOf: 5,
  });

  return matches;
}

// Generate 8-player bracket for Fatal Fury
function gen8Bracket(gameId: string, playerIds: string[]): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const r1Pairings = [[0,7],[3,4],[2,5],[1,6]];

  r1Pairings.forEach(([a, b], i) => {
    matches.push({
      id: `${gameId}-r0-${i}`,
      gameId,
      round: 0,
      roundName: 'Semifinals',
      matchNumber: i,
      player1Id: playerIds[a] ?? null,
      player2Id: playerIds[b] ?? null,
      state: i === 0 ? 'completed' : i === 1 ? 'in_progress' : 'pending',
      stationId: i === 0 ? null : i === 1 ? 6 : null,
      player1Score: i === 0 ? 2 : i === 1 ? 1 : 0,
      player2Score: i === 0 ? 0 : 0,
      winnerId: i === 0 ? playerIds[a] : null,
      bestOf: 3,
    });
  });

  [0,1].forEach((i) => {
    matches.push({
      id: `${gameId}-r1-${i}`,
      gameId,
      round: 1,
      roundName: 'Semifinals',
      matchNumber: i,
      player1Id: i === 0 ? playerIds[0] : null,
      player2Id: null,
      state: 'pending',
      stationId: null,
      player1Score: 0,
      player2Score: 0,
      winnerId: null,
      bestOf: 3,
    });
  });

  matches.push({
    id: `${gameId}-r2-0`,
    gameId,
    round: 2,
    roundName: 'Grand Finals',
    matchNumber: 0,
    player1Id: null,
    player2Id: null,
    state: 'pending',
    stationId: null,
    player1Score: 0,
    player2Score: 0,
    winnerId: null,
    bestOf: 5,
  });

  return matches;
}

const tk8PlayerIds = PLAYERS.filter(p => p.gameId === 'tekken8').sort((a,b) => a.seed - b.seed).map(p => p.id);
const sf6PlayerIds = PLAYERS.filter(p => p.gameId === 'sf6').sort((a,b) => a.seed - b.seed).map(p => p.id);
const ffPlayerIds = PLAYERS.filter(p => p.gameId === 'fatalFury').sort((a,b) => a.seed - b.seed).map(p => p.id);

export const INITIAL_BRACKETS: BracketMatch[] = [
  ...gen16Bracket('tekken8', tk8PlayerIds),
  ...gen16Bracket('sf6', sf6PlayerIds),
  ...gen8Bracket('fatalFury', ffPlayerIds),
];

export function generateMockDataForGame(gameId: string, gameName: string): { players: Player[], matches: BracketMatch[] } {
  const newPlayers: Player[] = [];
  const playerIds: string[] = [];
  for (let i = 1; i <= 16; i++) {
    const id = `${gameId}-p${i}`;
    playerIds.push(id);
    newPlayers.push({
      id,
      tag: `Player ${i}`,
      realName: `User ${i}`,
      country: 'US',
      countryFlag: '🇺🇸',
      seed: i,
      checkedIn: true,
      phone: `+1-555-0${900 + i}`,
      smsNotified: false,
      character: 'Random',
      gameId
    });
  }

  const newMatches = gen16Bracket(gameId, playerIds);
  // reset state for mock brackets so they aren't all in-progress/completed like the hardcoded ones
  const resetMatches = newMatches.map(m => ({
    ...m,
    state: m.round === 0 ? 'pending' : 'pending',
    stationId: null,
    player1Score: 0,
    player2Score: 0,
    winnerId: null,
  })) as BracketMatch[];

  return { players: newPlayers, matches: resetMatches };
}

export const STATIONS: Station[] = [
  { id: 1, name: 'Station 1', gameId: 'tekken8', matchId: null, active: true },
  { id: 2, name: 'Station 2', gameId: 'tekken8', matchId: null, active: true },
  { id: 3, name: 'Station 3', gameId: 'tekken8', matchId: 'tekken8-r0-2', active: true },
  { id: 4, name: 'Station 4', gameId: 'sf6', matchId: null, active: true },
  { id: 5, name: 'Station 5', gameId: 'tekken8', matchId: 'tekken8-r1-0', active: true },
  { id: 6, name: 'Station 6', gameId: 'fatalFury', matchId: 'fatalFury-r0-1', active: true },
  { id: 7, name: 'Station 7', gameId: 'sf6', matchId: null, active: true },
  { id: 8, name: 'Station 8', gameId: 'sf6', matchId: null, active: true },
  { id: 9, name: 'Station 9', gameId: 'fatalFury', matchId: null, active: false },
  { id: 10, name: 'Station 10', gameId: null, matchId: null, active: false },
  { id: 11, name: 'Station 11', gameId: null, matchId: null, active: false },
  { id: 12, name: 'Station 12', gameId: null, matchId: null, active: false },
];

export const TOURNAMENT = {
  id: 'clash-of-kings-vii',
  name: 'CLASH OF KINGS VII',
  slug: 'clash-of-kings-vii',
  location: 'Las Vegas, NV',
  venue: 'Mandalay Bay Convention Center',
  startAt: new Date('2026-06-15T10:00:00'),
  endAt: new Date('2026-06-16T22:00:00'),
  registrations: 56,
  checkedIn: 48,
  sourceUrl: 'https://www.start.gg/tournament/clash-of-kings-vii',
};
