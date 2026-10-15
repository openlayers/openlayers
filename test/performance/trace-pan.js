#! /usr/bin/env node
/**
 * Record a full Chrome trace while panning the VersaTiles page, and summarize
 * where each frame's time went.
 *
 *   node test/performance/trace-pan.js
 *   node test/performance/trace-pan.js --pans 4 --out test/performance/data/pan-trace.json
 *
 * The trace file opens in the DevTools Performance panel (Load profile). The
 * summary JSON next to it splits the pan into display frames and reports, per
 * thread, how busy the page main thread, the GPU process, and the compositor
 * were, plus what Chrome says happened to each frame.
 */
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {chromium} from 'playwright';
import {fileURLToPath} from 'url';
import {createServer} from 'vite';
import viteConfig from './vite.config.js';

const baseDir = dirname(fileURLToPath(import.meta.url));

const DEFAULT_VIEW = 'x=1813830.60524&y=6141396.74283&z=15&r=0&l=1';

const CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.stack',
  'disabled-by-default-v8.cpu_profiler',
  'v8.execute',
  'toplevel',
  'blink',
  'blink.user_timing',
  'cc',
  'viz',
  'gpu',
  'gpu.dawn',
  'gpu.service',
  'benchmark',
  'input',
  'latencyInfo',
];

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
 * Drag with real input events, so the pan goes through Chrome's input
 * pipeline the way a mouse does.
 * @param {import('playwright').Page} page Page.
 * @param {number} pans Number of drags.
 * @return {Promise<void>} Completes after the last drag.
 */
