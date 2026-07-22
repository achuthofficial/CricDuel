import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateMatch } from './engine.js';
import { ALL_PLAYERS } from '../draft.js';

function sampleSquad(role, count, offset = 0) {
  return ALL_PLAYERS.filter((p) => p.role === role).slice(offset, offset + count);
}

function buildSquad(offset = 0) {
  return [
    ...sampleSquad('OPEN', 2, offset),
    ...sampleSquad('TOP', 1, offset),
    ...sampleSquad('MID', 2, offset),
    ...sampleSquad('WK', 1, offset),
    ...sampleSquad('ALL', 2, offset),
    ...sampleSquad('PACE', 2, offset),
    ...sampleSquad('SPIN', 1, offset),
  ];
}

test('simulateMatch is deterministic for a fixed seed', () => {
  const squadA = buildSquad(0);
  const squadB = buildSquad(1);
  assert.equal(squadA.length, 11);
  assert.equal(squadB.length, 11);

  const r1 = simulateMatch(squadA, squadB, 12345);
  const r2 = simulateMatch(squadA, squadB, 12345);
  assert.deepEqual(r1, r2);
});

test('simulateMatch produces a valid result shape', () => {
  const squadA = buildSquad(0);
  const squadB = buildSquad(1);
  const result = simulateMatch(squadA, squadB, 999);

  assert.ok([0, 1].includes(result.result.winnerIdx));
  assert.ok(result.innings1.log.length > 0);
  assert.ok(result.innings2.log.length > 0);
  assert.ok(result.innings1.wickets <= 10);
  assert.ok(result.innings2.wickets <= 10);
  assert.ok(result.playerOfMatchId);

  for (const ball of [...result.innings1.log, ...result.innings2.log]) {
    assert.ok(ball.strikerId);
    assert.ok(ball.bowlerId);
    assert.ok(ball.commentary.length > 0);
  }
});

test('different seeds usually produce different results', () => {
  const squadA = buildSquad(0);
  const squadB = buildSquad(1);
  const r1 = simulateMatch(squadA, squadB, 1);
  const r2 = simulateMatch(squadA, squadB, 2);
  assert.notDeepEqual(r1.innings1.log, r2.innings1.log);
});
