import {getCurrentDevice} from '../../../src/ol/webgpu/Device.js';

const BAR_LIMIT = 80;
const ON_TIME = '#00aaff';
const LATE = '#eab308';
const MISSED = '#ef4444';

/**
 * Draws recent frame gaps and WebGPU queue completion time.
 * @param {HTMLElement} container Element that holds the display.
 * @return {{destroy: function(): void, getRefreshMs: function(): number}} Display handle.
 */
export function startFrameRateDisplay(container) {
  const root = document.createElement('div');
  root.className = 'ol-frame-rate-display';
  const graph = document.createElement('div');
  graph.className = 'ol-frame-rate-display-graph';
  const meta = document.createElement('div');
  meta.className = 'ol-frame-rate-display-meta';
  const frameLine = document.createElement('div');
  const gpuLine = document.createElement('div');
  const strip = document.createElement('div');
  strip.className = 'ol-frame-rate-display-strip';
  const legend = document.createElement('div');
  legend.className = 'ol-frame-rate-display-legend';
  for (const [color, label] of [
    [ON_TIME, 'on time'],
    [LATE, 'late'],
    [MISSED, 'missed'],
  ]) {
    const item = document.createElement('span');
    const swatch = document.createElement('i');
    swatch.style.background = color;
    item.append(swatch, label);
    legend.append(item);
  }
  graph.append(strip, legend);
  meta.append(frameLine, gpuLine);
  root.append(graph, meta);
  container.append(root);

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
  let frameRequest = 0;

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
        bars.push({color: MISSED, height: 1});
        missTimes.push(timestamp);
      }
    }
    bars.push({
      color: ratio > 1.5 ? LATE : ON_TIME,
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
      frameLine.textContent = refreshMs
        ? `${recent.length} fps · ${recentMisses.length} missed`
        : 'Measuring display refresh…';
      gpuLine.textContent = lastGpuMs
        ? `GPU queue ${lastGpuMs.toFixed(1)} ms`
        : 'GPU queue …';
      renderStrip();
    }
    previous = timestamp;
    frameRequest = requestAnimationFrame(onFrame);
  }

  frameRequest = requestAnimationFrame(onFrame);

  const display = {
    destroy() {
      cancelAnimationFrame(frameRequest);
      root.remove();
    },
    getRefreshMs() {
      return refreshMs || 1000 / 60;
    },
  };
  /** @type {any} */ (window).olFrameRateDisplay = display;
  return display;
}
