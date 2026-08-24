/**
 * BracketEngine — FightBracket Pro
 *
 * Builds a complete bracket tree from match data using prereqSet (parent-match)
 * relationships and round hierarchy to compute exact vertical slot positions
 * for each match, producing a layout identical to start.gg / Challonge.
 *
 * Algorithm:
 *   1. Build a directed graph: parentMatchId → [child1Id, child2Id]
 *   2. Identify leaf matches (Round 1 / starting round matches)
 *   3. Assign continuous slot indices to base matches
 *   4. Each parent's slot = average of its children's slots (or mathematically centered)
 *   5. Returns a SlotMap with exact vertical positions and fast connection lookup helpers.
 */

export interface SlotMap {
  slots: Map<string, number>;       // matchId → vertical slot index (float)
  maxSlot: number;                  // highest slot index (for height calculation)
  prereqMap: Map<string, string[]>; // matchId → [prereqMatchId1, prereqMatchId2]
}

export interface MinimalMatch {
  id: string;
  round: number;
  matchNumber?: number;
  identifier?: string;
  prereqSetIds?: string[];
  loserPrereqSetIds?: string[];
}

/** Sort start.gg identifiers correctly: single char < multi char, then alpha */
function compareIdentifiers(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b);
}

/**
 * Computes exact vertical layout slot positions for a set of matches in a bracket section.
 */
