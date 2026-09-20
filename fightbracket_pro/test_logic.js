import { computeBracketSlots } from './src/app/data/bracketEngine.js';

const mockMatches = [
  { id: "M_A", round: 1, prereqSetIds: [] },
  { id: "M_B", round: 1, prereqSetIds: [] },
  { id: "M_N", round: 2, prereqSetIds: ["M_A", "M_B"] }
];

const slotMap = computeBracketSlots(mockMatches);
console.log("SlotMap:", slotMap);

for (const match of mockMatches) {
  const nextMatch = mockMatches.find(m => m.prereqSetIds?.includes(match.id));
  console.log(`\nMatch ${match.id}:`);
  console.log("  nextMatch:", nextMatch?.id);
  
  if (nextMatch && slotMap) {
    const slot = slotMap.slots.get(match.id);
    const nextSlot = slotMap.slots.get(nextMatch.id);
    console.log("  slot:", slot);
    console.log("  nextSlot:", nextSlot);
    
    if (nextSlot !== undefined && slot !== undefined) {
      const dy = (nextSlot - slot) * 120;
      console.log("  dy:", dy);
    }
  }
}
