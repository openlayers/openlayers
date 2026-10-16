/**
 * A fixed flight: each phase is a function of the frame index, never of
 * wall-clock time, so runs stay comparable when rendering gets slower.
 */
import Map from '../../../src/ol/Map.js';
import ViewHint from '../../../src/ol/ViewHint.js';
import {easeOut, inAndOut} from '../../../src/ol/easing.js';
import {getCurrentDevice} from '../../../src/ol/webgpu/Device.js';
import {frameExperience, median} from './stats.js';

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
 * Creates a map for a benchmark case. It has no controls and no interactions,
 * so only the flight moves the view: nothing a user does while a run is in
 * progress can change the center, zoom, or rotation.
 * @param {HTMLElement} target Map target.
 * @param {import("../../../src/ol/layer/Layer.js").default} layer Layer under test.
 * @param {import("../../../src/ol/View.js").default} view View.
 * @return {Map} Map.
 */
export function createBenchmarkMap(target, layer, view) {
  return new Map({
    target,
    layers: [layer],
    view,
    controls: [],
    interactions: [],
  });
}

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
 * @param {import("../../../src/ol/View.js").default} view View.
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
 * Dense high-zoom navigation matching a drag, kinetic movement, a zoom out
 * and back across two levels, and the final label/tile settlement.
 *
 * The easing functions match View animations while fixed frame counts ensure
 * that fast and slow renderers process the same number of view states.
 * @param {import("../../../src/ol/View.js").default} view View.
 * @param {import("../../../src/ol/coordinate.js").Coordinate} center Start center.
 * @param {number} zoom High zoom.
 * @param {number} [runOffset] Horizontal offset separating repeated runs.
 * @return {Array<FlightPhase>} Phases.
 */
