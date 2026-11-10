const DEFAULT_Z = 1.96;

/** 95% Wilson upper bound on k events in n trials. Null when n is 0. */
export function wilsonUpper(k: number, n: number, z = DEFAULT_Z): number | null {
  if (n <= 0) return null;
  if (k < 0 || k > n) throw new Error(`wilsonUpper expected 0 <= k <= n, got k=${k} n=${n}`);
  const p = k / n;
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denominator;
  return center + margin;
}
