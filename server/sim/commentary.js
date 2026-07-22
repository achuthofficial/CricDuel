// ~8 short templates per outcome, picked with the same seeded PRNG the ball
// engine uses so a given seed always narrates the same way.
const TEMPLATES = {
  DOT: [
    'Solid defence, no run.',
    'Beaten outside off.',
    'Blocked back down the pitch.',
    'Left alone, well outside off.',
    'Worked to mid-on, no run.',
    'Ducks under a bouncer.',
    'Played and missed.',
    'Dead bat, back to the bowler.',
  ],
  1: [
    'Tucked away for a single.',
    'Nudged into the gap.',
    'Quick single, good running.',
    'Pushed to mid-off, one run.',
    'Worked off the pads.',
    'Driven to long-on, easy single.',
    'Steered past gully.',
    'Called through for one.',
  ],
  2: [
    'Driven into the gap, they come back for two.',
    'Good placement, two runs.',
    'Splits the field, easy two.',
    'Pushed wide of mid-on, two.',
    'Two more to the total.',
    'Well run between the wickets.',
    'Finds the gap square of the wicket.',
    'Two taken, sharp running.',
  ],
  3: [
    'Great effort in the deep, they get three.',
    'Fielder cuts it off late, three run.',
    'Excellent running, three taken.',
    'Chased down but too late — three.',
  ],
  FOUR: [
    'Cracked through the covers, FOUR.',
    'Elegant drive, races to the boundary.',
    'Punched off the back foot, FOUR.',
    'Finds the gap, no chance for the fielder.',
    'Threaded through point, FOUR.',
    'Flicked off the pads, races away.',
    'Short and cut hard, FOUR.',
    'Full and driven, FOUR all the way.',
  ],
  SIX: [
    'Launched over long-on, SIX!',
    'Into the stands, huge hit.',
    'Picks the length early — SIX.',
    'Smashed flat over the bowler\'s head.',
    'Enormous strike, SIX.',
    'Cleared the ropes with ease.',
    'That\'s gone miles — SIX.',
    'Muscled over deep midwicket.',
  ],
  WICKET: [
    'Beaten, timber.',
    'Huge appeal — and given!',
    'Skied it, easy catch.',
    'Sharp take, gone.',
    'Trapped dead in front.',
    'Direct hit, run out.',
    'Edged, taken behind.',
    'Big wicket, right on cue.',
  ],
  WIDE: [
    'Strays down leg, called wide.',
    'Too wide, signalled.',
    'Loses his line, wide.',
    'Umpire\'s arm goes out — wide.',
  ],
  NOBALL: [
    'Overstepped — no ball.',
    'Front foot over the line.',
    'No ball, free hit coming up.',
  ],
};

export function pickCommentary(outcome, rng) {
  const bank = TEMPLATES[outcome] ?? TEMPLATES.DOT;
  return bank[Math.floor(rng() * bank.length)];
}
