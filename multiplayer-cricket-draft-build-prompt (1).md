# Build Prompt — "Deadball" : Head-to-Head Cricket Draft (React, Multiplayer)

> Paste this whole file into your coding assistant (Claude Code, Cursor, v0, etc.) as the brief.
> Build it in the phases listed at the bottom — do not attempt the whole thing in one shot.

---

## 1. The brief

Build a free, browser-based, **two-player head-to-head cricket draft game** in React.

One player creates a room and gets a short share code. A friend joins with that code. Both players then draft an XI of cricket legends **in secret** — neither can see the other's picks, or even which players are still available to the other. Every pick is gated behind a **spin**: you spin a wheel, it lands on a squad, and you pick from that squad for the slot you're filling. That randomness is the whole game — you are building the best XI you can from hands you did not choose.

When both players tap **Ready**, the two XIs are revealed simultaneously and a ball-by-ball match is simulated between them. One winner. Then a rematch button.

The entire experience must be excellent on a phone held in one hand. Mobile is the primary target, not an afterthought.

**Originality note:** this is inspired by the genre, not a clone. Write your own player database, your own copy, your own name and art. Do not scrape or reproduce another site's assets, wording, or player ratings.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 18 + Vite** | Fast dev loop, small bundle |
| Styling | **Tailwind CSS** + a few hand-written CSS keyframes | Utility speed, custom motion where it matters |
| Local state | **Zustand** | Less ceremony than Redux for this size |
| Realtime | **Node + Express + Socket.IO** | Rooms are a native concept; server can keep secrets |
| Server state | **In-memory `Map`** (rooms expire after 30 min idle) | No DB needed for v1 |
| Animation | **Framer Motion** for layout/reveal, raw CSS transforms for the wheel | 60fps wheel needs no JS per frame |
| Hosting | Vite build on Vercel/Netlify + server on Render/Railway/Fly | — |

**Alternative if you want zero backend:** Firebase Realtime Database with security rules that hide the opponent's `squad` node until both `ready` flags are true. Socket.IO is the recommended path because the secrecy rule is easier to enforce and the simulation stays server-authoritative.

---

## 3. Game rules

### 3.1 The XI

Eleven slots, drafted in a fixed order. Each slot accepts only players of matching role:

| # | Slot | Accepts |
|---|---|---|
| 1 | Opener | `OPEN` |
| 2 | Opener | `OPEN` |
| 3 | Top order | `TOP` |
| 4 | Middle order | `MID` |
| 5 | Middle order | `MID` |
| 6 | Wicketkeeper | `WK` |
| 7 | All-rounder | `ALL` |
| 8 | All-rounder | `ALL` |
| 9 | Pace | `PACE` |
| 10 | Pace | `PACE` |
| 11 | Spin | `SPIN` |

Fixed slot order means both players draft in lockstep — good for pacing, and it means the "who's ahead" progress bar is meaningful.

### 3.2 The spin

For each slot:

1. Player taps **Spin**.
2. The wheel has **8 segments**, each a national squad (India, Australia, England, West Indies, Pakistan, South Africa, Sri Lanka, New Zealand). Label segments with **national flags or custom geometric marks in your own palette — never cricket board crests**, which are registered trademarks (see §5.1). Segments the player has already used **three times** are greyed out and skipped, so no one drafts an all-India XI.
3. Wheel lands on a squad. The card deck for that squad × current role is revealed — between 3 and 6 candidates.
4. Player picks one. Locked. Advance to next slot.

**Re-spins:** each player gets **3 re-spins** for the whole draft. Spending one re-rolls the wheel for the current slot. This is the only real strategic lever — spend them or bank them.

**Pick timer:** 40 seconds per slot. On expiry, auto-pick the highest-rated available candidate and advance. Show the timer as a thin bar, not a panic-inducing countdown — turn it red only in the last 8 seconds.

### 3.3 Secrecy — the rule that matters most

Until both players are ready:

