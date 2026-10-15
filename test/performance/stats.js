/**
 * Timing summaries shared by the flight and the headless runner.
 */

/** Render work longer than this cannot sustain 60 fps. */
export const FRAME_BUDGET_MS = 1000 / 60;

/**
 * A presented-frame gap longer than this is a visible freeze at both 30 Hz
 * and 60 Hz, so a normal refresh is not counted as a stall.
 */
export const STALL_MS = 100;

/**
 * @typedef {Object} SampleSummary
 * @property {number} mean Mean.
 * @property {number} p50 Median.
 * @property {number} p95 95th percentile.
 * @property {number} p99 99th percentile.
 * @property {number} max Maximum.
 */

/**
 * @typedef {Object} FrameExperience
 * @property {number} frames Presented frames.
 * @property {number} displayMs Measured display interval.
 * @property {SampleSummary} gaps Interval between presented frames.
 * @property {number} lateFrames Gaps longer than 1.5× the display interval.
 * @property {number} droppedFrames Estimated missed display refreshes.
 * @property {number} stalls Gaps longer than {@link STALL_MS}.
 * @property {number} worstGapMs Longest presented-frame interval.
 * @property {number} stallMs Total time inside stall gaps.
 * @property {SampleSummary} work Renderer main-thread time.
 * @property {number} overBudget Work samples longer than {@link FRAME_BUDGET_MS}.
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
 * @return {SampleSummary} Summary statistics.
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

/**
 * Classifies presented-frame gaps and renderer work.
 *
 * Gaps describe what a pan or zoom looked like, and they are only slow
 * relative to `displayMs`. Work is main-thread renderer time, compared with
 * a 60 fps budget whatever refresh the display happened to use. A missing
 * display interval falls back to that budget so the counts stay defined.
 *
 * @param {Array<number>} gaps Milliseconds between presented frames.
 * @param {Array<number>} work Milliseconds of renderer main-thread work.
 * @param {number} displayMs Measured display interval.
 * @return {FrameExperience} Experience summary.
 */
export function frameExperience(gaps, work, displayMs) {
  const interval = displayMs > 0 ? displayMs : FRAME_BUDGET_MS;
  const gapSummary = summarize(gaps);
  const stallGaps = gaps.filter((gap) => gap > STALL_MS);
  return {
    frames: gaps.length,
    displayMs: interval,
    gaps: gapSummary,
    lateFrames: gaps.filter((gap) => gap > interval * 1.5).length,
    droppedFrames: gaps.reduce(
      (sum, gap) => sum + Math.max(0, Math.round(gap / interval) - 1),
      0,
    ),
    stalls: stallGaps.length,
    worstGapMs: gapSummary.max,
    stallMs: stallGaps.reduce((sum, gap) => sum + gap, 0),
    work: summarize(work),
    overBudget: work.filter((sample) => sample > FRAME_BUDGET_MS).length,
  };
}

/**
 * Labeled lines for the dev page and the headless log. Gap times are named
 * as the interval between presented frames so a 30 Hz cadence is not read as
 * a missed 16 ms budget.
 *
 * @param {FrameExperience} experience Experience summary.
 * @return {Array<string>} Summary lines.
 */
export function formatExperience(experience) {
  const hz = 1000 / experience.displayMs;
  return [
    `display ${experience.displayMs.toFixed(1)}ms (${hz.toFixed(0)} Hz), ${experience.frames} frames`,
    `presented-frame interval p50 ${experience.gaps.p50.toFixed(1)}ms, p99 ${experience.gaps.p99.toFixed(1)}ms`,
    `late ${experience.lateFrames}, dropped ${experience.droppedFrames}, stalls ${experience.stalls} (worst ${experience.worstGapMs.toFixed(1)}ms)`,
    `render work p50 ${experience.work.p50.toFixed(1)}ms, p99 ${experience.work.p99.toFixed(1)}ms, max ${experience.work.max.toFixed(1)}ms, over ${FRAME_BUDGET_MS.toFixed(1)}ms: ${experience.overBudget}`,
  ];
}
