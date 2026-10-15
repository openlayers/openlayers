/**
 * A fixed flight: each phase is a function of the frame index, never of
 * wall-clock time, so runs stay comparable when rendering gets slower.
 */
import ViewHint from '../../src/ol/ViewHint.js';
import {
  enableMetrics,
  readMetrics,
  resetMetrics,
} from '../../src/ol/webgpu/metrics.js';
import {frameExperience, summarize} from './stats.js';

/**
 * @typedef {Object} FlightPhase
 * @property {string} name Phase name.
 * @property {function(number): void} apply Apply progress in [0, 1].
 * @property {boolean} [moving] Set the interacting hint during the phase. Not the
 * animating hint: setting the center or zoom cancels animations, which resets it.
 * @property {boolean} [interacting] Set the interacting hint during the phase.
 * @property {boolean} [settle] Measure time to the first rendercomplete event.
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
      moving: true,
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
 * High-zoom tile churn followed by stationary frames while pending tile work
 * completes. The eased pan approximates kinetic movement after pointer release.
 * @param {import("../../src/ol/View.js").default} view View.
 * @param {number} minZoom Minimum zoom.
 * @param {number} maxZoom Maximum zoom.
 * @param {number} [runOffset] Horizontal offset separating repeated runs.
 * @return {Array<FlightPhase>} Phases.
 */
export function createOverzoomPhases(view, minZoom, maxZoom, runOffset = 0) {
  const startX = runOffset * view.getResolutionForZoom(maxZoom) * 16000;
  const distance = view.getResolutionForZoom(maxZoom) * 12000;
  const endX = startX + distance;
  return [
    {
      name: 'zoom-in',
      apply: (t) => {
        view.setCenter([startX, 0]);
        view.setRotation(0);
        view.setZoom(minZoom + (maxZoom - minZoom) * t);
      },
    },
    {
      name: 'kinetic-pan',
      moving: true,
      apply: (t) => {
        view.setZoom(maxZoom);
        view.setRotation(0);
        const eased = 1 - Math.pow(1 - t, 3);
        view.setCenter([startX + distance * eased, 0]);
      },
    },
    {
      name: 'settle',
      apply: () => {
        view.setZoom(maxZoom);
        view.setRotation(0);
        view.setCenter([endX, 0]);
      },
    },
    {
      name: 'zoom-out',
      moving: true,
      apply: (t) => {
        view.setCenter([endX, 0]);
        view.setRotation(0);
        view.setZoom(maxZoom + (minZoom - maxZoom) * t);
      },
    },
  ];
}

/**
 * Dense high-zoom navigation matching a drag, kinetic movement, wheel zoom,
 * and the final label/tile settlement users experience.
 * @param {import("../../src/ol/View.js").default} view View.
 * @param {import("../../src/ol/coordinate.js").Coordinate} center Start center.
 * @param {number} zoom High zoom.
 * @param {number} [runOffset] Horizontal offset separating repeated runs.
 * @return {Array<FlightPhase>} Phases.
 */