- A player receives **only their own** picks over the socket.
- The server never sends the opponent's `squad` array to the client. Not hidden with CSS, not filtered client-side — **never transmitted**.
- The opponent's progress is broadcast as a **number only**: `{ opponentSlotsFilled: 4 }`. Not names, not nations, not ratings.
- Player pools are drawn from the same database, and **duplicates across the two teams are allowed**. Do not implement a shared "taken" list — that would leak the opponent's picks by omission.

Write a test for this. Assert that the payload sent to socket A during `DRAFTING` contains no substring matching any player ID in B's squad.

### 3.4 Ready and reveal

- Both players see a **Ready** button once their XI is complete.
- Tapping Ready is reversible until the opponent also readies up.
- When the second player readies: server locks both squads, runs the simulation, and emits the full ball-by-ball log plus a `startAt` timestamp ~1.5s in the future. Both clients animate the same log from the same moment, so the two phones stay in sync without further chatter.

---

## 4. Room lifecycle

```
        create                join            both XIs full       both ready         match end
  ─────────────▶ LOBBY ─────────────▶ DRAFTING ──────────▶ READY_CHECK ────────▶ SIMULATING ────────▶ RESULT
                   │                                                                                    │
                   │◀───────────────────────── rematch (same room, new seed) ───────────────────────────┘
```

### Room codes

- **4 characters**, uppercase, from the alphabet `ACDEFGHJKLMNPQRTUVWXY34679` — ambiguous glyphs (`B/8`, `I/1`, `O/0`, `S/5`, `Z/2`) removed so codes are readable aloud and off a screenshot.
- Collision check against active rooms; regenerate on clash.
- Also generate a deep link: `https://yourgame.com/j/AB3K`. Joining via link auto-fills the code.
- Share via `navigator.share()` when available, clipboard fallback with a toast.

### Socket events

**Client → server**
```
room:create   { displayName }
room:join     { code, displayName }
draft:spin    { useRespin: boolean }
draft:pick    { playerId }
player:ready  { ready: boolean }
room:rematch  {}
room:leave    {}
```

**Server → client**
```
room:state       { code, phase, you, opponent: { name, connected, slotsFilled }, config }
draft:wheel      { segments, landedIndex, spinDuration, seed }   // sent only to the spinner
draft:candidates { slot, players[] }                              // only to the spinner
draft:confirmed  { slot, player }                                 // only to the picker
draft:progress   { opponentSlotsFilled }                          // number only
match:start      { startAt, innings1[], innings2[], result, squads } // first time both XIs are sent
error            { code, message }
```

---

## 5. Data models

```ts
type Role = 'OPEN' | 'TOP' | 'MID' | 'WK' | 'ALL' | 'PACE' | 'SPIN';

interface Player {
  id: string;
  name: string;
  nation: string;
  era: '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';
  role: Role;
  bat: number;      // 0–100  run-scoring quality
  strike: number;   // 0–100  scoring tempo / boundary frequency
  bowl: number;     // 0–100  wicket-taking threat (0 for pure batters)
  economy: number;  // 0–100  run containment (higher = tighter)
  field: number;    // 0–100  small modifier on run-outs and catches
}

interface RoomPlayer {
  socketId: string;
  displayName: string;
  connected: boolean;
  squad: (Player | null)[];   // length 11
  respinsLeft: number;
  nationCounts: Record<string, number>;
  ready: boolean;
}

interface Room {
  code: string;
  phase: 'LOBBY' | 'DRAFTING' | 'READY_CHECK' | 'SIMULATING' | 'RESULT';
  players: [RoomPlayer, RoomPlayer?];
  currentSlot: number;
  seed: number;
  createdAt: number;
  lastActivity: number;
}
```

---

## 5.1 Where the player data comes from

**Do not integrate a live cricket API.** CricAPI, Roanuz, Sportmonks and similar are built for live scores and fixtures — paid, rate-limited, and irrelevant here. This game needs ~180 historical players, which is a **static JSON file built once** and committed to the repo. Zero runtime dependency, zero cost, works offline.

