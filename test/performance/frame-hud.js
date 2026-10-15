import {getCurrentDevice} from '../../src/ol/webgpu/Device.js';

const BAR_LIMIT = 96;

/**
 * @typedef {Object} ChromeFrameCounts
 * @property {number} presented Frames presented with every update.
 * @property {number} partial Frames presented with only some updates.
 * @property {number} dropped Frames the compositor dropped.
 * @property {number} fps Presented plus partial frames per second.
 */

/**
 * @typedef {Object} FrameHud
 * @property {function(ChromeFrameCounts): void} setChromeCounts Show Chrome's per-second frame counts.
 * @property {function(): number} getRefreshMs Measured display refresh interval.
 */

/**
 * Draw frame timing the page can see itself, and Chrome's frame classification
 * when a recorder is pushing it in.
 * @return {FrameHud} HUD handle, also assigned to `window.olFrameHud`.
 */
export function startFrameHud() {
  const root = document.createElement('div');
  root.className = 'ol-frame-hud';
  const rafLine = document.createElement('div');
  const strip = document.createElement('div');
  strip.className = 'ol-frame-hud-strip';
  const gpuLine = document.createElement('div');
  const chromeLine = document.createElement('div');
  chromeLine.hidden = true;
  const hint = document.createElement('div');
  hint.className = 'ol-frame-hud-hint';
  hint.textContent = 'h hides';
  root.append(rafLine, strip, gpuLine, chromeLine, hint);
  document.body.append(root);

  const style = document.createElement('style');
  style.textContent = `
    .ol-frame-hud {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 10;
      min-width: 240px;
      padding: 8px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      font: 12px/1.4 ui-monospace, monospace;
      pointer-events: none;
    }
    .ol-frame-hud-strip {
      display: flex;
      align-items: flex-end;
      height: 28px;
      margin: 4px 0;
      gap: 1px;
    }
    .ol-frame-hud-strip i {
      display: block;
      width: 3px;
      flex: 0 0 3px;
    }
    .ol-frame-hud-hint {
      opacity: 0.6;
    }
  `;
  document.head.append(style);

  /** @type {Array<number>} */
  const refreshSamples = [];
  /** @type {Array<{color: string, height: number}>} */
  const bars = [];
  /** @type {Array<number>} */
  const frameTimes = [];
  /** @type {Array<number>} */
  const missTimes = [];
  let previous = 0;
  let seen = 0;
  let refreshMs = 0;
  let lastGpuMs = 0;
  let queuePatched = false;

  /**
   * @param {number} gap Milliseconds since the previous animation frame.
   * @param {number} timestamp Frame timestamp.
   */
  function recordGap(gap, timestamp) {
    const refresh = refreshMs || 16.7;
    const ratio = gap / refresh;
    if (ratio > 1.5) {
      const missed = Math.max(1, Math.round(ratio) - 1);
      for (let i = 0; i < missed; ++i) {
        bars.push({color: '#ef4444', height: 1});
        missTimes.push(timestamp);
      }
    }
    bars.push({
      color: ratio > 1.15 ? '#eab308' : '#3b82f6',
      height: Math.min(1, Math.max(0.2, ratio / 2)),
    });
    if (bars.length > BAR_LIMIT) {
      bars.splice(0, bars.length - BAR_LIMIT);
    }
  }

  function renderStrip() {
    strip.replaceChildren();
    for (const bar of bars) {
      const mark = document.createElement('i');
      mark.style.background = bar.color;
      mark.style.height = `${Math.round(bar.height * 100)}%`;
      strip.append(mark);
    }
  }

  function patchQueue() {
    if (queuePatched) {
      return;
    }
    const handle = getCurrentDevice();
    if (!handle) {
      return;
    }
    queuePatched = true;
    const queue = handle.device.queue;
    const submit = queue.submit.bind(queue);
    queue.submit = (commandBuffers) => {
      const start = performance.now();
      submit(commandBuffers);
      queue.onSubmittedWorkDone().then(
        () => {
          lastGpuMs = performance.now() - start;
        },
        () => undefined,
      );
    };
  }

  /**
   * @param {number} timestamp Frame timestamp.
   */
  function onFrame(timestamp) {
    patchQueue();
    if (previous) {
      const gap = timestamp - previous;
      seen += 1;
      frameTimes.push(timestamp);
      if (!refreshMs && gap >= 4 && gap <= 40) {
        refreshSamples.push(gap);
      }
      if (!refreshMs && (refreshSamples.length === 12 || seen > 40)) {
        const sorted = (refreshSamples.length ? refreshSamples : [1000 / 60])
          .slice()
          .sort((a, b) => a - b);
        refreshMs = sorted[Math.floor(sorted.length / 2)] || 1000 / 60;
      }
      if (refreshMs) {
        recordGap(gap, timestamp);
      }
      const recent = frameTimes.filter((time) => timestamp - time <= 1000);
      frameTimes.length = 0;
      frameTimes.push(...recent);
      const recentMisses = missTimes.filter((time) => timestamp - time <= 1000);
      missTimes.length = 0;
      missTimes.push(...recentMisses);
      rafLine.textContent = refreshMs
        ? `rAF ${recent.length} fps · ${recentMisses.length} missed`
        : 'rAF measuring refresh…';
      const gpuLate = refreshMs && lastGpuMs > refreshMs;
      gpuLine.textContent = lastGpuMs
        ? `GPU ${lastGpuMs.toFixed(1)} ms`
        : 'GPU …';
      gpuLine.style.color = gpuLate ? '#eab308' : '';
      renderStrip();
    }
    previous = timestamp;
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'h' || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    root.hidden = !root.hidden;
  });

  /** @type {FrameHud} */
  const hud = {
    setChromeCounts(counts) {
      chromeLine.hidden = false;
      chromeLine.textContent = `Chrome ${counts.fps.toFixed(0)} fps · ${counts.presented} presented · ${counts.partial} partial · ${counts.dropped} dropped`;
    },
    getRefreshMs() {
      return refreshMs || 1000 / 60;
    },
  };
  /** @type {any} */ (window).olFrameHud = hud;
  return hud;
}
