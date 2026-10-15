#! /usr/bin/env node
/**
 * Count WebGPU commands per frame on the VersaTiles page, at rest and while
 * panning.
 *
 *   node test/performance/count-gpu-calls.js
 *
 * Every command recorded in the page has to be validated and translated by
 * the GPU process before the graphics card sees it, so the number of draws
 * and state changes per frame is what that process spends its time on.
 */
import {chromium} from 'playwright';

const VIEW = 'x=1813830.60524&y=6141396.74283&z=15&r=0&l=1';

/**
 * @param {...*} args Values to print.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

/**
 * Wrap encoder and queue methods so each call increments a counter.
 * Runs in the page before any script.
 */
function instrument() {
  const counts = {};
  /** @type {any} */ (window).__gpuCounts = counts;
  const wrap = (proto, names, prefix) => {
    if (!proto) {
      return;
    }
    for (const name of names) {
      const original = proto[name];
      if (typeof original !== 'function') {
        continue;
      }
      const key = `${prefix}.${name}`;
      proto[name] = function (...args) {
        counts[key] = (counts[key] || 0) + 1;
        if (prefix === 'bundle' && name === 'drawIndexed') {
          const n = args[0];
          const bucket =
            n <= 6 ? 'idx<=6' : n <= 60 ? 'idx<=60' : n <= 600 ? 'idx<=600' : 'idx>600';
          counts[bucket] = (counts[bucket] || 0) + 1;
        }
        if (prefix === 'bundle' && name === 'setVertexBuffer' && args[0] === 0) {
          const buffers = /** @type {any} */ (window).__vbufs || new Set();
          /** @type {any} */ (window).__vbufs = buffers;
          buffers.add(args[1]);
        }
        if (name === 'executeBundles') {
          counts['bundlesExecuted'] =
            (counts['bundlesExecuted'] || 0) + (args[0]?.length || 0);
        }
        if (name === 'submit') {
          counts['commandBuffers'] =
            (counts['commandBuffers'] || 0) + (args[0]?.length || 0);
        }
        return original.apply(this, args);
      };
    }
  };
  const drawing = [
    'draw',
    'drawIndexed',
    'setVertexBuffer',
    'setIndexBuffer',
    'setBindGroup',
    'setPipeline',
    'executeBundles',
    'setScissorRect',
    'setStencilReference',
  ];
  wrap(globalThis.GPURenderPassEncoder?.prototype, drawing, 'pass');
  wrap(globalThis.GPURenderBundleEncoder?.prototype, drawing, 'bundle');
  wrap(globalThis.GPUCommandEncoder?.prototype, ['beginRenderPass', 'copyBufferToBuffer'], 'encoder');
  wrap(globalThis.GPUQueue?.prototype, ['submit', 'writeBuffer', 'writeTexture', 'copyExternalImageToTexture'], 'queue');
  wrap(globalThis.GPUDevice?.prototype, ['createBindGroup', 'createBuffer', 'createRenderBundleEncoder'], 'device');
}

/**
 * @param {import('playwright').Page} page Page.
 * @param {function(): Promise<void>} during Work to measure.
 * @return {Promise<Object>} Counts per animation frame.
 */
async function measure(page, during) {
  await page.evaluate(() => {
    const state = /** @type {any} */ (window);
    for (const key of Object.keys(state.__gpuCounts)) {
      delete state.__gpuCounts[key];
    }
    state.__frames = 0;
    state.__counting = true;
    const tick = () => {
      if (!state.__counting) {
        return;
      }
      state.__frames += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await during();
  return page.evaluate(() => {
    const state = /** @type {any} */ (window);
    state.__counting = false;
    const frames = state.__frames || 1;
    const totals = {...state.__gpuCounts};
    totals.distinctPositionBuffers = state.__vbufs ? state.__vbufs.size : 0;
    state.__vbufs = new Set();
    const submits = totals['queue.submit'] || 1;
    const perSubmit = {};
    for (const [key, value] of Object.entries(totals)) {
      perSubmit[key] = Math.round((value / submits) * 10) / 10;
    }
    return {frames, totals, perSubmit};
  });
}

const browser = await chromium.launch({
  headless: false,
  channel: 'chrome',
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan'],
});
try {
  const context = await browser.newContext({viewport: null});
  await context.addInitScript(instrument);
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:8123/versatiles.html?${VIEW}`, {
    waitUntil: 'load',
  });
  await page.waitForFunction(
    () => typeof (/** @type {any} */ (window).olFrameHud) === 'object',
  );
  await page.waitForTimeout(3000);

  const rest = await measure(page, () => page.waitForTimeout(2000));
  log('at rest', JSON.stringify(rest, null, 2));

  const size = await page.evaluate(() => [innerWidth, innerHeight]);
  const panning = await measure(page, async () => {
    const y = size[1] / 2;
    for (let i = 0; i < 2; ++i) {
      const from = size[0] * (i % 2 ? 0.25 : 0.75);
      const to = size[0] * (i % 2 ? 0.65 : 0.35);
      await page.mouse.move(from, y);
      await page.mouse.down();
      for (let step = 1; step <= 90; ++step) {
        await page.mouse.move(from + ((to - from) * step) / 90, y);
        await page.waitForTimeout(8);
      }
      await page.mouse.up();
    }
  });
  log('panning', JSON.stringify(panning, null, 2));
} finally {
  await browser.close();
}
