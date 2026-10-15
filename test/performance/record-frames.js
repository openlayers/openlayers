#! /usr/bin/env node
/**
 * Record Chrome compositor frame states while navigating the VersaTiles page.
 *
 *   node test/performance/record-frames.js
 *   node test/performance/record-frames.js --seconds 20 --out session.json
 *
 * Opens a headed Chrome window with the frame overlay on, and traces
 * `PipelineReporter` frame states (presented, partially presented, dropped).
 * Chrome only delivers those events when a trace stops, so the trace is
 * flushed about once a second. The gap between windows is not counted.
 * Press Enter or close the window to write the session JSON.
 */
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {chromium} from 'playwright';
import {fileURLToPath} from 'url';
import {createServer} from 'vite';
import viteConfig from './vite.config.js';

const baseDir = dirname(fileURLToPath(import.meta.url));

const TRACE = {
  transferMode: 'ReportEvents',
  traceConfig: {
    recordMode: 'recordUntilFull',
    includedCategories: ['disabled-by-default-devtools.timeline.frame'],
    excludedCategories: ['*'],
  },
};

const COUNTED = {
  STATE_PRESENTED_ALL: 'presented',
  STATE_PRESENTED_PARTIAL: 'partial',
  STATE_DROPPED: 'dropped',
};

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
 * @param {import('playwright').Browser} browser Browser.
 * @param {string} url Page URL.
 * @return {Promise<import('playwright').Page>} Page.
 */
