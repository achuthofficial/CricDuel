import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, joinRoom, buildRoomState } from './rooms.js';
import { spin, revealCandidates, confirmPick, autoPick } from './draft.js';

function draftFullSquad(room, slot) {
  while (room.players[slot].squad.some((s) => s === null)) {
    const { wheel, error: spinErr } = spin(room, slot, false);
    assert.ifError(spinErr);
    const { candidates, error: candErr } = revealCandidates(room, slot);
    assert.ifError(candErr);
    if (candidates.players.length === 0) {
      // extremely unlikely given the validated dataset, but stay unstuck in a test
      continue;
    }
    const pick = candidates.players[0];
    const { error: pickErr } = confirmPick(room, slot, pick.id);
    assert.ifError(pickErr);
  }
}

test('opponent payload never contains the other player\'s squad', () => {
  const { room } = createRoom('Alice', 'socket-a');
  joinRoom(room.code, 'Bob', 'socket-b');

  draftFullSquad(room, 0);
  draftFullSquad(room, 1);

  assert.equal(room.phase, 'READY_CHECK');

  const stateForA = buildRoomState(room, 0);
  const stateForB = buildRoomState(room, 1);

  const bIds = room.players[1].squad.map((p) => p.id);
  const aIds = room.players[0].squad.map((p) => p.id);
  // Duplicates across the two teams are allowed by design (spec §3.3), so a
  // shared pick legitimately shows up in both players' own squads. Only ids
  // unique to the opponent are proof of a leak if they appear.
  const bIdsUniqueToB = bIds.filter((id) => !aIds.includes(id));
  const aIdsUniqueToA = aIds.filter((id) => !bIds.includes(id));

  const serializedForA = JSON.stringify(stateForA);
  const serializedForB = JSON.stringify(stateForB);

  // The opponent object must carry no squad, no player IDs, no names — only a count.
  assert.deepEqual(Object.keys(stateForA.opponent).sort(), ['connected', 'name', 'ready', 'slotsFilled'].sort());
  assert.deepEqual(Object.keys(stateForB.opponent).sort(), ['connected', 'name', 'ready', 'slotsFilled'].sort());

  for (const id of bIdsUniqueToB) {
    assert.ok(!serializedForA.includes(id), `A's payload leaked B's player id ${id}`);
  }
  for (const id of aIdsUniqueToA) {
    assert.ok(!serializedForB.includes(id), `B's payload leaked A's player id ${id}`);
  }

  // Sanity: each player's own state does contain their own full squad.
  assert.equal(stateForA.you.squad.filter(Boolean).length, 11);
  assert.equal(stateForB.you.squad.filter(Boolean).length, 11);
});

test('draft:candidates and draft:wheel content is only ever computed for the requesting player', () => {
  const { room } = createRoom('Alice', 'socket-a');
  joinRoom(room.code, 'Bob', 'socket-b');

  const { wheel } = spin(room, 0, false);
  assert.ok(wheel.segments.length === 8);
  const { candidates } = revealCandidates(room, 0);
  assert.ok(candidates.players.length >= 1 && candidates.players.length <= 6);

  // Player B has made no picks yet and has no pending state of A's.
  assert.equal(room.players[1].pendingWheel, null);
  assert.equal(room.players[1].pendingCandidates, null);
});
