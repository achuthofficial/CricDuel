// Fixed 11-slot draft order (spec §3.1). Each slot accepts exactly one role.
export const SLOT_ROLES = ['OPEN', 'OPEN', 'TOP', 'MID', 'MID', 'WK', 'ALL', 'ALL', 'PACE', 'PACE', 'SPIN'];

export const NATIONS = [
  'India',
  'Australia',
  'England',
  'West Indies',
  'Pakistan',
  'South Africa',
  'Sri Lanka',
  'New Zealand',
];

export const MAX_PER_NATION = 3;
export const RESPINS_PER_PLAYER = 3;
export const PICK_TIMER_SECONDS = 40;
