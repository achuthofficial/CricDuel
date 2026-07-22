export function formatOvers(ballsFaced: number): string {
  const overs = Math.floor(ballsFaced / 6);
  const balls = ballsFaced % 6;
  return `${overs}.${balls}`;
}

export function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

export function requiredRunRate(target: number, runsSoFar: number, ballsFaced: number, oversPerSide: number): string | null {
  const ballsRemaining = oversPerSide * 6 - ballsFaced;
  if (ballsRemaining <= 0) return null;
  const runsNeeded = target - runsSoFar;
  if (runsNeeded <= 0) return '0.00';
  return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
}

export function formatMargin(margin: { type: 'runs' | 'wickets' | 'tie-breaker'; value: number }): string {
  if (margin.type === 'runs') return `won by ${margin.value} run${margin.value === 1 ? '' : 's'}`;
  if (margin.type === 'wickets') return `won by ${margin.value} wicket${margin.value === 1 ? '' : 's'}`;
  return 'won in the super over';
}
