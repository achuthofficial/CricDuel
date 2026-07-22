// Phase 0 sign-off checks for server/data/players.json (spec §5.1 step 5).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const players = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'server', 'data', 'players.json'), 'utf8')
);

const NATIONS = ['India', 'Australia', 'England', 'West Indies', 'Pakistan', 'South Africa', 'Sri Lanka', 'New Zealand'];
const ROLES = ['OPEN', 'TOP', 'MID', 'WK', 'ALL', 'PACE', 'SPIN'];

const errors = [];

// Duplicate IDs
const ids = new Set();
for (const p of players) {
  if (ids.has(p.id)) errors.push(`Duplicate id: ${p.id}`);
  ids.add(p.id);
}

// Rating ranges: field is always populated; bat/strike/bowl/economy are
// either 0 (not applicable to the role) or in the meaningful 25-96 band.
for (const p of players) {
  if (p.field == null || p.field < 40 || p.field > 96) {
    errors.push(`${p.id}: field rating out of range or null (${p.field})`);
  }
  for (const key of ['bat', 'strike', 'bowl', 'economy']) {
    const v = p[key];
    if (v !== 0 && (v < 20 || v > 96)) {
      errors.push(`${p.id}: ${key} out of range (${v})`);
    }
  }
}

// No nation x role bucket may be empty (hard wheel-deadlock guard)
for (const nation of NATIONS) {
  for (const role of ROLES) {
    const count = players.filter((p) => p.nation === nation && p.role === role).length;
    if (count === 0) {
      errors.push(`Deadlock: ${nation} x ${role} has zero candidates`);
    } else if (count < 2) {
      console.warn(`Warning: ${nation} x ${role} has only ${count} candidate(s)`);
    }
  }
}

if (errors.length) {
  console.error(`${errors.length} validation error(s):`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log(`OK: ${players.length} players validated, no deadlocks, all ratings in range.`);