async function openPage(browser, url) {
  const context = await browser.newContext({viewport: null});
  const page = await context.newPage();
  page.on('pageerror', (error) => {
    log(`page error: ${error.message}`);
  });
  await page.goto(`${url}/versatiles.html`, {waitUntil: 'load'});
  try {
    await page.waitForFunction(
      () => typeof (/** @type {any} */ (window).olFrameHud) === 'object',
      undefined,
      {timeout: 30000},
    );
  } catch {
    throw new Error(
      'Frame HUD did not start. If the dataset is missing, run node test/performance/fetch-versatiles.js',
    );
  }
  return page;
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
    '--show-fps-counter',
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
 * @param {Array<{ts: number, kind: string}>} frames Frames in one window.
 * @param {number} recordedMs Recording length, excluding the flush.
 * @param {number} index Window index.
 * @return {Object} Window summary.
 */
function summarizeWindow(frames, recordedMs, index) {
  const ordered = frames.slice().sort((a, b) => a.ts - b.ts);
  let presented = 0;
  let partial = 0;
  let dropped = 0;
  for (const frame of ordered) {
    if (frame.kind === 'presented') {
      presented += 1;
    } else if (frame.kind === 'partial') {
      partial += 1;
    } else if (frame.kind === 'dropped') {
      dropped += 1;
    }
  }
  const seconds = Math.max(recordedMs, 1) / 1000;
  return {
    t: index,
    recordedMs: Math.round(recordedMs),
    presented,
    partial,
    dropped,
    fps: (presented + partial) / seconds,
    frames: ordered,
  };
}

/**
 * @param {Array<{kind: string}>} frames Frames in trace order.
 * @return {number} Longest consecutive dropped run.
 */
function longestDroppedRun(frames) {
  let run = 0;
  let longest = 0;
  for (const frame of frames) {
    if (frame.kind === 'dropped') {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  return longest;
}

/**
 * @param {import('playwright').Page} page Page.
 * @param {Object} counts Counts for the latest window.
 * @return {Promise<void>} Completes after the page is updated.
 */
async function pushCounts(page, counts) {
  if (page.isClosed()) {
    return;
  }
  await page
    .evaluate((value) => {
      window /** @type {any} */.olFrameHud
        ?.setChromeCounts(value);
    }, counts)
    .catch(() => undefined);
}

/**
 * @param {import('playwright').Page} page Page.
 * @return {Promise<number|undefined>} Refresh interval in milliseconds.
 */
async function readRefresh(page) {
  if (page.isClosed()) {
    return undefined;
  }
  return page
    .evaluate(() => {
      const hud = /** @type {any} */ (window).olFrameHud;
      return hud ? hud.getRefreshMs() : undefined;
    })
    .catch(() => undefined);
}

/**
 * @param {import('playwright').CDPSession} client Session.
 * @param {import('playwright').Page} page Page.
 * @param {Promise<void>} stopped Resolves when the session should end.
 * @return {Promise<Object>} Session report.
 */
async function record(client, page, stopped) {
  /** @type {Array<Object>} */
  const windows = [];
  /** @type {Array<{kind: string}>} */
  const allFrames = [];
  let displayMs = await readRefresh(page);
  let index = 0;
  let stop = false;
  stopped.then(() => {
    stop = true;
  });

  while (!stop && !page.isClosed()) {
    /** @type {Array<{ts: number, kind: string}>} */
    const frames = [];
    /**
     * @param {{value: Array<Object>}} payload Trace batch.
     */
    const onData = ({value}) => {
      for (const event of value) {
        const reporter = event.args?.frame_reporter;
        const kind = COUNTED[reporter?.state];
        // A forked reporter repeats the same display frame for a second
        // sequence and would double the frame rate.
        if (
          !kind ||
          reporter.frame_type === 'FORKED' ||
          typeof event.ts !== 'number'
        ) {
          continue;
        }
        frames.push({ts: event.ts, kind});
      }
    };
    client.on('Tracing.dataCollected', onData);
    await client.send('Tracing.start', TRACE);
    const recordStart = performance.now();
    await Promise.race([
      page.waitForTimeout(1000).catch(() => undefined),
      stopped,
    ]);
    const recordedMs = performance.now() - recordStart;
    try {
      await client.send('Tracing.end');
      await new Promise((resolve) => {
        client.once('Tracing.tracingComplete', () => resolve(undefined));
      });
      await page.waitForTimeout(50).catch(() => undefined);
    } catch {
      client.off('Tracing.dataCollected', onData);
      break;
    }
    client.off('Tracing.dataCollected', onData);
    const summary = summarizeWindow(frames, recordedMs, index);
    allFrames.push(...summary.frames);
    const row = {
      t: summary.t,
      recordedMs: summary.recordedMs,
      presented: summary.presented,
      partial: summary.partial,
      dropped: summary.dropped,
      fps: Math.round(summary.fps * 10) / 10,
    };
    windows.push(row);
    log(
      `${row.t}s  presented ${row.presented}  partial ${row.partial}  dropped ${row.dropped}  fps ${row.fps}`,
    );
    await pushCounts(page, row);
    displayMs = (await readRefresh(page)) || displayMs;
    index += 1;
  }

  const presented = windows.reduce((sum, row) => sum + row.presented, 0);
  const partial = windows.reduce((sum, row) => sum + row.partial, 0);
  const dropped = windows.reduce((sum, row) => sum + row.dropped, 0);
  const total = presented + partial + dropped;
  return {
    displayMs: displayMs || null,
    presented,
    partial,
    dropped,
    partialOrDroppedShare: total ? (partial + dropped) / total : 0,
    longestDroppedRun: longestDroppedRun(allFrames),
    windows,
  };
}

const seconds = option('seconds');
const outPath = path.resolve(
  option('out') || path.join(baseDir, 'data', 'frame-session.json'),
);
const port = option('port');

const server = await serve(port ? Number(port) : undefined);
const browser = await launchBrowser();
try {
  const page = await openPage(browser, server.url);
  log(`recording ${server.url}/versatiles.html`);
  log('navigate the map, then press Enter or close the window');
  const stopped = new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(undefined);
    };
    page.on('close', finish);
    if (seconds) {
      setTimeout(finish, Number(seconds) * 1000);
    }
    if (process.stdin.isTTY) {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (data) => {
        if (String(data).includes('\n')) {
          finish();
        }
      });
      process.stdin.resume();
    }
  });
  const client = await page.context().newCDPSession(page);
  const report = await record(client, page, stopped);
  await fs.mkdir(path.dirname(outPath), {recursive: true});
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  const share = (report.partialOrDroppedShare * 100).toFixed(1);
  log('');
  log(
    `presented ${report.presented}  partial ${report.partial}  dropped ${report.dropped}`,
  );
  log(
    `partial or dropped ${share}%  longest dropped run ${report.longestDroppedRun}  display ${report.displayMs} ms`,
  );
  log(`wrote ${outPath}`);
} finally {
  await browser.close();
  await server.close();
}
