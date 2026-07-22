// mulberry32 — small, fast, seeded PRNG. Same seed always produces the same
// sequence, which is what makes the simulation deterministic and replayable.
export function mulberry32(seed) {
  let a = seed | 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weightedPick(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [label, w] of entries) {
    if (r < w) return label;
    r -= w;
  }
  return entries[entries.length - 1][0];
}
