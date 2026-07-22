# CricDuel

A free, browser-based, two-player head-to-head cricket draft game.

One player creates a room and shares a short code. A friend joins. Both players
then draft an XI of cricket legends **in secret** — neither can see the
other's picks, or even which players are still available to the other. Every
pick is gated behind a spin of an 8-segment wheel: it lands on a national
squad, and you pick from that squad for the slot you're filling. When both
players are ready, the two XIs are revealed simultaneously and a ball-by-ball
20-over match is simulated between them.

> Inspired by the genre, not a clone. Original player database, original
> ratings, original art direction — see [Player data](#player-data) below.

## How it plays

1. **Create or join** a room with a 4-character code.
2. **Draft in secret** — 11 fixed slots (openers, top order, middle order,
   wicketkeeper, all-rounders, pace, spin), each filled by spinning a wheel of
   national squads and picking from whichever 3–6 candidates it reveals. Three
   re-spins banked for the whole draft; a 40-second pick timer keeps things
   moving.
3. **Ready up.** Once both players are ready, squads lock and a seeded,
   deterministic ball-by-ball simulation runs server-side.
4. **Watch the match** play out as a scorebook ledger stamps in over by over,
   navy ink for your innings, red for theirs, on a floodlit night background.
5. **Rematch** instantly in the same room.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Local state | Zustand |
| Realtime | Node + Express + Socket.IO |
| Server state | In-memory (rooms expire after 30 min idle) — no DB |
| Animation | Framer Motion for reveals, CSS transforms for the wheel/ledger |

## Running locally

Requires Node 20+.

```bash
npm install --prefix client
npm install --prefix server
npm run dev
```

This starts the Socket.IO server on `:3001` and the Vite dev server on
`:5173`. Open `http://localhost:5173` in two browser windows (or two
devices on the same network, pointing at your machine's LAN IP) to play
against yourself.

Useful scripts from the repo root:

```bash
npm run validate:players   # sanity-checks server/data/players.json
npm run test:server        # server unit tests (secrecy + sim determinism)
```

## Project structure

```
/client        React app — screens, components, Zustand store, design tokens
/server        Express + Socket.IO server, room/draft logic, sim engine
/scripts       One-time player-data build pipeline (roster → ratings → JSON)
```

See `server/index.js` for the socket protocol and `server/sim/engine.js` for
the ball-by-ball simulation model.

## Player data

The game ships with ~160 real historical and modern cricketers across the
8 wheel nations and six eras (1970s–2020s). Names, nations, and eras are
public facts; the five gameplay ratings (`bat`, `strike`, `bowl`, `economy`,
`field`) are **original derived work** — a hand-authored roster
(`scripts/roster.mjs`) tagged with a class/tier judgment per player, expanded
into final numbers by `scripts/build-players.mjs` using the same
cohort-relative idea a real stats pipeline would use (rate a player against
era peers, not across eras). No player photographs, board logos, or
tournament marks are used anywhere — wheel segments are original geometric
marks, not flags or crests.

## Secrecy model

The server never transmits a player's own squad to their opponent's socket —
not filtered client-side, never sent at all. The opponent's draft progress is
broadcast as a bare count (`slotsFilled`), nothing else. This is covered by an
automated test: `server/secrecy.test.js` asserts that no payload sent to one
player ever contains an ID unique to the other player's squad.