export function computeBracketSlots(matches: MinimalMatch[]): SlotMap {
  if (matches.length === 0) {
    return { slots: new Map(), maxSlot: 0, prereqMap: new Map() };
  }

  const allIds = new Set(matches.map(m => m.id));
  const isLosers = matches.some(m => m.round < 0);

  // 1. Build parent→children map (which match feeds into which)
  const prereqMap = new Map<string, string[]>();      // matchId → prereq match IDs within this set
  const feedsInto = new Map<string, string>();         // prereqMatchId → parentMatchId

  for (const match of matches) {
    const validPrereqs = (match.prereqSetIds || []).filter(id => allIds.has(id));
    if (validPrereqs.length > 0) {
      prereqMap.set(match.id, validPrereqs);
      for (const pid of validPrereqs) {
        feedsInto.set(pid, match.id);
      }
    }
  }

  // 2. Group matches by round
  const roundGroups = new Map<number, MinimalMatch[]>();
  for (const m of matches) {
    if (!roundGroups.has(m.round)) roundGroups.set(m.round, []);
    roundGroups.get(m.round)!.push(m);
  }

  // Sort rounds chronologically
  const sortedRounds = [...roundGroups.keys()].sort((a, b) =>
    isLosers ? Math.abs(a) - Math.abs(b) : a - b
  );

  const initialRound = sortedRounds[0];
  const initialMatches = roundGroups.get(initialRound) || [];

  // Sort initial round matches
  initialMatches.sort((a, b) => {
    if (a.identifier && b.identifier) return compareIdentifiers(a.identifier, b.identifier);
    if (a.matchNumber !== undefined && b.matchNumber !== undefined) return a.matchNumber - b.matchNumber;
    return parseInt(a.id) - parseInt(b.id) || 0;
  });

  const slots = new Map<string, number>();

  // 3. Assign base slot positions (0, 1, 2, 3...) to earliest round
  initialMatches.forEach((m, i) => slots.set(m.id, i));

  // 4. Process subsequent rounds chronologically
  for (let rIdx = 1; rIdx < sortedRounds.length; rIdx++) {
    const currentRound = sortedRounds[rIdx];
    const roundMatches = roundGroups.get(currentRound) || [];

    // Sort matches by matchNumber or identifier
    roundMatches.sort((a, b) => {
      if (a.identifier && b.identifier) return compareIdentifiers(a.identifier, b.identifier);
      if (a.matchNumber !== undefined && b.matchNumber !== undefined) return a.matchNumber - b.matchNumber;
      return 0;
    });

    const prevRound = sortedRounds[rIdx - 1];
    const prevMatches = roundGroups.get(prevRound) || [];

    roundMatches.forEach((match, mIdx) => {
      const prereqs = prereqMap.get(match.id) || [];
      const knownSlots = prereqs.filter(id => slots.has(id)).map(id => slots.get(id)!);

      if (knownSlots.length > 0) {
        // Center parent between its feeding children
        const avg = knownSlots.reduce((a, b) => a + b, 0) / knownSlots.length;
        slots.set(match.id, avg);
      } else {
        // Fallback: mathematical tree interpolation based on match index and previous round
        if (prevMatches.length === roundMatches.length * 2) {
          // Standard 2-to-1 binary tree progression
          const child1 = prevMatches[mIdx * 2];
          const child2 = prevMatches[mIdx * 2 + 1];
          const slot1 = child1 ? slots.get(child1.id) : undefined;
          const slot2 = child2 ? slots.get(child2.id) : undefined;

          if (slot1 !== undefined && slot2 !== undefined) {
            slots.set(match.id, (slot1 + slot2) / 2);
          } else if (slot1 !== undefined) {
            slots.set(match.id, slot1 + 0.5);
          } else {
            const step = Math.pow(2, rIdx);
            slots.set(match.id, mIdx * step + (step - 1) / 2);
          }
        } else if (prevMatches.length === roundMatches.length) {
          // 1-to-1 progression (e.g. drop round in losers)
          const directPrev = prevMatches[mIdx];
          const prevSlot = directPrev ? slots.get(directPrev.id) : undefined;
          slots.set(match.id, prevSlot !== undefined ? prevSlot : mIdx);
        } else {
          // General proportionate distribution
          const totalInRound = roundMatches.length;
          const maxBaseSlot = Math.max(1, initialMatches.length - 1);
          const pos = totalInRound > 1 ? (mIdx / (totalInRound - 1)) * maxBaseSlot : maxBaseSlot / 2;
          slots.set(match.id, pos);
        }
      }
    });
  }

  // 5. Ensure all matches have a slot (safety fallback)
  let fallbackSlot = initialMatches.length;
  for (const match of matches) {
    if (!slots.has(match.id)) {
      slots.set(match.id, fallbackSlot++);
    }
  }

  // 6. Collision resolution: within each round, ensure no two matches share
  //    the same (or nearly identical) slot. Sort by current slot and push
  //    any match that would collide downward by at least 1 slot unit.
  const MIN_SLOT_GAP = 1.0; // must be >= 1 to avoid overlap at SLOT_SIZE px
  for (const round of sortedRounds) {
    const roundMatches = roundGroups.get(round) || [];
    // Sort by current assigned slot so we can do a single forward pass
    roundMatches.sort((a, b) => (slots.get(a.id) ?? 0) - (slots.get(b.id) ?? 0));
    for (let i = 1; i < roundMatches.length; i++) {
      const prevSlot = slots.get(roundMatches[i - 1].id) ?? 0;
      const currSlot = slots.get(roundMatches[i].id) ?? 0;
      if (currSlot < prevSlot + MIN_SLOT_GAP) {
        slots.set(roundMatches[i].id, prevSlot + MIN_SLOT_GAP);
      }
    }
  }

  const maxSlot = Math.max(0, ...slots.values());
  return { slots, maxSlot, prereqMap };
}

/**
 * Finds the destination match that a given match feeds into (winners path or losers path).
 */
export function findNextMatch(
  match: MinimalMatch,
  allMatches: MinimalMatch[],
  isLoserPath: boolean = false
): MinimalMatch | null {
  if (isLoserPath) {
    // Check if match has explicit loser destination
    const dest = allMatches.find(m => m.loserPrereqSetIds?.includes(match.id));
    if (dest) return dest;
  }

  // Check if any match in allMatches has this match as prereq
  const destByPrereq = allMatches.find(m => m.prereqSetIds?.includes(match.id));
  if (destByPrereq) return destByPrereq;

  // Fallback for single-elimination sequential indexing in the same game & bracket
  if (match.round >= 0 && match.matchNumber !== undefined) {
    const nextRound = match.round + 1;
    const targetMatchNum = Math.floor(match.matchNumber / 2);
    const fallbackMatch = allMatches.find(
      m => m.round === nextRound && m.matchNumber === targetMatchNum
    );
    if (fallbackMatch) return fallbackMatch;
  }

  return null;
}