async function pan(page, pans) {
  const size = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const y = Math.round(size.height / 2);
  for (let i = 0; i < pans; ++i) {
    const left = i % 2 === 0;
    const startX = Math.round(size.width * (left ? 0.75 : 0.25));
    const endX = Math.round(size.width * (left ? 0.35 : 0.65));
    await page.mouse.move(startX, y);
    await page.mouse.down();
    const steps = 90;
    for (let step = 1; step <= steps; ++step) {
      await page.mouse.move(startX + ((endX - startX) * step) / steps, y);
      await page.waitForTimeout(8);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
}

/**
 * @param {import('playwright').CDPSession} client Session.
 * @param {string} handle Stream handle.
 * @return {Promise<string>} Stream contents.
 */
async function readStream(client, handle) {
  const chunks = [];
  for (;;) {
    const {data, eof, base64Encoded} = await client.send('IO.read', {
      handle,
      size: 1 << 20,
    });
    chunks.push(base64Encoded ? Buffer.from(data, 'base64').toString() : data);
    if (eof) {
      break;
    }
  }
  await client.send('IO.close', {handle});
  return chunks.join('');
}

/**
 * @param {Array<number>} values Values.
 * @param {number} q Quantile in `[0, 1]`.
 * @return {number} Quantile.
 */
function quantile(values, q) {
  if (!values.length) {
    return 0;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/**
 * @param {number} us Microseconds.
 * @return {number} Milliseconds, one decimal.
 */
function ms(us) {
  return Math.round(us / 100) / 10;
}

/**
 * @param {Array<Object>} events Trace events.
 * @param {string} pageUrl Page URL, to find the renderer process.
 * @return {Object} Summary.
 */
function summarize(events, pageUrl) {
  /** @type {Map<string, string>} */
  const threadNames = new Map();
  /** @type {Map<number, string>} */
  const processNames = new Map();
  for (const event of events) {
    if (event.ph !== 'M') {
      continue;
    }
    if (event.name === 'thread_name') {
      threadNames.set(`${event.pid}:${event.tid}`, event.args.name);
    } else if (event.name === 'process_name') {
      processNames.set(event.pid, event.args.name);
    }
  }

  const rendererPid = findRendererPid(events, pageUrl);
  const gpuPid = [...processNames].find(
    ([, name]) => name === 'GPU Process',
  )?.[0];
  const browserPid = [...processNames].find(
    ([, name]) => name === 'Browser',
  )?.[0];

  const pipelines = events.filter(
    (event) =>
      event.name === 'PipelineReporter' &&
      event.ph === 'b' &&
      event.pid === rendererPid &&
      event.args?.frame_reporter?.state &&
      event.args.frame_reporter.frame_type !== 'FORKED',
  );
  const states = {};
  for (const event of pipelines) {
    const state = event.args.frame_reporter.state;
    states[state] = (states[state] || 0) + 1;
  }

  const panStart = Math.min(
    ...events
      .filter(
        (event) =>
          event.name === 'EventDispatch' &&
          event.args?.data?.type === 'pointerdown',
      )
      .map((event) => event.ts),
  );
  const panEnd = Math.max(
    ...events
      .filter(
        (event) =>
          event.name === 'EventDispatch' &&
          event.args?.data?.type === 'pointerup',
      )
      .map((event) => event.ts + (event.dur || 0)),
  );
  const windowUs =
    Number.isFinite(panStart) && Number.isFinite(panEnd)
      ? panEnd - panStart
      : 0;

  /**
   * Busy time per thread inside the pan window, from top-level tasks only.
   * @type {Map<string, {name: string, process: string, busyUs: number, tasks: Array<number>}>}
   */
  const threads = new Map();
  for (const event of events) {
    if (event.ph !== 'X' || !event.dur) {
      continue;
    }
    if (
      event.name !== 'ThreadControllerImpl::RunTask' &&
      event.name !== 'RunTask'
    ) {
      continue;
    }
    if (event.ts < panStart || event.ts > panEnd) {
      continue;
    }
    const key = `${event.pid}:${event.tid}`;
    let thread = threads.get(key);
    if (!thread) {
      thread = {
        name: threadNames.get(key) || key,
        process: processNames.get(event.pid) || String(event.pid),
        busyUs: 0,
        tasks: [],
      };
      threads.set(key, thread);
    }
    thread.busyUs += event.dur;
    thread.tasks.push(event.dur);
  }
  const busiest = [...threads.values()]
    .filter((thread) => thread.busyUs > 0)
    .sort((a, b) => b.busyUs - a.busyUs)
    .slice(0, 12)
    .map((thread) => ({
      thread: thread.name,
      process: thread.process,
      busyMs: ms(thread.busyUs),
      busyShare: windowUs
        ? Math.round((thread.busyUs / windowUs) * 1000) / 10
        : 0,
      tasks: thread.tasks.length,
      taskP95Ms: ms(quantile(thread.tasks, 0.95)),
      taskMaxMs: ms(Math.max(...thread.tasks)),
    }));

  /**
   * Named events by total duration, per process of interest, inside the pan.
   * @param {number|undefined} pid Process.
   * @return {Array<Object>} Top events.
   */
  function topEvents(pid) {
    /** @type {Map<string, {us: number, count: number}>} */
    const totals = new Map();
    for (const event of events) {
      if (event.pid !== pid || event.ph !== 'X' || !event.dur) {
        continue;
      }
      if (event.ts < panStart || event.ts > panEnd) {
        continue;
      }
      if (
        event.name === 'ThreadControllerImpl::RunTask' ||
        event.name === 'RunTask' ||
        event.name === 'ThreadController active'
      ) {
        continue;
      }
      const entry = totals.get(event.name) || {us: 0, count: 0};
      entry.us += event.dur;
      entry.count += 1;
      totals.set(event.name, entry);
    }
    return [...totals]
      .sort((a, b) => b[1].us - a[1].us)
      .slice(0, 25)
      .map(([name, value]) => ({
        name,
        totalMs: ms(value.us),
        count: value.count,
        avgMs: ms(value.us / value.count),
      }));
  }

  const stageNames = [
    'BeginImplFrameToSendBeginMainFrame',
    'SendBeginMainFrameToCommit',
    'Commit',
    'EndCommitToActivation',
    'Activation',
    'EndActivateToSubmitCompositorFrame',
    'SubmitCompositorFrameToPresentationCompositorFrame',
  ];
  /** @type {Object<string, Array<number>>} */
  const stages = {};
  for (const event of events) {
    if (
      event.pid !== rendererPid ||
      event.ph !== 'b' ||
      !stageNames.includes(event.name) ||
      event.ts < panStart ||
      event.ts > panEnd
    ) {
      continue;
    }
    const end = events.find(
      (other) =>
        other.ph === 'e' &&
        other.name === event.name &&
        other.id2?.local === event.id2?.local &&
        other.pid === event.pid &&
        other.ts >= event.ts,
    );
    if (!end) {
      continue;
    }
    (stages[event.name] ||= []).push(end.ts - event.ts);
  }
  const stageSummary = Object.fromEntries(
    Object.entries(stages).map(([name, values]) => [
      name,
      {
        p50Ms: ms(quantile(values, 0.5)),
        p95Ms: ms(quantile(values, 0.95)),
        count: values.length,
      },
    ]),
  );

  const animationFrames = events
    .filter(
      (event) =>
        event.pid === rendererPid &&
        event.ph === 'X' &&
        event.name === 'FireAnimationFrame' &&
        event.ts >= panStart &&
        event.ts <= panEnd,
    )
    .map((event) => event.dur || 0);
  const pointerMoves = events
    .filter(
      (event) =>
        event.pid === rendererPid &&
        event.ph === 'X' &&
        event.name === 'EventDispatch' &&
        event.args?.data?.type === 'pointermove' &&
        event.ts >= panStart &&
        event.ts <= panEnd,
    )
    .map((event) => event.dur || 0);

  return {
    panMs: ms(windowUs),
    frameStatesWholeTrace: states,
    animationFrame: {
      count: animationFrames.length,
      p50Ms: ms(quantile(animationFrames, 0.5)),
      p95Ms: ms(quantile(animationFrames, 0.95)),
      maxMs: ms(Math.max(0, ...animationFrames)),
      totalMs: ms(animationFrames.reduce((sum, value) => sum + value, 0)),
    },
    pointerMove: {
      count: pointerMoves.length,
      p50Ms: ms(quantile(pointerMoves, 0.5)),
      p95Ms: ms(quantile(pointerMoves, 0.95)),
      totalMs: ms(pointerMoves.reduce((sum, value) => sum + value, 0)),
    },
    frameStages: stageSummary,
    busiestThreads: busiest,
    rendererEvents: topEvents(rendererPid),
    gpuEvents: topEvents(gpuPid),
    browserEvents: topEvents(browserPid),
  };
}

/**
 * @param {Array<Object>} events Trace events.
 * @param {string} pageUrl Page URL.
 * @return {number|undefined} Renderer process id.
 */
function findRendererPid(events, pageUrl) {
  const host = new URL(pageUrl).host;
  for (const event of events) {
    const url = event.args?.data?.url || event.args?.data?.frames?.[0]?.url;
    if (typeof url === 'string' && url.includes(host)) {
      return event.pid;
    }
  }
  const counts = new Map();
  for (const event of events) {
    if (event.name === 'FireAnimationFrame') {
      counts.set(event.pid, (counts.get(event.pid) || 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const pans = Number(option('pans') || 4);
const view = option('view') || DEFAULT_VIEW;
const tracePath = path.resolve(
  option('out') || path.join(baseDir, 'data', 'pan-trace.json'),
);
const summaryPath = tracePath.replace(/\.json$/, '') + '-summary.json';

const server = await serve(option('port') ? Number(option('port')) : undefined);
const browser = await launchBrowser();
try {
  const context = await browser.newContext({viewport: null});
  const page = await context.newPage();
  page.on('pageerror', (error) => log(`page error: ${error.message}`));
  const pageUrl = `${server.url}/versatiles.html?${view}`;
  await page.goto(pageUrl, {waitUntil: 'load'});
  await page.waitForFunction(
    () => typeof (/** @type {any} */ (window).olFrameHud) === 'object',
  );
  await page.waitForTimeout(3000);

  const client = await context.newCDPSession(page);
  await client.send('Tracing.start', {
    transferMode: 'ReturnAsStream',
    streamCompression: 'none',
    traceConfig: {
      recordMode: 'recordAsMuchAsPossible',
      includedCategories: CATEGORIES,
      excludedCategories: ['*'],
    },
  });
  await page.waitForTimeout(300);
  await pan(page, pans);
  const hud = await page.locator('.ol-frame-hud').innerText();
  const done = new Promise((resolve) =>
    client.once('Tracing.tracingComplete', resolve),
  );
  await client.send('Tracing.end');
  const {stream} = /** @type {{stream: string}} */ (await done);
  const text = await readStream(client, stream);
  await fs.mkdir(path.dirname(tracePath), {recursive: true});
  await fs.writeFile(tracePath, text);
  const parsed = JSON.parse(text);
  const events = Array.isArray(parsed) ? parsed : parsed.traceEvents;
  const summary = {view, pans, hud, ...summarize(events, pageUrl)};
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  log(JSON.stringify(summary, null, 2));
  log(`wrote ${tracePath} (${(text.length / 1e6).toFixed(1)} MB)`);
  log(`wrote ${summaryPath}`);
} finally {
  await browser.close();
  await server.close();
}
