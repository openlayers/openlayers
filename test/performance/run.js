#! /usr/bin/env node
/**
 * Headless runner for the performance cases in this directory.
 *
 *   node test/performance/run.js --out base.json
 *   node test/performance/run.js --out head.json
 *   node test/performance/run.js --compare base.json head.json
 *
 * Each case is driven several times and aggregated with a trimmed mean, so a
 * single slow run caused by other load on the machine does not dominate.
 */
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {chromium} from 'playwright';
import {fileURLToPath} from 'url';
import {createServer} from 'vite';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {trimmedMean} from './stats.js';
import viteConfig from './vite.config.js';

const baseDir = dirname(fileURLToPath(import.meta.url));

/**
 * @param {...*} args Values to print.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

/**
 * @param {...*} args Values to print.
 */
function logError(...args) {
  console.error(...args); // eslint-disable-line no-console
}

/**
 * Metrics lifted into the top-level summary and used for comparisons.
 */
const SUMMARY_KEYS = [
  'frameMs.p50',
  'frameMs.p95',
  'frameMs.p99',
  'cpuMs.p50',
  'cpuMs.p95',
  'cpuMs.p99',
  'slowFrames20',
  'slowFrames33',
];

/**
 * @param {Object} object Object.
 * @param {string} keyPath Dot-separated path.
 * @return {number|undefined} Value.
 */
function pick(object, keyPath) {
  return keyPath
    .split('.')
    .reduce((value, key) => (value === undefined ? value : value[key]), object);
}

/**
 * @param {Array<Object>} runs Individual run results.
 * @return {Object<string, number>} Trimmed mean per summary key.
 */
function summarizeRuns(runs) {
  /** @type {Object<string, number>} */
  const summary = {};
  for (const key of SUMMARY_KEYS) {
    summary[key] = trimmedMean(runs.map((run) => pick(run, key)));
  }
  const metricNames = new Set();
  for (const run of runs) {
    for (const phase of run.phases || []) {
      for (const name in phase.metrics) {
        metricNames.add(name);
      }
    }
  }
  for (const name of metricNames) {
    const perRun = runs.map((run) =>
      (run.phases || []).reduce(
        (sum, phase) => sum + (phase.metrics[name] || 0),
        0,
      ),
    );
    summary['metrics.' + name] = trimmedMean(perRun);
  }
  return summary;
}

/**
 * @return {Promise<Array<string>>} Case names, from `cases/*.js`.
 */
async function listCases() {
  const names = (await fs.readdir(path.join(baseDir, 'cases')))
    .filter((name) => name.endsWith('.js'))
    .map((name) => name.slice(0, -3))
    .sort();
  if (!names.length) {
    throw new Error('no benchmark cases found');
  }
  return names;
}

/**
 * @param {Object} options Options.
 * @return {Promise<{url: string, close: function(): Promise<void>}>} Server.
 */
async function serve(options) {
  const server = await createServer({
    ...viteConfig,
    configFile: false,
    logLevel: 'error',
    // Bind IPv4 explicitly: with `localhost` the dev server only listens on
    // ::1, which the browser cannot reach at 127.0.0.1.
    server: {host: '127.0.0.1', port: options.port, strictPort: false},
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port =
    address && typeof address === 'object' ? address.port : options.port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  };
}

/**
 * @param {import('playwright').Page} page Page.
 * @param {string} url Page URL.
 * @param {Object} options Options.
 * @param {string} caseName Case name.
 */
async function openCase(page, url, options, caseName) {
  const query = new URLSearchParams({
    case: caseName,
    projection: options.projection,
    features: String(options.features),
    vertices: String(options.vertices),
    frames: String(options.frames),
    warmup: String(options.warmup),
    autorun: 'false',
  });
  await page.goto(`${url}/?${query}`, {
    waitUntil: 'load',
    timeout: options.timeout,
  });
}

/**
 * @param {Object} options Options.
 * @return {Promise<Object>} Aggregated result.
 */
async function measure(options) {
  const caseNames = options.case ? [options.case] : await listCases();
  if (options.case && !(await listCases()).includes(options.case)) {
    throw new Error(`unknown benchmark case: ${options.case}`);
  }
  const server = await serve(options);
  const browser = await chromium.launch({
    headless: options.headless,
    // The default headless shell has no WebGPU support; the full browser in
    // headless mode does.
    channel: options.channel,
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--disable-dev-shm-usage',
      ...options.browserArg,
    ],
  });
  try {
    const [width, height] = options.viewport.split('x').map(Number);
    const page = await browser.newPage({viewport: {width, height}});
    page.setDefaultTimeout(options.timeout);
    page.on('pageerror', (err) => logError('page error:', err.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        logError('console error:', message.text());
      }
    });

    await openCase(page, server.url, options, caseNames[0]);
    const supported = await page.evaluate(() => !!navigator.gpu);
    if (!supported) {
      return {
        skipped: true,
        reason:
          'WebGPU is not available in this browser. Try --no-headless, or pass ' +
          '--browser-arg to enable it for your platform.',
      };
    }

    /** @type {Object<string, Object>} */
    const cases = {};
    for (const caseName of caseNames) {
      await openCase(page, server.url, options, caseName);
      /** @type {Array<Object>} */
      const runs = [];
      for (let i = 0; i < options.runs; ++i) {
        const result = await page.evaluate(
          () => /** @type {any} */ (window).olBenchmark.run(),
          undefined,
        );
        if (result.error) {
          throw new Error(`${caseName}: ${result.error}`);
        }
        runs.push(result);
        log(
          `${caseName} run ${i + 1}/${options.runs}: frame p50 ${result.frameMs.p50.toFixed(
            1,
          )}ms, p99 ${result.frameMs.p99.toFixed(
            1,
          )}ms, cpu p50 ${result.cpuMs.p50.toFixed(1)}ms`,
        );
      }
      cases[caseName] = {
        config: runs[0].config,
        size: runs[0].size,
        devicePixelRatio: runs[0].devicePixelRatio,
        runs,
        summary: summarizeRuns(runs),
      };
    }
    return {cases};
  } finally {
    await browser.close();
    await server.close();
  }
}

