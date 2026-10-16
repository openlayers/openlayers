/** Default display interval when refresh measurement is unavailable. */
export const DEFAULT_DISPLAY_MS = 1000 / 60;

/**
 * A presented-frame gap longer than this is a visible freeze at both 30 Hz
 * and 60 Hz, so a normal refresh is not counted as a stall.
 */
export const STALL_MS = 100;

/**
 * @typedef {Object} FrameExperience
 * @property {number} frames Presented frames.
 * @property {number} displayMs Measured display interval.
 * @property {number} lateFrames Gaps longer than 1.5× the display interval.
 * @property {number} droppedFrames Estimated missed display refreshes.
 * @property {number} stalls Gaps longer than {@link STALL_MS}.
 * @property {number} worstGapMs Longest presented-frame interval.
 */

/**
 * @param {Array<number>} samples Samples.
 * @return {number} Median.
 */
export function median(samples) {
  if (!samples.length) {
    return 0;
  }
  const sorted = samples.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Classifies presented-frame gaps relative to the measured display interval.
 * @param {Array<number>} gaps Milliseconds between presented frames.
 * @param {number} displayMs Measured display interval.
 * @return {FrameExperience} Experience summary.
 */
export function frameExperience(gaps, displayMs) {
  const interval = displayMs > 0 ? displayMs : DEFAULT_DISPLAY_MS;
  const stallGaps = gaps.filter((gap) => gap > STALL_MS);
  return {
    frames: gaps.length,
    displayMs: interval,
    lateFrames: gaps.filter((gap) => gap > interval * 1.5).length,
    droppedFrames: gaps.reduce(
      (sum, gap) => sum + Math.max(0, Math.round(gap / interval) - 1),
      0,
    ),
    stalls: stallGaps.length,
    worstGapMs: gaps.length ? Math.max(...gaps) : 0,
  };
}