### Sources for the raw facts

| Source | What it gives | Licence / terms | Use it for |
|---|---|---|---|
| **Cricsheet** (cricsheet.org) | Ball-by-ball data, Tests/ODIs/T20Is + domestic, ~2005 onward | Open Database Licence, attribution required — **verify the current licence text on the site before shipping** | Deriving accurate phase-specific numbers (powerplay vs death strike rates) for modern players |
| **Wikidata** | Career aggregates, nations, career spans, roles | CC0 — public domain, no attribution needed | Bulk import via SPARQL. Cleanest legal position available |
| **Wikipedia** infoboxes | Same aggregates, human-readable | CC BY-SA | Spot-checking and filling gaps |
| **ESPNcricinfo Statsguru** | The best statistical resource in cricket | Terms restrict automated scraping | Reading manually and typing figures into your own file. Do **not** point a scraper at it |

**The era gap matters.** Cricsheet's coverage starts around 2005, so it gives you nothing for your 1970s–1990s cohort. Those players need career aggregates from Wikidata or manual entry. Plan for a hybrid: rich derived data for modern players, career averages for historical ones, normalised onto the same 0–100 scale.

For 180 players, manual entry is realistically 4–6 hours. That is the recommended path. It is legally clean, and you will make better role assignments by eye than any parser will.

### The ratings are derived, not sourced

Nobody publishes `bat: 87`. You compute the five rating fields from public career statistics, and **that derivation is your own original work** — no licensing question, and it is where all your game balance lives. The ratings *are* the design.

```js
// scripts/derive-ratings.js
//
// Rule one: normalise WITHIN an era cohort, never across eras.
// A 1985 strike rate of 75 was blistering. In 2025 it is a liability.
// Without cohort normalisation every modern batter outranks every
// historical one, the wheel stops being interesting, and the game dies.

const z = (value, mean, stdDev) => (value - mean) / stdDev;

// mean 72, ±2σ lands around 54–90, rare outliers to 96
const toRating = (zScore) =>
  Math.min(96, Math.max(50, Math.round(72 + 9 * zScore)));

function derive(player, cohort) {
  return {
    bat:     toRating(z(player.battingAvg,   cohort.battingAvg.mean,  cohort.battingAvg.sd)),
    strike:  toRating(z(player.battingSR,    cohort.battingSR.mean,   cohort.battingSR.sd)),
    bowl:    toRating(z(-player.bowlingSR,   cohort.bowlingSR.mean,   cohort.bowlingSR.sd)),
    economy: toRating(z(-player.economyRate, cohort.economyRate.mean, cohort.economyRate.sd)),
    field:   null, // judgment call — catches per match, plus your own eye
  };
}
```

Two decisions baked in above:

- Use **bowling strike rate** (balls per wicket), not bowling average, for `bowl`. It measures wicket-taking threat, which is exactly what the simulation consumes, and it does not get muddied by economy — which you are already scoring separately.
- `bowl` and `economy` are computed from **negated** inputs because lower is better in both.

**Then hand-tune.** The formula will get roughly 85% right and then rate somebody absurdly. Override those by hand and leave a comment saying why. This is a game, not a regression model. Target the final spread at 55–95 with very few above 90, so the great players feel great.

### Asset rules — enforce these

| Asset | Status |
|---|---|
| Player names, career statistics | Facts. Not copyrightable. Fine to use |
| Player photographs | Copyrighted, almost always agency-owned. **Never use** |
| Cricket board and tournament logos (BCCI, CA, ECB, ICC) | Registered trademarks. **Never use** |
| National flags | Generally free to use |
| Your derived ratings | Yours |

For player art, use illustrated silhouettes, monogram initials, or geometric avatars generated deterministically from the player ID. This looks more coherent than a grid of mismatched photographs anyway, and it costs nothing.

