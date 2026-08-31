/**
 * Timing summaries shared by the flight and the headless runner.
 */

/**
 * @param {Array<number>} sorted Ascending samples.
 * @param {number} fraction Percentile in [0, 1].
 * @return {number} Percentile value.
 */
export function percentile(sorted, fraction) {
  if (!sorted.length) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(fraction * (sorted.length - 1))),
  );
  return sorted[index];
}

/**
 * @param {Array<number>} samples Millisecond samples.
 * @return {Object<string, number>} Summary statistics.
 */
export function summarize(samples) {
  const sorted = samples.slice().sort((a, b) => a - b);
  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    mean: samples.length ? total / samples.length : 0,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  };
}

/**
 * Mean after discarding the fastest and slowest sample. With fewer than three
 * samples there is nothing to discard, so this is a plain mean.
 *
 * @param {Array<number>} samples Samples.
 * @return {number} Trimmed mean.
 */
export function trimmedMean(samples) {
  const values = samples.filter((value) => typeof value === 'number').sort();
  if (!values.length) {
    return 0;
  }
  const kept = values.length >= 3 ? values.slice(1, -1) : values;
  return kept.reduce((sum, value) => sum + value, 0) / kept.length;
}
