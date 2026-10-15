#! /usr/bin/env node
/**
 * Sample the main thread while panning the VersaTiles page.
 *
 *   node test/performance/profile-pan.js
 *   node test/performance/profile-pan.js --pans 4 --out profile.json
 *
 * Reuses the bench server when it is already running. Opens the focus view,
 * waits until the map is drawing, then records a V8 CPU profile across
 * repeated drags. The JSON lists functions by self time so a slow pan can be
 * compared from one run to the next.
 */
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {chromium} from 'playwright';
import {fileURLToPath} from 'url';
import {createServer} from 'vite';
import viteConfig from './vite.config.js';

const baseDir = dirname(fileURLToPath(import.meta.url));

const DEFAULT_VIEW = 'x=1813830.60524&y=6141396.74283&z=15&r=0&l=1';

/**
 * @param {...*} args Values to print.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

/**
 * @param {string} name Flag name, without leading dashes.
 * @return {string|undefined} The following argument.
 */
function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`--${name} needs a value`);
  }
  return value;
}

/**
 * @param {number} [port] Preferred port.
 * @return {Promise<{url: string, close: function(): Promise<void>}>} Server.
 */
async function serve(port) {
  const preferred = port || 8123;
  try {
    const response = await fetch(
      `http://127.0.0.1:${preferred}/versatiles.html`,
    );
    if (response.ok) {
      log(`using the server already on port ${preferred}`);
      return {
        url: `http://127.0.0.1:${preferred}`,
        close: () => Promise.resolve(),
      };
    }
  } catch {
    // Nothing is serving the page there.
  }
  const server = await createServer({
    ...viteConfig,
    configFile: false,
    logLevel: 'error',
    server: {host: '127.0.0.1', port: preferred, strictPort: false},
  });
  await server.listen();
  const address = server.httpServer?.address();
  const actual =
    address && typeof address === 'object' ? address.port : preferred;
  return {
    url: `http://127.0.0.1:${actual}`,
    close: () => server.close(),
  };
}

/**
 * @return {Promise<import('playwright').Browser>} Headed Chrome.
 */
async function launchBrowser() {
  const args = [
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan',
    '--disable-dev-shm-usage',
  ];
  try {
    return await chromium.launch({headless: false, channel: 'chrome', args});
  } catch (error) {
    log(
      `system Chrome unavailable (${error instanceof Error ? error.message : error}); using bundled Chromium`,
    );
    return await chromium.launch({headless: false, args});
  }
}

/**
 * Drag the map back and forth.
 * Runs in the page.
 * @param {number} pans Number of drags.
 * @return {Promise<Array<string>>} HUD text after each drag.
 */
function panRepeatedly(pans) {
  const viewport = document.querySelector('.ol-viewport');
  if (!viewport) {
    throw new Error('map viewport is missing');
  }
  const notes = [];
  const pointer = (target, type, x, y, buttons) => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons,
      }),
    );
  };
  return (async () => {
    for (let pan = 0; pan < pans; ++pan) {
      const rect = viewport.getBoundingClientRect();
      const direction = pan % 2 === 0 ? -1 : 1;
      const startX = rect.left + rect.width * (direction < 0 ? 0.75 : 0.25);
      const y = rect.top + rect.height * 0.5;
      const distance = rect.width * 0.4 * direction;
      const steps = 45;
      pointer(viewport, 'pointerdown', startX, y, 1);
      for (let i = 1; i <= steps; ++i) {
        pointer(document, 'pointermove', startX + distance * (i / steps), y, 1);
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
      pointer(document, 'pointerup', startX + distance, y, 0);
      await new Promise((resolve) => setTimeout(resolve, 250));
      notes.push(document.querySelector('.ol-frame-hud')?.textContent || '');
    }
    return notes;
  })();
}

/**
 * @param {Object} profile V8 CPU profile.
 * @return {Array<Object>} Functions ordered by self time.
 */