If you use Cricsheet at any stage, the attribution goes in the About page. Non-negotiable — it is a licence condition, and the project is one person's unpaid work.

One further flag: personality and publicity rights are actively litigated in India, with several celebrity injunctions granted by the Delhi High Court in recent years. Historical players in a free, non-commercial game is low risk. A monetised product built on currently active players is a materially different question — take actual legal advice before charging for this.

### Build pipeline

```
scripts/
  1-fetch-wikidata.js     SPARQL query → raw-players.csv (~500 rows)
  2-select.js             hand-pick 180: ~20 per nation, spread across 6 eras,
                          assign roles manually
  3-derive-ratings.js     bucket by era → compute cohort mean/sd → apply formula
  4-overrides.json        hand-tuned corrections, each with a comment
  5-build.js              merge + validate → server/data/players.json
```

Validation step 5 must assert, and fail the build otherwise:

- Every role has at least 6 candidates per nation, or the wheel can deadlock
- All ratings fall in 50–96
- No duplicate IDs
- Every player has a non-null `field` rating

---

---

## 6. Simulation engine

Runs **server-side only**. Clients receive the completed log and animate it.

### Format

**20 overs per side.** Player A bats first (decided by a coin toss shown in the UI), Player B chases. 240 balls total, animated at ~120ms per ball with pauses on wickets and boundaries — roughly 45 seconds of match. Long enough to feel like an event, short enough to rematch immediately.

Make the over count a config value so a 50-over mode can be switched on later.

### Determinism

Use a seeded PRNG (`mulberry32`) so a given seed + two squads always produces the same match. This makes bugs reproducible and lets you add a "share your match" replay link later.

### Per-ball model

For each delivery, take the striker and the current bowler:

```
advantage   = (striker.bat - bowler.bowl) / 100
tempo       = striker.strike / 100
phase       = powerplay (ov 1-6) | middle (7-15) | death (16-20)
```

Build an outcome distribution over `[0, 1, 2, 3, 4, 6, WICKET, EXTRA]`:

- **Wicket base** ~4.5% per ball, scaled up by `bowler.bowl`, down by `striker.bat`, and up in the death overs when the batter is pushing tempo.
- **Boundary chance** scales with `tempo` and `advantage`, up sharply at the death, down in the middle overs.
- **Dot chance** scales with `bowler.economy` and drops as `tempo` rises.
- **Extras** ~3%, mostly wides.

Then:

- Rotate strike on odd runs and at over end.
- New batter in on a wicket, in slot order.
- All out at 10 wickets; innings ends there or at 120 balls.
- Bowlers: only `PACE`, `SPIN`, and `ALL` players bowl. Max 4 overs each. Pick the next bowler as the highest-rated eligible bowler with overs remaining, with a small randomiser so it isn't identical every match.
- Second innings ends the moment the target is passed.

### Output

```ts
interface BallEvent {
  innings: 1 | 2;
  over: number; ball: number;
  strikerId: string; bowlerId: string;
  outcome: 'DOT'|'1'|'2'|'3'|'FOUR'|'SIX'|'WICKET'|'WIDE'|'NOBALL';
  dismissal?: 'bowled'|'caught'|'lbw'|'run out'|'stumped';
  scoreAfter: { runs: number; wickets: number };
  commentary: string;   // one short line, generated from a template bank
}
```

Write ~8 commentary templates per outcome type and pick with the same seeded PRNG. Keep them short — one line, no purple prose. "Beaten, timber." beats a paragraph.

---

## 7. Screens

All screens are single-column, max-width `440px`, centred, with content in the lower two-thirds where the thumb reaches.

### 7.1 Home
Title lockup. Two large stacked buttons: **Create room** / **Join room**. Name field above them, remembered in `localStorage`. Below the fold: a two-line "how it works" and nothing else. No marketing.