export function createNavigationPhases(view, center, zoom, runOffset = 0) {
  const resolution = view.getResolutionForZoom(zoom);
  const startX = center[0] + runOffset * resolution * 5000;
  const startY = center[1];
  const dragDistance = resolution * 1400;
  const dragEnd = startX + dragDistance;
  const kineticDistance = resolution * 1000;
  const endX = dragEnd + kineticDistance;
  const overviewZoom = zoom - 2;
  return [
    {
      name: 'hold',
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
        const eased = inAndOut(t);
        view.setZoom(zoom);
        view.setRotation(0);
        view.setCenter([
          startX + dragDistance * eased,
          startY + Math.sin(eased * Math.PI) * resolution * 120,
        ]);
      },
    },
    {
      name: 'kinetic-pan',
      moving: true,
      apply: (t) => {
        const eased = easeOut(t);
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
        const trip = t < 0.5 ? inAndOut(t * 2) : 1 - inAndOut((t - 0.5) * 2);
        view.setZoom(zoom + (overviewZoom - zoom) * trip);
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
 * Wait until the renderer is up and the layer has drawn at least once.
 * @param {import("../../../src/ol/Map.js").default} map Map.
 * @param {import("../../../src/ol/layer/Layer.js").default} layer Layer.
 * @param {function(import("../../../src/ol/layer/Layer.js").default): boolean} [ready] Readiness check.
 * @param {AbortSignal} [signal] Signal that cancels the wait.
 * @return {Promise<boolean>} Whether the renderer is usable.
 */
async function waitForRenderer(map, layer, ready, signal) {
  for (let i = 0; i < 600; ++i) {
    if (signal?.aborted) {
      return false;
    }
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
 * @property {import("../../../src/ol/Map.js").default} map Map.
 * @property {import("../../../src/ol/layer/Layer.js").default} layer Layer.
 * @property {Array<FlightPhase>} phases Phases.
 * @property {number} framesPerPhase Frames in each phase.
 * @property {number} warmup Warmup frames.
 * @property {Object} config Config echoed in the result.
 * @property {'sync'|'animate'} [mode='sync'] Rendering mode.
 * @property {function(import("../../../src/ol/layer/Layer.js").default): boolean} [ready] Readiness check.
 * @property {AbortSignal} [signal] Signal that stops the flight before the next frame.
 */

/**
 * Run a scripted flight.
 *
 * Presented-frame gaps are the time from one frame to the next.
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
    signal,
  } = options;
  const view = map.getView();
  const rendererReady = await waitForRenderer(map, layer, ready, signal);
  if (signal?.aborted) {
    return {cancelled: true};
  }
  if (!rendererReady) {
    return {error: 'WebGPU is not available'};
  }

  const refreshSamples = [];
  let refreshPrevious = await nextFrame();
  for (let i = 0; i < 12; ++i) {
    if (signal?.aborted) {
      return {cancelled: true};
    }
    const timestamp = await nextFrame();
    refreshSamples.push(timestamp - refreshPrevious);
    refreshPrevious = timestamp;
  }
  const targetFrameMs = median(refreshSamples) || 1000 / 60;

  for (let i = 0; i < warmup; ++i) {
    if (signal?.aborted) {
      return {cancelled: true};
    }
    phases[0].apply(i / Math.max(1, warmup - 1));
    map.renderSync();
    await nextFrame();
  }

  /** @type {Array<Object>} */
  const phaseResults = [];
  /** @type {Array<number>} */
  const allFrameMs = [];

  let previous = await nextFrame();
  for (const phase of phases) {
    if (signal?.aborted) {
      return {cancelled: true};
    }
    const hinted = phase.moving || phase.interacting;
    if (hinted) {
      view.setHint(ViewHint.INTERACTING, 1);
    }
    /** @type {Array<number>} */
    const frameMs = [];
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
    let cancelled = false;
    try {
      for (let i = 0; i < framesPerPhase; ++i) {
        if (signal?.aborted) {
          cancelled = true;
          break;
        }
        let rendered;
        if (mode === 'animate') {
          const renderedPromise = new Promise((resolve) => {
            function onAbort() {
              map.un('postrender', onRender);
              resolve(undefined);
            }
            function onRender() {
              signal?.removeEventListener('abort', onAbort);
              resolve(performance.now());
            }
            map.once('postrender', onRender);
            if (signal?.aborted) {
              onAbort();
            } else {
              signal?.addEventListener('abort', onAbort, {once: true});
            }
          });
          phase.apply(i / Math.max(1, framesPerPhase - 1));
          map.render();
          rendered = await renderedPromise;
          if (rendered === undefined) {
            cancelled = true;
            break;
          }
          const now = /** @type {number} */ (rendered);
          frameMs.push(now - previous);
          previous = now;
        } else {
          phase.apply(i / Math.max(1, framesPerPhase - 1));
          map.renderSync();
          const now = await nextFrame();
          frameMs.push(now - previous);
          previous = now;
        }
      }
    } finally {
      if (settleListener) {
        map.un('rendercomplete', settleListener);
      }
      if (hinted) {
        view.setHint(ViewHint.INTERACTING, -1);
      }
    }
    if (cancelled || signal?.aborted) {
      return {cancelled: true};
    }
    if (settleListener && !settleMs) {
      settleMs = performance.now() - settleStart;
    }
    await getCurrentDevice()?.device.queue.onSubmittedWorkDone();
    phaseResults.push({
      name: phase.name,
      frames: frameMs.length,
      experience: frameExperience(frameMs, targetFrameMs),
      settleMs,
    });
    allFrameMs.push(...frameMs);
  }

  return {
    config,
    devicePixelRatio: window.devicePixelRatio,
    size: map.getSize(),
    frames: allFrameMs.length,
    targetFrameMs,
    experience: frameExperience(allFrameMs, targetFrameMs),
    settleMs: Math.max(
      0,
      ...phaseResults.map((phase) => /** @type {number} */ (phase.settleMs)),
    ),
    phases: phaseResults,
  };
}