function summarizeProfile(profile) {
  /** @type {Map<number, Object>} */
  const nodes = new Map();
  /** @type {Map<number, number>} */
  const parentOf = new Map();
  for (const node of profile.nodes) {
    nodes.set(node.id, node);
    for (const child of node.children || []) {
      parentOf.set(child, node.id);
    }
  }
  /** @type {Map<number, number>} */
  const selfUs = new Map();
  const samples = profile.samples || [];
  const deltas = profile.timeDeltas || [];
  for (let i = 0; i < samples.length; ++i) {
    const id = samples[i];
    selfUs.set(id, (selfUs.get(id) || 0) + (deltas[i] || 0));
  }
  /** @type {Map<string, {name: string, url: string, line: number, selfUs: number, callers: Map<string, number>}>} */
  const byFrame = new Map();
  for (const [id, us] of selfUs) {
    const node = nodes.get(id);
    const frame = node?.callFrame;
    if (!frame) {
      continue;
    }
    const name = frame.functionName || '(anonymous)';
    const url = frame.url || '';
    const line = frame.lineNumber + 1;
    const key = `${name} ${url}:${line}`;
    let entry = byFrame.get(key);
    if (!entry) {
      entry = {name, url, line, selfUs: 0, callers: new Map()};
      byFrame.set(key, entry);
    }
    entry.selfUs += us;
    const parent = nodes.get(parentOf.get(id));
    const callerName = parent?.callFrame?.functionName || '(root)';
    entry.callers.set(callerName, (entry.callers.get(callerName) || 0) + us);
  }
  return [...byFrame.values()]
    .sort((a, b) => b.selfUs - a.selfUs)
    .slice(0, 40)
    .map((entry) => {
      const caller = [...entry.callers.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0];
      return {
        name: entry.name,
        file: entry.url ? path.basename(entry.url.split('?')[0]) : '',
        line: entry.line,
        selfMs: Math.round(entry.selfUs / 100) / 10,
        topCaller: caller ? caller[0] : '',
      };
    });
}

const pans = Number(option('pans') || 4);
const view = option('view') || DEFAULT_VIEW;
const outPath = path.resolve(
  option('out') || path.join(baseDir, 'data', 'pan-profile.json'),
);

const server = await serve(option('port') ? Number(option('port')) : undefined);
const browser = await launchBrowser();
try {
  const context = await browser.newContext({viewport: null});
  const page = await context.newPage();
  page.on('pageerror', (error) => log(`page error: ${error.message}`));
  await page.goto(`${server.url}/versatiles.html?${view}`, {waitUntil: 'load'});
  await page.waitForFunction(
    () => typeof (/** @type {any} */ (window).olFrameHud) === 'object',
  );
  await page.waitForTimeout(2500);
  const before = await page.locator('.ol-frame-hud').innerText();
  log('before pan:');
  log(before);

  const client = await context.newCDPSession(page);
  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', {interval: 100});
  await client.send('Profiler.start');
  const hud = await page.evaluate(panRepeatedly, pans);
  const {profile} = await client.send('Profiler.stop');
  const after = await page.locator('.ol-frame-hud').innerText();

  const report = {
    view,
    pans,
    hudBefore: before,
    hudDuring: hud,
    hudAfter: after,
    topSelfTime: summarizeProfile(profile),
  };
  await fs.mkdir(path.dirname(outPath), {recursive: true});
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  log('');
  log('after pan:');
  log(after);
  log('');
  const width = Math.max(...report.topSelfTime.map((row) => row.name.length));
  for (const row of report.topSelfTime.slice(0, 25)) {
    log(
      `${row.selfMs.toFixed(1).padStart(8)} ms  ${row.name.padEnd(width)}  ${row.file}:${row.line}  ← ${row.topCaller}`,
    );
  }
  log('');
  log(`wrote ${outPath}`);
} finally {
  await browser.close();
  await server.close();
}
