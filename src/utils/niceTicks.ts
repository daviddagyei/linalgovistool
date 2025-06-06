// Returns a nice tick step for a given range and target number of ticks
export function getNiceTickStep(range: number, targetTicks: number = 10): number {
  const rawStep = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceNormalized: number;
  if (normalized < 1.5) niceNormalized = 1;
  else if (normalized < 3) niceNormalized = 2;
  else if (normalized < 7) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}
