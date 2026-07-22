import { mulberry32, weightedPick } from './rng.js';
import { pickCommentary } from './commentary.js';

const BOWLING_ROLES = new Set(['PACE', 'SPIN', 'ALL']);

function phaseOf(overIndex, oversPerSide) {
  const powerplayEnd = Math.round(oversPerSide * 0.3); // overs 1-6 of 20
  const deathStart = Math.round(oversPerSide * 0.75); // overs 16-20 of 20
  if (overIndex < powerplayEnd) return 'powerplay';
  if (overIndex >= deathStart) return 'death';
  return 'middle';
}

function simulateBall(striker, bowler, overIndex, oversPerSide, rng) {
  const advantage = (striker.bat - bowler.bowl) / 100;
  const tempo = striker.strike / 100;
  const phase = phaseOf(overIndex, oversPerSide);

  let pWicket = 0.045 + (bowler.bowl / 100) * 0.05 - (striker.bat / 100) * 0.03;
  if (phase === 'death') pWicket += tempo * 0.02;
  pWicket = Math.min(0.18, Math.max(0.01, pWicket));

  let pBoundary = 0.12 + tempo * 0.15 + advantage * 0.1;
  if (phase === 'death') pBoundary *= 1.4;
  if (phase === 'middle') pBoundary *= 0.7;
  pBoundary = Math.min(0.45, Math.max(0.03, pBoundary));

  let pDot = 0.35 + (bowler.economy / 100) * 0.25 - tempo * 0.2;
  pDot = Math.min(0.75, Math.max(0.1, pDot));

  const pExtra = 0.03;

  let remaining = 1 - pWicket - pBoundary - pDot - pExtra;
  if (remaining < 0) {
    const scale = (1 - pWicket - pExtra) / (pBoundary + pDot);
    pBoundary *= scale;
    pDot *= scale;
    remaining = 0;
  }

  const sixShare = Math.min(0.6, Math.max(0.15, tempo * 0.5 + advantage * 0.2));
  const pSix = pBoundary * sixShare;
  const pFour = pBoundary - pSix;
  const p1 = remaining * 0.7;
  const p2 = remaining * 0.25;
  const p3 = remaining - p1 - p2;

  const outcome = weightedPick(rng, [
    ['WICKET', pWicket],
    ['WIDE', pExtra * 0.8],
    ['NOBALL', pExtra * 0.2],
    ['DOT', pDot],
    ['1', p1],
    ['2', p2],
    ['3', p3],
    ['FOUR', pFour],
    ['SIX', pSix],
  ]);

  if (outcome === 'WICKET') {
    const stumpedWeight = bowler.role === 'SPIN' ? 0.12 : 0.02;
    const dismissal = weightedPick(rng, [
      ['caught', 0.45],
      ['bowled', 0.25],
      ['lbw', 0.15],
      ['run out', 0.13 - stumpedWeight],
      ['stumped', stumpedWeight],
    ]);
    return { outcome, runs: 0, dismissal };
  }

  if (outcome === 'WIDE' || outcome === 'NOBALL') return { outcome, runs: 1 };
  if (outcome === 'DOT') return { outcome, runs: 0 };
  if (outcome === 'FOUR') return { outcome, runs: 4 };
  if (outcome === 'SIX') return { outcome, runs: 6 };
  return { outcome, runs: Number(outcome) };
}

function pickBowler(eligible, oversBowled, maxOversPerBowler, lastBowlerId, rng) {
  let candidates = eligible.filter((b) => (oversBowled.get(b.id) || 0) < maxOversPerBowler && b.id !== lastBowlerId);
  if (candidates.length === 0) {
    candidates = eligible.filter((b) => (oversBowled.get(b.id) || 0) < maxOversPerBowler);
  }
  if (candidates.length === 0) candidates = eligible;
  const sorted = candidates.slice().sort((a, b) => b.bowl - a.bowl);
  const top = sorted.slice(0, Math.min(3, sorted.length));
  return top[Math.floor(rng() * top.length)];
}