export function createNavigationPhases(view, center, zoom, runOffset = 0) {
  const resolution = view.getResolutionForZoom(zoom);
  const startX = center[0] + runOffset * resolution * 8000;
  const startY = center[1];
  const dragDistance = resolution * 2400;
  const dragEnd = startX + dragDistance;
  const kineticDistance = resolution * 1200;
  const endX = dragEnd + kineticDistance;
  return [
    {
      name: 'hold-z17',
      apply: () => {
        view.setCenter([startX, startY]);
        view.setRotation(0);
        view.setZoom(zoom);
      },
    },
    {
      name: 'drag',
      interacting: true,
      apply: (t) => {
        view.setZoom(zoom);
        view.setRotation(0);
        view.setCenter([
          startX + dragDistance * t,
          startY + Math.sin(t * Math.PI * 2) * resolution * 180,
        ]);
      },
    },
    {
      name: 'kinetic-pan',
      moving: true,
      apply: (t) => {
        const eased = 1 - Math.pow(1 - t, 3);
        view.setCenter([dragEnd + kineticDistance * eased, startY]);
        view.setRotation(0);
        view.setZoom(zoom);
      },
    },
    {
      name: 'zoom',
      interacting: true,
      apply: (t) => {
        view.setCenter([endX, startY]);
        view.setRotation(0);
        view.setZoom(zoom - Math.sin(t * Math.PI) * 0.8);
      },
    },
    {
      name: 'settle',
      settle: true,
      apply: () => {
        view.setCenter([endX, startY]);
        view.setRotation(0);
        view.setZoom(zoom);
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
  for (const name in metrics.gauges) {
    out[name + 'Max'] = metrics.gauges[name];
  }
  return out;
}

/**
 * Wait until the renderer is up and the layer has drawn at least once.
 * @param {import("../../src/ol/Map.js").default} map Map.
 * @param {import("../../src/ol/layer/Layer.js").default} layer Layer.
 * @param {function(import("../../src/ol/layer/Layer.js").default): boolean} [ready] Readiness check.
 * @return {Promise<boolean>} Whether the renderer is usable.
 */
async function waitForRenderer(map, layer, ready) {
  for (let i = 0; i < 600; ++i) {
    map.renderSync();
    if (
      ready
        ? ready(layer)
        : !!(/** @type {any} */ (layer.getRenderer())?.helper)
    ) {
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
 * @property {'sync'|'animate'} [mode='sync'] Rendering mode.
 * @property {function(import("../../src/ol/layer/Layer.js").default): boolean} [ready] Readiness check.
 */

/**
 * Run a scripted flight.
 *
 * Presented-frame gaps are the time from one frame to the next. Render work
 * in sync mode is the `renderSync` duration. In animate mode it is the time
 * from the map `precompose` event to `postrender`. That brackets deferred
 * declutter painting; a layer's own `prerender` and `postrender` do not,
 * because decluttered vector layers paint later from `renderDeferred`.
 *
 * @param {FlightOptions} options Options.
 * @return {Promise<Object>} Benchmark result.
 */
export async function runFlight(options) {
  const {
    map,
    layer,
    phases,
    framesPerPhase,
    warmup,
    config,
    mode = 'sync',
    ready,
  } = options;
  const view = map.getView();
  const rendererReady = await waitForRenderer(map, layer, ready);
  if (!rendererReady) {
    return {error: 'WebGPU is not available'};
  }

  const refreshSamples = [];
  let refreshPrevious = await nextFrame();
  for (let i = 0; i < 12; ++i) {
    const timestamp = await nextFrame();
    refreshSamples.push(timestamp - refreshPrevious);
    refreshPrevious = timestamp;
  }
  const targetFrameMs = summarize(refreshSamples).p50 || 1000 / 60;

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
  /** @type {Array<number>} */
  const allInputToFrameMs = [];
  /** @type {Array<number>} */
  const allLongTasks = [];
  /** @type {Array<number>} */
  const longTasks = [];
  let longTaskObserver;
  if (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push(entry.duration);
      }
    });
    longTaskObserver.observe({type: 'longtask'});
  }

  let previous = await nextFrame();
  let workStart = 0;
  let workOpen = false;
  /** @type {Array<number>} */
  let phaseWorkMs = [];
  const onPrecompose = () => {
    workStart = performance.now();
    workOpen = true;
  };
  const onWorkEnd = () => {
    if (!workOpen) {
      return;
    }
    phaseWorkMs.push(performance.now() - workStart);
    workOpen = false;
  };
  if (mode === 'animate') {
    map.on('precompose', onPrecompose);
    map.on('postrender', onWorkEnd);
  }
  /** @type {Array<number>} */
  const allWorkMs = [];
  try {
    for (const phase of phases) {
      if (phase.moving || phase.interacting) {
        view.setHint(ViewHint.INTERACTING, 1);
      }
      /** @type {Array<number>} */
      const frameMs = [];
      /** @type {Array<number>} */
      const cpuMs = [];
      /** @type {Array<number>} */
      const inputToFrameMs = [];
      /** @type {Array<number>} */
      const animateWorkMs = [];
      phaseWorkMs = animateWorkMs;
      let settleMs = 0;
      const settleStart = performance.now();
      const settleListener = phase.settle
        ? () => {
            if (!settleMs) {
              settleMs = performance.now() - settleStart;
            }
          }
        : null;
      if (settleListener) {
        map.once('rendercomplete', settleListener);
      }
      longTasks.length = 0;
      resetMetrics();
      for (let i = 0; i < framesPerPhase; ++i) {
        const start = performance.now();
        let rendered;
        if (mode === 'animate') {
          const renderedPromise = new Promise((resolve) =>
            map.once('postrender', () => resolve(performance.now())),
          );
          phase.apply(i / Math.max(1, framesPerPhase - 1));
          map.render();
          rendered = await renderedPromise;
          inputToFrameMs.push(/** @type {number} */ (rendered) - start);
          const now = /** @type {number} */ (rendered);
          frameMs.push(now - previous);
          previous = now;
        } else {
          phase.apply(i / Math.max(1, framesPerPhase - 1));
          map.renderSync();
          cpuMs.push(performance.now() - start);
          const now = await nextFrame();
          frameMs.push(now - previous);
          previous = now;
        }
      }
      if (settleListener) {
        map.un('rendercomplete', settleListener);
        if (!settleMs) {
          settleMs = performance.now() - settleStart;
        }
      }
      const metrics = readMetrics();
      const phaseLongTasks = longTasks.slice();
      const workMs = mode === 'animate' ? animateWorkMs : cpuMs;
      phaseResults.push({
        name: phase.name,
        frames: frameMs.length,
        frameMs: summarize(frameMs),
        cpuMs: summarize(cpuMs),
        inputToFrameMs: summarize(inputToFrameMs),
        experience: frameExperience(frameMs, workMs, targetFrameMs),
        settleMs,
        longTasks: {
          count: phaseLongTasks.length,
          total: phaseLongTasks.reduce((sum, duration) => sum + duration, 0),
          ...summarize(phaseLongTasks),
        },
        metrics: perFrameMetrics(metrics, frameMs.length),
      });
      allFrameMs.push(...frameMs);
      allCpuMs.push(...cpuMs);
      allInputToFrameMs.push(...inputToFrameMs);
      allWorkMs.push(...workMs);
      allLongTasks.push(...phaseLongTasks);
      if (phase.moving || phase.interacting) {
        view.setHint(ViewHint.INTERACTING, -1);
      }
    }
  } finally {
    if (mode === 'animate') {
      map.un('precompose', onPrecompose);
      map.un('postrender', onWorkEnd);
    }
    longTaskObserver?.disconnect();
    enableMetrics(false);
  }

  return {
    config,
    devicePixelRatio: window.devicePixelRatio,
    size: map.getSize(),
    frames: allFrameMs.length,
    targetFrameMs,
    frameMs: summarize(allFrameMs),
    cpuMs: summarize(allCpuMs),
    inputToFrameMs: summarize(allInputToFrameMs),
    experience: frameExperience(allFrameMs, allWorkMs, targetFrameMs),
    longTasks: {
      count: allLongTasks.length,
      total: allLongTasks.reduce((sum, duration) => sum + duration, 0),
      ...summarize(allLongTasks),
    },
    settleMs: Math.max(
      0,
      ...phaseResults.map((phase) => /** @type {number} */ (phase.settleMs)),
    ),
    phases: phaseResults,
  };
}