### 7.2 Lobby
- The room code rendered **very large** in mono, letter-spaced, tappable to copy.
- **Share invite** button (native share sheet).
- Two player slots: you, filled. Opponent, an empty dashed outline with a pulsing "waiting" state that fills in with their name on join.
- Host sees **Start draft**, enabled only when both are present. Guest sees "Waiting for host".
- A quiet "Leave room" text link at the bottom.

### 7.3 Draft
The screen you'll spend the most time on. Get it right.

```
┌──────────────────────────────────┐
│ ●● you        vs        ●● them  │  ← two 11-dot progress rails
│ ▓▓▓▓▓░░░░░░              ▓▓▓░░░░ │
├──────────────────────────────────┤
│  SLOT 4 · MIDDLE ORDER           │  ← eyebrow, current slot
│  ▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░  40s         │  ← timer bar
│                                  │
│         ╭──────────╮             │
│         │  WHEEL   │             │  ← 8 segments, flags (no board logos)
│         ╰──────────╯             │
│                                  │
│   ┌────────────────────────┐     │
│   │  SPIN                  │     │  ← primary, thumb zone
│   └────────────────────────┘     │
│   re-spins left  ● ● ○           │
└──────────────────────────────────┘
```

After the wheel lands, candidates rise from the bottom as a **bottom sheet** (not a centre modal — bottom sheets are reachable). Each candidate is a card: name, nation, era chip, and four small stat bars. Tap to select, tap **Confirm pick** to lock. Two-step so nobody misfires.

Your filled slots live in a collapsed strip at the top that expands to a full XI list on tap.

**The opponent rail shows dots only.** Never names.

### 7.4 Ready check
Your XI laid out as a scorecard. A single big **Ready** button. Once tapped, it becomes a calm "Waiting for opponent" state with their name and a soft pulse. When they ready up, a 3-2-1 count and the lights change.