/**
 * @param {string} title Table title.
 * @param {Object<string, number>} base Baseline summary.
 * @param {Object<string, number>} head Candidate summary.
 */
function compareSummaries(title, base, head) {
  const names = new Set([...Object.keys(base), ...Object.keys(head)]);
  const width = Math.max(
    title.length,
    ...[...names].map((name) => name.length),
  );
  log('');
  log(
    `${title.padEnd(width)}  ${'base'.padStart(12)}  ${'head'.padStart(
      12,
    )}  change`,
  );
  for (const name of names) {
    const a = base[name] ?? 0;
    const b = head[name] ?? 0;
    const change = a === 0 ? (b === 0 ? 0 : Infinity) : ((b - a) / a) * 100;
    const sign = change > 0 ? '+' : '';
    log(
      `${name.padEnd(width)}  ${a.toFixed(3).padStart(12)}  ${b
        .toFixed(3)
        .padStart(12)}  ${sign}${change.toFixed(1)}%`,
    );
  }
}

/**
 * @param {string} basePath Baseline JSON path.
 * @param {string} headPath Candidate JSON path.
 */
async function compare(basePath, headPath) {
  const base = JSON.parse(await fs.readFile(basePath, 'utf8'));
  const head = JSON.parse(await fs.readFile(headPath, 'utf8'));
  if (base.skipped || head.skipped) {
    throw new Error('cannot compare skipped runs');
  }
  const names = new Set([
    ...Object.keys(base.cases || {}),
    ...Object.keys(head.cases || {}),
  ]);
  for (const name of names) {
    const baseCase = base.cases?.[name];
    const headCase = head.cases?.[name];
    if (!baseCase || !headCase) {
      log(`${name}: missing from ${baseCase ? headPath : basePath}`);
      continue;
    }
    compareSummaries(name, baseCase.summary, headCase.summary);
  }
}

const options = yargs(hideBin(process.argv))
  .option('case', {
    describe: 'Run a single case (default: every file in cases/)',
    type: 'string',
  })
  .option('projection', {
    describe: 'View projection',
    type: 'string',
    default: 'EPSG:3857',
  })
  .option('features', {
    describe: 'Feature count for vector cases',
    type: 'number',
    default: 1500,
  })
  .option('vertices', {
    describe: 'Vertices per polygon ring',
    type: 'number',
    default: 64,
  })
  .option('frames', {
    describe: 'Frames per flight phase',
    type: 'number',
    default: 90,
  })
  .option('warmup', {
    describe: 'Warmup frames before measuring',
    type: 'number',
    default: 20,
  })
  .option('runs', {
    describe: 'Number of flights to average',
    type: 'number',
    default: 3,
  })
  .option('out', {
    describe: 'Write the result JSON to this path',
    type: 'string',
  })
  .option('compare', {
    describe: 'Compare two result files instead of measuring',
    type: 'array',
  })
  .option('port', {
    describe: 'Port for the benchmark server',
    type: 'number',
    default: 8123,
  })
  .option('viewport', {
    describe: 'Browser viewport, as WIDTHxHEIGHT',
    type: 'string',
    default: '1024x768',
  })
  .option('headless', {
    describe: 'Run the browser headless',
    type: 'boolean',
    default: true,
  })
  .option('channel', {
    describe: 'Playwright browser channel',
    type: 'string',
    default: 'chromium',
  })
  .option('browser-arg', {
    describe: 'Extra Chromium argument (repeatable)',
    type: 'array',
    default: [],
  })
  .option('timeout', {
    describe: 'Page and flight timeout in milliseconds',
    type: 'number',
    default: 180000,
  })
  .parse();

if (options.compare) {
  if (options.compare.length !== 2) {
    throw new Error('--compare needs exactly two files');
  }
  await compare(String(options.compare[0]), String(options.compare[1]));
} else {
  const result = await measure(options);
  if (result.skipped) {
    log(`skipped: ${result.reason}`);
  } else {
    for (const caseName of Object.keys(result.cases)) {
      log('');
      log(caseName);
      for (const name of SUMMARY_KEYS) {
        log(
          `${name.padEnd(14)} ${result.cases[caseName].summary[name].toFixed(3)}`,
        );
      }
    }
  }
  if (options.out) {
    const outPath = path.resolve(options.out);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2));
    log(`wrote ${outPath}`);
  }
}
