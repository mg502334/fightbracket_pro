/**
 * BracketEngine — FightBracket Pro
 *
 * Builds a complete bracket tree from start.gg match data using
 * prereqSet (parent-match) relationships to compute exact vertical
 * slot positions for each match, producing a layout identical to start.gg.
 *
 * Algorithm:
 *   1. Build a directed graph: parentMatchId → [child1Id, child2Id]
 *   2. Identify leaf matches (Round 1, no incoming edges from within this phase)
 *   3. Sort leaves by their start.gg identifier (N < O < P < Q...)
 *   4. Assign leaves continuous slot indices: 0, 1, 2, 3, ...
 *   5. Each parent's slot = average of its two children's slots
 *      (so parent appears visually between its two feeders)
 *   6. Return a Map<matchId, slotIndex> for use by BracketView
 */

export interface SlotMap {
  slots: Map<string, number>;       // matchId → vertical slot index (float)
  maxSlot: number;                  // highest slot index (for height calculation)
  prereqMap: Map<string, string[]>; // matchId → [prereqMatchId1, prereqMatchId2]
}

interface MinimalMatch {
  id: string;
  round: number;
  identifier?: string;
  prereqSetIds?: string[];
}

/** Sort start.gg identifiers correctly: single char < multi char, then alpha */
function compareIdentifiers(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b);
}

export function computeBracketSlots(matches: MinimalMatch[]): SlotMap {
  const allIds = new Set(matches.map(m => m.id));

  // Build parent→children map (which match feeds into which)
  const prereqMap = new Map<string, string[]>();      // matchId → prereq match IDs within this phase
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

  // Leaf matches: not fed by any other match within this phase
  // (i.e., first-round matches)
  const leafMatches = matches.filter(m => {
    const prereqs = prereqMap.get(m.id) || [];
    return prereqs.length === 0;
  });

  // Sort leaves by identifier, then by round, then by numeric id
  leafMatches.sort((a, b) => {
    if (a.identifier && b.identifier) return compareIdentifiers(a.identifier, b.identifier);
    if (a.identifier) return -1;
    if (b.identifier) return 1;
    return Math.abs(a.round) - Math.abs(b.round) || parseInt(a.id) - parseInt(b.id);
  });

  const slots = new Map<string, number>();

  // Assign leaf slot positions (integers: 0, 1, 2, 3...)
  leafMatches.forEach((m, i) => slots.set(m.id, i));

  // Process remaining matches in order of increasing round depth
  // so that by the time we process a parent, all its children have slots
  const nonLeaves = matches
    .filter(m => !slots.has(m.id))
    .sort((a, b) => Math.abs(a.round) - Math.abs(b.round));

  // Iterative relaxation: keep trying until all slots are assigned
  let iterations = 0;
  const remaining = [...nonLeaves];
  while (remaining.length > 0 && iterations < 20) {
    iterations++;
    const stillPending: typeof remaining = [];
    for (const match of remaining) {
      const prereqs = prereqMap.get(match.id) || [];
      const knownSlots = prereqs.filter(id => slots.has(id)).map(id => slots.get(id)!);

      if (knownSlots.length > 0) {
        // Average of known child slots
        const avg = knownSlots.reduce((a, b) => a + b, 0) / knownSlots.length;
        slots.set(match.id, avg);
      } else {
        // No prereqs known yet — assign based on identifier or defer
        if (match.identifier) {
          // Use a rough position based on identifier sort order
          const sortIndex = nonLeaves.findIndex(m => m.id === match.id);
          slots.set(match.id, leafMatches.length + sortIndex);
        } else {
          stillPending.push(match);
        }
      }
    }
    remaining.length = 0;
    remaining.push(...stillPending);
  }

  // Any still-unassigned matches get appended at the end
  let fallbackSlot = slots.size;
  for (const match of remaining) {
    slots.set(match.id, fallbackSlot++);
  }

  const maxSlot = Math.max(0, ...slots.values());
  return { slots, maxSlot, prereqMap };
}

/**
 * Groups matches by round and sorts each group by their computed slot position.
 * Returns the rounds in chronological order (winners: ascending, losers: ascending abs value).
 */
export function sortMatchesByBracketLayout(
  matches: MinimalMatch[],
  slotMap: SlotMap
): { round: number; matches: MinimalMatch[] }[] {
  const isLosers = matches.some(m => m.round < 0);

  const roundGroups = new Map<number, MinimalMatch[]>();
  for (const m of matches) {
    if (!roundGroups.has(m.round)) roundGroups.set(m.round, []);
    roundGroups.get(m.round)!.push(m);
  }

  // Sort rounds chronologically
  const sortedRounds = [...roundGroups.keys()].sort((a, b) =>
    isLosers ? Math.abs(a) - Math.abs(b) : a - b
  );

  return sortedRounds.map(round => {
    const roundMatches = roundGroups.get(round)!;
    // Sort matches within round by their computed slot (vertical position)
    roundMatches.sort((a, b) => {
      const slotA = slotMap.slots.get(a.id) ?? 999;
      const slotB = slotMap.slots.get(b.id) ?? 999;
      return slotA - slotB;
    });
    return { round, matches: roundMatches };
  });
}