### 7.5 Match
- Scoreboard pinned top: `147/4 (14.2)` in mono, with target and required rate in the second innings.
- Below it, the **ledger** — the signature element, see §8.
- Commentary line updates per ball, one line, cross-fading.
- Bottom bar: **Skip to result** (always available — respect people's time) and a speed toggle (1× / 2×).
- Wicket = the screen takes a red ink blot, 400ms. Six = a warm floodlight flash from the top edge. Use these two moments and nothing else; if every ball is animated, no ball is.

### 7.6 Result
- Winner headline. Margin stated properly in cricket terms — "won by 23 runs" or "won by 4 wickets".
- Both XIs side by side with individual scores, your innings in navy ink, theirs in red.
- Player of the match.
- **Rematch** (primary) and **Share result** (secondary — renders a compact result card image via canvas).

---

## 8. Design direction

Do not build this in generic dark-mode-with-one-accent. The design has a specific thesis:

> **Drafting is a paper scorebook. The match is a floodlit night.**
> The moment both players hit Ready, the interface transitions from ledger paper to a floodlit ground. That transition is the signature.

This is drawn from the subject: cricket scorers traditionally keep the book in **two ink colours**, one per innings. That maps exactly onto a two-player head-to-head, and it's the visual spine of the whole product.

### Tokens

```css
--ledger:     #EDE6D6;  /* aged scorebook paper — draft phase ground */
--ink:        #14213D;  /* scorer's navy — your innings, primary text */
--scorer-red: #C1121F;  /* scorer's red — opponent's innings, wickets */
--night:      #071A14;  /* floodlit outfield at dusk — match phase ground */
--turf:       #1FA97C;  /* live/active states, the "in play" green */
--floodlight: #FFE9B0;  /* lamp glow — boundaries, sixes, the winner */
```

### Type

| Role | Face | Notes |
|---|---|---|
| Display | **Bricolage Grotesque** 700/800 | Headlines, winner, room code. Used with restraint |
| Body | **Inter Tight** 400/600 | Everything readable |
| Data | **Chivo Mono** 500 | All scores, codes, overs. `font-variant-numeric: tabular-nums` is mandatory — digits must not jitter as the score ticks |

Type scale: `12 / 14 / 16 / 20 / 28 / 40 / 64`. Nothing between. Body copy never below 16px on mobile.

### The ledger (signature element)

During the match, render a **scorebook grid** — 20 rows (overs) × 6 columns (balls), cells stamping in one by one as the simulation plays. Innings 1 in navy, innings 2 in red, on the same grid so the two innings visibly race each other. Dots are a small dot, runs are the numeral, a wicket is a red `W` in a circle, a six gets a floodlight-coloured cell.

By the end you have a complete, readable, screenshot-worthy scorebook page. That's the artefact people share.

### Motion

- Wheel: single CSS transform, `cubic-bezier(.15,.9,.25,1)`, 3.2s, 4–6 full rotations plus the landing offset. Never animate with JS per frame.
- Ledger cells: 80ms stagger, scale from 0.8, no bounce.
- Paper → night transition: 900ms, background crossfade with the floodlights ramping in from the top corners.
- **Respect `prefers-reduced-motion`**: wheel resolves in 400ms with no spin, ledger fills instantly, no flashes.

---

## 9. Mobile UX — non-negotiables

Treat every one of these as a bug if missing.

**Layout**
- [ ] Portrait-first. Test at 360×640 (small Android) and 390×844 (iPhone) before anything else.
- [ ] `env(safe-area-inset-bottom)` padding on every fixed bottom bar — buttons must not sit under the home indicator.
- [ ] `100dvh`, not `100vh`. The URL bar collapse must not break layout.
- [ ] Primary actions in the bottom third. Nothing critical in the top corners.
- [ ] No horizontal scroll anywhere, at any width.

**Touch**
- [ ] Minimum 44×44px tap targets, 8px minimum gap between adjacent targets.
- [ ] `touch-action: manipulation` to kill the 300ms tap delay.
- [ ] No hover-only affordances. Every hover state has a `:active` equivalent.
- [ ] Bottom sheets, not centre modals. Swipe-to-dismiss where a sheet is dismissible.
- [ ] Haptics via `navigator.vibrate()` on: wheel stop (20ms), pick confirm (10ms), wicket (30ms), win (60ms). Behind a settings toggle.

**Input**
- [ ] Room code field: `inputMode="text"`, `autoCapitalize="characters"`, `maxLength={4}`, auto-advance and auto-submit on the fourth character.
- [ ] Name field: `autoComplete="nickname"`, `enterKeyHint="go"`.
- [ ] Never let the keyboard cover the field being typed into.

**Session**
- [ ] `navigator.wakeLock` during the match so the screen doesn't sleep mid-chase.
- [ ] Reconnect: socket auto-reconnects, rejoins the room by code + a `sessionId` in `sessionStorage`, and restores exact draft state. Backgrounding the app for 30 seconds must not lose the game.
- [ ] Connection banner slides down on disconnect: "Reconnecting…" — never a blocking modal.
- [ ] If the opponent disconnects mid-draft, show it in their rail and give them 90 seconds before offering the remaining player a "Claim win / Leave" choice.

**Performance**
- [ ] First contentful paint under 1.5s on a mid-range Android over 4G.
- [ ] Lazy-load the player database and the simulation animation code — the home screen needs neither.
- [ ] Wheel and ledger animations stay on `transform`/`opacity` only. No layout thrash.
- [ ] Preload the two display fonts, `font-display: swap`.

**Accessibility**
- [ ] Visible focus rings, keyboard-navigable throughout.
- [ ] `aria-live="polite"` on the score, `aria-live="assertive"` on wickets.
- [ ] Colour is never the only signal — the wicket blot also carries a `W` glyph, the two innings are also labelled, not just navy vs red.
- [ ] Contrast: 4.5:1 body, 3:1 large text. Check `--turf` on `--night` specifically.

---

## 10. Edge cases to handle explicitly

| Case | Behaviour |
|---|---|
| Join code doesn't exist | Inline error under the field, field shakes once, code cleared |
| Room already has 2 players | "This room is full" — offer to create a new one |
| Host leaves in lobby | Room closes, guest sent home with a toast |
| Player leaves mid-draft | 90s grace, then opponent gets Claim win / Leave |
| Both disconnect | Room garbage-collected after 30 min idle |
| Pick timer expires | Auto-pick highest-rated candidate, brief "auto-picked" toast |
| Wheel lands on an exhausted nation | Impossible — exclude exhausted segments before the spin, don't correct after |
| Rematch | Same room and players, fresh seed, respins reset, phase back to `DRAFTING` |
| Tie | Super over. One over each, same engine. If still tied, boundary count |
| Refresh mid-game | `sessionStorage` session ID rejoins and restores. Never a lost game |

---

## 11. File structure

```
/client
  /src
    /components
      /ui           Button, Sheet, Toast, ProgressRail, StatBar
      /draft        Wheel, CandidateSheet, SlotStrip, PickTimer
      /match        Scoreboard, Ledger, CommentaryLine, MatchControls
      /result       WinnerCard, ScorecardCompare, ShareCard
    /screens        Home, Lobby, Draft, ReadyCheck, Match, Result
    /store          useGameStore.ts, useSocket.ts
    /lib            format.ts, haptics.ts, share.ts
    /styles         tokens.css, animations.css
/server
  index.js          Express + Socket.IO bootstrap
  rooms.js          Room map, lifecycle, GC
  draft.js          Wheel logic, candidate selection, secrecy filters
  sim/
    engine.js       Ball-by-ball simulation
    rng.js          mulberry32
    commentary.js   Template bank
  data/players.json Built artefact — commit it, do not fetch at runtime

/scripts           One-time data pipeline, see §5.1
  1-fetch-wikidata.js
  2-select.js
  3-derive-ratings.js
  4-overrides.json
  5-build.js
```

---

## 12. Build order

Ship each phase working before starting the next.

**Phase 0 — Player data.** Run the §5.1 pipeline and produce a validated `players.json`. Do this before any UI work, because every later phase depends on the shape of this file, and because the hand-tuning pass needs time to sit. A placeholder of 20 fake players is fine for Phases 1–3 if you want to work in parallel, but the real file must land before Phase 4 — simulation balance is meaningless against fake ratings.

**Phase 1 — Rooms.** Server, socket connection, create/join by code, lobby with both players visible, disconnect handling. No game yet. This is the risky part; do it first.

**Phase 2 — Draft loop, single slot.** Wheel spins, lands, candidates appear, pick confirms, state syncs. Get the wheel feeling good — it's the thing players touch most.

**Phase 3 — Full draft.** All 11 slots, re-spins, nation caps, timer, opponent progress rail, secrecy tests passing.

**Phase 4 — Simulation.** Engine on the server, unit-tested with fixed seeds. Text-only output first, no UI.

**Phase 5 — Match screen.** Scoreboard, ledger, commentary, sync via `startAt`, skip and speed controls.

**Phase 6 — Result and rematch.** Winner card, scorecard compare, share image, rematch loop.

**Phase 7 — Polish pass.** Every checkbox in §9. Test on a real phone, on real mobile data, with a friend in another location. Not on a desktop browser resized to look like a phone.

---

## 13. Definition of done

- Two people on two phones on different networks can play start to finish without either explaining anything to the other.
- Neither player can discover the other's picks before Ready — verified by inspecting network traffic, not by trusting the UI.
- A dropped connection at any point in the draft recovers to the same state.
- The whole loop — create, join, draft, sim, result — takes under 5 minutes.
- The final ledger is worth screenshotting.
- `players.json` passes every validation assertion in §5.1, and no wheel segment can deadlock for lack of candidates.
- No player photographs, board logos, or tournament marks appear anywhere in the build.
- Data attribution is present on the About page for every source whose licence requires it.
