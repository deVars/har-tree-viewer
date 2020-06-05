export function numFix(num: number, digits: number): number {
  const d = 10 ** digits;
  return Math.round(num * d) / d;
}