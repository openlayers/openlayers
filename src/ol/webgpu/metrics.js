/**
 * @module ol/webgpu/metrics
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
 * @type {Object<string, number>}
 */
let gauges = {};

/**
 * @typedef {Object} Metrics
 * @property {Object<string, Timer>} timers Accumulated timings.
 * @property {Object<string, number>} counters Accumulated counts.
 * @property {Object<string, number>} gauges Maximum observed values.
 */

/**
 * Discard everything collected so far.
 */
export function resetMetrics() {
  timers = {};
  counters = {};
  gauges = {};
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
  recordMetric(name, performance.now() - start);
}

/**
 * Record an already measured duration.
 * @param {string} name Timer name.
 * @param {number} duration Duration in milliseconds.
 */
export function recordMetric(name, duration) {
  if (!enabled) {
    return;
  }
  let timer = timers[name];
  if (!timer) {
    timer = {calls: 0, total: 0, samples: []};
    timers[name] = timer;
  }
  ++timer.calls;
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
 * Remember the largest value observed during the measurement interval.
 * @param {string} name Gauge name.
 * @param {number} value Value.
 */
export function maxMetric(name, value) {
  if (!enabled) {
    return;
  }
  gauges[name] = Math.max(gauges[name] ?? -Infinity, value);
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
  return {
    timers: timerCopy,
    counters: Object.assign({}, counters),
    gauges: Object.assign({}, gauges),
  };
}