function simulateInnings({ innings, battingSquad, bowlingSquad, oversPerSide, target, rng }) {
  const maxBalls = oversPerSide * 6;
  const maxOversPerBowler = Math.ceil(oversPerSide / 5);
  const eligible = bowlingSquad.filter((p) => BOWLING_ROLES.has(p.role));
  const oversBowled = new Map();

  let strikerIdx = 0;
  let nonStrikerIdx = 1;
  let nextInIdx = 2;
  let runs = 0;
  let wickets = 0;
  let ballCount = 0;
  let ballsThisOver = 0;
  let over = 0;
  let lastBowlerId = null;
  let currentBowler = pickBowler(eligible, oversBowled, maxOversPerBowler, null, rng);
  const log = [];
  const fallOfWickets = [];

  while (wickets < 10 && ballCount < maxBalls) {
    if (target !== null && runs >= target) break;
    if (ballsThisOver === 0) {
      currentBowler = pickBowler(eligible, oversBowled, maxOversPerBowler, lastBowlerId, rng);
    }

    const striker = battingSquad[strikerIdx];
    const result = simulateBall(striker, currentBowler, over, oversPerSide, rng);
    ballCount++;
    ballsThisOver++;

    if (result.outcome === 'WICKET') {
      wickets++;
      runs += result.runs;
      fallOfWickets.push({ wicket: wickets, runs, batsmanId: striker.id });
      if (wickets < 10 && nextInIdx < 11) {
        strikerIdx = nextInIdx;
        nextInIdx++;
      }
    } else {
      runs += result.runs;
      if ((result.outcome === '1' || result.outcome === '3') ) {
        [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
      }
    }

    log.push({
      innings,
      over: over + 1,
      ball: ballsThisOver,
      strikerId: striker.id,
      bowlerId: currentBowler.id,
      outcome: result.outcome,
      dismissal: result.dismissal,
      scoreAfter: { runs, wickets },
      commentary: pickCommentary(result.outcome, rng),
    });

    if (ballsThisOver === 6) {
      oversBowled.set(currentBowler.id, (oversBowled.get(currentBowler.id) || 0) + 1);
      lastBowlerId = currentBowler.id;
      ballsThisOver = 0;
      over++;
      [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
    }

    if (wickets >= 10) break;
    if (target !== null && runs >= target) break;
  }

  return { runs, wickets, ballsFaced: ballCount, log, fallOfWickets };
}

function playerOfMatch(squadA, squadB, logA, logB) {
  const contribution = new Map();
  const bump = (id, amount) => contribution.set(id, (contribution.get(id) || 0) + amount);
  for (const log of [logA, logB]) {
    for (const ball of log) {
      if (ball.outcome === 'WICKET') bump(ball.bowlerId, 20);
      else if (!Number.isNaN(Number(ball.outcome))) bump(ball.strikerId, Number(ball.outcome));
      else if (ball.outcome === 'FOUR') bump(ball.strikerId, 4);
      else if (ball.outcome === 'SIX') bump(ball.strikerId, 6);
    }
  }
  let bestId = null;
  let bestScore = -Infinity;
  for (const [id, score] of contribution) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  return bestId ?? [...squadA, ...squadB][0]?.id ?? null;
}

function boundaryCount(log) {
  return log.filter((b) => b.outcome === 'FOUR' || b.outcome === 'SIX').length;
}

/**
 * Simulates a full match between two 11-player squads. Same seed + same two
 * squads always produces the same result (mulberry32 is deterministic).
 * @param {object[]} squadA - room.players[0].squad, in slot/batting order
 * @param {object[]} squadB - room.players[1].squad, in slot/batting order
 * @param {number} seed
 * @param {{ oversPerSide?: number }} config
 */
export function simulateMatch(squadA, squadB, seed, config = {}) {
  const oversPerSide = config.oversPerSide ?? 20;
  const rng = mulberry32(seed);

  const aBatsFirst = rng() < 0.5;
  const firstBattingIdx = aBatsFirst ? 0 : 1;
  const firstBatting = aBatsFirst ? squadA : squadB;
  const firstBowling = aBatsFirst ? squadB : squadA;

  const innings1 = simulateInnings({
    innings: 1,
    battingSquad: firstBatting,
    bowlingSquad: firstBowling,
    oversPerSide,
    target: null,
    rng,
  });

  const target = innings1.runs + 1;
  const innings2 = simulateInnings({
    innings: 2,
    battingSquad: firstBowling,
    bowlingSquad: firstBatting,
    oversPerSide,
    target,
    rng,
  });

  let winnerIdx; // 0 or 1, indexing squadA/squadB — or null for a true tie
  let margin;
  let superOver = null;

  if (innings2.runs >= target) {
    winnerIdx = firstBattingIdx === 0 ? 1 : 0;
    margin = { type: 'wickets', value: 10 - innings2.wickets };
  } else if (innings2.runs === innings1.runs) {
    const soA = simulateInnings({ innings: 1, battingSquad: squadA, bowlingSquad: squadB, oversPerSide: 1, target: null, rng });
    const soB = simulateInnings({ innings: 2, battingSquad: squadB, bowlingSquad: squadA, oversPerSide: 1, target: soA.runs + 1, rng });
    superOver = { runsA: soA.runs, runsB: soB.runs };
    if (soA.runs > soB.runs) winnerIdx = 0;
    else if (soB.runs > soA.runs) winnerIdx = 1;
    else {
      const bA = boundaryCount((aBatsFirst ? innings1 : innings2).log);
      const bB = boundaryCount((aBatsFirst ? innings2 : innings1).log);
      winnerIdx = bA >= bB ? 0 : 1;
    }
    margin = { type: 'tie-breaker', value: 0 };
  } else {
    winnerIdx = firstBattingIdx;
    margin = { type: 'runs', value: innings1.runs - innings2.runs };
  }

  const potId = playerOfMatch(squadA, squadB, innings1.log, innings2.log);

  return {
    tossWinnerIdx: firstBattingIdx,
    innings1: { battingIdx: firstBattingIdx, runs: innings1.runs, wickets: innings1.wickets, balls: innings1.ballsFaced, log: innings1.log },
    innings2: { battingIdx: firstBattingIdx === 0 ? 1 : 0, runs: innings2.runs, wickets: innings2.wickets, balls: innings2.ballsFaced, log: innings2.log },
    result: { winnerIdx, margin, superOver },
    playerOfMatchId: potId,
  };
}
