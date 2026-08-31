/**
 * @module ol/webgpu/metrics
 *
 * Opt-in counters for the WebGPU renderers, used by the performance benchmarks.
 * Disabled by default so an instrumented call site costs one boolean check.
 */

let enabled = false;

/**
 * @typedef {Object} Timer
 * @property {number} calls Number of calls.
 * @property {number} total Total milliseconds.
 * @property {Array<number>} samples Individual durations.
 */

/**
 * @type {Object<string, Timer>}
 */
let timers = {};

/**
 * @type {Object<string, number>}
 */
let counters = {};

/**
 * @typedef {Object} Metrics
 * @property {Object<string, Timer>} timers Accumulated timings.
 * @property {Object<string, number>} counters Accumulated counts.
 */

/**
 * Discard everything collected so far.
 */
export function resetMetrics() {
  timers = {};
  counters = {};
}

/**
 * @param {boolean} value Collect metrics.
 */
export function enableMetrics(value) {
  enabled = value;
  resetMetrics();
}

/**
 * @return {boolean} Metrics are being collected.
 */
export function metricsEnabled() {
  return enabled;
}

/**
 * Start of a timed section. Pair with {@link endMetric}.
 *
 * @return {number} Start time, or zero when disabled.
 */
export function startMetric() {
  return enabled ? performance.now() : 0;
}

/**
 * @param {string} name Timer name.
 * @param {number} start Value returned by {@link startMetric}.
 */
export function endMetric(name, start) {
  if (!enabled) {
    return;
  }
  let timer = timers[name];
  if (!timer) {
    timer = {calls: 0, total: 0, samples: []};
    timers[name] = timer;
  }
  ++timer.calls;
  const duration = performance.now() - start;
  timer.total += duration;
  timer.samples.push(duration);
}

/**
 * @param {string} name Counter name.
 * @param {number} [amount] Increment, one by default.
 */
export function countMetric(name, amount) {
  if (!enabled) {
    return;
  }
  counters[name] = (counters[name] || 0) + (amount === undefined ? 1 : amount);
}

/**
 * @return {Metrics} Snapshot of everything collected since the last reset.
 */
export function readMetrics() {
  /** @type {Object<string, Timer>} */
  const timerCopy = {};
  for (const name in timers) {
    timerCopy[name] = {
      calls: timers[name].calls,
      total: timers[name].total,
      samples: timers[name].samples.slice(),
    };
  }
  return {timers: timerCopy, counters: Object.assign({}, counters)};
}
