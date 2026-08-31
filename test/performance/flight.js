/**
 * A fixed flight: each phase is a function of the frame index, never of
 * wall-clock time, so runs stay comparable when rendering gets slower.
 */
import {
  enableMetrics,
  readMetrics,
  resetMetrics,
} from '../../src/ol/webgpu/metrics.js';
import {summarize} from './stats.js';

/**
 * @typedef {Object} FlightPhase
 * @property {string} name Phase name.
 * @property {function(number): void} apply Apply progress in [0, 1].
 */

/**
 * @typedef {Object} FlightConfig
 * @property {string} projection View projection.
 * @property {number} features Feature count for vector cases.
 * @property {number} vertices Vertices per polygon ring.
 * @property {number} framesPerPhase Frames in each phase.
 * @property {number} warmup Warmup frames before measuring.
 */

/**
 * Query parameters shared by the flight cases.
 * @param {URLSearchParams} params Page query.
 * @return {FlightConfig} Config.
 */
export function readFlightConfig(params) {
  return {
    projection: params.get('projection') || 'EPSG:3857',
    features: Number(params.get('features') || 1500),
    vertices: Number(params.get('vertices') || 64),
    framesPerPhase: Number(params.get('frames') || 90),
    warmup: Number(params.get('warmup') || 20),
  };
}

/**
 * Zoom, pan, and rotate. `minZoom` and `maxZoom` match the layer under test.
 * @param {import("../../src/ol/View.js").default} view View.
 * @param {number} minZoom Minimum zoom.
 * @param {number} maxZoom Maximum zoom.
 * @return {Array<FlightPhase>} Phases.
 */
export function createFlightPhases(view, minZoom, maxZoom) {
  const midZoom = (minZoom + maxZoom) / 2;
  return [
    {
      name: 'zoom-in',
      apply: (t) => {
        view.setCenter([0, 0]);
        view.setRotation(0);
        view.setZoom(minZoom + (maxZoom - minZoom) * t);
      },
    },
    {
      name: 'pan',
      apply: (t) => {
        view.setZoom(midZoom);
        view.setRotation(0);
        const distance = view.getResolution() * 400;
        const angle = t * Math.PI * 2;
        view.setCenter([
          Math.cos(angle) * distance,
          Math.sin(angle) * distance,
        ]);
      },
    },
    {
      // A long drag at high zoom, so tiles enter and leave the view constantly.
      // This is where label work shows up: the pan above stays inside the tiles
      // it started with.
      name: 'pan-far',
      apply: (t) => {
        view.setZoom(maxZoom);
        view.setRotation(0);
        const resolution = view.getResolution();
        view.setCenter([t * resolution * 4000, resolution * 500]);
      },
    },
    {
      name: 'zoom-out',
      apply: (t) => {
        view.setCenter([0, 0]);
        view.setRotation(0);
        view.setZoom(maxZoom + (minZoom - maxZoom) * t);
      },
    },
    {
      name: 'rotate',
      apply: (t) => {
        view.setCenter([0, 0]);
        view.setZoom(midZoom);
        view.setRotation(t * Math.PI * 0.5);
      },
    },
  ];
}

/**
 * @return {Promise<number>} Frame timestamp.
 */
function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * @param {import("../../src/ol/webgpu/metrics.js").Metrics} metrics Metrics.
 * @param {number} frames Frame count to average over.
 * @return {Object<string, number>} Per-frame averages.
 */
function perFrameMetrics(metrics, frames) {
  const divisor = frames || 1;
  /** @type {Object<string, number>} */
  const out = {};
  for (const name in metrics.timers) {
    const timer = metrics.timers[name];
    const summary = summarize(timer.samples);
    out[name + 'MsPerFrame'] = timer.total / divisor;
    out[name + 'CallsPerFrame'] = timer.calls / divisor;
    out[name + 'MsP50'] = summary.p50;
    out[name + 'MsP95'] = summary.p95;
    out[name + 'MsP99'] = summary.p99;
    out[name + 'MsMax'] = summary.max;
  }
  for (const name in metrics.counters) {
    out[name + 'PerFrame'] = metrics.counters[name] / divisor;
  }
  return out;
}

/**
 * Wait until WebGPU is up and the layer has drawn at least once.
 * @param {import("../../src/ol/Map.js").default} map Map.
 * @param {import("../../src/ol/layer/Layer.js").default} layer Layer.
 * @return {Promise<boolean>} Whether the renderer is usable.
 */
async function waitForRenderer(map, layer) {
  for (let i = 0; i < 600; ++i) {
    map.renderSync();
    if (/** @type {any} */ (layer.getRenderer())?.helper) {
      return true;
    }
    await nextFrame();
  }
  return false;
}

/**
 * @typedef {Object} FlightOptions
 * @property {import("../../src/ol/Map.js").default} map Map.
 * @property {import("../../src/ol/layer/Layer.js").default} layer Layer.
 * @property {Array<FlightPhase>} phases Phases.
 * @property {number} framesPerPhase Frames in each phase.
 * @property {number} warmup Warmup frames.
 * @property {Object} config Config echoed in the result.
 */

/**
 * @param {FlightOptions} options Options.
 * @return {Promise<Object>} Benchmark result.
 */
export async function runFlight(options) {
  const {map, layer, phases, framesPerPhase, warmup, config} = options;
  const ready = await waitForRenderer(map, layer);
  if (!ready) {
    return {error: 'WebGPU is not available'};
  }

  for (let i = 0; i < warmup; ++i) {
    phases[0].apply(i / Math.max(1, warmup - 1));
    map.renderSync();
    await nextFrame();
  }

  enableMetrics(true);
  /** @type {Array<Object>} */
  const phaseResults = [];
  /** @type {Array<number>} */
  const allFrameMs = [];
  /** @type {Array<number>} */
  const allCpuMs = [];

  let previous = await nextFrame();
  for (const phase of phases) {
    /** @type {Array<number>} */
    const frameMs = [];
    /** @type {Array<number>} */
    const cpuMs = [];
    resetMetrics();
    for (let i = 0; i < framesPerPhase; ++i) {
      phase.apply(i / Math.max(1, framesPerPhase - 1));
      const start = performance.now();
      map.renderSync();
      cpuMs.push(performance.now() - start);
      const now = await nextFrame();
      frameMs.push(now - previous);
      previous = now;
    }
    const metrics = readMetrics();
    phaseResults.push({
      name: phase.name,
      frames: frameMs.length,
      frameMs: summarize(frameMs),
      cpuMs: summarize(cpuMs),
      metrics: perFrameMetrics(metrics, frameMs.length),
    });
    allFrameMs.push(...frameMs);
    allCpuMs.push(...cpuMs);
  }
  enableMetrics(false);

  return {
    config,
    devicePixelRatio: window.devicePixelRatio,
    size: map.getSize(),
    frames: allFrameMs.length,
    frameMs: summarize(allFrameMs),
    cpuMs: summarize(allCpuMs),
    slowFrames20: allFrameMs.filter((value) => value > 20).length,
    slowFrames33: allFrameMs.filter((value) => value > 33).length,
    phases: phaseResults,
  };
}
